"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/auth/guards";
import { assertNotLastActiveAdmin } from "@/server/auth/last-admin";
import { prisma } from "@/server/db/client";
import { emailInUse, getStaffUser } from "@/server/db/staff";
import { normalizeRoleSelection, RosterRuleError } from "@/server/domain/roster";
import {
  createStaffSchema,
  setStaffAccountRoleSchema,
  setStaffStatusSchema,
  updateStaffSchema,
} from "@/server/validation/staff";

import { fail, failFrom, ok, type ActionResult } from "./result";

const PATH = "/app/admin/staff";

function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input.";
}

async function assertRolesExist(roleIds: string[]): Promise<void> {
  const found = await prisma.role.count({ where: { id: { in: roleIds } } });
  if (found !== roleIds.length) {
    throw new RosterRuleError("One of the selected roles no longer exists.");
  }
}

async function sendSetPasswordEmail(email: string): Promise<void> {
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
      headers: await headers(),
    });
  } catch {
    // Non-fatal — an Admin can resend from the staff list.
  }
}

export async function createStaffAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const input = createStaffSchema.parse({
      email: formData.get("email"),
      name: formData.get("name"),
      roleIds: formData.getAll("roleIds"),
      primaryRoleId: formData.get("primaryRoleId"),
    });
    const selection = normalizeRoleSelection(input);
    await assertRolesExist(selection.roleIds);

    if (await emailInUse(input.email)) {
      return fail("An account with that email already exists.");
    }

    await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        role: "STAFF",
        status: "ACTIVE",
        staffProfile: {
          create: {
            primaryRoleId: selection.primaryRoleId,
            roleAssignments: { create: selection.roleIds.map((roleId) => ({ roleId })) },
          },
        },
      },
    });

    await sendSetPasswordEmail(input.email);
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    if (err instanceof RosterRuleError) return fail(err.message);
    return failFrom(err);
  }
}

export async function updateStaffAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const input = updateStaffSchema.parse({
      id: formData.get("id"),
      name: formData.get("name"),
      roleIds: formData.getAll("roleIds"),
      primaryRoleId: formData.get("primaryRoleId"),
    });
    const selection = normalizeRoleSelection(input);
    await assertRolesExist(selection.roleIds);

    const user = await getStaffUser(input.id);
    if (!user || user.role !== "STAFF") return fail("That staff member no longer exists.");

    await prisma.$transaction([
      prisma.user.update({ where: { id: input.id }, data: { name: input.name } }),
      prisma.roleAssignment.deleteMany({ where: { staffProfileId: input.id } }),
      prisma.staffProfile.update({
        where: { userId: input.id },
        data: {
          primaryRoleId: selection.primaryRoleId,
          roleAssignments: { create: selection.roleIds.map((roleId) => ({ roleId })) },
        },
      }),
    ]);

    revalidatePath(PATH);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    if (err instanceof RosterRuleError) return fail(err.message);
    return failFrom(err);
  }
}

export async function setStaffStatusAction(
  id: string,
  status: "ACTIVE" | "DEACTIVATED",
): Promise<ActionResult> {
  await requireAdmin();
  try {
    setStaffStatusSchema.parse({ id, status });
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return fail("That account no longer exists.");
    if (status === "DEACTIVATED" && user.role === "ADMIN") {
      await assertNotLastActiveAdmin(id);
    }
    await prisma.user.update({ where: { id }, data: { status } });
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    return failFrom(err);
  }
}

export async function setStaffAccountRoleAction(
  id: string,
  accountRole: "ADMIN" | "STAFF",
): Promise<ActionResult> {
  await requireAdmin();
  try {
    setStaffAccountRoleSchema.parse({ id, accountRole });
    const user = await getStaffUser(id);
    if (!user) return fail("That account no longer exists.");
    if (user.role === accountRole) return ok();

    if (accountRole === "STAFF") {
      // Demoting an Admin: they must already have staff roles to fall back to.
      if (!user.staffProfile || user.staffProfile.roleAssignments.length === 0) {
        return fail("This account has no staff roles, so it cannot be demoted to staff.");
      }
      await assertNotLastActiveAdmin(id);
    }

    await prisma.user.update({ where: { id }, data: { role: accountRole } });
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    return failFrom(err);
  }
}

export async function resendSetPasswordAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return fail("That account no longer exists.");
    await sendSetPasswordEmail(user.email);
    return ok();
  } catch (err) {
    return failFrom(err);
  }
}
