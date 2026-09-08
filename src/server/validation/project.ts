import { z } from "zod";

import { id, shortText } from "./common";

export const PROJECT_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

const priority = z.enum(PROJECT_PRIORITIES);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a deadline.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "That text is too long.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const createProjectSchema = z.object({
  name: shortText("a project name", 120),
  deadline: isoDate,
  priority,
  clientLabel: optionalText(120),
  brief: optionalText(2000),
});

export const updateProjectSchema = createProjectSchema.extend({ id });

export const setProjectStatusSchema = z.object({
  id,
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

export type ProjectPriority = z.infer<typeof priority>;
