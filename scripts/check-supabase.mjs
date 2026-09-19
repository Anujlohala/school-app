import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("Set the Supabase URL and publishable key in .env.local.");
  process.exit(1);
}

try {
  const settings = await fetch(new URL("/auth/v1/settings", url), {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  });
  if (!settings.ok) throw new Error(`Auth returned HTTP ${settings.status}.`);
  const auth = await settings.json();
  console.log("PASS: Supabase Auth accepts the configured publishable key.");
  if (auth.disable_signup !== true) {
    console.error("SETUP REQUIRED: Disable public signup in Supabase Auth.");
    process.exitCode = 1;
  } else {
    console.log("PASS: Public signup is disabled.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
    },
  });
  // Request zero rows: this checks reachability and anonymous permissions only.
  const { error } = await supabase.from("profiles").select("user_id").limit(0);
  if (error?.code === "42501") {
    console.log(
      "PASS: Database API is reachable and anonymous profile reads are denied.",
    );
  } else if (error?.code === "PGRST205") {
    console.error(
      "SETUP REQUIRED: Database API is reachable; apply the profiles migration.",
    );
    process.exitCode = 1;
  } else if (error) {
    throw new Error(`Database check failed (code ${error.code || "unknown"}).`);
  } else {
    console.error(
      "REVIEW REQUIRED: Anonymous profile SELECT is permitted; check table grants.",
    );
    process.exitCode = 1;
  }
} catch (error) {
  // Do not print request headers, keys, or SDK internals.
  console.error(
    error instanceof Error ? error.message : "Connection check failed.",
  );
  process.exitCode = 1;
}
