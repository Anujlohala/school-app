import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSchedulePreview,
  buildCycleCompletionSummary,
  cycleDraftInput,
  lastSaturdayOfMonth,
  type Cycle,
} from "@/domain/cycle";

const ids = Array.from(
  { length: 11 },
  (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
);

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
  activateCycle,
  completeCycle,
  overrideMeetingDate,
  saveCycleDraft,
} from "@/server/actions/cycles";

function cycleForm(memberIds = ids) {
  const data = new FormData();
  data.set("startedMonth", "2026-09");
  data.set("contributionAmount", "2000");
  data.set("fixedSavingAmount", "100");
  data.set("interestAmount", "200");
  for (const id of memberIds) data.append("memberIds", id);
  return data;
}

function activationForm() {
  const data = new FormData();
  data.set("confirmation", "confirmed");
  return data;
}

function completionForm() {
  const data = new FormData();
  data.set("confirmation", "confirmed");
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.guard.mockResolvedValue({ role: "admin" });
  mock.rpc.mockResolvedValue({ data: null, error: null });
});

describe("cycle rules", () => {
  it("calculates the last Saturday without local-time drift", () => {
    expect(lastSaturdayOfMonth(2026, 9)).toBe("2026-09-26");
    expect(lastSaturdayOfMonth(2026, 10)).toBe("2026-10-31");
    expect(lastSaturdayOfMonth(2027, 2)).toBe("2027-02-27");
  });

  it("builds 11 monthly dates across a year boundary", () => {
    const schedule = buildSchedulePreview("2026-09");
    expect(schedule).toHaveLength(11);
    expect(schedule[0]).toEqual({
      monthNumber: 1,
      scheduledDate: "2026-09-26",
    });
    expect(schedule[10]).toEqual({
      monthNumber: 11,
      scheduledDate: "2027-07-31",
    });
  });

  it("requires 11 unique members and whole non-negative rule amounts", () => {
    const base = {
      startedMonth: "2026-09",
      contributionAmount: "2000",
      fixedSavingAmount: "100",
      interestAmount: "200",
      memberIds: ids,
    };
    expect(cycleDraftInput.safeParse(base).success).toBe(true);
    expect(
      cycleDraftInput.safeParse({ ...base, memberIds: ids.slice(0, 10) })
        .success,
    ).toBe(false);
    expect(
      cycleDraftInput.safeParse({
        ...base,
        memberIds: [...ids.slice(0, 10), ids[0]],
      }).success,
    ).toBe(false);
    expect(
      cycleDraftInput.safeParse({ ...base, interestAmount: "20.5" }).success,
    ).toBe(false);
  });

  it("requires all winners and obligation snapshots but allows pending payments", () => {
    const cycle: Cycle = {
      id: ids[0]!,
      cycleNumber: 1,
      status: "active" as const,
      memberCount: 11,
      contributionAmount: 2000,
      fixedSavingAmount: 100,
      interestAmount: 200,
      startedOn: "2026-09-01",
      completedOn: null,
      updatedAt: "2026-09-22T00:00:02.123456Z",
      members: ids.map((memberId, index) => ({
        memberId,
        fullName: `Member ${index + 1}`,
        active: true,
        displayOrder: index + 1,
      })),
      months: ids.map((monthId, monthIndex) => ({
        id: monthId,
        monthNumber: monthIndex + 1,
        scheduledDate: "2026-09-26",
        dateOverridden: false,
        status: "open" as const,
        updatedAt: "2026-09-22T00:00:02.123500Z",
        winnerMemberId: ids[monthIndex]!,
        winnerName: `Member ${monthIndex + 1}`,
        payments: ids.map((memberId, memberIndex) => ({
          id: `${monthId}-${memberIndex}`,
          memberId,
          memberName: `Member ${memberIndex + 1}`,
          dhukutiDue: 2000,
          fixedSavingDue: 100,
          interestDue: 0,
          totalDue: 2100,
          paymentStatus: "pending" as const,
          paymentMethod: null,
          paidAt: null,
          createdAt: "2026-09-22T00:00:00Z",
          updatedAt:
            monthIndex === 10 && memberIndex === 10
              ? "2026-09-22T00:00:02.123789Z"
              : "2026-09-22T00:00:02.123600Z",
        })),
      })),
    };
    const summary = buildCycleCompletionSummary(cycle);
    expect(summary.ready).toBe(true);
    expect(summary.pendingCount).toBe(121);
    expect(summary.pendingAmount).toBe(254100);
    expect(summary.reviewVersion).toBe("2026-09-22T00:00:02.123789Z");

    cycle.months[10]!.winnerMemberId = null;
    expect(buildCycleCompletionSummary(cycle).blockers).toContain(
      "Every cycle member must be recorded as a winner once.",
    );
  });
});

describe("cycle actions", () => {
  it("checks administrator access before saving", async () => {
    mock.guard.mockRejectedValue(new Error("forbidden"));
    await expect(
      saveCycleDraft(null, null, { ok: false, message: "" }, cycleForm()),
    ).rejects.toThrow("forbidden");
    expect(mock.guard).toHaveBeenCalledWith(true);
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("sends validated draft values to one database transaction", async () => {
    const result = await saveCycleDraft(
      null,
      null,
      { ok: false, message: "" },
      cycleForm(),
    );
    expect(result.ok).toBe(true);
    expect(mock.rpc).toHaveBeenCalledWith("save_draft_cycle", {
      p_cycle_id: null,
      p_expected_updated_at: null,
      p_started_on: "2026-09-01",
      p_contribution_amount: 2000,
      p_fixed_saving_amount: 100,
      p_interest_amount: 200,
      p_member_ids: ids,
    });
    expect(mock.revalidate).toHaveBeenCalledWith("/months");
  });

  it("rejects incomplete rosters before contacting the database", async () => {
    const result = await saveCycleDraft(
      null,
      null,
      { ok: false, message: "" },
      cycleForm(ids.slice(0, 10)),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("exactly 11");
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("activates and changes dates only through authenticated RPCs", async () => {
    const cycleId = "10000000-0000-4000-8000-000000000000";
    const monthId = "20000000-0000-4000-8000-000000000000";
    const reviewedVersion = "2026-09-22T00:00:00.123456+00:00";
    await activateCycle(
      cycleId,
      reviewedVersion,
      { ok: false, message: "" },
      activationForm(),
    );
    const dateForm = new FormData();
    dateForm.set("scheduledDate", "2026-09-27");
    await overrideMeetingDate(monthId, { ok: false, message: "" }, dateForm);
    expect(mock.rpc).toHaveBeenNthCalledWith(1, "activate_cycle", {
      p_cycle_id: cycleId,
      p_expected_updated_at: reviewedVersion,
    });
    expect(mock.rpc).toHaveBeenNthCalledWith(2, "override_meeting_date", {
      p_month_id: monthId,
      p_scheduled_date: "2026-09-27",
    });
  });

  it("requires a valid reviewed version and explicit activation confirmation", async () => {
    const cycleId = "10000000-0000-4000-8000-000000000000";
    const version = "2026-09-22T00:00:00Z";
    expect(
      (
        await activateCycle(
          cycleId,
          "",
          { ok: false, message: "" },
          activationForm(),
        )
      ).ok,
    ).toBe(false);
    expect(
      (
        await activateCycle(
          cycleId,
          version,
          { ok: false, message: "" },
          new FormData(),
        )
      ).ok,
    ).toBe(false);
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("asks for a fresh review when the database rejects stale activation", async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "40001",
        message: "This cycle changed since it was reviewed",
      },
    });
    const result = await activateCycle(
      "10000000-0000-4000-8000-000000000000",
      "2026-09-22T00:00:00Z",
      { ok: false, message: "" },
      activationForm(),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Reload and review the latest draft");
    expect(mock.revalidate).not.toHaveBeenCalled();
  });

  it("completes a reviewed cycle through the database transaction", async () => {
    const cycleId = "10000000-0000-4000-8000-000000000000";
    const version = "2026-09-22T00:00:02Z";
    const result = await completeCycle(
      cycleId,
      version,
      { ok: false, message: "" },
      completionForm(),
    );
    expect(result.ok).toBe(true);
    expect(mock.rpc).toHaveBeenCalledWith("complete_cycle", {
      p_cycle_id: cycleId,
      p_expected_updated_at: version,
    });
    expect(mock.revalidate).toHaveBeenCalledWith("/dashboard");
    expect(mock.revalidate).toHaveBeenCalledWith("/history");
  });

  it("requires confirmation and reports a stale completion review", async () => {
    const cycleId = "10000000-0000-4000-8000-000000000000";
    const version = "2026-09-22T00:00:02Z";
    expect(
      (
        await completeCycle(
          cycleId,
          version,
          { ok: false, message: "" },
          new FormData(),
        )
      ).ok,
    ).toBe(false);
    mock.rpc.mockResolvedValue({
      data: null,
      error: { code: "40001", message: "changed" },
    });
    const result = await completeCycle(
      cycleId,
      version,
      { ok: false, message: "" },
      completionForm(),
    );
    expect(result.message).toContain("changed since you reviewed");
  });
});
