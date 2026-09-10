import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

export const PASSWORD = "e2e-acceptance-pw-1";
export const ADMIN = { email: "admin@e2e.test", name: "E2E Admin" };
export const ANN = { email: "ann@e2e.test", name: "Ann Editor" };
export const BEN = { email: "ben@e2e.test", name: "Ben Designer" };

const ROLE_NAMES = [
  "Content Creator",
  "Camera Operator",
  "Script Writer",
  "Voice Over Artist",
  "Video Editor",
  "Graphic Designer",
  "Motion Graphic Designer",
];

export interface Fixture {
  roles: Record<string, string>;
  projectId: string;
  adminId: string;
  annId: string;
  benId: string;
  reviewTaskId: string; // Ann, REVIEW — A1
  inProgressTaskId: string; // Ann, IN_PROGRESS, 5 pts — A2
  janTaskId: string; // Ann, COMPLETED, approved 2026-01-15, 8 pts, stamped Video Editor — A3/A6
  febTaskId: string; // Ann, COMPLETED, approved 2026-02-02, 5 pts — A3/A4/A5/A7/A8
}

export async function seedFixture(prisma: PrismaClient): Promise<Fixture> {
  await prisma.auditEntry.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.task.deleteMany();
  await prisma.payPeriodLock.deleteMany();
  await prisma.roleAssignment.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.taskType.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  const roles: Record<string, string> = {};
  for (const [i, name] of ROLE_NAMES.entries()) {
    const r = await prisma.role.create({
      data: { name, orderIndex: i, isSeed: true },
    });
    roles[name] = r.id;
  }

  const password = await hashPassword(PASSWORD);
  async function makeUser(
    u: { email: string; name: string },
    role: "ADMIN" | "STAFF",
  ) {
    const user = await prisma.user.create({
      data: { email: u.email, name: u.name, role, status: "ACTIVE", emailVerified: true },
    });
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password,
      },
    });
    return user.id;
  }

  const adminId = await makeUser(ADMIN, "ADMIN");
  const annId = await makeUser(ANN, "STAFF");
  const benId = await makeUser(BEN, "STAFF");

  // Ann's *primary* is Content Creator, but she also holds Video Editor — so a
  // Video-Editor-stamped Task of hers must still show under Video Editor (A6).
  await prisma.staffProfile.create({
    data: {
      userId: annId,
      primaryRoleId: roles["Content Creator"],
      roleAssignments: {
        create: [
          { roleId: roles["Content Creator"] },
          { roleId: roles["Video Editor"] },
        ],
      },
    },
  });
  await prisma.staffProfile.create({
    data: {
      userId: benId,
      primaryRoleId: roles["Graphic Designer"],
      roleAssignments: { create: [{ roleId: roles["Graphic Designer"] }] },
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "E2E Project",
      deadline: new Date("2026-12-31T00:00:00Z"),
      priority: "NORMAL",
      createdById: adminId,
    },
  });

  const base = {
    projectId: project.id,
    assigneeId: annId,
    stampedRoleId: roles["Video Editor"],
    priority: "NORMAL" as const,
    createdById: adminId,
  };

  const reviewTask = await prisma.task.create({
    data: { ...base, title: "Review me", status: "REVIEW", effortPoints: 3 },
  });
  const inProgressTask = await prisma.task.create({
    data: { ...base, title: "In progress work", status: "IN_PROGRESS", effortPoints: 5 },
  });
  const janTask = await prisma.task.create({
    data: {
      ...base,
      title: "January work",
      status: "COMPLETED",
      effortPoints: 8,
      approvalDate: new Date("2026-01-15T09:00:00Z"),
      approvedById: adminId,
      manuallyRecorded: true,
    },
  });
  const febTask = await prisma.task.create({
    data: {
      ...base,
      title: "February work",
      status: "COMPLETED",
      effortPoints: 5,
      approvalDate: new Date("2026-02-02T09:00:00Z"),
      approvedById: adminId,
      manuallyRecorded: true,
    },
  });

  return {
    roles,
    projectId: project.id,
    adminId,
    annId,
    benId,
    reviewTaskId: reviewTask.id,
    inProgressTaskId: inProgressTask.id,
    janTaskId: janTask.id,
    febTaskId: febTask.id,
  };
}
