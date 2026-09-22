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
import type { DashboardData, DashboardMonth } from "@/domain/dashboard";
import { npr } from "@/features/dashboard/format";
import { MemberPayments } from "@/features/dashboard/member-payments";
import { getDashboardData } from "@/server/queries/dashboard";

export const metadata: Metadata = { title: "Member dashboard" };

const meetingDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <div className="space-y-6 lg:space-y-7">
      <DashboardHeader dashboard={dashboard} />
      {dashboard ? (
        <DashboardContent dashboard={dashboard} />
      ) : (
        <EmptyDashboard />
      )}
    </div>
  );
}

function DashboardHeader({ dashboard }: { dashboard: DashboardData | null }) {
  return (
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
      {dashboard && (
        <Badge variant="outline" className="bg-card h-8 gap-2 px-3">
          <span className="bg-primary size-1.5 rounded-full" />
          Cycle {dashboard.cycle.number} · Month {dashboard.cycle.currentMonth}{" "}
          of {dashboard.cycle.totalMonths}
        </Badge>
      )}
    </div>
  );
}

function EmptyDashboard() {
  return (
    <Card className="items-center gap-3 border border-dashed p-8 text-center shadow-none ring-0">
      <Landmark aria-hidden="true" className="text-primary size-8" />
      <h2 className="text-lg font-bold">No active circle yet</h2>
      <p className="text-muted-foreground max-w-lg text-sm">
        The live dashboard will appear after an administrator activates the
        first cycle and its monthly schedule.
      </p>
    </Card>
  );
}

function DashboardContent({ dashboard }: { dashboard: DashboardData }) {
  const { collection, saving } = dashboard;
  const activityMonth = dashboard.activityMonth.number;
  const stats = [
    {
      label: "Total saving fund",
      value: npr(saving.balance),
      detail: "Received savings across all cycles",
      icon: Landmark,
    },
    {
      label: dashboard.activityMonth.isCurrentMonth
        ? "Collected this month"
        : `Collected in Month ${activityMonth}`,
      value: npr(collection.received),
      detail:
        collection.totalDue > 0
          ? `Of ${npr(collection.totalDue)} in monthly obligations`
          : "Waiting for recorded obligations",
      icon: ArrowDownLeft,
    },
    {
      label: dashboard.activityMonth.isCurrentMonth
        ? "Pending this month"
        : `Pending in Month ${activityMonth}`,
      value: npr(collection.pending),
      detail:
        collection.totalDue === 0
          ? "Waiting for recorded obligations"
          : collection.pendingMembers === 1
            ? "1 member yet to contribute"
            : `${collection.pendingMembers} members yet to contribute`,
      icon: Clock3,
    },
    {
      label: "Members paid",
      value: `${collection.paidMembers} / ${collection.totalMembers}`,
      detail: `Recorded against Month ${activityMonth}`,
      icon: Users,
    },
  ];

  return (
    <>
      {!dashboard.activityMonth.isCurrentMonth && (
        <div className="border-primary/20 bg-primary/5 text-primary flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
          <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            Month {dashboard.cycle.currentMonth} is awaiting its Chitta draw.
            Showing the latest recorded winner and payments from Month{" "}
            {activityMonth}.
          </p>
        </div>
      )}
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
            {(index === 1 || index === 3) && collection.totalDue > 0 ? (
              <progress
                aria-label={
                  index === 1 ? "Monthly amount collected" : "Members paid"
                }
                value={
                  index === 1 ? collection.received : collection.paidMembers
                }
                max={
                  index === 1 ? collection.totalDue : collection.totalMembers
                }
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
          <WinnerCard dashboard={dashboard} />
          <MemberPayments
            payments={dashboard.payments}
            monthNumber={activityMonth}
            isCurrentMonth={dashboard.activityMonth.isCurrentMonth}
          />
          <CycleProgress dashboard={dashboard} />
        </div>
        <aside
          aria-label="Savings and gathering details"
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1"
        >
          <SavingCard dashboard={dashboard} />
          <MeetingCard meeting={dashboard.nextMeeting} />
          <ExtraContributionCard contribution={dashboard.latestContribution} />
          <div className="text-muted-foreground flex gap-3 px-1 text-xs leading-relaxed">
            <ShieldCheck aria-hidden="true" className="size-5 shrink-0" />
            <p>
              Our shared record is visible to every friend. Payment and saving
              updates are handled by the administrator.
            </p>
          </div>
        </aside>
      </div>

      <footer className="text-muted-foreground flex flex-wrap justify-between gap-2 border-t pt-5 text-[10px]">
        <span>Oxford 2068 Circle · Eleven friends, one shared journey.</span>
        <span>Live data · Asia/Kathmandu</span>
      </footer>
    </>
  );
}

function WinnerCard({ dashboard }: { dashboard: DashboardData }) {
  const winner = dashboard.winner;
  const activity = dashboard.activityMonth;
  return (
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
            {activity.isCurrentMonth ? "This month’s winner" : "Latest winner"}
          </h2>
          <span className="rounded-full border border-white/25 px-2.5 py-1 text-[10px]">
            {activity.isCurrentMonth ? "Current" : "Latest recorded"} · Month{" "}
            {activity.number} of {dashboard.cycle.totalMonths}
          </span>
        </div>
        {winner ? (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-12 place-items-center rounded-full bg-white/15 text-sm font-bold"
                >
                  {winner.initials}
                </span>
                <div>
                  <p className="text-xl font-bold">{winner.name}</p>
                  <p className="mt-1 text-xs text-white/80">
                    Cycle {dashboard.cycle.number} ·{" "}
                    {meetingDateFormatter.format(
                      new Date(`${activity.scheduledDate}T00:00:00Z`),
                    )}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {npr(winner.payout)}
                </p>
                <p className="mt-1 text-xs text-white/80">
                  Calculated Dhukuti payout
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-white/20 pt-4 text-[11px] text-white/85">
              <span>
                {npr(dashboard.collection.dhukutiReceived)} principal received
              </span>
              <span>
                Winner contributes {npr(winner.fixedSavingDue)} fixed saving
              </span>
            </div>
          </>
        ) : (
          <div className="mt-6 border-t border-white/20 pt-5">
            <p className="text-lg font-bold">Awaiting the Chitta draw</p>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/80">
              The winner and monthly obligations will appear here after the
              administrator records the in-person result.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function CycleProgress({ dashboard }: { dashboard: DashboardData }) {
  const { recorded, remaining } = dashboard.winnerProgress;
  return (
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
            {recorded} {recorded === 1 ? "winner" : "winners"} recorded ·{" "}
            {remaining} remaining
          </p>
        </div>
        <CircleCheck aria-hidden="true" className="text-primary size-5" />
      </div>
      <ol
        aria-label="Cycle months"
        className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-11"
      >
        {dashboard.months.map((month) => (
          <li key={month.monthNumber} className="text-center">
            <div className={monthMarkerClass(month.state)}>
              {month.state === "recorded" ? (
                <Check aria-hidden="true" className="size-3.5" />
              ) : (
                <span className="text-xs font-bold">{month.monthNumber}</span>
              )}
            </div>
            <span className="text-muted-foreground mt-2 block text-[10px]">
              M{month.monthNumber}
              <span className="sr-only">: {monthStateLabel(month.state)}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground mt-5 border-t pt-4 text-xs">
        Winner eligibility and interest reset with the next cycle; received
        savings carry forward.
      </p>
    </section>
  );
}

function SavingCard({ dashboard }: { dashboard: DashboardData }) {
  const { saving } = dashboard;
  return (
    <Card className="gap-0 border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Inside our saving fund</h2>
        <Coins aria-hidden="true" className="text-primary size-4" />
      </div>
      <p className="text-muted-foreground mt-1 text-[11px]">
        Cycle {dashboard.cycle.number} · Received amounts only
      </p>
      <dl className="mt-5 space-y-3 text-xs">
        {[
          ["Fixed savings", saving.fixedSaving],
          ["Winner interest", saving.interest],
          ["Extra contributions", saving.extraContributions],
          ["Carried from prior cycles", saving.carriedFromPreviousCycles],
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
          <dd className="text-primary tabular-nums">{npr(saving.balance)}</dd>
        </div>
      </dl>
      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-950">
        {npr(saving.pendingSaving)} in pending savings and interest is excluded
        from this balance.
      </p>
    </Card>
  );
}

function MeetingCard({ meeting }: { meeting: DashboardData["nextMeeting"] }) {
  return (
    <Card className="gap-0 border p-5 shadow-none ring-0">
      <div className="flex items-center gap-2">
        <CalendarDays aria-hidden="true" className="text-primary size-4" />
        <h2 className="font-bold">Our next gathering</h2>
      </div>
      {meeting ? (
        <>
          <p className="mt-5 text-3xl font-bold tracking-tight">
            {meeting.daysRemaining === 0 ? "Today" : meeting.daysRemaining}{" "}
            {meeting.daysRemaining > 0 && (
              <span className="text-muted-foreground text-sm font-normal">
                {meeting.daysRemaining === 1 ? "day to go" : "days to go"}
              </span>
            )}
          </p>
          <p className="mt-2 text-sm font-semibold">
            {formatMeetingDate(meeting.date)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {meeting.overridden
              ? "Adjusted meeting date"
              : "Scheduled last Saturday"}
          </p>
          <p className="text-muted-foreground mt-5 border-t pt-3 text-[10px]">
            Countdown uses Asia/Kathmandu calendar dates.
          </p>
        </>
      ) : (
        <p className="text-muted-foreground mt-5 text-sm">
          No future meeting is scheduled for this cycle.
        </p>
      )}
    </Card>
  );
}

function ExtraContributionCard({
  contribution,
}: {
  contribution: DashboardData["latestContribution"];
}) {
  return (
    <Card className="gap-0 border p-5 shadow-none ring-0">
      <h2 className="font-bold">A little extra, together.</h2>
      <div className="mt-4 flex gap-3">
        <div className="bg-secondary text-primary grid size-9 shrink-0 place-items-center rounded-full">
          <Heart aria-hidden="true" className="size-4" />
        </div>
        {contribution ? (
          <div>
            <p className="text-xs font-bold">
              {contribution.reason ?? "Extra saving contribution"}
            </p>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {npr(contribution.amount)} · {contribution.methodLabel} ·{" "}
              {contribution.monthNumber
                ? `Month ${contribution.monthNumber}`
                : "Whole cycle"}
            </p>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Contributed by {contribution.memberName}.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs leading-relaxed">
            No extra contribution has been recorded for this cycle.
          </p>
        )}
      </div>
    </Card>
  );
}

function monthMarkerClass(state: DashboardMonth["state"]) {
  if (state === "current")
    return "bg-primary text-primary-foreground ring-secondary mx-auto grid size-8 place-items-center rounded-full ring-4";
  if (state === "missing")
    return "mx-auto grid size-8 place-items-center rounded-full bg-amber-50 text-amber-900";
  if (state === "recorded")
    return "bg-secondary text-primary mx-auto grid size-8 place-items-center rounded-full";
  return "bg-muted text-muted-foreground mx-auto grid size-8 place-items-center rounded-full";
}

function monthStateLabel(state: DashboardMonth["state"]) {
  if (state === "recorded") return "winner recorded";
  if (state === "current") return "current month";
  if (state === "missing") return "past month awaiting winner";
  return "upcoming";
}

function formatMeetingDate(date: string) {
  return meetingDateFormatter.format(new Date(`${date}T00:00:00Z`));
}
