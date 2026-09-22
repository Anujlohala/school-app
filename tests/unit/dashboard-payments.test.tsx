import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DashboardPayment } from "@/domain/dashboard";
import { MemberPayments } from "@/features/dashboard/member-payments";

const base: DashboardPayment = {
  id: "10000000-0000-4000-8000-000000000001",
  memberId: "20000000-0000-4000-8000-000000000001",
  memberName: "Asha Rai",
  dhukutiDue: 2000,
  fixedSavingDue: 100,
  interestDue: 200,
  totalDue: 2300,
  paymentStatus: "paid",
  paymentMethod: "cash",
  paymentMethodLabel: "Cash",
  paidAt: "2026-09-22T00:00:00Z",
  createdAt: "2026-09-22T00:00:00Z",
  updatedAt: "2026-09-22T00:00:00Z",
  winningMonth: 1,
};

afterEach(cleanup);

describe("dashboard member payments", () => {
  it("filters live payment records and shows their stored components", () => {
    const pending: DashboardPayment = {
      ...base,
      id: "10000000-0000-4000-8000-000000000002",
      memberId: "20000000-0000-4000-8000-000000000002",
      memberName: "Bikash Shah",
      paymentStatus: "pending",
      paymentMethod: null,
      paymentMethodLabel: "—",
      paidAt: null,
      winningMonth: null,
    };
    render(
      <MemberPayments
        payments={[base, pending]}
        monthNumber={2}
        isCurrentMonth
      />,
    );

    expect(screen.getAllByText("NPR 2,000 + NPR 100 + NPR 200")).toHaveLength(
      2,
    );
    fireEvent.click(screen.getByRole("button", { name: "Pending (1)" }));
    expect(screen.queryByText("Asha Rai")).not.toBeInTheDocument();
    expect(screen.getByText("Bikash Shah")).toBeVisible();
    expect(screen.getAllByText("Eligible")).toHaveLength(2);
  });

  it("labels payments and the winner when showing a previous recorded month", () => {
    render(
      <MemberPayments
        payments={[{ ...base, winningMonth: 1 }]}
        monthNumber={1}
        isCurrentMonth={false}
      />,
    );

    expect(
      screen.getByText("Month 1 · Latest recorded activity"),
    ).toBeVisible();
    expect(screen.getAllByText("Latest winner")).toHaveLength(2);
  });
});
