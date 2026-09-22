"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CycleMember } from "@/domain/cycle";
import { recordMonthWinner } from "@/server/actions/winners";

export function WinnerForm({
  monthId,
  updatedAt,
  members,
}: {
  monthId: string;
  updatedAt: string;
  members: CycleMember[];
}) {
  const [winnerId, setWinnerId] = useState("");
  const reviewVersion = `${monthId}:${updatedAt}:${winnerId}`;
  const [confirmedVersion, setConfirmedVersion] = useState<string | null>(null);
  const confirmed = winnerId !== "" && confirmedVersion === reviewVersion;
  const [state, action, pending] = useActionState(
    recordMonthWinner.bind(null, monthId, updatedAt),
    { ok: false, message: "" },
  );
  return (
    <form action={action} className="mt-4 space-y-3" aria-busy={pending}>
      <label htmlFor={`winner-${monthId}`} className="text-xs font-bold">
        Chitta winner
      </label>
      <select
        id={`winner-${monthId}`}
        name="winnerMemberId"
        required
        value={winnerId}
        disabled={pending}
        onChange={(event) => {
          setWinnerId(event.target.value);
          setConfirmedVersion(null);
        }}
        className="focus-ring bg-background min-h-11 w-full rounded-md border px-3 text-sm"
      >
        <option value="">Choose the drawn member</option>
        {members.map((member) => (
          <option key={member.memberId} value={member.memberId}>
            {member.fullName}
          </option>
        ))}
      </select>
      <label className="flex min-h-11 items-start gap-3 text-xs leading-relaxed">
        <input
          type="checkbox"
          name="confirmation"
          value="confirmed"
          required
          checked={confirmed}
          disabled={!winnerId || pending}
          onChange={(event) =>
            setConfirmedVersion(event.target.checked ? reviewVersion : null)
          }
          className="focus-ring mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
        />
        I confirm this is the result of the in-person Chitta draw. Saving
        creates all 11 monthly obligations and cannot be edited here.
      </label>
      <Button
        type="submit"
        className="min-h-11 w-full"
        disabled={!confirmed || pending}
      >
        {pending ? "Recording…" : "Record winner and obligations"}
      </Button>
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
