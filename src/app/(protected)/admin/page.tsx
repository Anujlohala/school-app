import Link from "next/link";
import { Users } from "lucide-react";
import { requireAccount } from "@/server/queries/auth";

export default async function AdminPage() {
  await requireAccount(true);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-primary text-xs font-bold tracking-widest uppercase">
          Administrator
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground text-sm">
          Manage the circle’s roster. Cycle setup and financial tools will
          follow.
        </p>
      </header>
      <Link
        href="/members"
        className="focus-ring bg-card hover:bg-secondary flex min-h-24 items-center gap-4 rounded-xl border p-6 transition-colors"
      >
        <Users aria-hidden="true" className="text-primary size-6 shrink-0" />
        <div>
          <h2 className="text-lg font-semibold">Manage members</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Add friends, edit names, and manage active status.
          </p>
        </div>
      </Link>
    </div>
  );
}
