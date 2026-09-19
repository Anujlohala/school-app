import { z } from "zod";

export const memberInput = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Enter a member name.")
    .max(120, "Use 120 characters or fewer."),
  active: z.enum(["true", "false"]),
});
export const memberIdentity = z.object({
  id: z.uuid(),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type Member = {
  id: string;
  full_name: string;
  active: boolean;
  updated_at: string;
};
