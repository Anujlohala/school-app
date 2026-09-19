import "server-only";
import { requireAccount } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Member } from "@/domain/member";

export async function listMembers(): Promise<Member[]> {
  await requireAccount();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .select("id,full_name,active,updated_at")
    .order("active", { ascending: false })
    .order("full_name");
  if (error) {
    console.error("members.list failed", { code: error.code });
    throw new Error("The member roster could not be loaded. Please try again.");
  }
  return data;
}
