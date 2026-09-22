import type { Cycle, MonthlyPayment } from "@/domain/cycle";
import { paymentMethodLabel, type PaymentMethod } from "@/domain/payment";
import type { ExtraContribution, SavingFund } from "@/domain/saving";

export type DashboardPayment = MonthlyPayment & {
  winningMonth: number | null;
  paymentMethodLabel: string;
};

export type DashboardMonth = {
  monthNumber: number;
  state: "recorded" | "current" | "upcoming" | "missing";
};

export type DashboardData = {
  cycle: {
    number: number;
    status: Cycle["status"];
    currentMonth: number;
    totalMonths: number;
  };
  collection: {
    totalDue: number;
    received: number;
    pending: number;
    paidMembers: number;
    pendingMembers: number;
    totalMembers: number;
    dhukutiReceived: number;
  };
  saving: {
    balance: number;
    carriedFromPreviousCycles: number;
    fixedSaving: number;
    interest: number;
    extraContributions: number;
    pendingSaving: number;
  };
  winner: {
    memberId: string;
    name: string;
    initials: string;
    payout: number;
    fixedSavingDue: number;
  } | null;
  winnerProgress: {
    recorded: number;
    remaining: number;
  };
  nextMeeting: {
    date: string;
    daysRemaining: number;
    overridden: boolean;
  } | null;
  months: DashboardMonth[];
  payments: DashboardPayment[];
  latestContribution: (ExtraContribution & { methodLabel: string }) | null;
};

export function buildDashboardData(
  cycles: Cycle[],
  funds: SavingFund[],
  today: string,
): DashboardData | null {
  const cycle =
    [...cycles]
      .sort((left, right) => right.cycleNumber - left.cycleNumber)
      .find((item) => item.status === "active") ??
    [...cycles]
      .sort((left, right) => right.cycleNumber - left.cycleNumber)
      .find((item) => item.status === "completed");
  if (!cycle || cycle.months.length === 0) return null;

  const months = [...cycle.months].sort(
    (left, right) => left.monthNumber - right.monthNumber,
  );
  const overdueUnfinishedMonth = months.find(
    (month) => month.scheduledDate < today && !month.winnerMemberId,
  );
  const nextMeetingMonth = months.find((month) => month.scheduledDate >= today);
  const currentMonth =
    overdueUnfinishedMonth ??
    nextMeetingMonth ??
    [...months].reverse().find((month) => month.winnerMemberId) ??
    months.at(-1)!;
  const payments = currentMonth.payments;
  const receivedPayments = payments.filter(
    (payment) => payment.paymentStatus === "paid",
  );
  const pendingPayments = payments.filter(
    (payment) => payment.paymentStatus === "pending",
  );
  const winningMonthByMember = new Map(
    months
      .filter((month) => month.winnerMemberId)
      .map((month) => [month.winnerMemberId!, month.monthNumber]),
  );
  const fund = funds.find((item) => item.cycleId === cycle.id);
  const latestContribution = fund?.contributions[0] ?? null;
  const recordedWinners = months.filter((month) => month.winnerMemberId).length;

  return {
    cycle: {
      number: cycle.cycleNumber,
      status: cycle.status,
      currentMonth: currentMonth.monthNumber,
      totalMonths: months.length,
    },
    collection: {
      totalDue: sum(payments, "totalDue"),
      received: sum(receivedPayments, "totalDue"),
      pending: sum(pendingPayments, "totalDue"),
      paidMembers: receivedPayments.length,
      pendingMembers: pendingPayments.length,
      totalMembers: payments.length || cycle.memberCount,
      dhukutiReceived: sum(receivedPayments, "dhukutiDue"),
    },
    saving: {
      balance: funds.reduce((total, item) => total + item.actualCycleSaving, 0),
      carriedFromPreviousCycles: fund?.carriedFromPreviousCycles ?? 0,
      fixedSaving: fund?.fixedSavingReceived ?? 0,
      interest: fund?.interestReceived ?? 0,
      extraContributions: fund?.extraContributions ?? 0,
      pendingSaving: funds.reduce(
        (total, item) => total + item.pendingFixedSaving + item.pendingInterest,
        0,
      ),
    },
    winner: currentMonth.winnerMemberId
      ? {
          memberId: currentMonth.winnerMemberId,
          name: currentMonth.winnerName ?? "Recorded member",
          initials: initials(currentMonth.winnerName ?? "Recorded member"),
          payout: (cycle.memberCount - 1) * cycle.contributionAmount,
          fixedSavingDue: cycle.fixedSavingAmount,
        }
      : null,
    winnerProgress: {
      recorded: recordedWinners,
      remaining: Math.max(cycle.memberCount - recordedWinners, 0),
    },
    nextMeeting: nextMeetingMonth
      ? {
          date: nextMeetingMonth.scheduledDate,
          daysRemaining: daysBetween(today, nextMeetingMonth.scheduledDate),
          overridden: nextMeetingMonth.dateOverridden,
        }
      : null,
    months: months.map((month) => ({
      monthNumber: month.monthNumber,
      state:
        month.id === currentMonth.id
          ? "current"
          : month.winnerMemberId
            ? "recorded"
            : month.scheduledDate < today
              ? "missing"
              : "upcoming",
    })),
    payments: payments.map((payment) => ({
      ...payment,
      winningMonth: winningMonthByMember.get(payment.memberId) ?? null,
      paymentMethodLabel: paymentMethodLabel(
        payment.paymentMethod as PaymentMethod | null,
      ),
    })),
    latestContribution: latestContribution
      ? {
          ...latestContribution,
          methodLabel: paymentMethodLabel(latestContribution.paymentMethod),
        }
      : null,
  };
}

function sum(payments: MonthlyPayment[], field: "totalDue" | "dhukutiDue") {
  return payments.reduce((total, payment) => total + payment[field], 0);
}

function daysBetween(from: string, to: string) {
  const fromTime = Date.parse(`${from}T00:00:00Z`);
  const toTime = Date.parse(`${to}T00:00:00Z`);
  return Math.max(Math.round((toTime - fromTime) / 86_400_000), 0);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
