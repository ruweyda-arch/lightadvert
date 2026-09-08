import type { ApprovedTaskRow, RosterEntry } from "@/server/domain/contribution";

import { prisma } from "./client";

/**
 * Approved-complete Tasks bucketed by Approval Date into [start, end)
 * (docs/prd.md R29, R36). `stampedRoleId` filters by the Role stamped on the
 * Task, not the person's profile.
 */
export async function getApprovedTaskRows(
  start: Date,
  end: Date,
  stampedRoleId?: string,
): Promise<ApprovedTaskRow[]> {
  const tasks = await prisma.task.findMany({
    where: {
      status: "COMPLETED",
      approvalDate: { gte: start, lt: end },
      stampedRoleId: stampedRoleId || undefined,
    },
    orderBy: { approvalDate: "asc" },
    select: {
      id: true,
      title: true,
      effortPoints: true,
      approvalDate: true,
      assignee: { select: { id: true, name: true } },
      stampedRole: { select: { id: true, name: true } },
      project: { select: { name: true } },
    },
  });

  return tasks.map((t) => ({
    taskId: t.id,
    assigneeId: t.assignee.id,
    assigneeName: t.assignee.name,
    stampedRoleId: t.stampedRole.id,
    stampedRoleName: t.stampedRole.name,
    projectName: t.project.name,
    taskTitle: t.title,
    effortPoints: t.effortPoints,
    approvalDate: t.approvalDate as Date,
  }));
}

/** Active Staff Members. Off-roster assignees with history are added by summarise(). */
export async function getRoster(): Promise<RosterEntry[]> {
  const users = await prisma.user.findMany({
    where: { role: "STAFF", status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return users.map((u) => ({ userId: u.id, name: u.name }));
}

/** Every approved Task for one person, newest first (per-person history, R41). */
export function getPersonApprovedTasks(userId: string) {
  return prisma.task.findMany({
    where: { assigneeId: userId, status: "COMPLETED" },
    orderBy: { approvalDate: "desc" },
    select: {
      id: true,
      title: true,
      effortPoints: true,
      approvalDate: true,
      stampedRole: { select: { name: true } },
      project: { select: { name: true } },
    },
  });
}
