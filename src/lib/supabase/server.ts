import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sessionCookieOptions, supabaseConfig } from "./config";

export async function createSupabaseServerClient(writable = false) {
  const store = await cookies();
  const { url, key } = supabaseConfig();
  return createServerClient(url, key, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        // Proxy refreshes cookies before Server Components render. Actions opt in.
        if (writable) {
          for (const { name, value, options } of values) {
            store.set(name, value, { ...options, ...sessionCookieOptions });
          }
        }
      },
    },
  });
}
