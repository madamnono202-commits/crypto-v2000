import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/blog-generator/runs
 *
 * Fetch recent automation runs from the shared database.
 * These runs are created by the Blog Generator service (Project 1).
 * Requires admin authentication.
 *
 * Query params: limit (default 10), includelogs (default false)
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "10", 10),
      50
    );
    const includeLogs = searchParams.get("includelogs") === "true";

    const runs = await prisma.automationRun.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: includeLogs
        ? {
            logs: {
              orderBy: { createdAt: "asc" },
              take: 100,
            },
          }
        : undefined,
    });

    return NextResponse.json({ runs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[BlogGenerator Proxy] Runs fetch error:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
