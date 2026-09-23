"use server";

import { revalidatePath } from "next/cache";
import { winnerCorrectionInput, winnerInput } from "@/domain/cycle";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAccount } from "@/server/queries/auth";

export type WinnerResult = { ok: boolean; message: string };

function winnerError(message?: string, code?: string) {
  if (code === "40001" || message?.includes("changed since"))
    return "This month changed since you reviewed it. Reload and confirm the latest record.";
  if (message?.includes("earlier month"))
    return "Record the earlier month winner first.";
  if (message?.includes("already won"))
    return "That member has already won in this cycle.";
  if (message?.includes("received payments"))
    return "Return every received payment from this month and later recorded months to pending before correcting the winner.";
  if (message?.includes("different winner"))
    return "Choose a different winner before saving the correction.";
  if (message?.includes("already has a winner"))
    return "This month already has a recorded winner.";
  if (message?.includes("belong to this cycle"))
    return "Choose a member from this cycle.";
  return "Could not record the winner. Reload and try again.";
}

function refreshWinnerViews() {
  revalidatePath("/months");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/savings");
  revalidatePath("/admin/reconciliation");
}

export async function recordMonthWinner(
  monthId: string,
  expectedUpdatedAt: string,
  _previous: WinnerResult,
  form: FormData,
): Promise<WinnerResult> {
  void _previous;
  await requireAccount(true);
  if (form.get("confirmation") !== "confirmed")
    return {
      ok: false,
      message: "Confirm the in-person Chitta result before saving.",
    };
  const parsed = winnerInput.safeParse({
    monthId,
    expectedUpdatedAt,
    winnerMemberId: form.get("winnerMemberId"),
  });
  if (!parsed.success)
    return {
      ok: false,
      message: "Choose a valid winner and reload if the page is stale.",
    };
  try {
    const supabase = await createSupabaseServerClient(true);
    const { data, error } = await supabase.rpc(
      "set_month_winner_and_generate_payments",
      {
        p_month_id: parsed.data.monthId,
        p_winner_member_id: parsed.data.winnerMemberId,
        p_expected_updated_at: parsed.data.expectedUpdatedAt,
      },
    );
    if (error)
      return { ok: false, message: winnerError(error.message, error.code) };
    const result = Array.isArray(data) ? data[0] : null;
    if (!result || result.generated_payment_count !== 11)
      return {
        ok: false,
        message: "The database did not confirm all 11 obligations.",
      };
  } catch {
    return { ok: false, message: winnerError() };
  }
  refreshWinnerViews();
  return {
    ok: true,
    message: "Winner recorded and 11 monthly obligations created.",
  };
}

export async function correctMonthWinner(
  monthId: string,
  currentWinnerMemberId: string,
  expectedUpdatedAt: string,
  _previous: WinnerResult,
  form: FormData,
): Promise<WinnerResult> {
  void _previous;
  await requireAccount(true);
  if (form.get("confirmation") !== "confirmed")
    return {
      ok: false,
      message: "Confirm the winner correction before saving.",
    };
  const parsed = winnerCorrectionInput.safeParse({
    monthId,
    currentWinnerMemberId,
    expectedUpdatedAt,
    winnerMemberId: form.get("winnerMemberId"),
  });
  if (!parsed.success)
    return {
      ok: false,
      message:
        "Choose a valid replacement winner and reload if the page is stale.",
    };
  if (parsed.data.winnerMemberId === parsed.data.currentWinnerMemberId)
    return { ok: false, message: "Choose a different winner before saving." };
  try {
    const supabase = await createSupabaseServerClient(true);
    const { data, error } = await supabase.rpc(
      "correct_month_winner_and_rebuild_payments",
      {
        p_month_id: parsed.data.monthId,
        p_new_winner_member_id: parsed.data.winnerMemberId,
        p_expected_updated_at: parsed.data.expectedUpdatedAt,
      },
    );
    if (error)
      return { ok: false, message: winnerError(error.message, error.code) };
    const result = Array.isArray(data) ? data[0] : null;
    if (!result || result.rebuilt_payment_count < 11)
      return {
        ok: false,
        message: "The database did not confirm the rebuilt obligations.",
      };
  } catch {
    return { ok: false, message: winnerError() };
  }
  refreshWinnerViews();
  return {
    ok: true,
    message: "Winner corrected and affected pending obligations rebuilt.",
  };
}
