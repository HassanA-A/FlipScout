import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyze } from "@/lib/analyzer";
import { createDeal, readDb } from "@/lib/store";
import { matchWatchlists } from "@/lib/watchlist";
import { supabaseEnv } from "@/lib/supabase/server";
import type { Source } from "@/lib/types";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

/**
 * Extension capture endpoint. Requires a Supabase access token
 * (the extension signs the user in and sends `Authorization: Bearer <token>`).
 * All queries run through a token-bound client, so RLS scopes everything
 * to the calling user.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Sign in required — open the extension popup and sign in." },
      { status: 401, headers: corsHeaders() }
    );
  }
  const token = authHeader.slice(7);

  const { url: supabaseUrl, anonKey } = supabaseEnv();
  const sb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json(
      { error: "Session expired — sign in again in the extension popup." },
      { status: 401, headers: corsHeaders() }
    );
  }

  const body = await req.json();
  const { source, url, title, price, description, seller, distanceMi } = body;
  if (!title || typeof price !== "number") {
    return NextResponse.json(
      { error: "title and price are required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  try {
    const db = await readDb(sb);
    const text = `${title}\n${description ?? ""}`;
    const a = analyze(text, price, db.priceOverrides);
    const now = new Date().toISOString();

    const deal = await createDeal(sb, {
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
    }, user.id);

    const hits = matchWatchlists(deal, db.watchlists);
    return NextResponse.json(
      { deal, analysis: a, watchlistHits: hits.map((w) => w.name) },
      { status: 201, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("Failed to ingest deal:", error);
    return NextResponse.json(
      { error: "Failed to ingest deal" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
