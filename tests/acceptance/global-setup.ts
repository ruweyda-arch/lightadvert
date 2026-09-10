import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";

import { seedFixture } from "./fixture";

/**
 * Migrates a disposable Postgres and seeds the acceptance fixture. Requires
 * E2E_DATABASE_URL — this suite is not meant to run without a throwaway DB
 * (CI provides one via a `postgres` service container). See docs/go-live.md.
 */
export default async function globalSetup() {
  const url = process.env.E2E_DATABASE_URL;
  if (!url) {
    throw new Error(
      "E2E_DATABASE_URL must point at a disposable Postgres for the acceptance suite.",
    );
  }

  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;
  execSync("pnpm prisma migrate deploy", { stdio: "inherit", env: process.env });

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const fixture = await seedFixture(prisma);
    writeFileSync(
      join(process.cwd(), "tests", "acceptance", ".fixture.json"),
      JSON.stringify(fixture, null, 2),
    );
  } finally {
    await prisma.$disconnect();
  }
}
