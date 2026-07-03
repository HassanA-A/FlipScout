import { NextResponse } from "next/server";
import { readDb, createWatchlist, updateWatchlist, deleteWatchlist } from "@/lib/store";
import { dealMatches } from "@/lib/watchlist";

export async function GET() {
  const db = await readDb();
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

  try {
    const w = await createWatchlist({
      name,
      query,
      maxPrice,
      active: true,
    });
    return NextResponse.json(w, { status: 201 });
  } catch (error) {
    console.error("Failed to create watchlist:", error);
    return NextResponse.json({ error: "Failed to create watchlist" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { id, active } = await req.json();

  try {
    const w = await updateWatchlist(id, { active });
    return NextResponse.json(w);
  } catch (error) {
    console.error("Failed to update watchlist:", error);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  try {
    await deleteWatchlist(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete watchlist:", error);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
