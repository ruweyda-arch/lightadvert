"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/server/auth/guards";
import { writeAudit } from "@/server/db/audit";
import { prisma } from "@/server/db/client";
import { findOverlappingActiveLock } from "@/server/db/pay-period";
import {
  lockMonthSchema,
  lockRangeSchema,
  unlockSchema,
} from "@/server/validation/pay-period";

import { fail, failFrom, ok, type ActionResult } from "./result";

const PATH = "/app/admin/periods";

function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input.";
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthBoundsCalendar(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 0)),
  };
}

async function createLock(
  startDate: Date,
  endDate: Date,
  actorId: string,
): Promise<ActionResult> {
  if (endDate.getTime() < startDate.getTime()) {
    return fail("The end date is before the start date.");
  }
  if (await findOverlappingActiveLock(startDate, endDate)) {
    return fail("An active lock already overlaps that range.");
  }

  await prisma.$transaction(async (tx) => {
    const row = await tx.payPeriodLock.create({
      data: { startDate, endDate, lockedById: actorId },
    });
    await writeAudit(tx, {
      eventType: "PERIOD_LOCKED",
      actorId,
      periodLockId: row.id,
      newValue: `${iso(startDate)} … ${iso(endDate)}`,
    });
  });

  revalidatePath(PATH);
  revalidatePath("/app/admin/reports");
  return ok();
}

export async function lockMonthAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const { month } = lockMonthSchema.parse({ month: formData.get("month") });
    const { start, end } = monthBoundsCalendar(month);
    return await createLock(start, end, session.user.id);
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function lockRangeAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const { from, to } = lockRangeSchema.parse({
      from: formData.get("from"),
      to: formData.get("to"),
    });
    return await createLock(
      new Date(`${from}T00:00:00.000Z`),
      new Date(`${to}T00:00:00.000Z`),
      session.user.id,
    );
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function unlockAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const { id, reason } = unlockSchema.parse({
      id: formData.get("id"),
      reason: formData.get("reason"),
    });
    const existing = await prisma.payPeriodLock.findUnique({ where: { id } });
    if (!existing) return fail("That lock no longer exists.");
    if (existing.unlockedAt) return fail("That period is already unlocked.");

    await prisma.$transaction(async (tx) => {
      await tx.payPeriodLock.update({
        where: { id },
        data: {
          unlockedAt: new Date(),
          unlockedById: session.user.id,
          unlockReason: reason,
        },
      });
      await writeAudit(tx, {
        eventType: "PERIOD_UNLOCKED",
        actorId: session.user.id,
        periodLockId: id,
        reason,
      });
    });

    revalidatePath(PATH);
    revalidatePath("/app/admin/reports");
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}
