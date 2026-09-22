import { beforeEach, describe, expect, it, vi } from "vitest";
import { paymentMethod, paymentMethodLabel } from "@/domain/payment";

const mock = vi.hoisted(() => ({
  guard: vi.fn(),
  rpc: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mock.revalidate }));
vi.mock("@/server/queries/auth", () => ({ requireAccount: mock.guard }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ rpc: mock.rpc }),
}));
import { markPaymentPaid, markPaymentPending } from "@/server/actions/payments";

const paymentId = "10000000-0000-4000-8000-000000000000";
const updatedAt = "2026-09-22T00:00:00.123456+00:00";

function paidForm(method = "cash") {
  const form = new FormData();
  form.set("paymentMethod", method);
  return form;
}

function correctionForm(confirm = true) {
  const form = new FormData();
  if (confirm) form.set("confirmation", "confirmed");
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.guard.mockResolvedValue({ role: "admin" });
  mock.rpc.mockResolvedValue({ data: null, error: null });
});

describe("payment domain", () => {
  it("accepts only the documented payment methods", () => {
    expect(paymentMethod.safeParse("esewa").success).toBe(true);
    expect(paymentMethod.safeParse("bank_transfer").success).toBe(true);
    expect(paymentMethod.safeParse("cash").success).toBe(true);
    expect(paymentMethod.safeParse("card").success).toBe(false);
    expect(paymentMethodLabel("bank_transfer")).toBe("Bank transfer");
    expect(paymentMethodLabel(null)).toBe("—");
  });
});

describe("payment actions", () => {
  it("authorizes and marks the stored obligation paid without accepting an amount", async () => {
    const result = await markPaymentPaid(
      paymentId,
      updatedAt,
      { ok: false, message: "" },
      paidForm("esewa"),
    );
    expect(result).toEqual({ ok: true, message: "Payment marked paid." });
    expect(mock.guard).toHaveBeenCalledWith(true);
    expect(mock.rpc).toHaveBeenCalledWith("mark_monthly_payment_paid", {
      p_payment_id: paymentId,
      p_method: "esewa",
      p_expected_updated_at: updatedAt,
    });
    expect(mock.revalidate).toHaveBeenCalledWith("/months");
    expect(mock.revalidate).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects an unsupported method before contacting the database", async () => {
    const result = await markPaymentPaid(
      paymentId,
      updatedAt,
      { ok: false, message: "" },
      paidForm("card"),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Choose eSewa");
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("requires explicit correction confirmation", async () => {
    const result = await markPaymentPending(
      paymentId,
      updatedAt,
      { ok: false, message: "" },
      correctionForm(false),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Confirm");
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("marks a confirmed correction pending through the database function", async () => {
    const result = await markPaymentPending(
      paymentId,
      updatedAt,
      { ok: false, message: "" },
      correctionForm(),
    );
    expect(result.ok).toBe(true);
    expect(mock.rpc).toHaveBeenCalledWith("mark_monthly_payment_pending", {
      p_payment_id: paymentId,
      p_expected_updated_at: updatedAt,
    });
  });

  it("asks for a reload after an optimistic-lock conflict", async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { code: "40001", message: "changed since it was reviewed" },
    });
    const result = await markPaymentPaid(
      paymentId,
      updatedAt,
      { ok: false, message: "" },
      paidForm(),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Reload");
    expect(mock.revalidate).not.toHaveBeenCalled();
  });
});
