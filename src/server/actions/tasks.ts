"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Session } from "@/server/auth";
import { requireAdmin, requireUser } from "@/server/auth/guards";
import { writeAudit } from "@/server/db/audit";
import { prisma } from "@/server/db/client";
import { loadActiveLocks } from "@/server/db/pay-period";
import { isApprovalDateLocked } from "@/server/domain/pay-period";
import { findTransition, type TaskStatus } from "@/server/domain/task-status";
import {
  commentSchema,
  createTaskSchema,
  deliverableSchema,
  reassignSchema,
  recordPastTaskSchema,
  transitionSchema,
  updateEstimateSchema,
  updateStampedRoleSchema,
  updateTaskDetailsSchema,
} from "@/server/validation/task";

import { fail, failFrom, ok, type ActionResult } from "./result";

const LIST = "/app/admin/tasks";
const detail = (id: string) => `/app/admin/tasks/${id}`;

function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input.";
}

function revalidateTask(id: string) {
  revalidatePath(LIST);
  revalidatePath(detail(id));
  revalidatePath("/app");
  revalidatePath("/app/admin/workload");
}

function resolveActor(
  session: Session,
  task: { assigneeId: string },
): "ADMIN" | "ASSIGNEE" | null {
  if (session.user.role === "ADMIN") return "ADMIN";
  if (task.assigneeId === session.user.id) return "ASSIGNEE";
  return null;
}

async function assertUnlocked(approvalDate: Date | null): Promise<void> {
  if (!approvalDate) return;
  const locks = await loadActiveLocks();
  if (isApprovalDateLocked(approvalDate, locks)) {
    throw new Error("This task falls in a locked pay period and cannot be changed.");
  }
}

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function readCreateFields(fd: FormData) {
  return {
    title: fd.get("title"),
    projectId: fd.get("projectId"),
    assigneeId: fd.get("assigneeId"),
    stampedRoleId: fd.get("stampedRoleId"),
    effortPoints: fd.get("effortPoints"),
    type: (fd.get("type") as string) || undefined,
    deadline: (fd.get("deadline") as string) || undefined,
    priority: fd.get("priority"),
    brief: (fd.get("brief") as string) || undefined,
  };
}

async function validateAssignmentTargets(input: {
  projectId: string;
  assigneeId: string;
  stampedRoleId: string;
}): Promise<ActionResult | null> {
  const [project, assignee, role] = await Promise.all([
    prisma.project.findUnique({ where: { id: input.projectId } }),
    prisma.user.findUnique({ where: { id: input.assigneeId } }),
    prisma.role.findUnique({ where: { id: input.stampedRoleId } }),
  ]);
  if (!project || project.status !== "ACTIVE") return fail("Pick an active project.");
  if (!assignee || assignee.role !== "STAFF" || assignee.status !== "ACTIVE") {
    return fail("Pick an active staff member.");
  }
  if (!role) return fail("That role no longer exists.");
  return null;
}

// ---------------------------------------------------------------------------
// 4a — create / assign
// ---------------------------------------------------------------------------

export async function createTaskAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const input = createTaskSchema.parse(readCreateFields(formData));
    const bad = await validateAssignmentTargets(input);
    if (bad) return bad;

    await prisma.task.create({
      data: {
        title: input.title,
        projectId: input.projectId,
        assigneeId: input.assigneeId,
        stampedRoleId: input.stampedRoleId,
        effortPoints: input.effortPoints,
        type: input.type ?? null,
        priority: input.priority,
        brief: input.brief ?? null,
        deadline: input.deadline ? toDate(input.deadline) : null,
        status: "ASSIGNED",
        createdById: session.user.id,
      },
    });
    revalidatePath(LIST);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

// ---------------------------------------------------------------------------
// 4c — lifecycle transitions
// ---------------------------------------------------------------------------

export async function transitionTaskAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUser();
  try {
    const { id, to, reason } = transitionSchema.parse({
      id: formData.get("id"),
      to: formData.get("to"),
      reason: formData.get("reason") ?? undefined,
    });
    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true, status: true, assigneeId: true, approvalDate: true },
    });
    if (!task) return fail("That task no longer exists.");

    const actor = resolveActor(session, task);
    if (!actor) return fail("You can only act on your own tasks.");

    const transition = findTransition(task.status as TaskStatus, to, actor);
    if (!transition) return fail("That status change isn't allowed from here.");

    if (to === "COMPLETED") {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id },
          data: {
            status: "COMPLETED",
            approvalDate: new Date(),
            approvedById: session.user.id,
          },
        });
        await writeAudit(tx, {
          eventType: "TASK_APPROVED",
          actorId: session.user.id,
          taskId: id,
          newValue: "COMPLETED",
        });
      });
    } else if (task.status === "COMPLETED" && to === "CANCELLED") {
      if (!reason?.trim()) return fail("A reason is required to cancel an approved task.");
      await assertUnlocked(task.approvalDate);
      await prisma.$transaction(async (tx) => {
        await tx.task.update({ where: { id }, data: { status: "CANCELLED" } });
        await writeAudit(tx, {
          eventType: "APPROVED_TASK_CANCELLED",
          actorId: session.user.id,
          taskId: id,
          oldValue: "COMPLETED",
          newValue: "CANCELLED",
          reason,
        });
      });
    } else {
      await prisma.task.update({ where: { id }, data: { status: to } });
    }

    revalidateTask(id);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

// ---------------------------------------------------------------------------
// 4d — edits
// ---------------------------------------------------------------------------

export async function updateTaskDetailsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const input = updateTaskDetailsSchema.parse({
      id: formData.get("id"),
      title: formData.get("title"),
      projectId: formData.get("projectId"),
      type: (formData.get("type") as string) || undefined,
      deadline: (formData.get("deadline") as string) || undefined,
      priority: formData.get("priority"),
      brief: (formData.get("brief") as string) || undefined,
    });
    const project = await prisma.project.findUnique({ where: { id: input.projectId } });
    if (!project || project.status !== "ACTIVE") return fail("Pick an active project.");

    await prisma.task.update({
      where: { id: input.id },
      data: {
        title: input.title,
        projectId: input.projectId,
        type: input.type ?? null,
        priority: input.priority,
        brief: input.brief ?? null,
        deadline: input.deadline ? toDate(input.deadline) : null,
      },
    });
    revalidateTask(input.id);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function updateEstimateAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const { id, effortPoints, reason } = updateEstimateSchema.parse({
      id: formData.get("id"),
      effortPoints: formData.get("effortPoints"),
      reason: formData.get("reason") ?? undefined,
    });
    const task = await prisma.task.findUnique({
      where: { id },
      select: { status: true, effortPoints: true, approvalDate: true },
    });
    if (!task) return fail("That task no longer exists.");
    if (task.effortPoints === effortPoints) return ok();

    const audited = task.status !== "ASSIGNED";
    if (audited && !reason?.trim()) {
      return fail("A reason is required to change the estimate after the task has started.");
    }
    if (audited) await assertUnlocked(task.approvalDate);

    if (audited) {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({ where: { id }, data: { effortPoints } });
        await writeAudit(tx, {
          eventType: "ESTIMATE_CHANGED",
          actorId: session.user.id,
          taskId: id,
          field: "effortPoints",
          oldValue: String(task.effortPoints),
          newValue: String(effortPoints),
          reason,
        });
      });
    } else {
      await prisma.task.update({ where: { id }, data: { effortPoints } });
    }
    revalidateTask(id);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function reassignTaskAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const { id, assigneeId, reason } = reassignSchema.parse({
      id: formData.get("id"),
      assigneeId: formData.get("assigneeId"),
      reason: formData.get("reason") ?? undefined,
    });
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        status: true,
        approvalDate: true,
        assigneeId: true,
        assignee: { select: { name: true } },
      },
    });
    if (!task) return fail("That task no longer exists.");
    if (task.assigneeId === assigneeId) return ok();

    const next = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!next || next.role !== "STAFF" || next.status !== "ACTIVE") {
      return fail("Pick an active staff member.");
    }

    const audited = task.status !== "ASSIGNED";
    if (audited && !reason?.trim()) {
      return fail("A reason is required to reassign a task after it has started.");
    }
    if (audited) await assertUnlocked(task.approvalDate);

    if (audited) {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({ where: { id }, data: { assigneeId } });
        await writeAudit(tx, {
          eventType: "TASK_REASSIGNED",
          actorId: session.user.id,
          taskId: id,
          field: "assigneeId",
          oldValue: task.assignee.name,
          newValue: next.name,
          reason,
        });
      });
    } else {
      await prisma.task.update({ where: { id }, data: { assigneeId } });
    }
    revalidateTask(id);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function updateStampedRoleAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const { id, stampedRoleId, reason } = updateStampedRoleSchema.parse({
      id: formData.get("id"),
      stampedRoleId: formData.get("stampedRoleId"),
      reason: formData.get("reason") ?? undefined,
    });
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        status: true,
        approvalDate: true,
        stampedRoleId: true,
        stampedRole: { select: { name: true } },
      },
    });
    if (!task) return fail("That task no longer exists.");
    if (task.stampedRoleId === stampedRoleId) return ok();

    const nextRole = await prisma.role.findUnique({ where: { id: stampedRoleId } });
    if (!nextRole) return fail("That role no longer exists.");

    const audited = task.status !== "ASSIGNED";
    if (audited && !reason?.trim()) {
      return fail("A reason is required to change the stamped role after the task has started.");
    }
    if (audited) await assertUnlocked(task.approvalDate);

    if (audited) {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({ where: { id }, data: { stampedRoleId } });
        await writeAudit(tx, {
          eventType: "STAMPED_ROLE_CHANGED",
          actorId: session.user.id,
          taskId: id,
          field: "stampedRoleId",
          oldValue: task.stampedRole.name,
          newValue: nextRole.name,
          reason,
        });
      });
    } else {
      await prisma.task.update({ where: { id }, data: { stampedRoleId } });
    }
    revalidateTask(id);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

// ---------------------------------------------------------------------------
// 4e — deliverables · 4f — comments
// ---------------------------------------------------------------------------

async function loadTaskForParticipant(session: Session, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, assigneeId: true },
  });
  if (!task) return { error: fail("That task no longer exists.") as ActionResult };
  if (!resolveActor(session, task)) {
    return { error: fail("You can only act on your own tasks.") as ActionResult };
  }
  return { task };
}

export async function addDeliverableAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUser();
  try {
    const { taskId, label, url } = deliverableSchema.parse({
      taskId: formData.get("taskId"),
      label: formData.get("label"),
      url: formData.get("url"),
    });
    const { error } = await loadTaskForParticipant(session, taskId);
    if (error) return error;

    await prisma.deliverable.create({
      data: { taskId, label, url, createdById: session.user.id },
    });
    revalidateTask(taskId);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function removeDeliverableAction(deliverableId: string): Promise<ActionResult> {
  const session = await requireUser();
  try {
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
      select: { taskId: true, task: { select: { assigneeId: true } } },
    });
    if (!deliverable) return fail("That deliverable no longer exists.");
    if (!resolveActor(session, deliverable.task)) {
      return fail("You can only act on your own tasks.");
    }
    await prisma.deliverable.delete({ where: { id: deliverableId } });
    revalidateTask(deliverable.taskId);
    return ok();
  } catch (err) {
    return failFrom(err);
  }
}

export async function addCommentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUser();
  try {
    const { taskId, body } = commentSchema.parse({
      taskId: formData.get("taskId"),
      body: formData.get("body"),
    });
    const { error } = await loadTaskForParticipant(session, taskId);
    if (error) return error;

    await prisma.comment.create({
      data: { taskId, body, authorId: session.user.id },
    });
    revalidateTask(taskId);
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

// ---------------------------------------------------------------------------
// 4g — backfill · 4h — delete
// ---------------------------------------------------------------------------

export async function recordPastTaskAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const input = recordPastTaskSchema.parse({
      ...readCreateFields(formData),
      status: formData.get("status"),
      approvalDate: (formData.get("approvalDate") as string) || undefined,
    });
    const bad = await validateAssignmentTargets(input);
    if (bad) return bad;

    const completed = input.status === "COMPLETED";
    if (completed && !input.approvalDate) {
      return fail("A completed backfill task needs an approval date.");
    }

    const approvalDate = input.approvalDate ? toDate(input.approvalDate) : null;
    if (approvalDate) {
      const locks = await loadActiveLocks();
      if (isApprovalDateLocked(approvalDate, locks)) {
        return fail("That approval date is inside a locked pay period.");
      }
    }

    await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: input.title,
          projectId: input.projectId,
          assigneeId: input.assigneeId,
          stampedRoleId: input.stampedRoleId,
          effortPoints: input.effortPoints,
          type: input.type ?? null,
          priority: input.priority,
          brief: input.brief ?? null,
          deadline: input.deadline ? toDate(input.deadline) : null,
          status: input.status,
          approvalDate,
          approvedById: completed ? session.user.id : null,
          manuallyRecorded: true,
          createdById: session.user.id,
        },
      });
      await writeAudit(tx, {
        eventType: "TASK_MANUALLY_RECORDED",
        actorId: session.user.id,
        taskId: task.id,
        newValue: `${input.status}${approvalDate ? ` @ ${input.approvalDate}` : ""} · ${input.effortPoints} pts`,
      });
    });

    revalidatePath(LIST);
    revalidatePath("/app/admin/reports");
    return ok();
  } catch (err) {
    if (err instanceof z.ZodError) return fail(firstIssue(err));
    return failFrom(err);
  }
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });
    if (!task) return fail("That task no longer exists.");
    if (!["ASSIGNED", "IN_PROGRESS", "REVIEW"].includes(task.status)) {
      return fail("A completed or cancelled task can't be deleted — cancel it instead.");
    }
    await prisma.task.delete({ where: { id: taskId } });
    revalidatePath(LIST);
    return ok();
  } catch (err) {
    return failFrom(err);
  }
}
