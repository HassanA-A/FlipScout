import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyzer";
import { createDeal, readDb } from "@/lib/store";
import { matchWatchlists } from "@/lib/watchlist";
import type { Source } from "@/lib/types";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-FlipScout-Key",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(req: Request) {
  const expected = process.env.FLIPSCOUT_API_KEY;
  if (expected && req.headers.get("x-flipscout-key") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders() });
  }

  const body = await req.json();
  const { source, url, title, price, description, seller, distanceMi } = body;
  if (!title || typeof price !== "number") {
    return NextResponse.json({ error: "title and price are required" }, { status: 400, headers: corsHeaders() });
  }

  try {
    const db = await readDb();
    const text = `${title}\n${description ?? ""}`;
    const a = analyze(text, price, db.priceOverrides);
    const now = new Date().toISOString();

    const deal = await createDeal({
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
    });

    const hits = matchWatchlists(deal, db.watchlists);
    return NextResponse.json({ deal, analysis: a, watchlistHits: hits.map((w) => w.name) }, { status: 201, headers: corsHeaders() });
  } catch (error) {
    console.error("Failed to ingest deal:", error);
    return NextResponse.json({ error: "Failed to ingest deal" }, { status: 500, headers: corsHeaders() });
  }
}
