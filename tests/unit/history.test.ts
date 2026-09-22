import { describe, expect, it } from "vitest";
import type { Cycle, CycleMonth, MonthlyPayment } from "@/domain/cycle";
import { buildHistoryData } from "@/domain/history";
import type { SavingFund } from "@/domain/saving";

function payment(
  id: string,
  memberName: string,
  status: "paid" | "pending",
): MonthlyPayment {
  return {
    id,
    memberId: `${id.slice(0, -1)}9`,
    memberName,
    dhukutiDue: 2000,
    fixedSavingDue: 100,
    interestDue: memberName === "Asha" ? 200 : 0,
    totalDue: memberName === "Asha" ? 2300 : 2100,
    paymentStatus: status,
    paymentMethod: status === "paid" ? "cash" : null,
    paidAt: status === "paid" ? "2026-02-20T02:00:00Z" : null,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt:
      status === "paid" ? "2026-02-20T02:00:00Z" : "2026-02-01T00:00:00Z",
  };
}

const month: CycleMonth = {
  id: "30000000-0000-4000-8000-000000000001",
  monthNumber: 1,
  scheduledDate: "2026-02-28",
  dateOverridden: true,
  status: "open",
  updatedAt: "2026-02-10T00:00:00Z",
  winnerMemberId: "10000000-0000-4000-8000-000000000001",
  winnerName: "Bikash",
  payments: [
    payment("20000000-0000-4000-8000-000000000001", "Asha", "paid"),
    payment("20000000-0000-4000-8000-000000000002", "Bikash", "pending"),
  ],
};

const cycle: Cycle = {
  id: "40000000-0000-4000-8000-000000000001",
  cycleNumber: 1,
  status: "active",
  memberCount: 11,
  contributionAmount: 2000,
  fixedSavingAmount: 100,
  interestAmount: 200,
  startedOn: "2026-02-01",
  updatedAt: "2026-02-01T00:00:00Z",
  members: [],
  months: [month],
};

const fund: SavingFund = {
  cycleId: cycle.id,
  cycleNumber: 1,
  fixedSavingReceived: 100,
  interestReceived: 200,
  extraContributions: 500,
  pendingFixedSaving: 100,
  pendingInterest: 0,
  actualCycleSaving: 800,
  carriedFromPreviousCycles: 0,
  cumulativeBalance: 800,
  contributions: [
    {
      id: "50000000-0000-4000-8000-000000000001",
      cycleId: cycle.id,
      monthId: month.id,
      monthNumber: 1,
      memberId: "10000000-0000-4000-8000-000000000003",
      memberName: "Chirag",
      amount: 500,
      paymentMethod: "esewa",
      reason: "Birthday gift",
      createdAt: "2026-02-21T00:00:00Z",
      updatedAt: "2026-02-21T00:00:00Z",
    },
  ],
};

describe("history model", () => {
  it("builds cycle and monthly financial history from stored records", () => {
    const history = buildHistoryData([cycle], [fund]);
    const result = history.cycles[0]!;
    const resultMonth = result.months[0]!;

    expect(result).toMatchObject({
      recordedMonths: 1,
      received: 2300,
      pending: 2100,
      actualSaving: 800,
      extraContributions: 500,
    });
    expect(resultMonth).toMatchObject({
      winnerName: "Bikash",
      payout: 20_000,
      state: "pending",
      totalDue: 4400,
      received: 2300,
      pending: 2100,
      savingReceived: 800,
      lastUpdatedAt: "2026-02-21T00:00:00Z",
    });
    expect(resultMonth.payments[0]?.paymentMethodLabel).toBe("Cash");
    expect(resultMonth.contributions[0]?.paymentMethodLabel).toBe("eSewa");
  });

  it("excludes draft cycles from shared history", () => {
    expect(
      buildHistoryData([{ ...cycle, status: "draft" }], [fund]).cycles,
    ).toEqual([]);
  });
});
