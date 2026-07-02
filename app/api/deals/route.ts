import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyzer";
import { newId, readDb, writeDb } from "@/lib/store";
import type { Deal } from "@/lib/types";

export async function GET() {
  const db = readDb();
  return NextResponse.json(db.deals);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, askingPrice, rawText, source, url, seller, distanceMi, notes } = body;
  if (!title || typeof askingPrice !== "number") {
    return NextResponse.json({ error: "title and askingPrice are required" }, { status: 400 });
  }

  const db = readDb();
  const a = analyze(rawText ?? title, askingPrice, db.priceOverrides);
  const now = new Date().toISOString();
  const deal: Deal = {
    id: newId(),
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
    createdAt: now,
    updatedAt: now,
  };
  db.deals.unshift(deal);
  writeDb(db);
  return NextResponse.json(deal, { status: 201 });
}
