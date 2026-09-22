"use client";

import { useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardPayment } from "@/domain/dashboard";
import { npr } from "./format";

export function MemberPayments({
  payments,
  monthNumber,
}: {
  payments: DashboardPayment[];
  monthNumber: number;
}) {
  const [filter, setFilter] = useState<"All" | "Paid" | "Pending">("All");
  const visible = payments.filter(
    (row) =>
      filter === "All" ||
      row.paymentStatus === (filter === "Paid" ? "paid" : "pending"),
  );

  return (
    <section
      aria-labelledby="payments-heading"
      className="bg-card overflow-hidden rounded-xl border"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5 sm:p-6">
        <div>
          <h2
            id="payments-heading"
            className="text-lg font-bold tracking-tight"
          >
            Members & payments
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Month {monthNumber} · Full monthly obligations
          </p>
        </div>
        {payments.length > 0 && (
          <div
            className="bg-muted flex rounded-lg p-1"
            role="group"
            aria-label="Filter payments"
          >
            {(["All", "Paid", "Pending"] as const).map((label) => (
              <Button
                key={label}
                variant={filter === label ? "default" : "ghost"}
                aria-pressed={filter === label}
                onClick={() => setFilter(label)}
                className="min-h-11 px-3 text-xs"
              >
                {label} ({count(payments, label)})
              </Button>
            ))}
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {visible.length} {filter.toLowerCase()} members
      </p>
      {payments.length === 0 ? (
        <p className="text-muted-foreground p-6 text-sm">
          Monthly obligations will appear after the administrator records this
          month&apos;s Chitta winner.
        </p>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground p-6 text-sm">
          No {filter.toLowerCase()} payments for this month.
        </p>
      ) : (
        <ul className="divide-y" aria-label="Member payment records">
          {visible.map((row) => (
            <li
              key={row.id}
              className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-5 py-4 sm:grid-cols-[1.5fr_1fr_1fr_0.7fr] sm:px-6"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="bg-secondary text-primary grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                >
                  {initials(row.memberName)}
                </span>
                <div>
                  <p className="text-xs font-bold sm:text-sm">
                    {row.memberName}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {row.paymentStatus === "paid"
                      ? row.paymentMethodLabel
                      : "Awaiting payment"}
                  </p>
                </div>
              </div>
              <div className="text-muted-foreground hidden text-xs sm:block">
                <WinnerStatus
                  winningMonth={row.winningMonth}
                  currentMonth={monthNumber}
                />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold tabular-nums sm:text-sm">
                  {npr(row.totalDue)}
                </p>
                <p className="text-muted-foreground text-[10px]">
                  {componentBreakdown(row)}
                </p>
              </div>
              <div className="col-span-2 flex items-center justify-between pl-12 sm:col-span-1 sm:justify-end sm:pl-0">
                <span className="text-muted-foreground text-[10px] sm:hidden">
                  <WinnerStatus
                    winningMonth={row.winningMonth}
                    currentMonth={monthNumber}
                  />
                </span>
                <Badge
                  variant="secondary"
                  className={
                    row.paymentStatus === "paid"
                      ? "bg-secondary text-primary"
                      : "bg-amber-50 text-amber-900"
                  }
                >
                  {row.paymentStatus === "paid" ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Clock3 aria-hidden="true" />
                  )}
                  {row.paymentStatus === "paid" ? "Paid" : "Pending"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="text-muted-foreground bg-muted/30 border-t px-5 py-4 text-[11px] sm:px-6">
        Amounts show the recorded Dhukuti, fixed saving, and interest components
        for this month.
      </div>
    </section>
  );
}

function count(
  payments: DashboardPayment[],
  filter: "All" | "Paid" | "Pending",
) {
  if (filter === "All") return payments.length;
  return payments.filter(
    (payment) =>
      payment.paymentStatus === (filter === "Paid" ? "paid" : "pending"),
  ).length;
}

function WinnerStatus({
  winningMonth,
  currentMonth,
}: {
  winningMonth: number | null;
  currentMonth: number;
}) {
  if (winningMonth === currentMonth)
    return <Badge variant="secondary">Current winner</Badge>;
  if (winningMonth) return <>Won · Month {winningMonth}</>;
  return <>Eligible</>;
}

function componentBreakdown(payment: DashboardPayment) {
  const parts = [
    payment.dhukutiDue && npr(payment.dhukutiDue),
    payment.fixedSavingDue && npr(payment.fixedSavingDue),
    payment.interestDue && npr(payment.interestDue),
  ].filter(Boolean);
  return parts.join(" + ") || npr(0);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
