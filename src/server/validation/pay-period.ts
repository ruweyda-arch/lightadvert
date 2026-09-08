import { z } from "zod";

import { id } from "./common";

export const lockMonthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Pick a month."),
});

export const lockRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a start date."),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an end date."),
});

export const unlockSchema = z.object({
  id,
  reason: z.string().trim().min(3, "Give a reason for unlocking.").max(500),
});
