import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyzer";
import { createDeal, readDb } from "@/lib/store";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.deals);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, askingPrice, rawText, source, url, seller, distanceMi, notes } = body;
  if (!title || typeof askingPrice !== "number") {
    return NextResponse.json({ error: "title and askingPrice are required" }, { status: 400 });
  }

  const db = await readDb();
  const a = analyze(rawText ?? title, askingPrice, db.priceOverrides);
  const now = new Date().toISOString();

  try {
    const deal = await createDeal({
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
    });
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Failed to create deal:", error);
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
