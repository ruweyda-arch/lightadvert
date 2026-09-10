/**
 * Local Postgres for development without Docker — runs a real Postgres binary
 * (via `embedded-postgres`) as a subprocess, persisting data in `.pgdata/`.
 *
 *   pnpm db:dev            # start it (stays in the foreground; Ctrl+C to stop)
 *   pnpm db:dev stop       # stop a running cluster
 *
 * Point .env at it:
 *   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/lightadvert"
 *   DIRECT_URL="postgresql://postgres:postgres@localhost:5433/lightadvert"
 *
 * Then: pnpm db:deploy && pnpm db:seed
 */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import EmbeddedPostgres from "embedded-postgres";

const DATA_DIR = join(process.cwd(), ".pgdata");
const PORT = 5433;
const DB_NAME = "lightadvert";

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
});

async function start() {
  if (!existsSync(join(DATA_DIR, "PG_VERSION"))) {
    mkdirSync(DATA_DIR, { recursive: true });
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase(DB_NAME);
  } catch {
    // already exists
  }
  console.log(
    `\nPostgres ready:\n  postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}\n\nLeave this running. Ctrl+C to stop.`,
  );
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });
  // keep the process alive
  await new Promise(() => {});
}

async function stop() {
  await pg.start().catch(() => {});
  await pg.stop();
  console.log("Postgres stopped.");
}

await (process.argv[2] === "stop" ? stop() : start());
