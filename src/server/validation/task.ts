import { z } from "zod";

import { EFFORT_POINTS } from "@/server/domain/effort";

import { id } from "./common";

const priority = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

const title = z
  .string()
  .trim()
  .min(1, "Enter a title.")
  .max(200, "Title is too long.");

const optionalShort = z
  .string()
  .trim()
  .max(60, "That label is too long.")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalBrief = z
  .string()
  .trim()
  .max(2000, "That brief is too long.")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalIsoDate = z
  .string()
  .optional()
  .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined));

const effortPoints = z.coerce
  .number()
  .refine(
    (n) => (EFFORT_POINTS as readonly number[]).includes(n),
    "Pick an effort value from the scale.",
  );

const httpUrl = z
  .string()
  .trim()
  .min(1, "Enter a URL.")
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid URL including https://");

const reason = z.string().trim().max(500, "Reason is too long.").optional();

export const createTaskSchema = z.object({
  title,
  projectId: id,
  assigneeId: id,
  stampedRoleId: id,
  effortPoints,
  type: optionalShort,
  deadline: optionalIsoDate,
  priority,
  brief: optionalBrief,
});

export const updateTaskDetailsSchema = z.object({
  id,
  title,
  projectId: id,
  type: optionalShort,
  deadline: optionalIsoDate,
  priority,
  brief: optionalBrief,
});

export const updateEstimateSchema = z.object({ id, effortPoints, reason });
export const reassignSchema = z.object({ id, assigneeId: id, reason });
export const updateStampedRoleSchema = z.object({ id, stampedRoleId: id, reason });

export const transitionSchema = z.object({
  id,
  to: z.enum(["IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"]),
  reason,
});

export const deliverableSchema = z.object({
  taskId: id,
  label: z.string().trim().min(1, "Enter a label.").max(120),
  url: httpUrl,
});

export const commentSchema = z.object({
  taskId: id,
  body: z.string().trim().min(1, "Write a comment.").max(4000),
});

export const recordPastTaskSchema = createTaskSchema.extend({
  status: z.enum(["ASSIGNED", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"]),
  approvalDate: optionalIsoDate,
});
