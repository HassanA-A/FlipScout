import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyzer";
import { createSupabaseServer, getSessionUser } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { text, askingPrice } = await req.json();
  if (!text || typeof askingPrice !== "number") {
    return NextResponse.json({ error: "text and askingPrice are required" }, { status: 400 });
  }
  return NextResponse.json(analyze(text, askingPrice, {}));
}
