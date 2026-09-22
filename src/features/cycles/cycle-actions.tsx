"use client";

import { useActionState, useState } from "react";
import { activateCycle, overrideMeetingDate } from "@/server/actions/cycles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ActivateCycleForm({
  cycleId,
  updatedAt,
}: {
  cycleId: string;
  updatedAt: string;
}) {
  const version = `${cycleId}:${updatedAt}`;
  const [confirmedVersion, setConfirmedVersion] = useState<string | null>(null);
  const confirmed = confirmedVersion === version;
  const [state, action, pending] = useActionState(
    activateCycle.bind(null, cycleId, updatedAt),
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="space-y-4" aria-busy={pending}>
      <label className="flex min-h-11 items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          name="confirmation"
          value="confirmed"
          required
          disabled={pending}
          checked={confirmed}
          onChange={(event) =>
            setConfirmedVersion(event.target.checked ? version : null)
          }
          className="focus-ring mt-1 size-5 shrink-0 accent-[var(--primary)]"
        />
        I reviewed the 11 members, financial rules, starting month, and meeting
        schedule. Activation locks this cycle setup.
      </label>
      <Button
        type="submit"
        className="min-h-11"
        disabled={!confirmed || pending}
      >
        {pending ? "Activating…" : "Activate cycle"}
      </Button>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={
            state.ok ? "text-primary text-sm" : "text-destructive text-sm"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

export function MeetingDateForm({
  monthId,
  scheduledDate,
}: {
  monthId: string;
  scheduledDate: string;
}) {
  const [state, action, pending] = useActionState(
    overrideMeetingDate.bind(null, monthId),
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="mt-3 space-y-2" aria-busy={pending}>
      <label htmlFor={`meeting-${monthId}`} className="sr-only">
        Meeting date
      </label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={`meeting-${monthId}`}
          type="date"
          name="scheduledDate"
          defaultValue={scheduledDate}
          required
          className="min-w-44 flex-1"
          disabled={pending}
        />
        <Button
          type="submit"
          variant="outline"
          className="min-h-12"
          disabled={pending}
        >
          {pending ? "Saving…" : "Update date"}
        </Button>
      </div>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={
            state.ok ? "text-primary text-xs" : "text-destructive text-xs"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
