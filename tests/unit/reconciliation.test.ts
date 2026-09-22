import { describe, expect, it } from "vitest";
import type { Cycle, CycleMonth, MonthlyPayment } from "@/domain/cycle";
import { buildReconciliationData } from "@/domain/reconciliation";
import type { SavingFund } from "@/domain/saving";

const memberIds = Array.from(
  { length: 11 },
  (_, index) => `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
);

function payment(
  monthNumber: number,
  memberIndex: number,
  status: "paid" | "pending" = "paid",
): MonthlyPayment {
  const previousWinner = memberIndex < monthNumber - 1;
  const currentWinner = memberIndex === monthNumber - 1;
  const interestDue = previousWinner ? 200 : 0;
  return {
    id: `20000000-0000-4000-${String(monthNumber).padStart(4, "0")}-${String(memberIndex).padStart(12, "0")}`,
    memberId: memberIds[memberIndex]!,
    memberName: `Member ${memberIndex + 1}`,
    dhukutiDue: currentWinner ? 0 : 2000,
    fixedSavingDue: 100,
    interestDue,
    totalDue: (currentWinner ? 0 : 2000) + 100 + interestDue,
    paymentStatus: status,
    paymentMethod: status === "paid" ? "cash" : null,
    paidAt: status === "paid" ? "2026-09-22T00:00:00Z" : null,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-22T00:00:00Z",
  };
}

function month(monthNumber: number, recorded: boolean): CycleMonth {
  return {
    id: `30000000-0000-4000-8000-${String(monthNumber).padStart(12, "0")}`,
    monthNumber,
    scheduledDate: `2026-${String(monthNumber).padStart(2, "0")}-28`,
    dateOverridden: false,
    status: recorded ? "open" : "draft",
    updatedAt: "2026-09-22T00:00:00Z",
    winnerMemberId: recorded ? memberIds[monthNumber - 1]! : null,
    winnerName: recorded ? `Member ${monthNumber}` : null,
    payments: recorded
      ? memberIds.map((_, memberIndex) => payment(monthNumber, memberIndex))
      : [],
  };
}

function cycle(recordedMonths: number): Cycle {
  return {
    id: "40000000-0000-4000-8000-000000000001",
    cycleNumber: 1,
    status: "active",
    memberCount: 11,
    contributionAmount: 2000,
    fixedSavingAmount: 100,
    interestAmount: 200,
    startedOn: "2026-01-01",
    completedOn: null,
    updatedAt: "2026-09-22T00:00:00Z",
    members: memberIds.map((memberId, index) => ({
      memberId,
      fullName: `Member ${index + 1}`,
      active: true,
      displayOrder: index + 1,
    })),
    months: Array.from({ length: 11 }, (_, index) =>
      month(index + 1, index < recordedMonths),
    ),
  };
}

function fund(actualCycleSaving: number): SavingFund {
  return {
    cycleId: "40000000-0000-4000-8000-000000000001",
    cycleNumber: 1,
    fixedSavingReceived: 0,
    interestReceived: 0,
    extraContributions: 1000,
    pendingFixedSaving: 0,
    pendingInterest: 0,
    actualCycleSaving,
    carriedFromPreviousCycles: 0,
    cumulativeBalance: actualCycleSaving,
    contributions: [],
  };
}

describe("historical reconciliation", () => {
  it("classifies the ninth recorded month and the unrecorded Month 10 saving", () => {
    const result = buildReconciliationData([cycle(9)], [fund(18_100)])
      .cycles[0]!;
    expect(result).toMatchObject({
      targetMonthCount: 10,
      recordedMonthCount: 9,
      uniqueWinnerCount: 9,
      obligationCount: 99,
      expectedRecordedObligations: 99,
      historicalBaselineSaving: 20_000,
      recordedRequiredSaving: 17_100,
      receivedRequiredSaving: 17_100,
      pendingRequiredSaving: 0,
      notYetRecordedSaving: 2_900,
      unexplainedDifference: 0,
      extraContributions: 1000,
      actualCycleSaving: 18_100,
      readyForHistoricalSignOff: false,
    });
    expect(result.remainingMembers).toHaveLength(2);
    expect(result.blockers).toContain(
      "Record and verify 1 more historical month.",
    );
    expect(result.months[8]?.state).toBe("reconciled");
    expect(result.months[9]?.state).toBe("not_recorded");
  });

  it("allows supported pending payments in a structurally complete Month 10 review", () => {
    const completeCycle = cycle(10);
    completeCycle.months[9]!.payments[0] = payment(10, 0, "pending");
    const result = buildReconciliationData([completeCycle], [fund(20_700)])
      .cycles[0]!;
    expect(result.readyForHistoricalSignOff).toBe(true);
    expect(result.pendingRequiredSaving).toBe(300);
    expect(result.receivedRequiredSaving).toBe(19_700);
    expect(result.notYetRecordedSaving).toBe(0);
    expect(result.unexplainedDifference).toBe(0);
    expect(result.remainingMembers).toEqual([
      { id: memberIds[10], name: "Member 11" },
    ]);
    expect(result.months[9]?.state).toBe("pending");
  });

  it("rejects missing obligation snapshots and ignores drafts", () => {
    const incomplete = cycle(10);
    incomplete.months[4]!.payments.pop();
    const result = buildReconciliationData([incomplete], [fund(20_900)])
      .cycles[0]!;
    expect(result.readyForHistoricalSignOff).toBe(false);
    expect(result.blockers).toContain(
      "Every recorded month must contain 11 obligation snapshots.",
    );
    expect(
      buildReconciliationData([{ ...incomplete, status: "draft" }], []).cycles,
    ).toEqual([]);
  });

  it("keeps the first-ten baseline stable after Month 11 is recorded", () => {
    const result = buildReconciliationData([cycle(11)], [fund(24_100)])
      .cycles[0]!;
    expect(result.recordedMonthCount).toBe(10);
    expect(result.historicalBaselineSaving).toBe(20_000);
    expect(result.unexplainedDifference).toBe(0);
    expect(result.remainingMembers).toEqual([
      { id: memberIds[10], name: "Member 11" },
    ]);
  });

  it("uses the full 11-month target for later cycles", () => {
    const nextCycle = cycle(11);
    nextCycle.cycleNumber = 2;
    const result = buildReconciliationData([nextCycle], [fund(24_100)])
      .cycles[0]!;
    expect(result.targetMonthCount).toBe(11);
    expect(result.historicalBaselineSaving).toBe(23_100);
    expect(result.remainingMembers).toEqual([]);
    expect(result.readyForHistoricalSignOff).toBe(true);
  });
});
