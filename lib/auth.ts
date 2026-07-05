import { createClient } from "@supabase/supabase-js";

export function getSupabaseServer() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function getCurrentUser() {
  const sb = getSupabaseServer();
  const {
    data: { session },
  } = await sb.auth.getSession();
  return session?.user;
}

export async function signUp(email: string, password: string) {
  const sb = getSupabaseServer();
  return sb.auth.signUpWithPassword({ email, password });
}

export async function signIn(email: string, password: string) {
  const sb = getSupabaseServer();
  return sb.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const sb = getSupabaseServer();
  return sb.auth.signOut();
}
