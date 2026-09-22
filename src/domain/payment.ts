import { z } from "zod";

export const paymentIdentity = z.uuid();
export const paymentVersion = z.iso.datetime({ offset: true });
export const paymentMethod = z.enum(["esewa", "bank_transfer", "cash"]);

export type PaymentMethod = z.infer<typeof paymentMethod>;

export function paymentMethodLabel(method: PaymentMethod | null) {
  if (method === "esewa") return "eSewa";
  if (method === "bank_transfer") return "Bank transfer";
  if (method === "cash") return "Cash";
  return "—";
}
