import { NextResponse } from "next/server";
import { newId, readDb, writeDb } from "@/lib/store";
import { dealMatches } from "@/lib/watchlist";

export async function GET() {
  const db = readDb();
  const withMatches = db.watchlists.map((w) => ({
    ...w,
    matches: db.deals.filter((d) => dealMatches(d, w)).map((d) => d.id),
  }));
  return NextResponse.json(withMatches);
}

export async function POST(req: Request) {
  const { name, query, maxPrice } = await req.json();
  if (!name || !query) {
    return NextResponse.json({ error: "name and query are required" }, { status: 400 });
  }
  const db = readDb();
  const w = { id: newId(), name, query, maxPrice, active: true };
  db.watchlists.push(w);
  writeDb(db);
  return NextResponse.json(w, { status: 201 });
}

export async function PATCH(req: Request) {
  const { id, active } = await req.json();
  const db = readDb();
  const w = db.watchlists.find((x) => x.id === id);
  if (!w) return NextResponse.json({ error: "not found" }, { status: 404 });
  w.active = active;
  writeDb(db);
  return NextResponse.json(w);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const db = readDb();
  db.watchlists = db.watchlists.filter((x) => x.id !== id);
  writeDb(db);
  return NextResponse.json({ ok: true });
}
