"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client with cookie-based session storage, so the server
 * (middleware, server components, API routes) can see the login.
 */
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required."
    );
  }
  return createBrowserClient(url, anonKey);
}
