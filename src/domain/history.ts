import type { Cycle, MonthlyPayment } from "@/domain/cycle";
import { paymentMethodLabel } from "@/domain/payment";
import type { ExtraContribution, SavingFund } from "@/domain/saving";

export type HistoryPayment = MonthlyPayment & {
  paymentMethodLabel: string;
};

export type HistoryContribution = ExtraContribution & {
  paymentMethodLabel: string;
};

export type HistoryMonth = {
  id: string;
  monthNumber: number;
  scheduledDate: string;
  dateOverridden: boolean;
  winnerName: string | null;
  payout: number;
  state: "awaiting_winner" | "pending" | "settled";
  totalDue: number;
  received: number;
  pending: number;
  paidMembers: number;
  pendingMembers: number;
  savingReceived: number;
  lastUpdatedAt: string;
  payments: HistoryPayment[];
  contributions: HistoryContribution[];
};

export type HistoryCycle = {
  id: string;
  cycleNumber: number;
  status: "active" | "completed";
  startedOn: string;
  memberCount: number;
  recordedMonths: number;
  received: number;
  pending: number;
  actualSaving: number;
  extraContributions: number;
  lastUpdatedAt: string;
  months: HistoryMonth[];
  wholeCycleContributions: HistoryContribution[];
};

export type HistoryData = {
  cycles: HistoryCycle[];
};

export function buildHistoryData(
  cycles: Cycle[],
  funds: SavingFund[],
): HistoryData {
  return {
    cycles: cycles
      .filter(
        (cycle): cycle is Cycle & { status: "active" | "completed" } =>
          cycle.status !== "draft",
      )
      .sort((left, right) => right.cycleNumber - left.cycleNumber)
      .map((cycle) => buildHistoryCycle(cycle, funds)),
  };
}

function buildHistoryCycle(
  cycle: Cycle & { status: "active" | "completed" },
  funds: SavingFund[],
): HistoryCycle {
  const fund = funds.find((item) => item.cycleId === cycle.id);
  const contributions = (fund?.contributions ?? []).map(mapContribution);
  const payments = cycle.months.flatMap((month) => month.payments);
  const receivedPayments = payments.filter(
    (payment) => payment.paymentStatus === "paid",
  );
  const months = cycle.months
    .map((month): HistoryMonth | null => {
      const monthContributions = contributions.filter(
        (contribution) => contribution.monthId === month.id,
      );
      if (
        !month.winnerMemberId &&
        month.payments.length === 0 &&
        monthContributions.length === 0
      ) {
        return null;
      }
      const paid = month.payments.filter(
        (payment) => payment.paymentStatus === "paid",
      );
      const pending = month.payments.filter(
        (payment) => payment.paymentStatus === "pending",
      );
      const totalDue = sum(month.payments, "totalDue");
      const received = sum(paid, "totalDue");
      const savingReceived =
        sum(paid, "fixedSavingDue") +
        sum(paid, "interestDue") +
        monthContributions.reduce(
          (total, contribution) => total + contribution.amount,
          0,
        );
      const mappedPayments = month.payments.map(mapPayment);
      return {
        id: month.id,
        monthNumber: month.monthNumber,
        scheduledDate: month.scheduledDate,
        dateOverridden: month.dateOverridden,
        winnerName: month.winnerName,
        payout: month.winnerMemberId
          ? (cycle.memberCount - 1) * cycle.contributionAmount
          : 0,
        state: !month.winnerMemberId
          ? "awaiting_winner"
          : pending.length > 0
            ? "pending"
            : "settled",
        totalDue,
        received,
        pending: totalDue - received,
        paidMembers: paid.length,
        pendingMembers: pending.length,
        savingReceived,
        lastUpdatedAt: latestTimestamp([
          month.updatedAt,
          ...month.payments.map((payment) => payment.updatedAt),
          ...monthContributions.map((contribution) => contribution.updatedAt),
        ]),
        payments: mappedPayments,
        contributions: monthContributions,
      };
    })
    .filter((month): month is HistoryMonth => month !== null)
    .sort((left, right) => right.monthNumber - left.monthNumber);
  const wholeCycleContributions = contributions.filter(
    (contribution) => contribution.monthId === null,
  );

  return {
    id: cycle.id,
    cycleNumber: cycle.cycleNumber,
    status: cycle.status,
    startedOn: cycle.startedOn,
    memberCount: cycle.memberCount,
    recordedMonths: cycle.months.filter((month) => month.winnerMemberId).length,
    received: sum(receivedPayments, "totalDue"),
    pending: sum(
      payments.filter((payment) => payment.paymentStatus === "pending"),
      "totalDue",
    ),
    actualSaving: fund?.actualCycleSaving ?? 0,
    extraContributions: fund?.extraContributions ?? 0,
    lastUpdatedAt: latestTimestamp([
      cycle.updatedAt,
      ...months.map((month) => month.lastUpdatedAt),
      ...wholeCycleContributions.map((contribution) => contribution.updatedAt),
    ]),
    months,
    wholeCycleContributions,
  };
}

function mapPayment(payment: MonthlyPayment): HistoryPayment {
  return {
    ...payment,
    paymentMethodLabel: paymentMethodLabel(payment.paymentMethod),
  };
}

function mapContribution(contribution: ExtraContribution): HistoryContribution {
  return {
    ...contribution,
    paymentMethodLabel: paymentMethodLabel(contribution.paymentMethod),
  };
}

function sum<
  T extends Pick<MonthlyPayment, "totalDue" | "fixedSavingDue" | "interestDue">,
>(items: T[], field: "totalDue" | "fixedSavingDue" | "interestDue") {
  return items.reduce((total, item) => total + item[field], 0);
}

function latestTimestamp(values: string[]) {
  return values.reduce(
    (latest, value) =>
      Date.parse(value) > Date.parse(latest) ? value : latest,
    new Date(0).toISOString(),
  );
}
