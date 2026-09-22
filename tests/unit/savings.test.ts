import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  extraContributionInput,
  extraContributionUpdateInput,
} from "@/domain/saving";

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
import {
  addExtraContribution,
  updateExtraContribution,
} from "@/server/actions/savings";

const cycleId = "10000000-0000-4000-8000-000000000000";
const memberId = "20000000-0000-4000-8000-000000000000";
const monthId = "30000000-0000-4000-8000-000000000000";
const contributionId = "40000000-0000-4000-8000-000000000000";
const updatedAt = "2026-09-22T00:00:00.123456+00:00";

function contributionForm(overrides: Record<string, string> = {}) {
  const values = {
    memberId,
    monthId,
    amount: "500",
    paymentMethod: "esewa",
    reason: "  Community support  ",
    ...overrides,
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.guard.mockResolvedValue({ role: "admin" });
  mock.rpc.mockResolvedValue({ data: null, error: null });
});

describe("saving domain", () => {
  it("accepts a whole positive NPR contribution and trims its public reason", () => {
    const parsed = extraContributionInput.parse({
      cycleId,
      memberId,
      monthId: "",
      amount: "500",
      paymentMethod: "cash",
      reason: "  Community support  ",
    });
    expect(parsed).toMatchObject({
      amount: 500,
      monthId: undefined,
      reason: "Community support",
    });
  });

  it.each(["0", "-1", "1.5"])(
    "rejects invalid contribution amount %s",
    (amount) => {
      expect(
        extraContributionUpdateInput.safeParse({
          amount,
          paymentMethod: "cash",
          reason: "",
        }).success,
      ).toBe(false);
    },
  );
});

describe("saving actions", () => {
  it("authorizes and records only validated contribution fields", async () => {
    const result = await addExtraContribution(
      cycleId,
      { ok: false, message: "" },
      contributionForm(),
    );
    expect(result).toEqual({
      ok: true,
      message: "Extra contribution recorded.",
    });
    expect(mock.guard).toHaveBeenCalledWith(true);
    expect(mock.rpc).toHaveBeenCalledWith("add_extra_contribution", {
      p_cycle_id: cycleId,
      p_month_id: monthId,
      p_member_id: memberId,
      p_amount: 500,
      p_method: "esewa",
      p_reason: "Community support",
    });
    expect(mock.revalidate).toHaveBeenCalledWith("/savings");
    expect(mock.revalidate).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects invalid input before contacting the database", async () => {
    const result = await addExtraContribution(
      cycleId,
      { ok: false, message: "" },
      contributionForm({ amount: "0", paymentMethod: "card" }),
    );
    expect(result.ok).toBe(false);
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("updates an existing contribution with optimistic locking", async () => {
    const result = await updateExtraContribution(
      contributionId,
      updatedAt,
      { ok: false, message: "" },
      contributionForm({ amount: "700", paymentMethod: "bank_transfer" }),
    );
    expect(result.ok).toBe(true);
    expect(mock.rpc).toHaveBeenCalledWith("update_extra_contribution", {
      p_contribution_id: contributionId,
      p_expected_updated_at: updatedAt,
      p_amount: 700,
      p_method: "bank_transfer",
      p_reason: "Community support",
    });
  });

  it("reports stale contribution corrections", async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { code: "40001", message: "changed since it was reviewed" },
    });
    const result = await updateExtraContribution(
      contributionId,
      updatedAt,
      { ok: false, message: "" },
      contributionForm(),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Reload");
    expect(mock.revalidate).not.toHaveBeenCalled();
  });
});
