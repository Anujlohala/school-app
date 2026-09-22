"use server";

import { revalidatePath } from "next/cache";
import {
  extraContributionIdentity,
  extraContributionInput,
  extraContributionUpdateInput,
  extraContributionVersion,
} from "@/domain/saving";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAccount } from "@/server/queries/auth";

export type SavingResult = { ok: boolean; message: string };

function contributionError(message?: string, code?: string) {
  if (code === "40001" || message?.includes("changed since"))
    return "This contribution changed since you reviewed it. Reload before trying again.";
  if (message?.includes("does not belong"))
    return "The selected contributor or month does not belong to this cycle.";
  if (message?.includes("draft cycle"))
    return "Extra contributions cannot be recorded against a draft cycle.";
  if (message?.includes("not found"))
    return "This contribution no longer exists. Reload the page.";
  return "Could not save this contribution. Reload and try again.";
}

function refreshSavingViews() {
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export async function addExtraContribution(
  cycleId: string,
  _previous: SavingResult,
  form: FormData,
): Promise<SavingResult> {
  void _previous;
  await requireAccount(true);
  const parsed = extraContributionInput.safeParse({
    cycleId,
    monthId: form.get("monthId"),
    memberId: form.get("memberId"),
    amount: form.get("amount"),
    paymentMethod: form.get("paymentMethod"),
    reason: form.get("reason"),
  });
  if (!parsed.success)
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Check the contribution details.",
    };
  try {
    const supabase = await createSupabaseServerClient(true);
    const { error } = await supabase.rpc("add_extra_contribution", {
      p_cycle_id: parsed.data.cycleId,
      p_month_id: parsed.data.monthId ?? null,
      p_member_id: parsed.data.memberId,
      p_amount: parsed.data.amount,
      p_method: parsed.data.paymentMethod,
      p_reason: parsed.data.reason ?? null,
    });
    if (error)
      return {
        ok: false,
        message: contributionError(error.message, error.code),
      };
  } catch {
    return { ok: false, message: contributionError() };
  }
  refreshSavingViews();
  return { ok: true, message: "Extra contribution recorded." };
}

export async function updateExtraContribution(
  contributionId: string,
  updatedAt: string,
  _previous: SavingResult,
  form: FormData,
): Promise<SavingResult> {
  void _previous;
  await requireAccount(true);
  const identity = extraContributionIdentity.safeParse(contributionId);
  const version = extraContributionVersion.safeParse(updatedAt);
  const parsed = extraContributionUpdateInput.safeParse({
    amount: form.get("amount"),
    paymentMethod: form.get("paymentMethod"),
    reason: form.get("reason"),
  });
  if (!identity.success || !version.success)
    return {
      ok: false,
      message: "Invalid or stale contribution. Reload the page.",
    };
  if (!parsed.success)
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Check the contribution details.",
    };
  try {
    const supabase = await createSupabaseServerClient(true);
    const { error } = await supabase.rpc("update_extra_contribution", {
      p_contribution_id: identity.data,
      p_expected_updated_at: version.data,
      p_amount: parsed.data.amount,
      p_method: parsed.data.paymentMethod,
      p_reason: parsed.data.reason ?? null,
    });
    if (error)
      return {
        ok: false,
        message: contributionError(error.message, error.code),
      };
  } catch {
    return { ok: false, message: contributionError() };
  }
  refreshSavingViews();
  return { ok: true, message: "Contribution updated." };
}
