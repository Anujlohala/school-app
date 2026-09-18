"use client";
import { useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { npr } from "./format";
import type { SamplePayment } from "./sample-data";
export function MemberPayments({ payments }: { payments: SamplePayment[] }) {
  const [filter, setFilter] = useState<"All" | "Paid" | "Pending">("All");
  const visible = payments.filter(
    (row) => filter === "All" || row.paid === (filter === "Paid"),
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
            Month 11 · Full monthly contributions
          </p>
        </div>
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
              {label} (
              {label === "All"
                ? payments.length
                : payments.filter((row) => row.paid === (label === "Paid"))
                    .length}
              )
            </Button>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {visible.length} {filter.toLowerCase()} members
      </p>
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
                {row.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div>
                <p className="text-xs font-bold sm:text-sm">{row.name}</p>
                <p className="text-muted-foreground text-[11px]">
                  {row.method ?? "Awaiting payment"}
                </p>
              </div>
            </div>
            <div className="text-muted-foreground hidden text-xs sm:block">
              {row.winningMonth === 11 ? (
                <Badge variant="secondary">Current winner</Badge>
              ) : (
                `Won · Month ${row.winningMonth}`
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold tabular-nums sm:text-sm">
                {npr(row.total)}
              </p>
              <p className="text-muted-foreground text-[10px]">
                {row.winningMonth === 11
                  ? "Fixed saving only"
                  : "2,000 + 100 + 200"}
              </p>
            </div>
            <div className="col-span-2 flex items-center justify-between pl-12 sm:col-span-1 sm:justify-end sm:pl-0">
              <span className="text-muted-foreground text-[10px] sm:hidden">
                {row.winningMonth === 11
                  ? "Current winner"
                  : `Won · Month ${row.winningMonth}`}
              </span>
              <Badge
                variant="secondary"
                className={
                  row.paid
                    ? "bg-secondary text-primary"
                    : "bg-amber-50 text-amber-900"
                }
              >
                {row.paid ? (
                  <Check aria-hidden="true" />
                ) : (
                  <Clock3 aria-hidden="true" />
                )}
                {row.paid ? "Paid" : "Pending"}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
      <div className="text-muted-foreground bg-muted/30 border-t px-5 py-4 text-[11px] sm:px-6">
        Amounts show Dhukuti + fixed saving + interest. All names and records
        are fictional.
      </div>
    </section>
  );
}
