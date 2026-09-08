"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";
import { nextRoleOrderIndex, roleIsReferenced } from "@/server/db/role";
import {
  addTaskTypeSchema,
  createRoleSchema,
  renameRoleSchema,
} from "@/server/validation/role";

import { fail, failFrom, ok, type ActionResult } from "./result";

const PATH = "/app/admin/roles";

function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input.";
}

export async function createRoleAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const { name } = createRoleSchema.parse({ name: formData.get("name") });
    if (await prisma.role.findUnique({ where: { name } })) {
      return fail("A role with that name already exists.");
    }
    await prisma.role.create({
      data: { name, orderIndex: await nextRoleOrderIndex() },
    });
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function renameRoleAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const { id, name } = renameRoleSchema.parse({
      id: formData.get("id"),
      name: formData.get("name"),
    });
    const clash = await prisma.role.findUnique({ where: { name } });
    if (clash && clash.id !== id) return fail("Another role already has that name.");
    await prisma.role.update({ where: { id }, data: { name } });
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function deleteRoleAction(roleId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return fail("That role no longer exists.");
    if (role.isSeed) return fail("Seed roles cannot be deleted.");
    if (await roleIsReferenced(roleId)) {
      return fail("This role is in use by staff or tasks and cannot be deleted.");
    }
    await prisma.$transaction([
      prisma.taskType.deleteMany({ where: { roleId } }),
      prisma.role.delete({ where: { id: roleId } }),
    ]);
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    return failFrom(err);
  }
}

export async function reorderRoleAction(
  roleId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const roles = await prisma.role.findMany({
      orderBy: { orderIndex: "asc" },
      select: { id: true, orderIndex: true },
    });
    const i = roles.findIndex((r) => r.id === roleId);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= roles.length) return ok();
    await prisma.$transaction([
      prisma.role.update({
        where: { id: roles[i].id },
        data: { orderIndex: roles[j].orderIndex },
      }),
      prisma.role.update({
        where: { id: roles[j].id },
        data: { orderIndex: roles[i].orderIndex },
      }),
    ]);
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    return failFrom(err);
  }
}

export async function addTaskTypeAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const { roleId, label } = addTaskTypeSchema.parse({
      roleId: formData.get("roleId"),
      label: formData.get("label"),
    });
    const existing = await prisma.taskType.findUnique({
      where: { roleId_label: { roleId, label } },
    });
    if (existing) return fail("That task type already exists for this role.");
    await prisma.taskType.create({ data: { roleId, label } });
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function removeTaskTypeAction(taskTypeId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.taskType.delete({ where: { id: taskTypeId } });
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    return failFrom(err);
  }
}
