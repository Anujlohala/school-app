"use client";

import { useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Gift,
  History,
  Landmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  HistoryContribution,
  HistoryCycle,
  HistoryData,
  HistoryMonth,
  HistoryPayment,
} from "@/domain/history";
import { npr } from "@/features/dashboard/format";

type HistoryFilter = "all" | "paid" | "pending" | "extras";

const filters: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "All activity" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "extras", label: "Extras" },
];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kathmandu",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kathmandu",
});

export function HistoryExplorer({ data }: { data: HistoryData }) {
  const [cycleId, setCycleId] = useState(data.cycles[0]?.id ?? "");
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const cycle =
    data.cycles.find((item) => item.id === cycleId) ?? data.cycles[0];

  if (!cycle) return null;

  const months = cycle.months.filter((month) => monthMatches(month, filter));
  const cycleContributions =
    filter === "all" || filter === "extras"
      ? cycle.wholeCycleContributions
      : [];
  const visibleRecordCount =
    months.reduce(
      (total, month) =>
        total +
        visiblePayments(month, filter).length +
        visibleContributions(month, filter).length,
      0,
    ) + cycleContributions.length;

  return (
    <div className="space-y-6">
      <Card className="gap-5 border p-5 shadow-none ring-0 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[12rem] flex-1 sm:max-w-xs">
            <label
              htmlFor="history-cycle"
              className="mb-2 block text-xs font-bold"
            >
              Cycle
            </label>
            <select
              id="history-cycle"
              value={cycle.id}
              onChange={(event) => setCycleId(event.target.value)}
              className="focus-ring bg-secondary min-h-11 w-full rounded-lg border border-transparent px-3 text-sm"
            >
              {data.cycles.map((item) => (
                <option key={item.id} value={item.id}>
                  Cycle {item.cycleNumber} · {statusLabel(item.status)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Cycle {cycle.cycleNumber}</h2>
              <Badge
                variant={cycle.status === "active" ? "default" : "secondary"}
              >
                {statusLabel(cycle.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Started {formatDate(cycle.startedOn)} · Last updated{" "}
              {formatDateTime(cycle.lastUpdatedAt)}
            </p>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryValue
            icon={History}
            label="Recorded months"
            value={`${cycle.recordedMonths} / ${cycle.memberCount}`}
          />
          <SummaryValue
            icon={Check}
            label="Received"
            value={npr(cycle.received)}
          />
          <SummaryValue
            icon={Clock3}
            label="Pending"
            value={npr(cycle.pending)}
            pending
          />
          <SummaryValue
            icon={Landmark}
            label="Cycle saving"
            value={npr(cycle.actualSaving)}
          />
        </dl>
      </Card>

      <section aria-labelledby="history-activity-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="history-activity-heading" className="text-xl font-bold">
              Recorded activity
            </h2>
            <p
              className="text-muted-foreground mt-1 text-xs"
              aria-live="polite"
            >
              {visibleRecordCount} visible payment and contribution record
              {visibleRecordCount === 1 ? "" : "s"}
            </p>
          </div>
          <div
            className="bg-muted flex flex-wrap rounded-lg p-1"
            role="group"
            aria-label="Filter history"
          >
            {filters.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={filter === item.value ? "default" : "ghost"}
                aria-pressed={filter === item.value}
                className="min-h-11 px-3 text-xs"
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {cycleContributions.length > 0 && (
          <Card className="gap-0 border p-5 shadow-none ring-0 sm:p-6">
            <div className="flex items-center gap-2">
              <Gift aria-hidden="true" className="text-primary size-4" />
              <h3 className="font-bold">Whole-cycle contributions</h3>
            </div>
            <ContributionList contributions={cycleContributions} />
          </Card>
        )}

        {months.length === 0 && cycleContributions.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed p-8 text-center">
            <History
              aria-hidden="true"
              className="text-primary mx-auto size-8"
            />
            <h3 className="mt-3 font-bold">No matching history</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              This cycle has no records in the selected filter.
            </p>
          </div>
        ) : (
          months.map((month) => (
            <MonthHistoryCard key={month.id} month={month} filter={filter} />
          ))
        )}
      </section>
    </div>
  );
}

function SummaryValue({
  icon: Icon,
  label,
  value,
  pending = false,
}: {
  icon: typeof History;
  label: string;
  value: string;
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
      <dt className="text-muted-foreground flex items-center gap-2 text-xs">
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </dt>
      <dd className="mt-2 text-lg font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function MonthHistoryCard({
  month,
  filter,
}: {
  month: HistoryMonth;
  filter: HistoryFilter;
}) {
  const payments = visiblePayments(month, filter);
  const contributions = visibleContributions(month, filter);

  return (
    <Card className="gap-0 overflow-hidden border shadow-none ring-0">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold">Month {month.monthNumber}</h3>
              <MonthStateBadge state={month.state} />
              {month.dateOverridden && (
                <Badge variant="outline">Adjusted date</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {formatDate(month.scheduledDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Winner</p>
            <p className="mt-1 font-bold">
              {month.winnerName ?? "Awaiting Chitta"}
            </p>
            {month.winnerName && (
              <p className="text-muted-foreground mt-1 text-xs">
                Payout {npr(month.payout)}
              </p>
            )}
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HistoryValue label="Total due" value={month.totalDue} />
          <HistoryValue label="Received" value={month.received} />
          <HistoryValue label="Pending" value={month.pending} pending />
          <HistoryValue label="Saving received" value={month.savingReceived} />
        </dl>
        <p className="text-muted-foreground mt-4 text-xs">
          {month.paidMembers} paid · {month.pendingMembers} pending · Last
          updated {formatDateTime(month.lastUpdatedAt)}
        </p>
      </div>

      {payments.length > 0 && (
        <PaymentTable month={month} payments={payments} />
      )}
      {contributions.length > 0 && (
        <div className="border-t p-5 sm:p-6">
          <h4 className="flex items-center gap-2 text-sm font-bold">
            <Gift aria-hidden="true" className="text-primary size-4" />
            Extra contributions
          </h4>
          <ContributionList contributions={contributions} />
        </div>
      )}
    </Card>
  );
}

function PaymentTable({
  month,
  payments,
}: {
  month: HistoryMonth;
  payments: HistoryPayment[];
}) {
  return (
    <details className="border-t">
      <summary className="focus-ring cursor-pointer rounded p-5 text-sm font-bold sm:p-6">
        View {payments.length} payment record{payments.length === 1 ? "" : "s"}
      </summary>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div
          className="focus-ring overflow-x-auto"
          role="region"
          aria-label={`Month ${month.monthNumber} historical payments`}
          tabIndex={0}
        >
          <table className="min-w-[940px] text-left text-xs">
            <thead className="text-muted-foreground border-b">
              <tr>
                <th scope="col" className="py-2 pr-4">
                  Member
                </th>
                <th scope="col" className="py-2 pr-4 text-right">
                  Dhukuti
                </th>
                <th scope="col" className="py-2 pr-4 text-right">
                  Saving
                </th>
                <th scope="col" className="py-2 pr-4 text-right">
                  Interest
                </th>
                <th scope="col" className="py-2 pr-4 text-right">
                  Total
                </th>
                <th scope="col" className="py-2 pr-4">
                  Method
                </th>
                <th scope="col" className="py-2 pr-4">
                  Status
                </th>
                <th scope="col" className="py-2">
                  Last updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <th scope="row" className="py-3 pr-4 font-semibold">
                    {payment.memberName}
                  </th>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {npr(payment.dhukutiDue)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {npr(payment.fixedSavingDue)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {npr(payment.interestDue)}
                  </td>
                  <td className="py-3 pr-4 text-right font-bold tabular-nums">
                    {npr(payment.totalDue)}
                  </td>
                  <td className="py-3 pr-4">{payment.paymentMethodLabel}</td>
                  <td className="py-3 pr-4">
                    <PaymentStatus status={payment.paymentStatus} />
                  </td>
                  <td className="text-muted-foreground py-3 whitespace-nowrap">
                    {formatDateTime(payment.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

function ContributionList({
  contributions,
}: {
  contributions: HistoryContribution[];
}) {
  return (
    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
      {contributions.map((contribution) => (
        <li key={contribution.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{contribution.memberName}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {contribution.paymentMethodLabel}
                {contribution.reason ? ` · ${contribution.reason}` : ""}
              </p>
            </div>
            <p className="text-primary font-bold tabular-nums">
              {npr(contribution.amount)}
            </p>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Last updated {formatDateTime(contribution.updatedAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function HistoryValue({
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
          ? "rounded-lg bg-amber-50 p-3"
          : "bg-secondary/50 rounded-lg p-3"
      }
    >
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 font-bold tabular-nums">{npr(value)}</dd>
    </div>
  );
}

function MonthStateBadge({ state }: { state: HistoryMonth["state"] }) {
  if (state === "settled") return <Badge variant="secondary">Settled</Badge>;
  if (state === "pending") {
    return <Badge className="bg-amber-50 text-amber-900">Pending</Badge>;
  }
  return <Badge variant="outline">Awaiting winner</Badge>;
}

function PaymentStatus({
  status,
}: {
  status: HistoryPayment["paymentStatus"];
}) {
  return (
    <Badge
      variant="secondary"
      className={
        status === "paid"
          ? "bg-secondary text-primary"
          : "bg-amber-50 text-amber-900"
      }
    >
      {status === "paid" ? (
        <Check aria-hidden="true" />
      ) : (
        <Clock3 aria-hidden="true" />
      )}
      {status === "paid" ? "Paid" : "Pending"}
    </Badge>
  );
}

function monthMatches(month: HistoryMonth, filter: HistoryFilter) {
  if (filter === "all") return true;
  if (filter === "extras") return month.contributions.length > 0;
  return month.payments.some((payment) => payment.paymentStatus === filter);
}

function visiblePayments(month: HistoryMonth, filter: HistoryFilter) {
  if (filter === "extras") return [];
  if (filter === "all") return month.payments;
  return month.payments.filter((payment) => payment.paymentStatus === filter);
}

function visibleContributions(month: HistoryMonth, filter: HistoryFilter) {
  return filter === "all" || filter === "extras" ? month.contributions : [];
}

function statusLabel(status: HistoryCycle["status"]) {
  return status === "active" ? "Active" : "Completed";
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
