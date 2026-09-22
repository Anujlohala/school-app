import { z } from "zod";
import type { PaymentMethod } from "@/domain/payment";

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export const cycleIdentity = z.uuid();
export const cycleVersion = z.iso.datetime({ offset: true });
export const cycleDraftInput = z
  .object({
    startedMonth: z
      .string()
      .regex(monthPattern, "Choose a valid Gregorian starting month."),
    contributionAmount: z.coerce
      .number()
      .int("Use a whole NPR amount.")
      .positive("Dhukuti contribution must be greater than zero."),
    fixedSavingAmount: z.coerce
      .number()
      .int("Use a whole NPR amount.")
      .nonnegative("Fixed saving cannot be negative."),
    interestAmount: z.coerce
      .number()
      .int("Use a whole NPR amount.")
      .nonnegative("Winner interest cannot be negative."),
    memberIds: z
      .array(z.uuid())
      .length(11, "Select exactly 11 active members."),
  })
  .refine((value) => new Set(value.memberIds).size === value.memberIds.length, {
    message: "Each member can appear only once in a cycle.",
    path: ["memberIds"],
  });

export const meetingDateInput = z.object({
  scheduledDate: z.iso.date("Choose a valid Gregorian meeting date."),
});

export const winnerInput = z.object({
  monthId: z.uuid(),
  winnerMemberId: z.uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});

export type CycleStatus = "draft" | "active" | "completed";
export type CycleMember = {
  memberId: string;
  fullName: string;
  active: boolean;
  displayOrder: number;
};
export type CycleMonth = {
  id: string;
  monthNumber: number;
  scheduledDate: string;
  dateOverridden: boolean;
  status: "draft" | "open" | "completed";
  updatedAt: string;
  winnerMemberId: string | null;
  winnerName: string | null;
  payments: MonthlyPayment[];
};
export type MonthlyPayment = {
  id: string;
  memberId: string;
  memberName: string;
  dhukutiDue: number;
  fixedSavingDue: number;
  interestDue: number;
  totalDue: number;
  paymentStatus: "pending" | "paid";
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type Cycle = {
  id: string;
  cycleNumber: number;
  status: CycleStatus;
  memberCount: number;
  contributionAmount: number;
  fixedSavingAmount: number;
  interestAmount: number;
  startedOn: string;
  completedOn: string | null;
  updatedAt: string;
  members: CycleMember[];
  months: CycleMonth[];
};

export type CycleCompletionSummary = {
  ready: boolean;
  blockers: string[];
  winnerCount: number;
  obligationCount: number;
  expectedObligationCount: number;
  pendingCount: number;
  pendingAmount: number;
  reviewVersion: string;
};

function postgresTimestampValue(value: string) {
  const milliseconds = Date.parse(value);
  const fraction = value.match(/\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/)?.[1] ?? "";
  const microsecondRemainder = Number(`${fraction.slice(3, 6)}000`.slice(0, 3));
  return milliseconds * 1000 + microsecondRemainder;
}

export function buildCycleCompletionSummary(
  cycle: Cycle,
): CycleCompletionSummary {
  const winnerIds = cycle.months.flatMap((month) =>
    month.winnerMemberId ? [month.winnerMemberId] : [],
  );
  const obligationCount = cycle.months.reduce(
    (total, month) => total + month.payments.length,
    0,
  );
  const expectedObligationCount = cycle.memberCount * cycle.memberCount;
  const pending = cycle.months.flatMap((month) =>
    month.payments.filter((payment) => payment.paymentStatus === "pending"),
  );
  const blockers: string[] = [];
  if (cycle.status !== "active") blockers.push("The cycle is not active.");
  if (
    cycle.memberCount !== 11 ||
    cycle.members.length !== cycle.memberCount ||
    cycle.months.length !== cycle.memberCount
  )
    blockers.push("The cycle must contain all 11 monthly records.");
  if (
    winnerIds.length !== cycle.memberCount ||
    new Set(winnerIds).size !== cycle.memberCount
  )
    blockers.push("Every cycle member must be recorded as a winner once.");
  if (
    obligationCount !== expectedObligationCount ||
    cycle.months.some((month) => month.payments.length !== cycle.memberCount)
  )
    blockers.push("Every month must contain all 11 obligation snapshots.");

  const versions = [
    cycle.updatedAt,
    ...cycle.months.flatMap((month) => [
      month.updatedAt,
      ...month.payments.map((payment) => payment.updatedAt),
    ]),
  ];
  return {
    ready: blockers.length === 0,
    blockers,
    winnerCount: winnerIds.length,
    obligationCount,
    expectedObligationCount,
    pendingCount: pending.length,
    pendingAmount: pending.reduce(
      (total, payment) => total + payment.totalDue,
      0,
    ),
    reviewVersion: versions.reduce((latest, value) =>
      postgresTimestampValue(value) > postgresTimestampValue(latest)
        ? value
        : latest,
    ),
  };
}

export function monthValueToDate(month: string) {
  if (!monthPattern.test(month)) return null;
  return `${month}-01`;
}

export function lastSaturdayOfMonth(year: number, month: number) {
  const finalDay = new Date(Date.UTC(year, month, 0));
  finalDay.setUTCDate(finalDay.getUTCDate() - ((finalDay.getUTCDay() + 1) % 7));
  return finalDay.toISOString().slice(0, 10);
}

export function buildSchedulePreview(startedMonth: string, count = 11) {
  if (!monthPattern.test(startedMonth)) return [];
  const [yearPart, monthPart] = startedMonth.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  return Array.from({ length: count }, (_, index) => {
    const zeroBased = month - 1 + index;
    const scheduledYear = year + Math.floor(zeroBased / 12);
    const scheduledMonth = (zeroBased % 12) + 1;
    return {
      monthNumber: index + 1,
      scheduledDate: lastSaturdayOfMonth(scheduledYear, scheduledMonth),
    };
  });
}
