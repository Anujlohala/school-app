"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthState = { error: string };
const invalid = {
  error: "Unable to sign in. Check your username and password.",
};

export async function signIn(
  admin: boolean,
  _state: AuthState,
  form: FormData,
): Promise<AuthState> {
  const username = form.get("username");
  const password = form.get("password");
  const expectedRole = admin ? "admin" : "member";
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.trim().toLowerCase() !== expectedRole ||
    !password ||
    password.length > 1024
  )
    return invalid;
  const email = admin
    ? process.env.ADMIN_LOGIN_EMAIL
    : process.env.MEMBER_LOGIN_EMAIL;
  if (!email)
    return {
      error:
        "Sign-in is temporarily unavailable. Please contact the administrator.",
    };
  try {
    const supabase = await createSupabaseServerClient(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) return invalid;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .single();
    if (profileError || profile?.role !== expectedRole) {
      await supabase.auth.signOut({ scope: "local" });
      return invalid;
    }
  } catch {
    return { error: "Sign-in is temporarily unavailable. Please try again." };
  }
  revalidatePath("/", "layout");
  redirect(admin ? "/admin" : "/dashboard");
}

export async function signOut(): Promise<AuthState> {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { error: "Could not sign out. Please try again." };
  } catch {
    return { error: "Could not sign out. Please try again." };
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
