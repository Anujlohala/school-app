import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieOptions, supabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        for (const { name, value } of values) request.cookies.set(name, value);
        const previous = response;
        response = NextResponse.next({ request });
        for (const cookie of previous.cookies.getAll())
          response.cookies.set(cookie);
        for (const { name, value, options } of values) {
          response.cookies.set(name, value, {
            ...options,
            ...sessionCookieOptions,
          });
        }
        for (const [name, value] of Object.entries(headers))
          response.headers.set(name, value);
      },
    },
  });
  const { data, error } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  const protectedPath =
    [
      "/dashboard",
      "/months",
      "/savings",
      "/history",
      "/members",
      "/admin",
    ].some((path) => pathname === path || pathname.startsWith(`${path}/`)) &&
    pathname !== "/admin/login";
  if (protectedPath && (error || !data?.claims)) {
    const destination = request.nextUrl.clone();
    destination.pathname = pathname.startsWith("/admin")
      ? "/admin/login"
      : "/login";
    destination.search = "";
    const redirected = NextResponse.redirect(destination);
    for (const cookie of response.cookies.getAll())
      redirected.cookies.set(cookie);
    response = redirected;
  }
  // Includes auth action responses and redirects: never cache authenticated HTML.
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
