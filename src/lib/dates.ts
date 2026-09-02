/**
 * Company time is Africa/Nairobi (EAT, UTC+3, no DST — a constant offset).
 * All "which calendar month" logic is computed in EAT. See docs/constraints.md §1.
 */
export const COMPANY_TZ = "Africa/Nairobi";
export const COMPANY_UTC_OFFSET_MINUTES = 180;

const OFFSET_MS = COMPANY_UTC_OFFSET_MINUTES * 60_000;

/**
 * The [start, end) UTC instants bounding the EAT calendar month that contains
 * `instant`. `end` is the first instant of the next month, so a range check is
 * `start <= x && x < end`.
 */
export function eatMonthBounds(instant: Date): { start: Date; end: Date } {
  const asEat = new Date(instant.getTime() + OFFSET_MS);
  const year = asEat.getUTCFullYear();
  const month = asEat.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1) - OFFSET_MS),
    end: new Date(Date.UTC(year, month + 1, 1) - OFFSET_MS),
  };
}

export function currentEatMonthBounds(now: Date = new Date()) {
  return eatMonthBounds(now);
}

/** Format an instant as `DD Mon YYYY` in company time. */
export function formatEatDate(instant: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: COMPANY_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(instant);
}
