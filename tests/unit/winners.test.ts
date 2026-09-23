import { beforeEach, describe, expect, it, vi } from "vitest";

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
  correctMonthWinner,
  recordMonthWinner,
} from "@/server/actions/winners";

const monthId = "10000000-0000-4000-8000-000000000000";
const winnerId = "20000000-0000-4000-8000-000000000000";
const replacementWinnerId = "30000000-0000-4000-8000-000000000000";
const updatedAt = "2026-09-22T00:00:00.123456+00:00";

function winnerForm(confirm = true) {
  const form = new FormData();
  form.set("winnerMemberId", winnerId);
  if (confirm) form.set("confirmation", "confirmed");
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.guard.mockResolvedValue({ role: "admin" });
  mock.rpc.mockResolvedValue({
    data: [{ generated_payment_count: 11 }],
    error: null,
  });
});

describe("winner recording", () => {
  it("authorizes an administrator and sends only reviewed identifiers", async () => {
    const result = await recordMonthWinner(
      monthId,
      updatedAt,
      { ok: false, message: "" },
      winnerForm(),
    );
    expect(result.ok).toBe(true);
    expect(mock.guard).toHaveBeenCalledWith(true);
    expect(mock.rpc).toHaveBeenCalledWith(
      "set_month_winner_and_generate_payments",
      {
        p_month_id: monthId,
        p_winner_member_id: winnerId,
        p_expected_updated_at: updatedAt,
      },
    );
    expect(mock.revalidate).toHaveBeenCalledWith("/months");
  });

  it("requires confirmation before contacting the database", async () => {
    const result = await recordMonthWinner(
      monthId,
      updatedAt,
      { ok: false, message: "" },
      winnerForm(false),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Confirm");
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("surfaces stale and out-of-order recording safely", async () => {
    mock.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "40001", message: "changed since" },
    });
    expect(
      (
        await recordMonthWinner(
          monthId,
          updatedAt,
          { ok: false, message: "" },
          winnerForm(),
        )
      ).message,
    ).toContain("Reload");
    mock.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "P0001", message: "Record earlier month winners first" },
    });
    expect(
      (
        await recordMonthWinner(
          monthId,
          updatedAt,
          { ok: false, message: "" },
          winnerForm(),
        )
      ).message,
    ).toContain("earlier month");
  });
});

describe("winner correction", () => {
  function correctionForm(confirm = true) {
    const form = new FormData();
    form.set("winnerMemberId", replacementWinnerId);
    if (confirm) form.set("confirmation", "confirmed");
    return form;
  }

  beforeEach(() => {
    mock.rpc.mockResolvedValue({
      data: [{ rebuilt_payment_count: 22 }],
      error: null,
    });
  });

  it("authorizes an administrator and sends only reviewed identifiers", async () => {
    const result = await correctMonthWinner(
      monthId,
      winnerId,
      updatedAt,
      { ok: false, message: "" },
      correctionForm(),
    );
    expect(result.ok).toBe(true);
    expect(mock.guard).toHaveBeenCalledWith(true);
    expect(mock.rpc).toHaveBeenCalledWith(
      "correct_month_winner_and_rebuild_payments",
      {
        p_month_id: monthId,
        p_new_winner_member_id: replacementWinnerId,
        p_expected_updated_at: updatedAt,
      },
    );
    expect(mock.revalidate).toHaveBeenCalledWith("/history");
    expect(mock.revalidate).toHaveBeenCalledWith("/savings");
  });

  it("requires confirmation and a different winner", async () => {
    const unconfirmed = await correctMonthWinner(
      monthId,
      winnerId,
      updatedAt,
      { ok: false, message: "" },
      correctionForm(false),
    );
    expect(unconfirmed.ok).toBe(false);
    expect(mock.rpc).not.toHaveBeenCalled();

    const sameWinner = correctionForm();
    sameWinner.set("winnerMemberId", winnerId);
    const unchanged = await correctMonthWinner(
      monthId,
      winnerId,
      updatedAt,
      { ok: false, message: "" },
      sameWinner,
    );
    expect(unchanged.message).toContain("different winner");
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("explains why received payments block the correction", async () => {
    mock.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "P0001", message: "affected received payments" },
    });
    const result = await correctMonthWinner(
      monthId,
      winnerId,
      updatedAt,
      { ok: false, message: "" },
      correctionForm(),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Return every received payment");
  });
});
