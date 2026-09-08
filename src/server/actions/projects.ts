"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";
import {
  createProjectSchema,
  setProjectStatusSchema,
  updateProjectSchema,
} from "@/server/validation/project";

import { fail, failFrom, ok, type ActionResult } from "./result";

const PATH = "/app/admin/projects";

function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input.";
}

function readFields(formData: FormData) {
  return {
    name: formData.get("name"),
    deadline: formData.get("deadline"),
    priority: formData.get("priority"),
    clientLabel: (formData.get("clientLabel") as string) || undefined,
    brief: (formData.get("brief") as string) || undefined,
  };
}

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export async function createProjectAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const input = createProjectSchema.parse(readFields(formData));
    await prisma.project.create({
      data: {
        name: input.name,
        deadline: toDate(input.deadline),
        priority: input.priority,
        clientLabel: input.clientLabel ?? null,
        brief: input.brief ?? null,
        createdById: session.user.id,
      },
    });
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function updateProjectAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const input = updateProjectSchema.parse({
      ...readFields(formData),
      id: formData.get("id"),
    });
    await prisma.project.update({
      where: { id: input.id },
      data: {
        name: input.name,
        deadline: toDate(input.deadline),
        priority: input.priority,
        clientLabel: input.clientLabel ?? null,
        brief: input.brief ?? null,
      },
    });
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function setProjectStatusAction(
  id: string,
  status: "ACTIVE" | "ARCHIVED",
): Promise<ActionResult> {
  await requireAdmin();
  try {
    setProjectStatusSchema.parse({ id, status });
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return fail("That project no longer exists.");
    if (project.isSeed && status === "ARCHIVED") {
      return fail("The Internal / Ad-hoc project cannot be archived.");
    }
    await prisma.project.update({ where: { id }, data: { status } });
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    return failFrom(err);
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });
    if (!project) return fail("That project no longer exists.");
    if (project.isSeed) return fail("The Internal / Ad-hoc project cannot be deleted.");
    if (project._count.tasks > 0) {
      return fail("This project has tasks — archive it instead (docs/prd.md R15).");
    }
    await prisma.project.delete({ where: { id } });
    revalidatePath(PATH);
    return ok();
  } catch (err) {
    return failFrom(err);
  }
}
