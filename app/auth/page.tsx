"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sb = useMemo(() => {
    try {
      return createSupabaseBrowser();
    } catch {
      return null;
    }
  }, []);

  if (!sb) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-300">
        Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and
        NEXT_PUBLIC_SUPABASE_ANON_KEY.
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          // Email confirmation disabled — signed in immediately.
          router.push("/");
          router.refresh();
        } else {
          setError("Check your email to confirm signup, then sign in.");
        }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-amber-500/20 bg-slate-800/50 p-8">
          <h1 className="mb-2 text-3xl font-bold text-amber-400">FlipScout</h1>
          <p className="mb-8 text-slate-400">
            {isSignUp ? "Create account" : "Sign in to your account"}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="rounded border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-amber-500 py-2 font-bold text-black transition hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-amber-400 hover:text-amber-300"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
