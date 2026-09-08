import type { LockWindow } from "@/server/domain/pay-period";

import { prisma } from "./client";

/** Active (not unlocked) Pay Period locks, for `isApprovalDateLocked`. */
export async function loadActiveLocks(): Promise<LockWindow[]> {
  const rows = await prisma.payPeriodLock.findMany({
    where: { unlockedAt: null },
    select: { startDate: true, endDate: true, unlockedAt: true },
  });
  return rows.map((r) => ({
    startDate: r.startDate,
    endDate: r.endDate,
    unlockedAt: r.unlockedAt,
  }));
}
