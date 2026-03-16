import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { runContentPipeline, type PipelineOptions } from "./pipeline";
import { query } from "./db";
import { closePool } from "./db";

const PORT = parseInt(process.env.PORT || "4100", 10);
const API_SECRET = process.env.API_SECRET || "";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function authenticate(req: IncomingMessage): boolean {
  if (!API_SECRET) return true; // No secret configured = open access
  const auth = req.headers.authorization;
  return auth === `Bearer ${API_SECRET}`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

async function handleTrigger(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!authenticate(req)) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  try {
    const rawBody = await parseBody(req);
    const body = rawBody ? JSON.parse(rawBody) : {};
    const options: PipelineOptions = {
      topicLimit:
        typeof body.topicLimit === "number" ? body.topicLimit : 3,
      publishAsDraft: body.publishAsDraft !== false,
    };

    const result = await runContentPipeline(options);

    json(res, 200, {
      success: result.status === "completed",
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[BlogGenerator] Trigger error:", message);
    json(res, 500, { success: false, error: message });
  }
}

async function handleGetPosts(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== "GET") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "20", 10),
      100
    );
    const published = url.searchParams.get("published") !== "false";

    const whereClause = published ? "WHERE published_at IS NOT NULL" : "";

    const posts = await query(
      `SELECT id, slug, title, content, meta_title, meta_description, featured_image, category, tags, published_at, created_at
       FROM blog_posts ${whereClause}
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    json(res, 200, { posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    json(res, 500, { error: message });
  }
}

async function handleGetRuns(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== "GET") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!authenticate(req)) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  try {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "10", 10),
      50
    );

    const runs = await query(
      `SELECT id, job_type, status, topics_fetched, articles_created, images_generated, error_count, started_at, completed_at, result_summary, created_at
       FROM automation_runs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    json(res, 200, { runs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    json(res, 500, { error: message });
  }
}

async function handleHealth(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  json(res, 200, {
    status: "ok",
    service: "cryptocompare-blog-generator",
    timestamp: new Date().toISOString(),
  });
}

// ─── Server ───────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const pathname = new URL(req.url ?? "/", `http://localhost:${PORT}`).pathname;

  try {
    switch (pathname) {
      case "/health":
        await handleHealth(req, res);
        break;
      case "/api/trigger":
        await handleTrigger(req, res);
        break;
      case "/api/posts":
        await handleGetPosts(req, res);
        break;
      case "/api/runs":
        await handleGetRuns(req, res);
        break;
      default:
        json(res, 404, { error: "Not found" });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[BlogGenerator] Unhandled error:", message);
    json(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`[BlogGenerator] Server running on http://localhost:${PORT}`);
  console.log(`[BlogGenerator] Endpoints:`);
  console.log(`  GET  /health       - Health check`);
  console.log(`  POST /api/trigger  - Trigger blog generation`);
  console.log(`  GET  /api/posts    - List generated blog posts`);
  console.log(`  GET  /api/runs     - List automation runs`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("[BlogGenerator] Shutting down...");
  server.close();
  await closePool();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
