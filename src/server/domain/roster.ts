/**
 * Roster rules (docs/prd.md R11, CONTEXT.md "Role" / "Primary Role").
 * Pure — no DB. The action layer checks that the role ids actually exist.
 */
export class RosterRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RosterRuleError";
  }
}

/** A Staff Member holds one or more Roles. */
export function assertAtLeastOneRole(roleIds: readonly string[]): void {
  if (roleIds.length === 0) {
    throw new RosterRuleError("A staff member needs at least one role.");
  }
}

/** The Primary Role must be one the person holds. */
export function assertPrimaryAmongRoles(
  primaryRoleId: string,
  roleIds: readonly string[],
): void {
  if (!roleIds.includes(primaryRoleId)) {
    throw new RosterRuleError("The primary role must be one of the assigned roles.");
  }
}

export interface RoleSelection {
  roleIds: string[];
  primaryRoleId: string;
}

/** Dedupe role ids, validate the pair, return a normalized selection. */
export function normalizeRoleSelection(input: {
  roleIds: readonly string[];
  primaryRoleId: string;
}): RoleSelection {
  const roleIds = [...new Set(input.roleIds)];
  assertAtLeastOneRole(roleIds);
  assertPrimaryAmongRoles(input.primaryRoleId, roleIds);
  return { roleIds, primaryRoleId: input.primaryRoleId };
}
