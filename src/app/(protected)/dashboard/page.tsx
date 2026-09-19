import { requireAccount } from "@/server/queries/auth";
import type { Metadata } from "next";
import {
  ArrowDownLeft,
  CalendarDays,
  Check,
  CircleCheck,
  Clock3,
  Coins,
  Heart,
  Landmark,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MemberPayments } from "@/features/dashboard/member-payments";
import { npr } from "@/features/dashboard/format";
import {
  samplePayments,
  sampleSummary as summary,
} from "@/features/dashboard/sample-data";
export const metadata: Metadata = { title: "Member dashboard" };
export default async function DashboardPage() {
  await requireAccount();
  const balance =
    summary.fixedSaving + summary.interest + summary.extra + summary.carried;
  const stats = [
    {
      label: "Total saving fund",
      value: npr(balance),
      detail: "Received savings across all cycles",
      icon: Landmark,
    },
    {
      label: "Collected this month",
      value: npr(summary.received),
      detail: "Of NPR 23,100 in monthly dues",
      icon: ArrowDownLeft,
    },
    {
      label: "Pending this month",
      value: npr(summary.pending),
      detail: "3 members yet to contribute",
      icon: Clock3,
    },
    {
      label: "Members paid",
      value: `${summary.paidCount} / 11`,
      detail: "Keeping our circle moving, together",
      icon: Users,
    },
  ];
  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary mb-2 text-[10px] font-bold tracking-[0.2em] uppercase">
            Together, since 2068
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Our circle, at a glance.
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            A clear view of our contributions, savings, and shared milestones.
          </p>
        </div>
        <Badge variant="outline" className="bg-card h-8 gap-2 px-3">
          <span className="bg-primary size-1.5 rounded-full" />
          Cycle 1 · Month 11 of 11
        </Badge>
      </div>
      <section
        aria-label="Financial overview"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, detail, icon: Icon }, index) => (
          <Card key={label} className="gap-0 border p-5 shadow-none ring-0">
            <div className="text-muted-foreground flex items-center justify-between gap-2">
              <h2 className="text-[10px] font-bold tracking-wider uppercase">
                {label}
              </h2>
              <Icon aria-hidden="true" className="size-4" />
            </div>
            <p className="mt-5 text-2xl font-extrabold tracking-tight tabular-nums">
              {value}
            </p>
            <p className="text-muted-foreground mt-2 text-[11px]">{detail}</p>
            {index === 1 || index === 3 ? (
              <progress
                aria-label={
                  index === 1 ? "Monthly amount collected" : "Members paid"
                }
                value={index === 1 ? summary.received : summary.paidCount}
                max={index === 1 ? summary.received + summary.pending : 11}
                className="dashboard-progress mt-4 h-1.5 w-full"
              />
            ) : (
              <div className="bg-border mt-4 h-px" />
            )}
          </Card>
        ))}
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-6">
          <section
            aria-labelledby="winner-heading"
            className="bg-primary text-primary-foreground relative overflow-hidden rounded-xl p-6 sm:p-7"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full border border-white/10 before:absolute before:inset-8 before:rounded-full before:border before:border-white/10 after:absolute after:inset-16 after:rounded-full after:border after:border-white/10"
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="winner-heading"
                  className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase"
                >
                  <Trophy aria-hidden="true" className="size-4" />
                  This month’s winner
                </h2>
                <span className="rounded-full border border-white/25 px-2.5 py-1 text-[10px]">
                  Final round
                </span>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-12 place-items-center rounded-full bg-white/15 text-sm font-bold"
                  >
                    RJ
                  </span>
                  <div>
                    <p className="text-xl font-bold">Rohan Joshi</p>
                    <p className="mt-1 text-xs text-white/80">
                      Cycle 1 · Month 11
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">NPR 20,000</p>
                  <p className="mt-1 text-xs text-white/80">
                    Calculated Dhukuti payout
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-white/20 pt-4 text-[11px] text-white/85">
                <span>
                  {npr(summary.dhukutiReceived)} principal collected so far
                </span>
                <span>Winner contributes NPR 100 fixed saving</span>
              </div>
            </div>
          </section>
          <MemberPayments payments={samplePayments} />
          <section
            aria-labelledby="cycle-heading"
            className="bg-card rounded-xl border p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="cycle-heading" className="text-lg font-bold">
                  One circle. Eleven turns.
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  10 months completed · Final month in progress
                </p>
              </div>
              <CircleCheck aria-hidden="true" className="text-primary size-5" />
            </div>
            <ol
              aria-label="Cycle months"
              className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-11"
            >
              {Array.from({ length: 11 }, (_, index) => (
                <li key={index} className="text-center">
                  <div
                    className={
                      index === 10
                        ? "bg-primary text-primary-foreground ring-secondary mx-auto grid size-8 place-items-center rounded-full ring-4"
                        : "bg-secondary text-primary mx-auto grid size-8 place-items-center rounded-full"
                    }
                  >
                    {index === 10 ? (
                      <span className="text-xs font-bold">11</span>
                    ) : (
                      <Check aria-hidden="true" className="size-3.5" />
                    )}
                  </div>
                  <span className="text-muted-foreground mt-2 block text-[10px]">
                    M{index + 1}
                    <span className="sr-only">
                      {index === 10 ? ": in progress" : ": completed"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-muted-foreground mt-5 border-t pt-4 text-xs">
              All 11 winners recorded. Eligibility and interest reset with the
              next cycle; savings carry forward.
            </p>
          </section>
        </div>
        <aside
          aria-label="Savings and gathering details"
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1"
        >
          <Card className="gap-0 border p-5 shadow-none ring-0">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Inside our saving fund</h2>
              <Coins aria-hidden="true" className="text-primary size-4" />
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Cycle 1 · Received amounts only
            </p>
            <dl className="mt-5 space-y-3 text-xs">
              {[
                ["Fixed savings", summary.fixedSaving],
                ["Winner interest", summary.interest],
                ["Extra contributions", summary.extra],
                ["Carried from prior cycles", summary.carried],
              ].map(([label, amount]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold tabular-nums">
                    {npr(Number(amount))}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between border-t pt-4 font-bold">
                <dt>Total balance</dt>
                <dd className="text-primary tabular-nums">{npr(balance)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-950">
              {npr(summary.pendingSaving)} in pending savings and interest is
              excluded from this balance.
            </p>
          </Card>
          <Card className="gap-0 border p-5 shadow-none ring-0">
            <div className="flex items-center gap-2">
              <CalendarDays
                aria-hidden="true"
                className="text-primary size-4"
              />
              <h2 className="font-bold">Our next gathering</h2>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight">
              8{" "}
              <span className="text-muted-foreground text-sm font-normal">
                days to go
              </span>
            </p>
            <p className="mt-2 text-sm font-semibold">
              Saturday, 26 September 2026
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Last Saturday of the month
            </p>
            <p className="text-muted-foreground mt-5 border-t pt-3 text-[10px]">
              Sample countdown as of 18 Sep 2026 · Asia/Kathmandu
            </p>
          </Card>
          <Card className="gap-0 border p-5 shadow-none ring-0">
            <h2 className="font-bold">A little extra, together.</h2>
            <div className="mt-4 flex gap-3">
              <div className="bg-secondary text-primary grid size-9 shrink-0 place-items-center rounded-full">
                <Heart aria-hidden="true" className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold">
                  Aarav’s birthday contribution
                </p>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  NPR 500 · eSewa · Month 11
                </p>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  A small gift to the fund that keeps us connected.
                </p>
              </div>
            </div>
          </Card>
          <div className="text-muted-foreground flex gap-3 px-1 text-xs leading-relaxed">
            <ShieldCheck aria-hidden="true" className="size-5 shrink-0" />
            <p>
              Our shared record, open to every friend. Payment updates are
              handled by the administrator.
            </p>
          </div>
        </aside>
      </div>
      <footer className="text-muted-foreground flex flex-wrap justify-between gap-2 border-t pt-5 text-[10px]">
        <span>Oxford 2068 Circle · Eleven friends, one shared journey.</span>
        <span>Sample snapshot · 18 September 2026</span>
      </footer>
    </div>
  );
}
