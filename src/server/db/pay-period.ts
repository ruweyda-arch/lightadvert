import { dbDateToEatStartUtc } from "@/lib/dates";
import type { LockWindow } from "@/server/domain/pay-period";

import { prisma } from "./client";

const DAY_MS = 86_400_000;

/**
 * Active (not unlocked) Pay Period locks as half-open UTC windows, so the lock
 * check lines up exactly with EAT month boundaries used by the Contribution
 * Report. Stored `startDate`/`endDate` are inclusive EAT calendar dates.
 */
export async function loadActiveLocks(): Promise<LockWindow[]> {
  const rows = await prisma.payPeriodLock.findMany({
    where: { unlockedAt: null },
    select: { startDate: true, endDate: true },
  });
  return rows.map((r) => ({
    start: dbDateToEatStartUtc(r.startDate),
    end: new Date(dbDateToEatStartUtc(r.endDate).getTime() + DAY_MS),
    unlockedAt: null,
  }));
}

export function listLocks() {
  return prisma.payPeriodLock.findMany({
    orderBy: [{ startDate: "desc" }, { lockedAt: "desc" }],
    include: {
      lockedBy: { select: { name: true } },
      unlockedBy: { select: { name: true } },
    },
  });
}

export type PayPeriodLockRow = Awaited<ReturnType<typeof listLocks>>[number];

/** An overlapping active lock, if one exists (inclusive EAT calendar dates). */
export function findOverlappingActiveLock(startDate: Date, endDate: Date) {
  return prisma.payPeriodLock.findFirst({
    where: {
      unlockedAt: null,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
}
