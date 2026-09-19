"use server";

import { revalidatePath } from "next/cache";
import { requireAccount } from "@/server/queries/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { memberIdentity, memberInput } from "@/domain/member";

export type MemberResult = { ok: boolean; message: string };
export async function saveMember(
  id: string | null,
  updatedAt: string | null,
  form: FormData,
): Promise<MemberResult> {
  await requireAccount(true);
  const parsed = memberInput.safeParse({
    fullName: form.get("fullName"),
    active: form.get("active"),
  });
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the member details.",
    };
  const identity =
    id === null ? null : memberIdentity.safeParse({ id, updatedAt });
  if (identity && !identity.success)
    return {
      ok: false,
      message: "Invalid member. Reload the page and try again.",
    };
  const values = {
    full_name: parsed.data.fullName,
    active: parsed.data.active === "true",
  };
  try {
    const supabase = await createSupabaseServerClient(true);
    const query = identity?.success
      ? supabase
          .from("members")
          .update(values)
          .eq("id", identity.data.id)
          .eq("updated_at", identity.data.updatedAt)
      : supabase.from("members").insert(values);
    const { data, error } = await query.select("id");
    if (error)
      return {
        ok: false,
        message:
          error.code === "23505"
            ? "An active member already has this name."
            : "Could not save this member. Please try again.",
      };
    if (!data?.length)
      return {
        ok: false,
        message:
          "This member changed since you opened the page. Reload before editing again.",
      };
  } catch {
    return {
      ok: false,
      message: "Could not save this member. Please try again.",
    };
  }
  revalidatePath("/members");
  return { ok: true, message: id ? "Member updated." : "Member added." };
}
