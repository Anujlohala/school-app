import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  guard: vi.fn(),
  from: vi.fn(),
  contributionSelect: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/queries/auth", () => ({ requireAccount: mock.guard }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ from: mock.from }),
}));

import { listSavingFunds } from "@/server/queries/savings";

const cycleId = "10000000-0000-4000-8000-000000000000";
const memberId = "20000000-0000-4000-8000-000000000000";
const monthId = "30000000-0000-4000-8000-000000000000";

beforeEach(() => {
  vi.clearAllMocks();
  mock.guard.mockResolvedValue({ role: "member" });
  mock.from.mockImplementation((table: string) => {
    if (table === "saving_fund_summary")
      return {
        select: () => ({
          order: async () => ({
            data: [
              {
                cycle_id: cycleId,
                cycle_number: 1,
                fixed_saving_received: 100,
                interest_received: 200,
                extra_contributions: 500,
                pending_fixed_saving: 300,
                pending_interest: 0,
                actual_cycle_saving: 800,
                carried_from_previous_cycles: 0,
                cumulative_balance: 800,
              },
            ],
            error: null,
          }),
        }),
      };
    if (table === "extra_contributions")
      return {
        select: (columns: string) => {
          mock.contributionSelect(columns);
          return {
            order: async () => ({
              data: [
                {
                  id: "40000000-0000-4000-8000-000000000000",
                  cycle_id: cycleId,
                  month_id: monthId,
                  member_id: memberId,
                  amount: 500,
                  payment_method: "cash",
                  reason: "Community support",
                  created_at: "2026-09-22T00:00:00Z",
                  updated_at: "2026-09-22T00:00:00Z",
                },
              ],
              error: null,
            }),
          };
        },
      };
    if (table === "members")
      return {
        select: async () => ({
          data: [{ id: memberId, full_name: "Asha" }],
          error: null,
        }),
      };
    return {
      select: async () => ({
        data: [{ id: monthId, month_number: 2 }],
        error: null,
      }),
    };
  });
});

describe("saving queries", () => {
  it("loads contribution labels without relying on ambiguous embedded relationships", async () => {
    const funds = await listSavingFunds();

    expect(mock.contributionSelect).toHaveBeenCalledWith(
      "id,cycle_id,month_id,member_id,amount,payment_method,reason,created_at,updated_at",
    );
    expect(funds[0]?.contributions[0]).toMatchObject({
      memberName: "Asha",
      monthNumber: 2,
      amount: 500,
    });
  });
});
