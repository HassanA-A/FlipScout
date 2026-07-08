import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyzer";
import { createDeal, readDb } from "@/lib/store";
import { matchWatchlists } from "@/lib/watchlist";
import { createClient } from "@supabase/supabase-js";
import type { Source } from "@/lib/types";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-FlipScout-Key, Authorization",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(req: Request) {
  let userId: string | null = null;
  const apiKey = process.env.FLIPSCOUT_API_KEY;
  const authHeader = req.headers.get("authorization");
  const headerApiKey = req.headers.get("x-flipscout-key");

  // Check API key (for extension) - for MVP, extension calls bypass per-user filtering
  if (apiKey && headerApiKey === apiKey) {
    // Extension auth - we'll use RLS at DB level but allow any data to be ingested
    userId = null; // Extension doesn't have a user
  } else if (authHeader?.startsWith("Bearer ")) {
    // Auth token (for web UI)
    const token = authHeader.slice(7);
    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "invalid token" }, { status: 401, headers: corsHeaders() });
    }
    userId = user.id;
  } else {
    return NextResponse.json({ error: "missing auth" }, { status: 401, headers: corsHeaders() });
  }

  const body = await req.json();
  const { source, url, title, price, description, seller, distanceMi } = body;
  if (!title || typeof price !== "number") {
    return NextResponse.json({ error: "title and price are required" }, { status: 400, headers: corsHeaders() });
  }

  try {
    const db = await readDb(userId || undefined);
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
    }, userId || "extension");

    const hits = matchWatchlists(deal, db.watchlists);
    return NextResponse.json({ deal, analysis: a, watchlistHits: hits.map((w) => w.name) }, { status: 201, headers: corsHeaders() });
  } catch (error) {
    console.error("Failed to ingest deal:", error);
    return NextResponse.json({ error: "Failed to ingest deal" }, { status: 500, headers: corsHeaders() });
  }
}
