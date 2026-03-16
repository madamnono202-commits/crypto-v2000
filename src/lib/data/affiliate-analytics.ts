import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type ClicksByExchange = {
  exchangeId: string;
  exchangeName: string;
  totalClicks: number;
};

export type ClicksBySource = {
  sourcePage: string;
  totalClicks: number;
};

export type RecentClick = {
  id: string;
  exchangeName: string;
  sourcePage: string;
  clickedAt: Date;
  ipHash: string;
};

export type AffiliateAnalytics = {
  totalClicks: number;
  clicksByExchange: ClicksByExchange[];
  clicksBySource: ClicksBySource[];
  recentClicks: RecentClick[];
};

// ─── Data Fetching ──────────────────────────────────────────────────────────────

export async function getAffiliateAnalytics(): Promise<AffiliateAnalytics> {
  try {
    const [totalClicks, clicksByExchangeRaw, clicksBySourceRaw, recentClicksRaw] =
      await Promise.all([
        prisma.affiliateClick.count(),

        prisma.affiliateClick.groupBy({
          by: ["exchangeId"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        }),

        prisma.affiliateClick.groupBy({
          by: ["sourcePage"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        }),

        prisma.affiliateClick.findMany({
          take: 20,
          orderBy: { clickedAt: "desc" },
          include: {
            exchange: { select: { name: true } },
          },
        }),
      ]);

    // Resolve exchange names for the grouped data
    const exchangeIds = clicksByExchangeRaw.map((r) => r.exchangeId);
    const exchanges = await prisma.exchange.findMany({
      where: { id: { in: exchangeIds } },
      select: { id: true, name: true },
    });
    const exchangeMap = new Map(exchanges.map((e) => [e.id, e.name]));

    const clicksByExchange: ClicksByExchange[] = clicksByExchangeRaw.map((r) => ({
      exchangeId: r.exchangeId,
      exchangeName: exchangeMap.get(r.exchangeId) || "Unknown",
      totalClicks: r._count.id,
    }));

    const clicksBySource: ClicksBySource[] = clicksBySourceRaw.map((r) => ({
      sourcePage: r.sourcePage,
      totalClicks: r._count.id,
    }));

    const recentClicks: RecentClick[] = recentClicksRaw.map((r) => ({
      id: r.id,
      exchangeName: r.exchange.name,
      sourcePage: r.sourcePage,
      clickedAt: r.clickedAt,
      ipHash: r.ipHash,
    }));

    return { totalClicks, clicksByExchange, clicksBySource, recentClicks };
  } catch {
    return {
      totalClicks: 0,
      clicksByExchange: [],
      clicksBySource: [],
      recentClicks: [],
    };
  }
}
