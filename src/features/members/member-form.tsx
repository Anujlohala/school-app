"use client";

import { useActionState, useState } from "react";
import { saveMember } from "@/server/actions/members";
import type { Member } from "@/domain/member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MemberForm({ member }: { member?: Member }) {
  const [name, setName] = useState(member?.full_name ?? "");
  const [active, setActive] = useState(member?.active ?? true);
  const [state, action, pending] = useActionState(
    async (_previous: { ok: boolean; message: string }, form: FormData) => {
      const result = await saveMember(
        member?.id ?? null,
        member?.updated_at ?? null,
        form,
      );
      if (result.ok && !member) {
        setName("");
        setActive(true);
      }
      return result;
    },
    { ok: false, message: "" },
  );
  const prefix = member?.id ?? "new-member";
  return (
    <form action={action} className="space-y-4" aria-busy={pending}>
      <fieldset disabled={pending} className="space-y-4">
        <div>
          <label
            htmlFor={`${prefix}-name`}
            className="mb-2 block text-sm font-semibold"
          >
            Full name
          </label>
          <Input
            id={`${prefix}-name`}
            name="fullName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={120}
            autoComplete="off"
            placeholder="Enter member’s full name"
          />
        </div>
        <input type="hidden" name="active" value={String(active)} />
        {member && (
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="focus-ring size-5 accent-[var(--primary)]"
            />
            Active — available for future cycles
          </label>
        )}
        <Button type="submit" className="min-h-11">
          {pending ? "Saving…" : member ? "Save changes" : "Add member"}
        </Button>
      </fieldset>
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
