import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyzer";
import { readDb } from "@/lib/store";

/**
 * Runs the analysis pipeline without saving. The prototype uses the
 * deterministic alias fast-path only; milestone M2 adds LLM extraction for
 * messy text and screenshots (extraction only — valuation stays in the DB).
 */
export async function POST(req: Request) {
  const { text, askingPrice } = await req.json();
  if (!text || typeof askingPrice !== "number") {
    return NextResponse.json({ error: "text and askingPrice are required" }, { status: 400 });
  }
  const db = readDb();
  return NextResponse.json(analyze(text, askingPrice, db.priceOverrides));
}
