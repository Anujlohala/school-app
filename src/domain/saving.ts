import { z } from "zod";
import type { PaymentMethod } from "@/domain/payment";

const optionalReason = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed || undefined;
}, z.string().max(240, "Keep the public reason within 240 characters.").optional());

const optionalMonthId = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid("Choose a valid month.").optional(),
);

export const extraContributionIdentity = z.uuid();
export const extraContributionVersion = z.iso.datetime({ offset: true });
export const extraContributionInput = z.object({
  cycleId: z.uuid(),
  monthId: optionalMonthId,
  memberId: z.uuid("Choose a contributor."),
  amount: z.coerce
    .number()
    .int("Use a whole NPR amount.")
    .positive("Amount must be greater than zero.")
    .max(2_147_483_647, "Amount is too large."),
  paymentMethod: z.enum(["esewa", "bank_transfer", "cash"], {
    message: "Choose eSewa, bank transfer, or cash.",
  }),
  reason: optionalReason,
});

export const extraContributionUpdateInput = extraContributionInput.pick({
  amount: true,
  paymentMethod: true,
  reason: true,
});

export type ExtraContribution = {
  id: string;
  cycleId: string;
  monthId: string | null;
  monthNumber: number | null;
  memberId: string;
  memberName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SavingFund = {
  cycleId: string;
  cycleNumber: number;
  fixedSavingReceived: number;
  interestReceived: number;
  extraContributions: number;
  pendingFixedSaving: number;
  pendingInterest: number;
  actualCycleSaving: number;
  carriedFromPreviousCycles: number;
  cumulativeBalance: number;
  contributions: ExtraContribution[];
};
