import { NextResponse } from "next/server";
import { supabaseEnv } from "@/lib/supabase/server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

/**
 * Public config for the browser extension. The anon key is a public,
 * publishable value — data is protected by RLS, not by hiding this key.
 */
export async function GET() {
  try {
    const { url, anonKey } = supabaseEnv();
    return NextResponse.json({ supabaseUrl: url, supabaseAnonKey: anonKey }, { headers: cors });
  } catch {
    return NextResponse.json({ error: "Server not configured" }, { status: 500, headers: cors });
  }
}
