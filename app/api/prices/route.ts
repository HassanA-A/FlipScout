import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { readDb } from "@/lib/store";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(getCatalog(db.priceOverrides));
}

export async function PATCH(req: Request) {
  const { id, buyValue, resaleValue } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  
  const db = await readDb();
  const current = getCatalog(db.priceOverrides).find((c) => c.id === id);
  if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
  
  db.priceOverrides[id] = {
    buyValue: buyValue ?? current.buyValue,
    resaleValue: resaleValue ?? current.resaleValue,
  };
  
  // TODO: In production, persist this to Supabase
  return NextResponse.json({ ...current, ...db.priceOverrides[id] });
}
