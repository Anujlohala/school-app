import { beforeEach, describe, expect, it, vi } from "vitest";
import { memberInput } from "@/domain/member";

const mock = vi.hoisted(() => {
  const select = vi.fn();
  const eq = vi.fn();
  const chain = { eq, select };
  eq.mockReturnValue(chain);
  return {
    select,
    eq,
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    guard: vi.fn(),
    revalidate: vi.fn(),
  };
});
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mock.revalidate }));
vi.mock("@/server/queries/auth", () => ({ requireAccount: mock.guard }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: () => ({ insert: mock.insert, update: mock.update }),
  }),
}));
import { saveMember } from "@/server/actions/members";

function form(name = "Test Friend", active = "true") {
  const data = new FormData();
  data.set("fullName", name);
  data.set("active", active);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mock.guard.mockResolvedValue({ role: "admin" });
  mock.select.mockResolvedValue({ data: [{ id: "saved" }], error: null });
});
describe("member validation", () => {
  it("trims names and supports Unicode", () =>
    expect(
      memberInput.parse({ fullName: "  अनुज  ", active: "true" }).fullName,
    ).toBe("अनुज"));
  it.each(["", "   ", "a".repeat(121)])("rejects invalid names", (name) =>
    expect(
      memberInput.safeParse({ fullName: name, active: "true" }).success,
    ).toBe(false),
  );
  it("rejects invalid status", () =>
    expect(
      memberInput.safeParse({ fullName: "Friend", active: "admin" }).success,
    ).toBe(false));
});
describe("member mutations", () => {
  it("requires admin before any mutation", async () => {
    mock.guard.mockRejectedValue(new Error("forbidden"));
    await expect(saveMember(null, null, form())).rejects.toThrow("forbidden");
    expect(mock.guard).toHaveBeenCalledWith(true);
    expect(mock.insert).not.toHaveBeenCalled();
  });
  it("saves validated names and revalidates the roster", async () => {
    expect((await saveMember(null, null, form(" Friend "))).ok).toBe(true);
    expect(mock.insert).toHaveBeenCalledWith({
      full_name: "Friend",
      active: true,
    });
    expect(mock.revalidate).toHaveBeenCalledWith("/members");
  });
  it("reports duplicate active names", async () => {
    mock.select.mockResolvedValue({ data: null, error: { code: "23505" } });
    expect((await saveMember(null, null, form())).message).toContain(
      "already has",
    );
  });
  it("rejects stale edits without claiming success", async () => {
    mock.select.mockResolvedValue({ data: [], error: null });
    const result = await saveMember(
      "694479f9-572c-45b4-b902-85e851d994da",
      "2026-09-19T10:00:00.123456+00:00",
      form(),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("changed");
    expect(mock.eq).toHaveBeenCalledWith(
      "updated_at",
      "2026-09-19T10:00:00.123456+00:00",
    );
  });
  it("does not turn an invalid update into an insert", async () => {
    expect((await saveMember("not-a-uuid", null, form())).ok).toBe(false);
    expect(mock.insert).not.toHaveBeenCalled();
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("deactivates rather than deleting identities", async () => {
    await saveMember(
      "694479f9-572c-45b4-b902-85e851d994da",
      "2026-09-19T10:00:00Z",
      form("Friend", "false"),
    );
    expect(mock.update).toHaveBeenCalledWith({
      full_name: "Friend",
      active: false,
    });
  });
});
