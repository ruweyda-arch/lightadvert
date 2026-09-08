import { prisma } from "./client";

export function listRoles() {
  return prisma.role.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      taskTypes: { orderBy: { label: "asc" } },
      _count: {
        select: { roleAssignments: true, stampedTasks: true, primaryOf: true },
      },
    },
  });
}

export type RoleWithCounts = Awaited<ReturnType<typeof listRoles>>[number];

export function getRole(id: string) {
  return prisma.role.findUnique({ where: { id } });
}

/** True when any Staff Member or Task references the Role (docs/prd.md R10). */
export async function roleIsReferenced(id: string): Promise<boolean> {
  const [assignments, stamped] = await Promise.all([
    prisma.roleAssignment.count({ where: { roleId: id } }),
    prisma.task.count({ where: { stampedRoleId: id } }),
  ]);
  return assignments > 0 || stamped > 0;
}

export async function nextRoleOrderIndex(): Promise<number> {
  const { _max } = await prisma.role.aggregate({ _max: { orderIndex: true } });
  return (_max.orderIndex ?? -1) + 1;
}
