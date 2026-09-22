"use server";

import { revalidatePath } from "next/cache";
import {
  cycleDraftInput,
  cycleIdentity,
  cycleVersion,
  meetingDateInput,
  monthValueToDate,
} from "@/domain/cycle";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAccount } from "@/server/queries/auth";

export type CycleResult = { ok: boolean; message: string };

function refreshCycleViews() {
  revalidatePath("/months");
  revalidatePath("/admin");
}

function cycleErrorMessage(message?: string) {
  if (message?.includes("changed since"))
    return "This cycle changed since you opened the page. Reload before editing again.";
  if (message?.includes("active member"))
    return "The cycle requires exactly 11 currently active members.";
  if (message?.includes("draft cycle"))
    return "This cycle is no longer a draft. Reload the page.";
  if (message?.includes("duplicate key"))
    return "A draft or active cycle already exists. Reload the page.";
  return "Could not save the cycle. Please try again.";
}

export async function saveCycleDraft(
  id: string | null,
  updatedAt: string | null,
  _previous: CycleResult,
  form: FormData,
): Promise<CycleResult> {
  void _previous;
  await requireAccount(true);
  const parsed = cycleDraftInput.safeParse({
    startedMonth: form.get("startedMonth"),
    contributionAmount: form.get("contributionAmount"),
    fixedSavingAmount: form.get("fixedSavingAmount"),
    interestAmount: form.get("interestAmount"),
    memberIds: form.getAll("memberIds"),
  });
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the cycle details.",
    };
  if (id !== null && !cycleIdentity.safeParse(id).success)
    return { ok: false, message: "Invalid cycle. Reload the page." };
  const startedOn = monthValueToDate(parsed.data.startedMonth);
  if (!startedOn)
    return { ok: false, message: "Choose a valid Gregorian starting month." };
  try {
    const supabase = await createSupabaseServerClient(true);
    const { error } = await supabase.rpc("save_draft_cycle", {
      p_cycle_id: id,
      p_expected_updated_at: updatedAt,
      p_started_on: startedOn,
      p_contribution_amount: parsed.data.contributionAmount,
      p_fixed_saving_amount: parsed.data.fixedSavingAmount,
      p_interest_amount: parsed.data.interestAmount,
      p_member_ids: parsed.data.memberIds,
    });
    if (error) return { ok: false, message: cycleErrorMessage(error.message) };
  } catch {
    return { ok: false, message: cycleErrorMessage() };
  }
  refreshCycleViews();
  return {
    ok: true,
    message: id ? "Draft cycle updated." : "Draft cycle saved.",
  };
}

export async function activateCycle(
  id: string,
  updatedAt: string,
  _previous: CycleResult,
  form: FormData,
): Promise<CycleResult> {
  void _previous;
  await requireAccount(true);
  if (!cycleIdentity.safeParse(id).success)
    return { ok: false, message: "Invalid cycle. Reload the page." };
  if (!cycleVersion.safeParse(updatedAt).success)
    return {
      ok: false,
      message: "Reload and review the latest draft before activating.",
    };
  if (form.get("confirmation") !== "confirmed")
    return {
      ok: false,
      message: "Confirm that you reviewed this cycle before activating.",
    };
  try {
    const supabase = await createSupabaseServerClient(true);
    const { error } = await supabase.rpc("activate_cycle", {
      p_cycle_id: id,
      p_expected_updated_at: updatedAt,
    });
    if (error)
      return {
        ok: false,
        message:
          error.code === "40001"
            ? "This cycle changed since you reviewed it. Reload and review the latest draft before activating."
            : error.message.includes("11 active")
              ? "Activation requires exactly 11 currently active members."
              : "Could not activate the cycle. Reload and try again.",
      };
  } catch {
    return { ok: false, message: "Could not activate the cycle. Try again." };
  }
  refreshCycleViews();
  return { ok: true, message: "Cycle activated and 11 meetings scheduled." };
}

export async function overrideMeetingDate(
  monthId: string,
  _previous: CycleResult,
  form: FormData,
): Promise<CycleResult> {
  void _previous;
  await requireAccount(true);
  if (!cycleIdentity.safeParse(monthId).success)
    return { ok: false, message: "Invalid month. Reload the page." };
  const parsed = meetingDateInput.safeParse({
    scheduledDate: form.get("scheduledDate"),
  });
  if (!parsed.success)
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Choose a valid meeting date.",
    };
  try {
    const supabase = await createSupabaseServerClient(true);
    const { error } = await supabase.rpc("override_meeting_date", {
      p_month_id: monthId,
      p_scheduled_date: parsed.data.scheduledDate,
    });
    if (error)
      return {
        ok: false,
        message: "Could not update this meeting date. Reload and try again.",
      };
  } catch {
    return {
      ok: false,
      message: "Could not update this meeting date. Try again.",
    };
  }
  revalidatePath("/months");
  return { ok: true, message: "Meeting date updated." };
}
