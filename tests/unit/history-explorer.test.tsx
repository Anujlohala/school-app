import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { HistoryData } from "@/domain/history";
import { HistoryExplorer } from "@/features/history/history-explorer";

const data: HistoryData = {
  cycles: [
    {
      id: "40000000-0000-4000-8000-000000000001",
      cycleNumber: 1,
      status: "active",
      startedOn: "2026-01-01",
      memberCount: 11,
      recordedMonths: 1,
      received: 2100,
      pending: 2100,
      actualSaving: 600,
      extraContributions: 500,
      lastUpdatedAt: "2026-02-21T00:00:00Z",
      wholeCycleContributions: [],
      months: [
        {
          id: "30000000-0000-4000-8000-000000000001",
          monthNumber: 1,
          scheduledDate: "2026-01-31",
          dateOverridden: false,
          winnerName: "Asha",
          payout: 20_000,
          state: "pending",
          totalDue: 4200,
          received: 2100,
          pending: 2100,
          paidMembers: 1,
          pendingMembers: 1,
          savingReceived: 600,
          lastUpdatedAt: "2026-02-21T00:00:00Z",
          payments: [
            {
              id: "20000000-0000-4000-8000-000000000001",
              memberId: "10000000-0000-4000-8000-000000000001",
              memberName: "Asha Rai",
              dhukutiDue: 2000,
              fixedSavingDue: 100,
              interestDue: 0,
              totalDue: 2100,
              paymentStatus: "paid",
              paymentMethod: "cash",
              paymentMethodLabel: "Cash",
              paidAt: "2026-02-20T00:00:00Z",
              createdAt: "2026-02-01T00:00:00Z",
              updatedAt: "2026-02-20T00:00:00Z",
            },
            {
              id: "20000000-0000-4000-8000-000000000002",
              memberId: "10000000-0000-4000-8000-000000000002",
              memberName: "Bikash Shah",
              dhukutiDue: 2000,
              fixedSavingDue: 100,
              interestDue: 0,
              totalDue: 2100,
              paymentStatus: "pending",
              paymentMethod: null,
              paymentMethodLabel: "—",
              paidAt: null,
              createdAt: "2026-02-01T00:00:00Z",
              updatedAt: "2026-02-01T00:00:00Z",
            },
          ],
          contributions: [
            {
              id: "50000000-0000-4000-8000-000000000001",
              cycleId: "40000000-0000-4000-8000-000000000001",
              monthId: "30000000-0000-4000-8000-000000000001",
              monthNumber: 1,
              memberId: "10000000-0000-4000-8000-000000000003",
              memberName: "Chirag Thapa",
              amount: 500,
              paymentMethod: "esewa",
              paymentMethodLabel: "eSewa",
              reason: "Birthday gift",
              createdAt: "2026-02-21T00:00:00Z",
              updatedAt: "2026-02-21T00:00:00Z",
            },
          ],
        },
      ],
    },
  ],
};

afterEach(cleanup);

describe("history explorer", () => {
  it("filters paid, pending, and extra contribution records", () => {
    render(<HistoryExplorer data={data} />);

    fireEvent.click(screen.getByRole("button", { name: "Pending" }));
    fireEvent.click(screen.getByText("View 1 payment record", { exact: true }));
    expect(screen.queryByText("Asha Rai")).not.toBeInTheDocument();
    expect(screen.getByText("Bikash Shah")).toBeVisible();
    expect(screen.queryByText("Chirag Thapa")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Extras" }));
    expect(screen.queryByText("Bikash Shah")).not.toBeInTheDocument();
    expect(screen.getByText("Chirag Thapa")).toBeVisible();
    expect(screen.getByText("Birthday gift", { exact: false })).toBeVisible();
  });
});
