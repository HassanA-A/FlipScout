import type { Deal, Watchlist } from "./types";

export function dealMatches(deal: Deal, w: Watchlist): boolean {
  if (!w.active) return false;
  if (w.maxPrice !== undefined && deal.askingPrice > w.maxPrice) return false;
  const hay = `${deal.title} ${deal.rawText ?? ""} ${(deal.parts ?? [])
    .map((p) => p.name)
    .join(" ")}`.toLowerCase();
  return hay.includes(w.query.toLowerCase());
}

export function matchWatchlists(deal: Deal, watchlists: Watchlist[]): Watchlist[] {
  return watchlists.filter((w) => dealMatches(deal, w));
}
