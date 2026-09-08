import { z } from "zod";

import { id, shortText } from "./common";

export const createRoleSchema = z.object({ name: shortText("a role name") });

export const renameRoleSchema = z.object({ id, name: shortText("a role name") });

export const addTaskTypeSchema = z.object({
  roleId: id,
  label: shortText("a task-type label"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
