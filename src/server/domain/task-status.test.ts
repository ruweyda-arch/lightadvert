import { describe, expect, it } from "vitest";

import { canTransition, findTransition } from "./task-status";

describe("task status transitions", () => {
  it("lets only the assignee submit for review (R22)", () => {
    expect(canTransition("IN_PROGRESS", "REVIEW", "ASSIGNEE")).toBe(true);
    expect(canTransition("IN_PROGRESS", "REVIEW", "ADMIN")).toBe(false);
  });

  it("lets only an Admin approve, never the assignee (no self-completion — A1)", () => {
    expect(canTransition("REVIEW", "COMPLETED", "ADMIN")).toBe(true);
    expect(canTransition("REVIEW", "COMPLETED", "ASSIGNEE")).toBe(false);
  });

  it("allows an informal hand-back from Review with no reason", () => {
    const t = findTransition("REVIEW", "IN_PROGRESS", "ADMIN");
    expect(t).not.toBeNull();
    expect(t?.reasonRequired).toBeFalsy();
  });

  it("only lets a Completed Task leave via a reason-required cancel (R26, R44)", () => {
    const t = findTransition("COMPLETED", "CANCELLED", "ADMIN");
    expect(t?.reasonRequired).toBe(true);
    expect(canTransition("COMPLETED", "IN_PROGRESS", "ADMIN")).toBe(false);
  });

  it("treats Cancelled as terminal", () => {
    expect(canTransition("CANCELLED", "IN_PROGRESS", "ADMIN")).toBe(false);
    expect(canTransition("CANCELLED", "ASSIGNED", "ADMIN")).toBe(false);
  });
});
