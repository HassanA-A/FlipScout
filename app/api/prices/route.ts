import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { readDb, writeDb } from "@/lib/store";

export async function GET() {
  const db = readDb();
  return NextResponse.json(getCatalog(db.priceOverrides));
}

export async function PATCH(req: Request) {
  const { id, buyValue, resaleValue } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const db = readDb();
  const current = getCatalog(db.priceOverrides).find((c) => c.id === id);
  if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
  db.priceOverrides[id] = {
    buyValue: buyValue ?? current.buyValue,
    resaleValue: resaleValue ?? current.resaleValue,
  };
  writeDb(db);
  return NextResponse.json({ ...current, ...db.priceOverrides[id] });
}
