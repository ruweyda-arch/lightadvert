import { describe, expect, it } from "vitest";

import { assertReason, reasonRequiredFor } from "./audit";

describe("audit reason rules (docs/prd.md R44)", () => {
  it("requires a reason for the pay-affecting edits", () => {
    for (const e of [
      "ESTIMATE_CHANGED",
      "STAMPED_ROLE_CHANGED",
      "TASK_REASSIGNED",
      "PERIOD_UNLOCKED",
      "APPROVED_TASK_CANCELLED",
    ] as const) {
      expect(reasonRequiredFor(e)).toBe(true);
    }
  });

  it("does not require a reason for approval / lock / manual-record", () => {
    for (const e of [
      "TASK_APPROVED",
      "PERIOD_LOCKED",
      "TASK_MANUALLY_RECORDED",
    ] as const) {
      expect(reasonRequiredFor(e)).toBe(false);
    }
  });

  it("assertReason throws on missing/blank reason where required", () => {
    expect(() => assertReason("ESTIMATE_CHANGED", undefined)).toThrow();
    expect(() => assertReason("ESTIMATE_CHANGED", "")).toThrow();
    expect(() => assertReason("ESTIMATE_CHANGED", "   ")).toThrow();
    expect(() => assertReason("ESTIMATE_CHANGED", "fixed a typo")).not.toThrow();
  });

  it("assertReason passes when no reason is required", () => {
    expect(() => assertReason("TASK_APPROVED", undefined)).not.toThrow();
  });
});
