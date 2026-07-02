import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/store";
import type { Deal } from "@/lib/types";

const EDITABLE: (keyof Deal)[] = [
  "status", "notes", "purchasePrice", "salePrice", "title",
  "askingPrice", "seller", "distanceMi", "url",
];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const db = readDb();
  const deal = db.deals.find((d) => d.id === id);
  if (!deal) return NextResponse.json({ error: "not found" }, { status: 404 });

  for (const key of EDITABLE) {
    if (key in patch) (deal as unknown as Record<string, unknown>)[key] = patch[key];
  }
  deal.updatedAt = new Date().toISOString();
  writeDb(db);
  return NextResponse.json(deal);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = readDb();
  const before = db.deals.length;
  db.deals = db.deals.filter((d) => d.id !== id);
  if (db.deals.length === before) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  writeDb(db);
  return NextResponse.json({ ok: true });
}
