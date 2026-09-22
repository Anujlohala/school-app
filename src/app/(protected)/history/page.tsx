import type { Metadata } from "next";
import { History } from "lucide-react";
import { HistoryExplorer } from "@/features/history/history-explorer";
import { getHistoryData } from "@/server/queries/history";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const data = await getHistoryData();

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="space-y-2">
        <p className="text-primary text-xs font-bold tracking-widest uppercase">
          Shared records
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Circle history</h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          Review recorded winners, member obligations, payment status, saving
          contributions, and correction timestamps across every cycle.
        </p>
      </header>

      {data.cycles.length === 0 ? (
        <section className="bg-card rounded-xl border border-dashed p-8 text-center">
          <History aria-hidden="true" className="text-primary mx-auto size-8" />
          <h2 className="mt-3 text-lg font-semibold">No history yet</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Recorded months and contributions will appear after a cycle is
            activated and financial activity begins.
          </p>
        </section>
      ) : (
        <HistoryExplorer data={data} />
      )}
    </div>
  );
}
