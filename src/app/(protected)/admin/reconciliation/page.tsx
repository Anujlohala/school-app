import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type {
  ReconciliationCycle,
  ReconciliationMonth,
} from "@/domain/reconciliation";
import { npr } from "@/features/dashboard/format";
import { getReconciliationData } from "@/server/queries/reconciliation";

export const metadata: Metadata = { title: "Cycle reconciliation" };

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kathmandu",
});

export default async function ReconciliationPage() {
  const data = await getReconciliationData();

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="space-y-2">
        <p className="text-primary text-xs font-bold tracking-widest uppercase">
          Administrator reconciliation
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Historical cycle review
        </h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          Verify winners, obligation snapshots, payment methods, and saving
          totals before signing off the first ten historical months. This page
          is read only; use the existing monthly and saving controls for
          corrections.
        </p>
      </header>

      {data.cycles.length === 0 ? (
        <section className="bg-card rounded-xl border border-dashed p-8 text-center">
          <ClipboardCheck
            aria-hidden="true"
            className="text-primary mx-auto size-8"
          />
          <h2 className="mt-3 text-lg font-semibold">
            No active cycle to review
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Activate a cycle before reconciling its historical records.
          </p>
        </section>
      ) : (
        data.cycles.map((cycle) => (
          <CycleReconciliation key={cycle.id} cycle={cycle} />
        ))
      )}
    </div>
  );
}

function CycleReconciliation({ cycle }: { cycle: ReconciliationCycle }) {
  return (
    <div className="space-y-5">
      <Card className="gap-5 border p-5 shadow-none ring-0 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">Cycle {cycle.cycleNumber}</h2>
              <Badge
                variant={cycle.status === "active" ? "default" : "secondary"}
              >
                {cycle.status === "active" ? "Active" : "Completed"}
              </Badge>
              <Badge
                variant={
                  cycle.readyForHistoricalSignOff ? "default" : "outline"
                }
              >
                {cycle.readyForHistoricalSignOff
                  ? "Ready for sign-off"
                  : "Review required"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Historical target: {cycle.targetMonthCount} recorded winners and
              complete monthly snapshots
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/months"
              className="focus-ring border-input bg-background hover:bg-secondary inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold"
            >
              Open monthly records
            </Link>
            <Link
              href="/savings"
              className="focus-ring border-input bg-background hover:bg-secondary inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold"
            >
              Open saving fund
            </Link>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryValue
            label="Roster and schedule"
            value={`${cycle.rosterCount} members · ${cycle.scheduleCount} months`}
          />
          <SummaryValue
            label="Recorded winners"
            value={`${cycle.recordedMonthCount} / ${cycle.targetMonthCount} · ${cycle.uniqueWinnerCount} unique`}
          />
          <SummaryValue
            label="Obligation snapshots"
            value={`${cycle.obligationCount} / ${cycle.expectedRecordedObligations}`}
          />
          <SummaryValue
            label="Remaining eligible"
            value={`${cycle.remainingMembers.length} member${cycle.remainingMembers.length === 1 ? "" : "s"}`}
          />
        </dl>

        {cycle.readyForHistoricalSignOff ? (
          <div className="border-primary/30 bg-primary/5 flex gap-3 rounded-lg border p-4">
            <CheckCircle2
              aria-hidden="true"
              className="text-primary mt-0.5 size-5 shrink-0"
            />
            <div>
              <p className="font-bold">
                Historical records are structurally ready
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Compare the values with the original source records before
                recording administrator sign-off.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0"
            />
            <div>
              <p className="font-bold">Resolve these blockers</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {cycle.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>

      <Card className="gap-5 border p-5 shadow-none ring-0 sm:p-6">
        <div>
          <h2 className="text-xl font-bold">Saving reconciliation</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            The historical baseline excludes extra contributions. Every baseline
            rupee must be received, pending, or not yet recorded.
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MoneyValue
            label={`Month ${cycle.targetMonthCount} baseline`}
            value={cycle.historicalBaselineSaving}
          />
          <MoneyValue
            label="Received required saving"
            value={cycle.receivedRequiredSaving}
          />
          <MoneyValue
            label="Pending required saving"
            value={cycle.pendingRequiredSaving}
            pending
          />
          <MoneyValue
            label="Not yet recorded"
            value={cycle.notYetRecordedSaving}
          />
          <MoneyValue
            label="Extra contributions"
            value={cycle.extraContributions}
          />
          <MoneyValue
            label="Unexplained difference"
            value={cycle.unexplainedDifference}
            pending={cycle.unexplainedDifference !== 0}
          />
        </dl>
        <p className="text-muted-foreground text-xs">
          Current cycle saving including extras: {npr(cycle.actualCycleSaving)}.
          Recorded required saving: {npr(cycle.recordedRequiredSaving)}.
        </p>
      </Card>

      <section aria-labelledby={`months-${cycle.id}`} className="space-y-3">
        <div>
          <h2 id={`months-${cycle.id}`} className="text-xl font-bold">
            Month-by-month checks
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Pending payments are valid when supported by the original records.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {cycle.months.map((month) => (
            <MonthCheck key={month.id} month={month} />
          ))}
        </div>
      </section>

      <Card className="gap-3 border p-5 shadow-none ring-0 sm:p-6">
        <div className="flex items-center gap-2">
          <Users aria-hidden="true" className="text-primary size-5" />
          <h2 className="font-bold">Remaining eligible members</h2>
        </div>
        {cycle.remainingMembers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Every cycle member already has a recorded winning month.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cycle.remainingMembers.map((member) => (
              <li
                key={member.id}
                className="bg-secondary/50 min-w-0 rounded-lg px-3 py-3 text-sm break-words"
              >
                {member.name}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MonthCheck({ month }: { month: ReconciliationMonth }) {
  return (
    <Card className="gap-3 border p-4 shadow-none ring-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">Month {month.monthNumber}</h3>
          <time
            dateTime={month.scheduledDate}
            className="text-muted-foreground mt-1 block text-xs"
          >
            {dateFormatter.format(new Date(`${month.scheduledDate}T00:00:00Z`))}
          </time>
        </div>
        <MonthStateBadge state={month.state} />
      </div>
      <p className="text-sm">
        <span className="text-muted-foreground">Winner:</span>{" "}
        {month.winnerName ?? "Not recorded"}
      </p>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <CompactValue
          label="Snapshots"
          value={`${month.obligationCount} / 11`}
        />
        <CompactValue label="Paid" value={String(month.paidCount)} />
        <CompactValue label="Pending" value={String(month.pendingCount)} />
        <CompactValue label="Saving due" value={npr(month.requiredSaving)} />
      </dl>
      {month.missingPaymentMethods > 0 && (
        <p className="text-destructive text-xs">
          {month.missingPaymentMethods} paid record lacks a payment method.
        </p>
      )}
      {month.pendingSaving > 0 && (
        <p className="flex items-center gap-2 text-xs text-amber-800">
          <Clock3 aria-hidden="true" className="size-4" />
          {npr(month.pendingSaving)} saving remains pending;{" "}
          {npr(month.receivedSaving)} received.
        </p>
      )}
    </Card>
  );
}

function MonthStateBadge({ state }: { state: ReconciliationMonth["state"] }) {
  if (state === "reconciled") return <Badge>Reconciled</Badge>;
  if (state === "pending")
    return <Badge variant="outline">Pending verified</Badge>;
  if (state === "incomplete")
    return <Badge variant="destructive">Incomplete</Badge>;
  return <Badge variant="secondary">Not recorded</Badge>;
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-4">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}

function MoneyValue({
  label,
  value,
  pending = false,
}: {
  label: string;
  value: number;
  pending?: boolean;
}) {
  return (
    <div
      className={
        pending
          ? "rounded-lg bg-amber-50 p-4"
          : "bg-secondary/50 rounded-lg p-4"
      }
    >
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 font-bold tabular-nums">{npr(value)}</dd>
    </div>
  );
}

function CompactValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
