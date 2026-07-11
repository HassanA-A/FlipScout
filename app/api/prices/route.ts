import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { createSupabaseServer, getSessionUser } from "@/lib/supabase/server";

export async function GET() {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json(getCatalog({}));
}

export async function PATCH(req: Request) {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, buyValue, resaleValue } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const current = getCatalog({}).find((c) => c.id === id);
  if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });

  // TODO: persist per-user price overrides to Supabase (price_points table)
  return NextResponse.json({
    ...current,
    buyValue: buyValue ?? current.buyValue,
    resaleValue: resaleValue ?? current.resaleValue,
  });
}
