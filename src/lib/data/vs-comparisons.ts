import { prisma } from "@/lib/prisma";
import { type ExchangeDetail, getExchangeBySlug } from "./exchanges";

export type VsComparisonData = {
  exchangeA: ExchangeDetail;
  exchangeB: ExchangeDetail;
};

/**
 * Parse a vs slug like "binance-vs-bybit" into two exchange slugs.
 * Returns null if the format is invalid.
 */
export function parseVsSlug(slug: string): { slugA: string; slugB: string } | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return { slugA: parts[0], slugB: parts[1] };
}

/**
 * Fetch both exchanges for a vs comparison page.
 * Returns null if either exchange is not found.
 */
export async function getVsComparison(slug: string): Promise<VsComparisonData | null> {
  const parsed = parseVsSlug(slug);
  if (!parsed) return null;

  const [exchangeA, exchangeB] = await Promise.all([
    getExchangeBySlug(parsed.slugA),
    getExchangeBySlug(parsed.slugB),
  ]);

  if (!exchangeA || !exchangeB) return null;
  if (exchangeA.slug === exchangeB.slug) return null;

  return { exchangeA, exchangeB };
}

/**
 * Get all exchange slugs for generating static params / sitemap entries.
 */
export async function getAllExchangeSlugs(): Promise<string[]> {
  try {
    const exchanges = await prisma.exchange.findMany({
      select: { slug: true },
      orderBy: { score: "desc" },
    });

    if (exchanges.length === 0) {
      return ["binance", "coinbase", "kraken", "bybit", "kucoin"];
    }

    return exchanges.map((e) => e.slug);
  } catch {
    return ["binance", "coinbase", "kraken", "bybit", "kucoin"];
  }
}

/**
 * Generate all possible vs pair slugs for sitemap / static generation.
 */
export async function getAllVsPairs(): Promise<string[]> {
  const slugs = await getAllExchangeSlugs();
  const pairs: string[] = [];

  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      pairs.push(`${slugs[i]}-vs-${slugs[j]}`);
    }
  }

  return pairs;
}
