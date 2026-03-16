import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/blog-generator/trigger
 *
 * Proxy route that forwards blog generation requests to the
 * standalone Blog Generator service (Project 1).
 * Requires admin authentication.
 *
 * Body: { topicLimit?: number, publishAsDraft?: boolean }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blogGeneratorUrl = process.env.BLOG_GENERATOR_URL;
  if (!blogGeneratorUrl) {
    return NextResponse.json(
      { success: false, error: "BLOG_GENERATOR_URL not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apiSecret = process.env.BLOG_GENERATOR_SECRET;
    if (apiSecret) {
      headers["Authorization"] = `Bearer ${apiSecret}`;
    }

    const response = await fetch(`${blogGeneratorUrl}/api/trigger`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        topicLimit: typeof body.topicLimit === "number" ? body.topicLimit : 3,
        publishAsDraft: body.publishAsDraft !== false,
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[BlogGenerator Proxy] Trigger error:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
