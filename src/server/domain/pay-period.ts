/**
 * Pay periods and locking (docs/prd.md R33–R35, docs/architecture.md §7.4).
 *
 * A Task's Contribution is credited to the period containing its Approval Date.
 * A locked period freezes `effortPoints` and `approvalDate` for every Task
 * approved within its window.
 */
import { eatMonthBounds } from "@/lib/dates";

export interface DateRange {
  /** inclusive */
  start: Date;
  /** exclusive */
  end: Date;
}

export interface LockWindow {
  startDate: Date;
  endDate: Date;
  unlockedAt: Date | null;
}

/** Calendar-month pay period (EAT) for a given instant — the default cadence. */
export function monthlyPeriodFor(instant: Date): DateRange {
  return eatMonthBounds(instant);
}

export function isInRange(instant: Date, range: DateRange): boolean {
  return instant.getTime() >= range.start.getTime() && instant.getTime() < range.end.getTime();
}

/**
 * Whether an approved Task with the given Approval Date sits inside any active
 * lock window. `endDate` is treated as an inclusive calendar day.
 */
export function isApprovalDateLocked(
  approvalDate: Date,
  locks: readonly LockWindow[],
): boolean {
  const t = approvalDate.getTime();
  return locks.some((lock) => {
    if (lock.unlockedAt) return false;
    const start = lock.startDate.getTime();
    const endInclusive = lock.endDate.getTime() + 24 * 60 * 60 * 1000;
    return t >= start && t < endInclusive;
  });
}
