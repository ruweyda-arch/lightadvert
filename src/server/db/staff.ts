import { prisma } from "./client";

const staffInclude = {
  staffProfile: {
    include: {
      primaryRole: true,
      roleAssignments: { include: { role: true } },
    },
  },
} as const;

/** Every Staff Member (role STAFF), deactivated ones last. */
export function listStaff() {
  return prisma.user.findMany({
    where: { role: "STAFF" },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: staffInclude,
  });
}

export type StaffRow = Awaited<ReturnType<typeof listStaff>>[number];

export function listAdmins() {
  return prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export function getStaffUser(id: string) {
  return prisma.user.findUnique({ where: { id }, include: staffInclude });
}

export function emailInUse(email: string) {
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}
