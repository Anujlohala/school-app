// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mock = vi.hoisted(() => ({ claims: vi.fn(), create: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({ createServerClient: mock.create }));
import { proxy } from "@/proxy";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable");
  mock.claims.mockResolvedValue({ data: null, error: null });
  mock.create.mockReturnValue({ auth: { getClaims: mock.claims } });
});

it.each(["dashboard", "months", "savings", "history", "members"])(
  "redirects anonymous %s requests without caching",
  async (path) => {
    const response = await proxy(
      new NextRequest(`http://localhost:3000/${path}`),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login",
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
  },
);
it("keeps the administrator login public but protects nested admin routes", async () => {
  expect(
    (await proxy(new NextRequest("http://localhost:3000/admin/login"))).status,
  ).toBe(200);
  const result = await proxy(
    new NextRequest(
      "http://localhost:3000/admin/settings?next=https://evil.test",
    ),
  );
  expect(result.headers.get("location")).toBe(
    "http://localhost:3000/admin/login",
  );
});
it("preserves refreshed HTTP-only cookies and passes them to the render", async () => {
  mock.create.mockImplementation((_url, _key, options) => ({
    auth: {
      getClaims: async () => {
        options.cookies.setAll(
          [{ name: "session", value: "refreshed", options: { path: "/" } }],
          {},
        );
        return { data: { claims: { sub: "verified-id" } }, error: null };
      },
    },
  }));
  const request = new NextRequest("http://localhost:3000/dashboard");
  const response = await proxy(request);
  expect(request.cookies.get("session")?.value).toBe("refreshed");
  expect(response.cookies.get("session")?.httpOnly).toBe(true);
  expect(response.cookies.get("session")?.sameSite).toBe("lax");
  expect(response.status).toBe(200);
});
it("preserves cleared cookies on authentication redirects", async () => {
  mock.create.mockImplementation((_url, _key, options) => ({
    auth: {
      getClaims: async () => {
        options.cookies.setAll(
          [{ name: "session", value: "", options: { maxAge: 0 } }],
          {},
        );
        return { data: null, error: { message: "invalid" } };
      },
    },
  }));
  const response = await proxy(
    new NextRequest("http://localhost:3000/dashboard"),
  );
  expect(response.status).toBe(307);
  expect(response.cookies.get("session")?.maxAge).toBe(0);
});
