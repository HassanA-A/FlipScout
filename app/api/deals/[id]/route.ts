import { NextResponse } from "next/server";
import { updateDeal, deleteDeal } from "@/lib/store";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();

  try {
    const deal = await updateDeal(id, patch);
    return NextResponse.json(deal);
  } catch (error) {
    console.error("Failed to update deal:", error);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    await deleteDeal(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete deal:", error);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
