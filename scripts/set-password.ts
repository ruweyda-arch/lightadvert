/**
 * Stopgap: set (or reset) a user's password directly, so the first Admin can log
 * in before Resend is configured (docs/phase-1-plan.md M0 step 5).
 *
 *   pnpm tsx scripts/set-password.ts <email> <password>
 *
 * Once the reset-password email flow works, prefer that and delete this script.
 * If importing the auth module fails here, fall back to the reset flow.
 */
import { PrismaClient } from "@prisma/client";

import { auth } from "../src/server/auth";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] ?? process.env.SEED_ADMIN_EMAIL;
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: pnpm tsx scripts/set-password.ts <email> <password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters (docs/prd.md R4).");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user with email ${email}. Run \`pnpm db:seed\` first.`);

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);

  const existing = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { id: true },
  });

  if (existing) {
    await prisma.account.update({ where: { id: existing.id }, data: { password: hash } });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hash,
      },
    });
  }

  console.log(`Password set for ${email}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
