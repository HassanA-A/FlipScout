import { redirect } from "next/navigation";
import { Board } from "@/components/Board";
import { readDb } from "@/lib/store";
import { createSupabaseServer, getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sb = await createSupabaseServer();
  const user = await getSessionUser(sb);
  if (!user) redirect("/auth");

  const db = await readDb(sb);
  return <Board initialDeals={db.deals} />;
}
