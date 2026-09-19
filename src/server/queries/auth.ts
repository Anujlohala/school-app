import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Account = { userId: string; role: "admin" | "member" };

// React cache deduplicates only within the current render/request.
export const getAccount = cache(async (): Promise<Account | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();
  if (
    profileError ||
    !profile ||
    (profile.role !== "admin" && profile.role !== "member")
  )
    return null;
  return { userId: data.user.id, role: profile.role };
});

export async function requireAccount(admin = false) {
  const account = await getAccount();
  if (!account) redirect(admin ? "/admin/login" : "/login");
  if (admin && account.role !== "admin") redirect("/dashboard");
  return account;
}
