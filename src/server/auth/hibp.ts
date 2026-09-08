import { createHash } from "node:crypto";

/**
 * Reject passwords that appear in the HaveIBeenPwned breach corpus (docs/prd.md
 * R4), using the k-anonymity range API — only the first 5 hex of the SHA-1 ever
 * leaves the server.
 *
 * Fails **open**: a network error or non-200 lets the password through.
 * Availability of sign-in beats strict enforcement here (docs/constraints.md §8).
 */
export class BreachedPasswordError extends Error {
  constructor() {
    super("This password has appeared in a known data breach. Choose a different one.");
    this.name = "BreachedPasswordError";
  }
}

export async function assertNotBreached(password: string): Promise<void> {
  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  let body: string;
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return;
    body = await res.text();
  } catch {
    return;
  }

  for (const line of body.split("\n")) {
    const [hashSuffix, countRaw] = line.trim().split(":");
    if (hashSuffix === suffix && Number(countRaw) > 0) {
      throw new BreachedPasswordError();
    }
  }
}
