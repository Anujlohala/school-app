import type { Metadata } from "next";
import { CalendarDays, CircleCheck, TriangleAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  buildSchedulePreview,
  buildCycleCompletionSummary,
  type Cycle,
  type CycleMonth,
} from "@/domain/cycle";
import {
  ActivateCycleForm,
  CompleteCycleForm,
  MeetingDateForm,
} from "@/features/cycles/cycle-actions";
import { CycleSetupForm } from "@/features/cycles/cycle-setup-form";
import { WinnerForm } from "@/features/months/winner-form";
import { WinnerCorrectionForm } from "@/features/months/winner-correction-form";
import { PaymentControls } from "@/features/payments/payment-controls";
import { npr } from "@/features/dashboard/format";
import { paymentMethodLabel } from "@/domain/payment";
import { requireAccount } from "@/server/queries/auth";
import { listCycles } from "@/server/queries/cycles";
import { listMembers } from "@/server/queries/members";

export const metadata: Metadata = { title: "Cycles and monthly records" };

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kathmandu",
});

function displayDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kathmandu",
});

function displayDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export default async function MonthsPage() {
  const account = await requireAccount();
  const [members, cycles] = await Promise.all([listMembers(), listCycles()]);
  const admin = account.role === "admin";
  const activeMembers = members.filter((member) => member.active);
  const draft = cycles.find((cycle) => cycle.status === "draft");
  const activeCycle = cycles.find((cycle) => cycle.status === "active");

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="space-y-2">
        <p className="text-primary text-xs font-bold tracking-widest uppercase">
          {admin ? "Cycle administration" : "Monthly records"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Cycles and monthly schedule
        </h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          Each cycle snapshots its 11-person roster and contribution rules.
          Meeting dates default to the last Saturday of each Gregorian month.
        </p>
      </header>

      {admin && (
        <section
          className="bg-card space-y-5 rounded-xl border p-5 sm:p-6"
          aria-labelledby="cycle-setup-heading"
        >
          <div>
            <h2 id="cycle-setup-heading" className="text-xl font-bold">
              {draft
                ? `Edit Cycle ${draft.cycleNumber} draft`
                : "Create a cycle"}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Save and review the setup as a draft before activation. A draft
              can be prepared while another cycle is active.
            </p>
          </div>
          <CycleSetupForm activeMembers={activeMembers} draft={draft} />
        </section>
      )}

      {cycles.length === 0 ? (
        <section className="bg-card rounded-xl border border-dashed p-8 text-center">
          <CalendarDays
            aria-hidden="true"
            className="text-primary mx-auto mb-3 size-8"
          />
          <h2 className="text-lg font-semibold">No cycle has been created</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {admin
              ? "Complete the setup above to save Cycle 1 as a draft."
              : "The administrator is preparing the first cycle."}
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {cycles.map((cycle) => (
            <CycleCard
              key={cycle.id}
              cycle={cycle}
              admin={admin}
              activeCycleNumber={activeCycle?.cycleNumber}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CycleCard({
  cycle,
  admin,
  activeCycleNumber,
}: {
  cycle: Cycle;
  admin: boolean;
  activeCycleNumber: number | undefined;
}) {
  const completion = buildCycleCompletionSummary(cycle);
  const preview = buildSchedulePreview(cycle.startedOn.slice(0, 7));
  const schedule = cycle.months.length
    ? cycle.months
    : preview.map((month) => ({
        id: `preview-${month.monthNumber}`,
        monthNumber: month.monthNumber,
        scheduledDate: month.scheduledDate,
        dateOverridden: false,
        status: "draft" as const,
        updatedAt: cycle.updatedAt,
        winnerMemberId: null,
        winnerName: null,
        payments: [],
      }));
  const usedWinnerIds = new Set(
    cycle.months.flatMap((month) =>
      month.winnerMemberId ? [month.winnerMemberId] : [],
    ),
  );
  const nextDraftMonth = cycle.months.find((month) => !month.winnerMemberId);
  const eligibleMembers = cycle.members.filter(
    (member) => !usedWinnerIds.has(member.memberId),
  );
  return (
    <Card className="gap-0 border p-5 shadow-none ring-0 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold">Cycle {cycle.cycleNumber}</h2>
            <Badge
              variant={cycle.status === "active" ? "default" : "secondary"}
            >
              {cycle.status === "draft"
                ? "Draft"
                : cycle.status === "active"
                  ? "Active"
                  : "Completed"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Starts {displayDate(cycle.startedOn)} · {cycle.members.length}{" "}
            members
            {cycle.completedOn &&
              ` · Completed ${displayDate(cycle.completedOn)}`}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right text-xs">
          <div>
            <span className="text-muted-foreground block">Dhukuti</span>
            <strong>{npr(cycle.contributionAmount)}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block">Saving</span>
            <strong>{npr(cycle.fixedSavingAmount)}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block">Interest</span>
            <strong>{npr(cycle.interestAmount)}</strong>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.4fr]">
        <section aria-labelledby={`cycle-${cycle.id}-roster`}>
          <h3
            id={`cycle-${cycle.id}-roster`}
            className="flex items-center gap-2 text-sm font-bold"
          >
            <Users aria-hidden="true" className="text-primary size-4" />
            Saved roster
          </h3>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {cycle.members.map((member) => (
              <li
                key={member.memberId}
                className="bg-secondary/50 flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm"
              >
                <span className="text-muted-foreground w-5 text-right text-xs tabular-nums">
                  {member.displayOrder}
                </span>
                <span className="min-w-0 break-words">{member.fullName}</span>
                {!member.active && (
                  <Badge variant="outline" className="ml-auto">
                    Inactive
                  </Badge>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section
          className="min-w-0"
          aria-labelledby={`cycle-${cycle.id}-schedule`}
        >
          <h3
            id={`cycle-${cycle.id}-schedule`}
            className="flex items-center gap-2 text-sm font-bold"
          >
            <CalendarDays aria-hidden="true" className="text-primary size-4" />
            {cycle.status === "draft" ? "Schedule preview" : "Meeting schedule"}
          </h3>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2">
            {schedule.map((month) => (
              <li key={month.id} className="min-w-0 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold">
                      Month {month.monthNumber}
                    </p>
                    <time
                      dateTime={month.scheduledDate}
                      className="text-muted-foreground mt-1 block text-xs"
                    >
                      {displayDate(month.scheduledDate)}
                    </time>
                  </div>
                  {month.dateOverridden ? (
                    <Badge variant="outline">Adjusted</Badge>
                  ) : (
                    <Badge variant="secondary">Last Saturday</Badge>
                  )}
                </div>
                {admin && cycle.status === "active" && (
                  <MeetingDateForm
                    monthId={month.id}
                    scheduledDate={month.scheduledDate}
                  />
                )}
                {month.winnerMemberId ? (
                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs font-bold">Winner</p>
                    <p className="mt-1 text-sm">{month.winnerName}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Payout:{" "}
                      {npr((cycle.memberCount - 1) * cycle.contributionAmount)}
                    </p>
                    <MonthlyObligations month={month} admin={admin} />
                    {admin && month.winnerName && (
                      <WinnerCorrectionForm
                        monthId={month.id}
                        monthNumber={month.monthNumber}
                        updatedAt={month.updatedAt}
                        currentWinnerMemberId={month.winnerMemberId}
                        currentWinnerName={month.winnerName}
                        members={cycle.members.filter(
                          (member) =>
                            member.memberId !== month.winnerMemberId &&
                            !cycle.months.some(
                              (otherMonth) =>
                                otherMonth.id !== month.id &&
                                otherMonth.winnerMemberId === member.memberId,
                            ),
                        )}
                        receivedPaymentCount={
                          cycle.months
                            .filter(
                              (affectedMonth) =>
                                affectedMonth.monthNumber >= month.monthNumber,
                            )
                            .flatMap((affectedMonth) => affectedMonth.payments)
                            .filter(
                              (payment) => payment.paymentStatus === "paid",
                            ).length
                        }
                      />
                    )}
                  </div>
                ) : admin &&
                  cycle.status === "active" &&
                  nextDraftMonth?.id === month.id ? (
                  <WinnerForm
                    monthId={month.id}
                    updatedAt={month.updatedAt}
                    members={eligibleMembers}
                  />
                ) : cycle.status === "active" && admin ? (
                  <p className="text-muted-foreground mt-3 border-t pt-3 text-xs">
                    Record the earlier month first.
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {admin && cycle.status === "draft" && (
        <section
          className="mt-6 border-t pt-5"
          aria-labelledby="activate-heading"
        >
          <div className="mb-4 flex items-start gap-3">
            <CircleCheck
              aria-hidden="true"
              className="text-primary mt-0.5 size-5 shrink-0"
            />
            <div>
              <h3 id="activate-heading" className="font-bold">
                Activate this cycle
              </h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Activation creates all 11 month records and permanently locks
                the roster, starting month, and rule amounts.
              </p>
            </div>
          </div>
          <ActivateCycleForm
            cycleId={cycle.id}
            updatedAt={cycle.updatedAt}
            blockedByCycleNumber={activeCycleNumber}
          />
        </section>
      )}

      {admin && cycle.status === "active" && (
        <section
          className="mt-6 border-t pt-5"
          aria-labelledby={`complete-${cycle.id}-heading`}
        >
          <div className="mb-4 flex items-start gap-3">
            {completion.ready ? (
              <CircleCheck
                aria-hidden="true"
                className="text-primary mt-0.5 size-5 shrink-0"
              />
            ) : (
              <TriangleAlert
                aria-hidden="true"
                className="text-muted-foreground mt-0.5 size-5 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 id={`complete-${cycle.id}-heading`} className="font-bold">
                Complete Cycle {cycle.cycleNumber}
              </h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Completion closes all 11 months and unlocks activation of the
                next draft. Pending payments remain available for correction.
              </p>
            </div>
          </div>
          <dl className="bg-secondary/50 mb-4 grid gap-3 rounded-lg p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground text-xs">Winners</dt>
              <dd className="mt-1 font-bold">
                {completion.winnerCount} / {cycle.memberCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Obligations</dt>
              <dd className="mt-1 font-bold">
                {completion.obligationCount} /{" "}
                {completion.expectedObligationCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Still pending</dt>
              <dd className="mt-1 font-bold">
                {npr(completion.pendingAmount)} · {completion.pendingCount}
              </dd>
            </div>
          </dl>
          {completion.ready ? (
            <CompleteCycleForm
              cycleId={cycle.id}
              reviewVersion={completion.reviewVersion}
            />
          ) : (
            <div className="rounded-lg border border-dashed p-4">
              <p className="text-sm font-bold">Completion requirements</p>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
                {completion.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </Card>
  );
}

function MonthlyObligations({
  month,
  admin,
}: {
  month: CycleMonth;
  admin: boolean;
}) {
  const paid = month.payments.filter(
    (payment) => payment.paymentStatus === "paid",
  );
  const received = paid.reduce((sum, payment) => sum + payment.totalDue, 0);
  const total = month.payments.reduce(
    (sum, payment) => sum + payment.totalDue,
    0,
  );
  return (
    <>
      <dl className="bg-secondary/50 mt-3 grid grid-cols-2 gap-3 rounded-lg p-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Received</dt>
          <dd className="mt-1 font-bold">{npr(received)}</dd>
          <dd className="text-muted-foreground mt-0.5">
            {paid.length} of {month.payments.length} members
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pending</dt>
          <dd className="mt-1 font-bold">{npr(total - received)}</dd>
          <dd className="text-muted-foreground mt-0.5">
            {month.payments.length - paid.length} members
          </dd>
        </div>
      </dl>
      <details className="mt-3">
        <summary className="focus-ring cursor-pointer rounded text-xs font-bold">
          {admin ? "Manage" : "View"} {month.payments.length} member obligations
        </summary>
        <div
          className="focus-ring mt-3 overflow-x-auto"
          role="region"
          aria-label={`Month ${month.monthNumber} member obligations`}
          tabIndex={0}
        >
          <table
            className={`w-full text-left text-xs ${admin ? "min-w-[1080px]" : "min-w-[820px]"}`}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                <th scope="col" className="py-2 pr-3">
                  Member
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  Dhukuti
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  Saving
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  Interest
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  Total
                </th>
                <th scope="col" className="py-2 pr-3">
                  Status
                </th>
                <th scope="col" className="py-2 pr-3">
                  Method / received
                </th>
                <th scope="col" className="py-2 pr-3">
                  Last updated
                </th>
                {admin && (
                  <th scope="col" className="py-2">
                    Administrator action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {month.payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b align-top last:border-0"
                >
                  <td className="py-3 pr-3 font-medium">
                    {payment.memberName}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {npr(payment.dhukutiDue)}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {npr(payment.fixedSavingDue)}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {npr(payment.interestDue)}
                  </td>
                  <td className="py-3 pr-3 text-right font-bold">
                    {npr(payment.totalDue)}
                  </td>
                  <td className="py-3 pr-3">
                    <Badge
                      variant={
                        payment.paymentStatus === "paid"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {payment.paymentStatus === "paid" ? "Paid" : "Pending"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3">
                    <span>{paymentMethodLabel(payment.paymentMethod)}</span>
                    {payment.paidAt && (
                      <time
                        dateTime={payment.paidAt}
                        className="text-muted-foreground mt-1 block"
                      >
                        {displayDateTime(payment.paidAt)}
                      </time>
                    )}
                  </td>
                  <td className="text-muted-foreground py-3 pr-3">
                    <time dateTime={payment.updatedAt}>
                      {displayDateTime(payment.updatedAt)}
                    </time>
                  </td>
                  {admin && (
                    <td className="py-3">
                      <PaymentControls payment={payment} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
