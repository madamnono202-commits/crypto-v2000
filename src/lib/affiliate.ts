/**
 * Build the affiliate click-tracking URL that routes through /api/click.
 *
 * The API handler records the click in the database and then 302-redirects
 * the user to the exchange's affiliate URL.
 */
export function buildClickUrl(exchangeId: string, sourcePage: string): string {
  const params = new URLSearchParams({
    exchange_id: exchangeId,
    source_page: sourcePage,
  });
  return `/api/click?${params.toString()}`;
}
