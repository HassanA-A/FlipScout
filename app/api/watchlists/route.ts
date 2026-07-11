import { NextResponse } from "next/server";
import { readDb, createWatchlist, updateWatchlist, deleteWatchlist } from "@/lib/store";
import { dealMatches } from "@/lib/watchlist";
import { createSupabaseServer, getSessionUser } from "@/lib/supabase/server";

export async function GET() {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = await readDb(sb);
  const withMatches = db.watchlists.map((w) => ({
    ...w,
    matches: db.deals.filter((d) => dealMatches(d, w)).map((d) => d.id),
  }));
  return NextResponse.json(withMatches);
}

export async function POST(req: Request) {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, query, maxPrice } = await req.json();
  if (!name || !query) {
    return NextResponse.json({ error: "name and query are required" }, { status: 400 });
  }

  try {
    const w = await createWatchlist(sb, {
      name,
      query,
      maxPrice,
      active: true,
    }, user.id);
    return NextResponse.json(w, { status: 201 });
  } catch (error) {
    console.error("Failed to create watchlist:", error);
    return NextResponse.json({ error: "Failed to create watchlist" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, active } = await req.json();

  try {
    const w = await updateWatchlist(sb, id, { active });
    return NextResponse.json(w);
  } catch (error) {
    console.error("Failed to update watchlist:", error);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(req: Request) {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await req.json();

  try {
    await deleteWatchlist(sb, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete watchlist:", error);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
