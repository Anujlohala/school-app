import type { Cycle, CycleMonth, MonthlyPayment } from "@/domain/cycle";
import type { SavingFund } from "@/domain/saving";

export type ReconciliationMonthState =
  "not_recorded" | "incomplete" | "pending" | "reconciled";

export type ReconciliationMonth = {
  id: string;
  monthNumber: number;
  scheduledDate: string;
  winnerName: string | null;
  obligationCount: number;
  paidCount: number;
  pendingCount: number;
  requiredSaving: number;
  receivedSaving: number;
  pendingSaving: number;
  missingPaymentMethods: number;
  state: ReconciliationMonthState;
};

export type ReconciliationCycle = {
  id: string;
  cycleNumber: number;
  status: Cycle["status"];
  targetMonthCount: number;
  rosterCount: number;
  scheduleCount: number;
  recordedMonthCount: number;
  uniqueWinnerCount: number;
  obligationCount: number;
  expectedRecordedObligations: number;
  remainingMembers: { id: string; name: string }[];
  historicalBaselineSaving: number;
  recordedRequiredSaving: number;
  receivedRequiredSaving: number;
  pendingRequiredSaving: number;
  notYetRecordedSaving: number;
  unexplainedDifference: number;
  extraContributions: number;
  actualCycleSaving: number;
  blockers: string[];
  readyForHistoricalSignOff: boolean;
  months: ReconciliationMonth[];
};

export type ReconciliationData = { cycles: ReconciliationCycle[] };

export function buildReconciliationData(
  cycles: Cycle[],
  funds: SavingFund[],
): ReconciliationData {
  return {
    cycles: cycles
      .filter((cycle) => cycle.status !== "draft")
      .sort((left, right) => left.cycleNumber - right.cycleNumber)
      .map((cycle) => buildCycleReconciliation(cycle, funds)),
  };
}

function buildCycleReconciliation(
  cycle: Cycle,
  funds: SavingFund[],
): ReconciliationCycle {
  const targetMonthCount = cycle.cycleNumber === 1 ? 10 : cycle.memberCount;
  const expectedRemainingMembers = cycle.memberCount - targetMonthCount;
  const reviewMonths = cycle.months.filter(
    (month) => month.monthNumber <= targetMonthCount,
  );
  const recordedMonths = reviewMonths.filter(
    (month) => month.winnerMemberId !== null,
  );
  const recordedPayments = recordedMonths.flatMap((month) => month.payments);
  const winnerIds = recordedMonths.flatMap((month) =>
    month.winnerMemberId ? [month.winnerMemberId] : [],
  );
  const won = new Set(winnerIds);
  const remainingMembers = cycle.members
    .filter((member) => !won.has(member.memberId))
    .map((member) => ({ id: member.memberId, name: member.fullName }));
  const historicalBaselineSaving =
    targetMonthCount * cycle.memberCount * cycle.fixedSavingAmount +
    ((targetMonthCount * (targetMonthCount - 1)) / 2) * cycle.interestAmount;
  const recordedRequiredSaving = savingDue(recordedPayments);
  const paid = recordedPayments.filter(
    (payment) => payment.paymentStatus === "paid",
  );
  const pending = recordedPayments.filter(
    (payment) => payment.paymentStatus === "pending",
  );
  const receivedRequiredSaving = savingDue(paid);
  const pendingRequiredSaving = savingDue(pending);
  const notYetRecordedSaving = Math.max(
    0,
    historicalBaselineSaving - recordedRequiredSaving,
  );
  const unexplainedDifference =
    historicalBaselineSaving -
    receivedRequiredSaving -
    pendingRequiredSaving -
    notYetRecordedSaving;
  const fund = funds.find((item) => item.cycleId === cycle.id);
  const months = cycle.months
    .map((month) => buildMonthReconciliation(month, cycle.memberCount))
    .sort((left, right) => left.monthNumber - right.monthNumber);
  const blockers: string[] = [];

  if (cycle.members.length !== 11 || cycle.memberCount !== 11)
    blockers.push("The saved cycle roster must contain exactly 11 members.");
  if (cycle.months.length !== 11)
    blockers.push("The cycle schedule must contain all 11 months.");
  if (recordedMonths.length < targetMonthCount)
    blockers.push(
      `Record and verify ${targetMonthCount - recordedMonths.length} more historical month${targetMonthCount - recordedMonths.length === 1 ? "" : "s"}.`,
    );
  if (new Set(winnerIds).size !== winnerIds.length)
    blockers.push("A member appears as winner more than once.");
  if (
    recordedMonths.some((month) => month.payments.length !== cycle.memberCount)
  )
    blockers.push("Every recorded month must contain 11 obligation snapshots.");
  if (
    recordedPayments.some(
      (payment) =>
        payment.paymentStatus === "paid" && payment.paymentMethod === null,
    )
  )
    blockers.push("Every paid obligation must have a payment method.");
  if (unexplainedDifference !== 0)
    blockers.push(
      `The Month ${targetMonthCount} saving baseline has an unexplained difference.`,
    );
  if (
    recordedMonths.length === targetMonthCount &&
    remainingMembers.length !== expectedRemainingMembers
  )
    blockers.push(
      `Expected ${expectedRemainingMembers} member${expectedRemainingMembers === 1 ? "" : "s"} to remain eligible after ${targetMonthCount} winners.`,
    );

  return {
    id: cycle.id,
    cycleNumber: cycle.cycleNumber,
    status: cycle.status,
    targetMonthCount,
    rosterCount: cycle.members.length,
    scheduleCount: cycle.months.length,
    recordedMonthCount: recordedMonths.length,
    uniqueWinnerCount: new Set(winnerIds).size,
    obligationCount: recordedPayments.length,
    expectedRecordedObligations: recordedMonths.length * cycle.memberCount,
    remainingMembers,
    historicalBaselineSaving,
    recordedRequiredSaving,
    receivedRequiredSaving,
    pendingRequiredSaving,
    notYetRecordedSaving,
    unexplainedDifference,
    extraContributions: fund?.extraContributions ?? 0,
    actualCycleSaving: fund?.actualCycleSaving ?? 0,
    blockers,
    readyForHistoricalSignOff: blockers.length === 0,
    months,
  };
}

function buildMonthReconciliation(
  month: CycleMonth,
  memberCount: number,
): ReconciliationMonth {
  const paid = month.payments.filter(
    (payment) => payment.paymentStatus === "paid",
  );
  const pending = month.payments.filter(
    (payment) => payment.paymentStatus === "pending",
  );
  const missingPaymentMethods = paid.filter(
    (payment) => payment.paymentMethod === null,
  ).length;
  const completeSnapshots = month.payments.length === memberCount;
  const state: ReconciliationMonthState = !month.winnerMemberId
    ? "not_recorded"
    : !completeSnapshots || missingPaymentMethods > 0
      ? "incomplete"
      : pending.length > 0
        ? "pending"
        : "reconciled";
  return {
    id: month.id,
    monthNumber: month.monthNumber,
    scheduledDate: month.scheduledDate,
    winnerName: month.winnerName,
    obligationCount: month.payments.length,
    paidCount: paid.length,
    pendingCount: pending.length,
    requiredSaving: savingDue(month.payments),
    receivedSaving: savingDue(paid),
    pendingSaving: savingDue(pending),
    missingPaymentMethods,
    state,
  };
}

function savingDue(payments: MonthlyPayment[]) {
  return payments.reduce(
    (total, payment) => total + payment.fixedSavingDue + payment.interestDue,
    0,
  );
}
