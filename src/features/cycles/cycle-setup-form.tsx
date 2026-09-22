"use client";

import { useActionState, useMemo, useState } from "react";
import type { Cycle } from "@/domain/cycle";
import { buildSchedulePreview } from "@/domain/cycle";
import type { Member } from "@/domain/member";
import { saveCycleDraft } from "@/server/actions/cycles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kathmandu",
});

export function CycleSetupForm({
  activeMembers,
  draft,
}: {
  activeMembers: Member[];
  draft: Cycle | undefined;
}) {
  const activeMemberIds = new Set(activeMembers.map((member) => member.id));
  const initialSelected = draft
    ? draft.members
        .map((member) => member.memberId)
        .filter((memberId) => activeMemberIds.has(memberId))
    : activeMembers.length === 11
      ? activeMembers.map((member) => member.id)
      : [];
  const [selected, setSelected] = useState(initialSelected);
  const [startedMonth, setStartedMonth] = useState(
    draft?.startedOn.slice(0, 7) ?? "",
  );
  const [state, action, pending] = useActionState(
    saveCycleDraft.bind(null, draft?.id ?? null, draft?.updatedAt ?? null),
    { ok: false, message: "" },
  );
  const preview = useMemo(
    () => buildSchedulePreview(startedMonth),
    [startedMonth],
  );
  const canSave = activeMembers.length >= 11 && selected.length === 11;

  function toggleMember(id: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...current, id]
        : current.filter((memberId) => memberId !== id),
    );
  }

  return (
    <form action={action} className="space-y-6" aria-busy={pending}>
      <fieldset disabled={pending} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="cycle-started-month"
              className="mb-2 block text-sm font-semibold"
            >
              Starting month
            </label>
            <Input
              id="cycle-started-month"
              name="startedMonth"
              type="month"
              value={startedMonth}
              onChange={(event) => setStartedMonth(event.target.value)}
              required
            />
          </div>
          <MoneyField
            id="cycle-contribution"
            name="contributionAmount"
            label="Dhukuti contribution"
            defaultValue={draft?.contributionAmount ?? 2000}
            min={1}
          />
          <MoneyField
            id="cycle-saving"
            name="fixedSavingAmount"
            label="Fixed saving"
            defaultValue={draft?.fixedSavingAmount ?? 100}
          />
          <MoneyField
            id="cycle-interest"
            name="interestAmount"
            label="Winner interest"
            defaultValue={draft?.interestAmount ?? 200}
          />
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Cycle roster</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Select exactly 11 active members. Their displayed order is saved
                with the cycle.
              </p>
            </div>
            <span className="text-primary text-sm font-bold">
              {selected.length} / 11 selected
            </span>
          </div>
          {activeMembers.length < 11 && (
            <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
              Add {11 - activeMembers.length} more active member
              {11 - activeMembers.length === 1 ? "" : "s"} before saving a
              cycle.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activeMembers.map((member) => {
              const checked = selected.includes(member.id);
              return (
                <label
                  key={member.id}
                  className="focus-within:ring-ring flex min-h-12 items-center gap-3 rounded-lg border px-3 text-sm focus-within:ring-2"
                >
                  <input
                    type="checkbox"
                    name="memberIds"
                    value={member.id}
                    checked={checked}
                    disabled={!checked && selected.length >= 11}
                    onChange={(event) =>
                      toggleMember(member.id, event.target.checked)
                    }
                    className="size-5 accent-[var(--primary)]"
                  />
                  <span className="min-w-0 break-words">
                    {member.full_name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {preview.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">Default schedule preview</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Each meeting defaults to the last Saturday of its Gregorian month.
            </p>
            <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((month) => (
                <li
                  key={month.monthNumber}
                  className="bg-secondary/50 flex justify-between rounded-lg px-3 py-2 text-xs"
                >
                  <span className="font-semibold">
                    Month {month.monthNumber}
                  </span>
                  <time dateTime={month.scheduledDate}>
                    {formatDate.format(
                      new Date(`${month.scheduledDate}T00:00:00Z`),
                    )}
                  </time>
                </li>
              ))}
            </ol>
          </div>
        )}

        <Button type="submit" className="min-h-11" disabled={!canSave}>
          {pending
            ? "Saving draft…"
            : draft
              ? "Save draft changes"
              : "Save draft cycle"}
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

function MoneyField({
  id,
  name,
  label,
  defaultValue,
  min = 0,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: number;
  min?: number;
}) {
  // React resets uncontrolled fields even when an action returns a validation error.
  const [value, setValue] = useState(String(defaultValue));
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label} (NPR)
      </label>
      <Input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        step={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        required
      />
    </div>
  );
}
