import type { TaskStatus } from "@/server/domain/task-status";

import { prisma } from "./client";

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  stampedRoleId?: string;
}

export function listTasks(filters: TaskFilters = {}) {
  return prisma.task.findMany({
    where: {
      projectId: filters.projectId,
      assigneeId: filters.assigneeId,
      status: filters.status,
      stampedRoleId: filters.stampedRoleId,
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      project: { select: { name: true } },
      assignee: { select: { name: true } },
      stampedRole: { select: { name: true } },
      _count: { select: { deliverables: true, comments: true } },
    },
  });
}

export type TaskListRow = Awaited<ReturnType<typeof listTasks>>[number];

export function getTask(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, deadline: true, status: true } },
      assignee: { select: { id: true, name: true, email: true } },
      stampedRole: { select: { id: true, name: true } },
      approvedBy: { select: { name: true } },
      deliverables: {
        orderBy: { createdAt: "asc" },
        include: { createdBy: { select: { name: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
      auditEntries: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });
}

export type TaskDetail = NonNullable<Awaited<ReturnType<typeof getTask>>>;

/** Active projects for the assignment picker (docs/prd.md R13). */
export function assignableProjects() {
  return prisma.project.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ isSeed: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

/** Active Staff Members, with their Roles for the stamped-Role default + warning. */
export function assignableStaff() {
  return prisma.user.findMany({
    where: { role: "STAFF", status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      staffProfile: {
        select: {
          primaryRoleId: true,
          roleAssignments: { select: { roleId: true } },
        },
      },
    },
  });
}
