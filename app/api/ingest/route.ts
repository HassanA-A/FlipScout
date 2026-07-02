import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyzer";
import { newId, readDb, writeDb } from "@/lib/store";
import { matchWatchlists } from "@/lib/watchlist";
import type { Deal, Source } from "@/lib/types";

/**
 * Browser-extension capture endpoint (DESIGN.md §6). The extension reads the
 * DOM of the listing page the user is viewing and POSTs it here; the deal is
 * analyzed, saved to the board, and checked against watchlists in one shot.
 *
 * Prototype auth: X-FlipScout-Key must equal FLIPSCOUT_API_KEY if set.
 */
export async function POST(req: Request) {
  const expected = process.env.FLIPSCOUT_API_KEY;
  if (expected && req.headers.get("x-flipscout-key") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { source, url, title, price, description, seller, distanceMi } = body;
  if (!title || typeof price !== "number") {
    return NextResponse.json({ error: "title and price are required" }, { status: 400 });
  }

  const db = readDb();
  const text = `${title}\n${description ?? ""}`;
  const a = analyze(text, price, db.priceOverrides);
  const now = new Date().toISOString();
  const deal: Deal = {
    id: newId(),
    title,
    url,
    source: (source as Source) ?? "manual",
    askingPrice: price,
    estValue: a.estValue,
    estProfit: a.estProfit,
    status: "new",
    verdict: a.verdict,
    score: a.score,
    confidence: a.confidence,
    reasoning: a.reasoning,
    parts: a.parts,
    seller,
    distanceMi,
    listedAt: now,
    rawText: text,
    createdAt: now,
    updatedAt: now,
  };
  db.deals.unshift(deal);
  writeDb(db);

  const hits = matchWatchlists(deal, db.watchlists);
  // M4 wires hits to Discord/Telegram; the prototype returns them inline.
  return NextResponse.json({ deal, analysis: a, watchlistHits: hits.map((w) => w.name) }, { status: 201 });
}
