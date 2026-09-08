import { z } from "zod";

export const id = z.string().min(1);

export const shortText = (label: string, max = 60) =>
  z.string().trim().min(1, `Enter ${label}.`).max(max, `${label} is too long.`);

export const personName = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(120, "Name is too long.");

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Enter a valid email address.");
