import { z } from "zod";

import { email, id, personName } from "./common";

const roleIds = z.array(id).min(1, "Pick at least one role.");

export const createStaffSchema = z.object({
  email,
  name: personName,
  roleIds,
  primaryRoleId: id,
});

export const updateStaffSchema = z.object({
  id,
  name: personName,
  roleIds,
  primaryRoleId: id,
});

export const setStaffStatusSchema = z.object({
  id,
  status: z.enum(["ACTIVE", "DEACTIVATED"]),
});

export const setStaffAccountRoleSchema = z.object({
  id,
  accountRole: z.enum(["ADMIN", "STAFF"]),
});
