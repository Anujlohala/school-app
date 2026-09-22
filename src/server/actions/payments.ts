"use server";

import { revalidatePath } from "next/cache";
import {
  paymentIdentity,
  paymentMethod,
  paymentVersion,
} from "@/domain/payment";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAccount } from "@/server/queries/auth";

export type PaymentResult = { ok: boolean; message: string };

function paymentError(message?: string, code?: string) {
  if (code === "40001" || message?.includes("changed since"))
    return "This payment changed since you reviewed it. Reload before trying again.";
  if (message?.includes("before changing its method"))
    return "Return this payment to pending before changing its method.";
  if (message?.includes("not found"))
    return "This payment no longer exists. Reload the page.";
  return "Could not update this payment. Reload and try again.";
}

function refreshPaymentViews() {
  revalidatePath("/months");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/savings");
}

export async function markPaymentPaid(
  paymentId: string,
  updatedAt: string,
  _previous: PaymentResult,
  form: FormData,
): Promise<PaymentResult> {
  void _previous;
  await requireAccount(true);
  const id = paymentIdentity.safeParse(paymentId);
  const version = paymentVersion.safeParse(updatedAt);
  const method = paymentMethod.safeParse(form.get("paymentMethod"));
  if (!id.success || !version.success)
    return { ok: false, message: "Invalid or stale payment. Reload the page." };
  if (!method.success)
    return { ok: false, message: "Choose eSewa, bank transfer, or cash." };
  try {
    const supabase = await createSupabaseServerClient(true);
    const { error } = await supabase.rpc("mark_monthly_payment_paid", {
      p_payment_id: id.data,
      p_method: method.data,
      p_expected_updated_at: version.data,
    });
    if (error)
      return { ok: false, message: paymentError(error.message, error.code) };
  } catch {
    return { ok: false, message: paymentError() };
  }
  refreshPaymentViews();
  return { ok: true, message: "Payment marked paid." };
}

export async function markPaymentPending(
  paymentId: string,
  updatedAt: string,
  _previous: PaymentResult,
  form: FormData,
): Promise<PaymentResult> {
  void _previous;
  await requireAccount(true);
  if (form.get("confirmation") !== "confirmed")
    return { ok: false, message: "Confirm this payment correction." };
  const id = paymentIdentity.safeParse(paymentId);
  const version = paymentVersion.safeParse(updatedAt);
  if (!id.success || !version.success)
    return { ok: false, message: "Invalid or stale payment. Reload the page." };
  try {
    const supabase = await createSupabaseServerClient(true);
    const { error } = await supabase.rpc("mark_monthly_payment_pending", {
      p_payment_id: id.data,
      p_expected_updated_at: version.data,
    });
    if (error)
      return { ok: false, message: paymentError(error.message, error.code) };
  } catch {
    return { ok: false, message: paymentError() };
  }
  refreshPaymentViews();
  return { ok: true, message: "Payment returned to pending." };
}
