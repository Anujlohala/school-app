"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MonthlyPayment } from "@/domain/cycle";
import { markPaymentPaid, markPaymentPending } from "@/server/actions/payments";

export function PaymentControls({ payment }: { payment: MonthlyPayment }) {
  if (payment.paymentStatus === "paid")
    return <PaidCorrectionForm payment={payment} />;
  return <MarkPaidForm payment={payment} />;
}

function MarkPaidForm({ payment }: { payment: MonthlyPayment }) {
  const [state, action, pending] = useActionState(
    markPaymentPaid.bind(null, payment.id, payment.updatedAt),
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="min-w-44 space-y-2" aria-busy={pending}>
      <label htmlFor={`method-${payment.id}`} className="sr-only">
        Payment method for {payment.memberName}
      </label>
      <select
        id={`method-${payment.id}`}
        name="paymentMethod"
        required
        defaultValue=""
        disabled={pending}
        className="focus-ring bg-background min-h-11 w-full rounded-md border px-2 text-xs"
      >
        <option value="" disabled>
          Choose method
        </option>
        <option value="esewa">eSewa</option>
        <option value="bank_transfer">Bank transfer</option>
        <option value="cash">Cash</option>
      </select>
      <Button
        type="submit"
        size="sm"
        className="min-h-11 w-full"
        disabled={pending}
      >
        {pending ? "Saving…" : "Mark paid"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

function PaidCorrectionForm({ payment }: { payment: MonthlyPayment }) {
  const reviewKey = `${payment.id}:${payment.updatedAt}`;
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);
  const confirmed = confirmedKey === reviewKey;
  const [state, action, pending] = useActionState(
    markPaymentPending.bind(null, payment.id, payment.updatedAt),
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="min-w-44 space-y-2" aria-busy={pending}>
      <label className="flex min-h-11 items-start gap-2 text-xs leading-relaxed">
        <input
          type="checkbox"
          name="confirmation"
          value="confirmed"
          required
          checked={confirmed}
          disabled={pending}
          onChange={(event) =>
            setConfirmedKey(event.target.checked ? reviewKey : null)
          }
          className="focus-ring mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
        />
        Confirm correction to pending
      </label>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="min-h-11 w-full"
        disabled={!confirmed || pending}
      >
        {pending ? "Correcting…" : "Return to pending"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

function ActionMessage({ state }: { state: { ok: boolean; message: string } }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={state.ok ? "text-primary text-xs" : "text-destructive text-xs"}
    >
      {state.message}
    </p>
  );
}
