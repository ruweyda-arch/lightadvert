/**
 * Idempotent seed. Creates the seven Roles, the first Admin (from env), and the
 * permanent "Internal / Ad-hoc" Project. See docs/prd.md R8.
 *
 * The Admin is created without a password; set one via the app's password-reset
 * flow (Resend must be configured), or a dedicated set-password script (TODO).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES = [
  "Content Creator",
  "Camera Operator",
  "Script Writer",
  "Voice Over Artist",
  "Video Editor",
  "Graphic Designer",
  "Motion Graphic Designer",
] as const;

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminName = process.env.SEED_ADMIN_NAME ?? "Light Advert Owner";
  if (!adminEmail) {
    throw new Error("SEED_ADMIN_EMAIL is required to seed the first Admin.");
  }

  for (const [i, name] of ROLES.entries()) {
    await prisma.role.upsert({
      where: { name },
      update: { orderIndex: i, isSeed: true },
      create: { name, orderIndex: i, isSeed: true },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", status: "ACTIVE", name: adminName },
    create: {
      email: adminEmail,
      name: adminName,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  const seededProject = await prisma.project.findFirst({ where: { isSeed: true } });
  if (!seededProject) {
    await prisma.project.create({
      data: {
        name: "Internal / Ad-hoc",
        isSeed: true,
        deadline: new Date("2100-01-01T00:00:00.000Z"),
        priority: "NORMAL",
        createdById: admin.id,
      },
    });
  }

  console.log(
    `Seeded ${ROLES.length} roles, admin <${adminEmail}>, and the Internal / Ad-hoc project.`,
  );
  console.log(
    "Next: set the admin password via the app's password-reset flow (Resend required).",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
