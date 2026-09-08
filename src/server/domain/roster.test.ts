import { describe, expect, it } from "vitest";

import {
  assertAtLeastOneRole,
  assertPrimaryAmongRoles,
  normalizeRoleSelection,
  RosterRuleError,
} from "./roster";

describe("roster rules", () => {
  it("requires at least one role", () => {
    expect(() => assertAtLeastOneRole([])).toThrow(RosterRuleError);
    expect(() => assertAtLeastOneRole(["r1"])).not.toThrow();
  });

  it("requires the primary role to be among the assigned roles", () => {
    expect(() => assertPrimaryAmongRoles("r9", ["r1", "r2"])).toThrow(RosterRuleError);
    expect(() => assertPrimaryAmongRoles("r2", ["r1", "r2"])).not.toThrow();
  });

  it("normalizes a valid selection, deduping ids", () => {
    expect(
      normalizeRoleSelection({ roleIds: ["r1", "r2", "r1"], primaryRoleId: "r2" }),
    ).toEqual({ roleIds: ["r1", "r2"], primaryRoleId: "r2" });
  });

  it("rejects a selection whose primary is not held", () => {
    expect(() =>
      normalizeRoleSelection({ roleIds: ["r1"], primaryRoleId: "r2" }),
    ).toThrow(RosterRuleError);
  });

  it("rejects an empty selection", () => {
    expect(() =>
      normalizeRoleSelection({ roleIds: [], primaryRoleId: "r1" }),
    ).toThrow(RosterRuleError);
  });
});
