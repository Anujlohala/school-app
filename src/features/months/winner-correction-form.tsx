"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CycleMember } from "@/domain/cycle";
import { correctMonthWinner } from "@/server/actions/winners";

export function WinnerCorrectionForm({
  monthId,
  monthNumber,
  updatedAt,
  currentWinnerMemberId,
  currentWinnerName,
  members,
  receivedPaymentCount,
}: {
  monthId: string;
  monthNumber: number;
  updatedAt: string;
  currentWinnerMemberId: string;
  currentWinnerName: string;
  members: CycleMember[];
  receivedPaymentCount: number;
}) {
  const [winnerId, setWinnerId] = useState("");
  const reviewVersion = `${monthId}:${updatedAt}:${currentWinnerMemberId}:${winnerId}`;
  const [confirmedVersion, setConfirmedVersion] = useState<string | null>(null);
  const confirmed = winnerId !== "" && confirmedVersion === reviewVersion;
  const [state, action, pending] = useActionState(
    correctMonthWinner.bind(null, monthId, currentWinnerMemberId, updatedAt),
    { ok: false, message: "" },
  );
  const blocked = receivedPaymentCount > 0;

  return (
    <details className="mt-3 rounded-lg border border-dashed p-3">
      <summary className="focus-ring flex min-h-11 cursor-pointer items-center rounded text-xs font-bold">
        Edit winner
      </summary>
      {blocked ? (
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
          This correction affects Month {monthNumber} and later recorded months.
          Return the {receivedPaymentCount} received payment
          {receivedPaymentCount === 1 ? "" : "s"} in that range to pending
          before editing the winner.
        </p>
      ) : (
        <form action={action} className="mt-3 space-y-3" aria-busy={pending}>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Current winner: <strong>{currentWinnerName}</strong>. Saving will
            rebuild pending obligations from Month {monthNumber} onward.
          </p>
          <label
            htmlFor={`correct-winner-${monthId}`}
            className="text-xs font-bold"
          >
            Correct winner
          </label>
          <select
            id={`correct-winner-${monthId}`}
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
            <option value="">Choose the correct member</option>
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
            I confirm {currentWinnerName} was recorded incorrectly and the
            selected member is the actual Chitta winner.
          </label>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="min-h-11 w-full"
            disabled={!confirmed || pending}
          >
            {pending ? "Correcting…" : "Save winner correction"}
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
      )}
    </details>
  );
}
