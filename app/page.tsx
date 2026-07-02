import { Board } from "@/components/Board";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const db = readDb();
  return <Board initialDeals={db.deals} />;
}
