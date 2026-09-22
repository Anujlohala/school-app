import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MonthlyPayment } from "@/domain/cycle";
import { PaymentControls } from "@/features/payments/payment-controls";

const mock = vi.hoisted(() => ({ paid: vi.fn(), pending: vi.fn() }));
vi.mock("@/server/actions/payments", () => ({
  markPaymentPaid: mock.paid,
  markPaymentPending: mock.pending,
}));

const payment: MonthlyPayment = {
  id: "10000000-0000-4000-8000-000000000000",
  memberId: "20000000-0000-4000-8000-000000000000",
  memberName: "Asha",
  dhukutiDue: 2000,
  fixedSavingDue: 100,
  interestDue: 0,
  totalDue: 2100,
  paymentStatus: "pending",
  paymentMethod: null,
  paidAt: null,
  createdAt: "2026-09-22T00:00:00Z",
  updatedAt: "2026-09-22T00:00:00Z",
};

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe("payment controls", () => {
  it("submits the selected method for a pending obligation", async () => {
    mock.paid.mockResolvedValue({ ok: true, message: "Payment marked paid." });
    render(<PaymentControls payment={payment} />);
    fireEvent.change(screen.getByLabelText("Payment method for Asha"), {
      target: { value: "bank_transfer" },
    });
    const form = screen
      .getByRole("button", { name: "Mark paid" })
      .closest("form")!;
    await act(async () => fireEvent.submit(form));
    const submitted = mock.paid.mock.calls[0]?.[3] as FormData;
    expect(submitted.get("paymentMethod")).toBe("bank_transfer");
  });

  it("requires fresh correction confirmation after the payment version changes", async () => {
    mock.pending.mockResolvedValue({ ok: true, message: "Corrected" });
    const paid = {
      ...payment,
      paymentStatus: "paid" as const,
      paymentMethod: "cash" as const,
      paidAt: "2026-09-22T01:00:00Z",
    };
    const { rerender } = render(<PaymentControls payment={paid} />);
    const checkbox = screen.getByRole("checkbox");
    const button = screen.getByRole("button", { name: "Return to pending" });
    expect(button).toBeDisabled();
    fireEvent.click(checkbox);
    expect(button).toBeEnabled();
    rerender(
      <PaymentControls
        payment={{ ...paid, updatedAt: "2026-09-22T01:01:00Z" }}
      />,
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(button).toBeDisabled();
  });
});
