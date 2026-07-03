import { Board } from "@/components/Board";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = await readDb();
  return <Board initialDeals={db.deals} />;
}
