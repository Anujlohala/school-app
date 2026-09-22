import { describe, expect, it } from "vitest";
import type { Cycle, CycleMonth, MonthlyPayment } from "@/domain/cycle";
import { buildDashboardData } from "@/domain/dashboard";
import type { SavingFund } from "@/domain/saving";

const memberIds = [
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
];

function payment(
  memberIndex: number,
  values: Partial<MonthlyPayment> = {},
): MonthlyPayment {
  const memberId = memberIds[memberIndex]!;
  return {
    id: `20000000-0000-4000-8000-00000000000${memberIndex}`,
    memberId,
    memberName: ["Asha", "Bikash", "Chirag"][memberIndex]!,
    dhukutiDue: 100,
    fixedSavingDue: 10,
    interestDue: 0,
    totalDue: 110,
    paymentStatus: "pending",
    paymentMethod: null,
    paidAt: null,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
    ...values,
  };
}

function month(values: Partial<CycleMonth>): CycleMonth {
  return {
    id: "30000000-0000-4000-8000-000000000001",
    monthNumber: 1,
    scheduledDate: "2026-01-31",
    dateOverridden: false,
    status: "open",
    updatedAt: "2026-01-01T00:00:00Z",
    winnerMemberId: memberIds[0]!,
    winnerName: "Asha",
    payments: [],
    ...values,
  };
}

const cycle: Cycle = {
  id: "40000000-0000-4000-8000-000000000001",
  cycleNumber: 1,
  status: "active",
  memberCount: 3,
  contributionAmount: 100,
  fixedSavingAmount: 10,
  interestAmount: 20,
  startedOn: "2026-01-01",
  completedOn: null,
  updatedAt: "2026-01-01T00:00:00Z",
  members: memberIds.map((memberId, index) => ({
    memberId,
    fullName: ["Asha", "Bikash", "Chirag"][index]!,
    active: true,
    displayOrder: index + 1,
  })),
  months: [
    month({}),
    month({
      id: "30000000-0000-4000-8000-000000000002",
      monthNumber: 2,
      scheduledDate: "2026-02-28",
      dateOverridden: true,
      winnerMemberId: memberIds[1]!,
      winnerName: "Bikash",
      payments: [
        payment(0, {
          interestDue: 20,
          totalDue: 130,
          paymentStatus: "paid",
          paymentMethod: "cash",
          paidAt: "2026-02-10T00:00:00Z",
        }),
        payment(1, { dhukutiDue: 0, totalDue: 10 }),
        payment(2),
      ],
    }),
    month({
      id: "30000000-0000-4000-8000-000000000003",
      monthNumber: 3,
      scheduledDate: "2026-03-28",
      status: "draft",
      winnerMemberId: null,
      winnerName: null,
    }),
  ],
};

const fund: SavingFund = {
  cycleId: cycle.id,
  cycleNumber: 1,
  fixedSavingReceived: 40,
  interestReceived: 20,
  extraContributions: 50,
  pendingFixedSaving: 20,
  pendingInterest: 0,
  actualCycleSaving: 110,
  carriedFromPreviousCycles: 0,
  cumulativeBalance: 110,
  contributions: [
    {
      id: "50000000-0000-4000-8000-000000000001",
      cycleId: cycle.id,
      monthId: cycle.months[1]!.id,
      monthNumber: 2,
      memberId: memberIds[0]!,
      memberName: "Asha",
      amount: 50,
      paymentMethod: "esewa",
      reason: "Community support",
      createdAt: "2026-02-02T00:00:00Z",
      updatedAt: "2026-02-02T00:00:00Z",
    },
  ],
};

describe("live dashboard model", () => {
  it("selects the next scheduled month and derives live collection data", () => {
    const dashboard = buildDashboardData([cycle], [fund], "2026-02-15")!;

    expect(dashboard.cycle.currentMonth).toBe(2);
    expect(dashboard.activityMonth).toEqual({
      number: 2,
      scheduledDate: "2026-02-28",
      isCurrentMonth: true,
    });
    expect(dashboard.collection).toMatchObject({
      totalDue: 250,
      received: 130,
      pending: 120,
      paidMembers: 1,
      pendingMembers: 2,
      dhukutiReceived: 100,
    });
    expect(dashboard.winner).toMatchObject({
      name: "Bikash",
      payout: 200,
      fixedSavingDue: 10,
    });
    expect(dashboard.winnerProgress).toEqual({ recorded: 2, remaining: 1 });
    expect(dashboard.nextMeeting).toEqual({
      date: "2026-02-28",
      daysRemaining: 13,
      overridden: true,
    });
    expect(dashboard.payments[0]).toMatchObject({
      memberName: "Asha",
      winningMonth: 1,
      paymentMethodLabel: "Cash",
    });
  });

  it("uses received saving totals and exposes the latest contribution", () => {
    const priorFund: SavingFund = {
      ...fund,
      cycleId: "40000000-0000-4000-8000-000000000000",
      cycleNumber: 0,
      actualCycleSaving: 90,
      contributions: [],
    };
    const dashboard = buildDashboardData(
      [cycle],
      [priorFund, fund],
      "2026-02-15",
    )!;

    expect(dashboard.saving).toEqual({
      balance: 200,
      carriedFromPreviousCycles: 0,
      fixedSaving: 40,
      interest: 20,
      extraContributions: 50,
      pendingSaving: 40,
    });
    expect(dashboard.latestContribution).toMatchObject({
      memberName: "Asha",
      methodLabel: "eSewa",
      amount: 50,
    });
  });

  it("keeps an overdue unfinished month current while showing the latest recorded activity", () => {
    const overdueCycle: Cycle = {
      ...cycle,
      months: cycle.months.map((cycleMonth) =>
        cycleMonth.monthNumber === 1
          ? {
              ...cycleMonth,
              payments: [
                payment(0, { dhukutiDue: 0, totalDue: 10 }),
                payment(1),
                payment(2),
              ],
            }
          : cycleMonth.monthNumber === 2
            ? {
                ...cycleMonth,
                winnerMemberId: null,
                winnerName: null,
                payments: [],
              }
            : cycleMonth,
      ),
    };
    const dashboard = buildDashboardData([overdueCycle], [fund], "2026-03-01")!;

    expect(dashboard.cycle.currentMonth).toBe(2);
    expect(dashboard.activityMonth).toEqual({
      number: 1,
      scheduledDate: "2026-01-31",
      isCurrentMonth: false,
    });
    expect(dashboard.winner?.name).toBe("Asha");
    expect(dashboard.payments).toHaveLength(3);
    expect(dashboard.collection.totalDue).toBe(230);
    expect(dashboard.months[1]).toEqual({
      monthNumber: 2,
      state: "current",
    });
    expect(dashboard.nextMeeting?.date).toBe("2026-03-28");
  });

  it("returns an empty state when no active or completed cycle is visible", () => {
    expect(
      buildDashboardData([{ ...cycle, status: "draft" }], [fund], "2026-02-15"),
    ).toBeNull();
  });
});
