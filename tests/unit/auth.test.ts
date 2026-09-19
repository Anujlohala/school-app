import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => {
  const single = vi.fn();
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  return {
    single,
    eq,
    select,
    from: vi.fn(() => ({ select })),
    signIn: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    redirect: vi.fn((url: string) => {
      throw new Error(`redirect:${url}`);
    }),
  };
});
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: mock.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      signInWithPassword: mock.signIn,
      signOut: mock.signOut,
      getUser: mock.getUser,
    },
    from: mock.from,
  }),
}));

import { signIn, signOut } from "@/server/actions/auth";
import { getAccount, requireAccount } from "@/server/queries/auth";

const initial = { error: "" };
function form(username = "member", password = "test-only-password") {
  const data = new FormData();
  data.set("username", username);
  data.set("password", password);
  data.set("role", "admin"); // Untrusted role fields must have no effect.
  data.set("email", "attacker@example.test");
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ADMIN_LOGIN_EMAIL", "admin@example.test");
  vi.stubEnv("MEMBER_LOGIN_EMAIL", "member@example.test");
  mock.signIn.mockResolvedValue({
    data: { user: { id: "member-id" } },
    error: null,
  });
  mock.signOut.mockResolvedValue({ error: null });
  mock.getUser.mockResolvedValue({
    data: { user: { id: "member-id" } },
    error: null,
  });
  mock.single.mockResolvedValue({ data: { role: "member" }, error: null });
});

describe("sign-in authorization", () => {
  it("maps usernames server-side and ignores browser roles/emails", async () => {
    await expect(signIn(false, initial, form())).rejects.toThrow(
      "redirect:/dashboard",
    );
    expect(mock.signIn).toHaveBeenCalledWith({
      email: "member@example.test",
      password: "test-only-password",
    });
    expect(mock.eq).toHaveBeenCalledWith("user_id", "member-id");
  });
  it("requires the database admin role for administrator login", async () => {
    const result = await signIn(true, initial, form("admin"));
    expect(result.error).toContain("Unable to sign in");
    expect(mock.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mock.redirect).not.toHaveBeenCalled();
  });
  it("redirects a verified administrator to administration", async () => {
    mock.single.mockResolvedValue({ data: { role: "admin" }, error: null });
    await expect(signIn(true, initial, form("admin"))).rejects.toThrow(
      "redirect:/admin",
    );
  });
  it("fails closed when no profile exists", async () => {
    mock.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    expect((await signIn(false, initial, form())).error).toContain(
      "Unable to sign in",
    );
    expect(mock.redirect).not.toHaveBeenCalled();
  });
  it("rejects unknown usernames and missing passwords before contacting Auth", async () => {
    await signIn(false, initial, form("admin"));
    await signIn(false, initial, form("member", ""));
    expect(mock.signIn).not.toHaveBeenCalled();
  });
  it("does not reveal provider errors or credentials", async () => {
    mock.signIn.mockResolvedValue({
      data: { user: null },
      error: { message: "private detail" },
    });
    expect((await signIn(false, initial, form())).error).toBe(
      "Unable to sign in. Check your username and password.",
    );
  });
});

describe("protected access", () => {
  it("rejects unverified identities even if a profile could be found", async () => {
    mock.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid token" },
    });
    await expect(requireAccount()).rejects.toThrow("redirect:/login");
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("does not allow members into administration", async () => {
    await expect(requireAccount(true)).rejects.toThrow("redirect:/dashboard");
  });
  it("rejects unknown database roles", async () => {
    mock.single.mockResolvedValue({ data: { role: "owner" }, error: null });
    expect(await getAccount()).toBeNull();
  });
  it("rejects revoked profile access", async () => {
    mock.single.mockResolvedValue({ data: null, error: { message: "denied" } });
    expect(await getAccount()).toBeNull();
  });
});

describe("logout", () => {
  it("ends only this device session so shared-member devices stay signed in", async () => {
    await expect(signOut()).rejects.toThrow("redirect:/login");
    expect(mock.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("reports failure instead of pretending logout succeeded", async () => {
    mock.signOut.mockResolvedValue({
      error: { message: "network unavailable" },
    });
    expect((await signOut()).error).toContain("Could not sign out");
    expect(mock.redirect).not.toHaveBeenCalled();
  });
});
