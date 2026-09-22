import type { Metadata } from "next";
import { CircleDollarSign, Landmark, PiggyBank } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Cycle } from "@/domain/cycle";
import { paymentMethodLabel } from "@/domain/payment";
import type { SavingFund } from "@/domain/saving";
import { npr } from "@/features/dashboard/format";
import {
  AddContributionForm,
  EditContributionForm,
} from "@/features/savings/contribution-forms";
import { requireAccount } from "@/server/queries/auth";
import { listCycles } from "@/server/queries/cycles";
import { listSavingFunds } from "@/server/queries/savings";

export const metadata: Metadata = { title: "Saving fund" };

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kathmandu",
});

export default async function SavingsPage() {
  const account = await requireAccount();
  const [funds, cycles] = await Promise.all([listSavingFunds(), listCycles()]);
  const admin = account.role === "admin";
  const availableCycles = cycles.filter((cycle) => cycle.status !== "draft");
  const totalBalance = funds.reduce(
    (total, fund) => total + fund.actualCycleSaving,
    0,
  );
  const totalPending = funds.reduce(
    (total, fund) => total + fund.pendingFixedSaving + fund.pendingInterest,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="space-y-2">
        <p className="text-primary text-xs font-bold tracking-widest uppercase">
          {admin ? "Saving administration" : "Saving fund"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Live saving fund</h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          The balance includes received fixed savings, winner interest, and
          extra contributions. Pending savings remain visible but are excluded
          from the available balance.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Saving totals">
        <SummaryCard
          icon={Landmark}
          label="Available saving balance"
          value={npr(totalBalance)}
          note="Received funds across all cycles"
        />
        <SummaryCard
          icon={CircleDollarSign}
          label="Pending saving"
          value={npr(totalPending)}
          note="Excluded until the related obligation is paid"
        />
      </section>

      {availableCycles.length === 0 ? (
        <section className="bg-card rounded-xl border border-dashed p-8 text-center">
          <PiggyBank
            aria-hidden="true"
            className="text-primary mx-auto size-8"
          />
          <h2 className="mt-3 text-lg font-semibold">No active saving fund</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Activate a cycle before recording or viewing saving activity.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {availableCycles.map((cycle) => (
            <CycleSavingCard
              key={cycle.id}
              cycle={cycle}
              fund={funds.find((item) => item.cycleId === cycle.id)}
              admin={admin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Landmark;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="gap-3 border p-5 shadow-none ring-0">
      <div className="flex items-center gap-3">
        <span className="bg-secondary text-primary grid size-10 place-items-center rounded-lg">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-muted-foreground text-xs font-semibold">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">{note}</p>
    </Card>
  );
}

function CycleSavingCard({
  cycle,
  fund,
  admin,
}: {
  cycle: Cycle;
  fund: SavingFund | undefined;
  admin: boolean;
}) {
  const values = fund ?? emptyFund(cycle);
  const pendingSaving = values.pendingFixedSaving + values.pendingInterest;

  return (
    <Card className="gap-0 border p-5 shadow-none ring-0 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Cycle {cycle.cycleNumber}</h2>
            <Badge
              variant={cycle.status === "active" ? "default" : "secondary"}
            >
              {cycle.status === "active" ? "Active" : "Completed"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {npr(values.carriedFromPreviousCycles)} carried into this cycle
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-xs">Cumulative balance</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {npr(values.cumulativeBalance)}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SavingValue
          label="Fixed saving received"
          value={values.fixedSavingReceived}
        />
        <SavingValue
          label="Interest received"
          value={values.interestReceived}
        />
        <SavingValue
          label="Extra contributions"
          value={values.extraContributions}
        />
        <SavingValue
          label="Cycle saving"
          value={values.actualCycleSaving}
          strong
        />
        <SavingValue label="Pending saving" value={pendingSaving} pending />
      </dl>

      {admin && (
        <section
          className="mt-6 border-t pt-5"
          aria-labelledby={`add-${cycle.id}`}
        >
          <h3 id={`add-${cycle.id}`} className="font-bold">
            Record an extra contribution
          </h3>
          <p className="text-muted-foreground mt-1 mb-4 text-xs">
            Record a received whole-NPR amount. The contributor and reason are
            visible to members.
          </p>
          <AddContributionForm cycle={cycle} />
        </section>
      )}

      <section
        className="mt-6 border-t pt-5"
        aria-labelledby={`activity-${cycle.id}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id={`activity-${cycle.id}`} className="font-bold">
            Extra contribution activity
          </h3>
          <span className="text-muted-foreground text-xs">
            {values.contributions.length} record
            {values.contributions.length === 1 ? "" : "s"}
          </span>
        </div>
        {values.contributions.length === 0 ? (
          <p className="text-muted-foreground mt-3 rounded-lg border border-dashed p-4 text-sm">
            No extra contributions have been recorded for this cycle.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {values.contributions.map((contribution) => (
              <li key={contribution.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{contribution.memberName}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {contribution.monthNumber
                        ? `Month ${contribution.monthNumber}`
                        : "Whole cycle"}
                      {" · "}
                      {paymentMethodLabel(contribution.paymentMethod)}
                    </p>
                    {contribution.reason && (
                      <p className="mt-2 text-sm">{contribution.reason}</p>
                    )}
                    <p className="text-muted-foreground mt-2 text-xs">
                      Last updated{" "}
                      <time dateTime={contribution.updatedAt}>
                        {dateTimeFormatter.format(
                          new Date(contribution.updatedAt),
                        )}
                      </time>
                    </p>
                  </div>
                  <p className="text-primary text-lg font-bold tabular-nums">
                    {npr(contribution.amount)}
                  </p>
                </div>
                {admin && (
                  <details className="mt-4 border-t pt-3">
                    <summary className="focus-ring cursor-pointer rounded text-xs font-bold">
                      Correct this contribution
                    </summary>
                    <div className="mt-3 max-w-2xl">
                      <EditContributionForm
                        key={`${contribution.id}:${contribution.updatedAt}`}
                        contribution={contribution}
                      />
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Card>
  );
}

function SavingValue({
  label,
  value,
  strong = false,
  pending = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
  pending?: boolean;
}) {
  return (
    <div
      className={
        pending
          ? "rounded-lg bg-amber-50 p-3"
          : "bg-secondary/50 rounded-lg p-3"
      }
    >
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd
        className={`mt-1 tabular-nums ${strong ? "text-primary text-lg font-bold" : "font-semibold"}`}
      >
        {npr(value)}
      </dd>
    </div>
  );
}

function emptyFund(cycle: Cycle): SavingFund {
  return {
    cycleId: cycle.id,
    cycleNumber: cycle.cycleNumber,
    fixedSavingReceived: 0,
    interestReceived: 0,
    extraContributions: 0,
    pendingFixedSaving: 0,
    pendingInterest: 0,
    actualCycleSaving: 0,
    carriedFromPreviousCycles: 0,
    cumulativeBalance: 0,
    contributions: [],
  };
}
