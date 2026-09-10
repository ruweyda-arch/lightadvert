import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Fixture } from "./fixture";

/** The fixture ids written by global-setup, read by specs. */
export function fixture(): Fixture {
  return JSON.parse(
    readFileSync(join(process.cwd(), "tests", "acceptance", ".fixture.json"), "utf8"),
  ) as Fixture;
}
