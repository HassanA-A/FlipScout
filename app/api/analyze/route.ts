import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyzer";
import { readDb } from "@/lib/store";

export async function POST(req: Request) {
  const { text, askingPrice } = await req.json();
  if (!text || typeof askingPrice !== "number") {
    return NextResponse.json({ error: "text and askingPrice are required" }, { status: 400 });
  }
  const db = await readDb();
  return NextResponse.json(analyze(text, askingPrice, db.priceOverrides));
}
