import { describe, expect, it } from "vitest";

import { isApprovalDateLocked, isInRange, monthlyPeriodFor } from "./pay-period";

const janLock = {
  startDate: new Date("2026-01-01T00:00:00Z"),
  endDate: new Date("2026-01-31T00:00:00Z"),
  unlockedAt: null as Date | null,
};

describe("isApprovalDateLocked (docs/prd.md R34)", () => {
  it("is true for an approval inside the locked window", () => {
    expect(isApprovalDateLocked(new Date("2026-01-15T09:00:00Z"), [janLock])).toBe(true);
  });

  it("treats the end date as an inclusive calendar day", () => {
    expect(isApprovalDateLocked(new Date("2026-01-31T23:59:00Z"), [janLock])).toBe(true);
    expect(isApprovalDateLocked(new Date("2026-02-01T00:30:00Z"), [janLock])).toBe(false);
  });

  it("is false before the window", () => {
    expect(isApprovalDateLocked(new Date("2025-12-31T23:00:00Z"), [janLock])).toBe(false);
  });

  it("ignores a lock that has been unlocked", () => {
    expect(
      isApprovalDateLocked(new Date("2026-01-15T09:00:00Z"), [
        { ...janLock, unlockedAt: new Date("2026-02-02T00:00:00Z") },
      ]),
    ).toBe(false);
  });
});

describe("monthlyPeriodFor / isInRange (EAT)", () => {
  it("brackets the EAT calendar month", () => {
    const range = monthlyPeriodFor(new Date("2026-03-10T12:00:00Z"));
    // 2026-02-28T21:00Z is 2026-03-01T00:00 in EAT (UTC+3) — the month's start.
    expect(isInRange(new Date("2026-03-01T00:00:00Z"), range)).toBe(true);
    expect(isInRange(new Date("2026-03-31T20:59:00Z"), range)).toBe(true);
    expect(isInRange(new Date("2026-02-28T20:30:00Z"), range)).toBe(false);
    expect(isInRange(new Date("2026-03-31T21:30:00Z"), range)).toBe(false);
  });
});
