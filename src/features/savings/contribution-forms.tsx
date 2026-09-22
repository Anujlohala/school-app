"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Cycle } from "@/domain/cycle";
import type { ExtraContribution } from "@/domain/saving";
import {
  addExtraContribution,
  updateExtraContribution,
} from "@/server/actions/savings";

const emptyResult = { ok: false, message: "" };

export function AddContributionForm({ cycle }: { cycle: Cycle }) {
  const [memberId, setMemberId] = useState("");
  const [monthId, setMonthId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reason, setReason] = useState("");
  const [state, action, pending] = useActionState(
    async (_previous: typeof emptyResult, form: FormData) => {
      const result = await addExtraContribution(cycle.id, _previous, form);
      if (result.ok) {
        setMemberId("");
        setMonthId("");
        setAmount("");
        setMethod("");
        setReason("");
      }
      return result;
    },
    emptyResult,
  );
  const prefix = `cycle-${cycle.id}-contribution`;

  return (
    <form action={action} className="space-y-4" aria-busy={pending}>
      <fieldset disabled={pending} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Contributor" htmlFor={`${prefix}-member`}>
            <select
              id={`${prefix}-member`}
              name="memberId"
              required
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              className="focus-ring bg-background min-h-11 w-full rounded-md border px-3 text-sm"
            >
              <option value="" disabled>
                Choose member
              </option>
              {cycle.members.map((member) => (
                <option key={member.memberId} value={member.memberId}>
                  {member.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Related month (optional)" htmlFor={`${prefix}-month`}>
            <select
              id={`${prefix}-month`}
              name="monthId"
              value={monthId}
              onChange={(event) => setMonthId(event.target.value)}
              className="focus-ring bg-background min-h-11 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Whole cycle</option>
              {cycle.months.map((month) => (
                <option key={month.id} value={month.id}>
                  Month {month.monthNumber}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (NPR)" htmlFor={`${prefix}-amount`}>
            <Input
              id={`${prefix}-amount`}
              name="amount"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Field label="Payment method" htmlFor={`${prefix}-method`}>
            <MethodSelect
              id={`${prefix}-method`}
              value={method}
              onChange={setMethod}
            />
          </Field>
        </div>
        <Field label="Public reason (optional)" htmlFor={`${prefix}-reason`}>
          <Input
            id={`${prefix}-reason`}
            name="reason"
            maxLength={240}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="For example, support for the group saving fund"
          />
        </Field>
        <Button type="submit" className="min-h-11">
          {pending ? "Recording…" : "Record contribution"}
        </Button>
      </fieldset>
      <ActionMessage state={state} />
    </form>
  );
}

export function EditContributionForm({
  contribution,
}: {
  contribution: ExtraContribution;
}) {
  const [amount, setAmount] = useState(String(contribution.amount));
  const [method, setMethod] = useState<string>(contribution.paymentMethod);
  const [reason, setReason] = useState(contribution.reason ?? "");
  const [state, action, pending] = useActionState(
    updateExtraContribution.bind(null, contribution.id, contribution.updatedAt),
    emptyResult,
  );
  const prefix = `contribution-${contribution.id}`;

  return (
    <form action={action} className="space-y-3" aria-busy={pending}>
      <fieldset disabled={pending} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount (NPR)" htmlFor={`${prefix}-amount`} compact>
            <Input
              id={`${prefix}-amount`}
              name="amount"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Field label="Payment method" htmlFor={`${prefix}-method`} compact>
            <MethodSelect
              id={`${prefix}-method`}
              value={method}
              onChange={setMethod}
            />
          </Field>
        </div>
        <Field
          label="Public reason (optional)"
          htmlFor={`${prefix}-reason`}
          compact
        >
          <Input
            id={`${prefix}-reason`}
            name="reason"
            maxLength={240}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <Button type="submit" variant="outline" className="min-h-11">
          {pending ? "Saving…" : "Save correction"}
        </Button>
      </fieldset>
      <ActionMessage state={state} />
    </form>
  );
}

function MethodSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      id={id}
      name="paymentMethod"
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="focus-ring bg-background min-h-11 w-full rounded-md border px-3 text-sm"
    >
      <option value="" disabled>
        Choose method
      </option>
      <option value="esewa">eSewa</option>
      <option value="bank_transfer">Bank transfer</option>
      <option value="cash">Cash</option>
    </select>
  );
}

function Field({
  label,
  htmlFor,
  compact = false,
  children,
}: {
  label: string;
  htmlFor: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className={`${compact ? "mb-1 text-xs" : "mb-2 text-sm"} block font-semibold`}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionMessage({ state }: { state: typeof emptyResult }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={state.ok ? "text-primary text-sm" : "text-destructive text-sm"}
    >
      {state.message}
    </p>
  );
}
