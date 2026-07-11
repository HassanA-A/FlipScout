import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyzer";
import { createDeal, readDb } from "@/lib/store";
import { createSupabaseServer, getSessionUser } from "@/lib/supabase/server";

export async function GET() {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = await readDb(sb);
  return NextResponse.json(db.deals);
}

export async function POST(req: Request) {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, askingPrice, rawText, source, url, seller, distanceMi, notes } = body;
  if (!title || typeof askingPrice !== "number") {
    return NextResponse.json({ error: "title and askingPrice are required" }, { status: 400 });
  }

  const a = analyze(rawText ?? title, askingPrice, {});
  const now = new Date().toISOString();

  try {
    const deal = await createDeal(sb, {
      title,
      url,
      source: source ?? "manual",
      askingPrice,
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
      rawText,
      notes,
    }, user.id);
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Failed to create deal:", error);
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
