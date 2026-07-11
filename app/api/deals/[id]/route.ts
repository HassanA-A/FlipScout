import { NextResponse } from "next/server";
import { updateDeal, deleteDeal } from "@/lib/store";
import { createSupabaseServer, getSessionUser } from "@/lib/supabase/server";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const patch = await req.json();

  try {
    // RLS guarantees the row belongs to this user.
    const deal = await updateDeal(sb, id, patch);
    return NextResponse.json(deal);
  } catch (error) {
    console.error("Failed to update deal:", error);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    await deleteDeal(sb, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete deal:", error);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
