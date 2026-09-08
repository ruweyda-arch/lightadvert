import { createHash } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { assertNotBreached, BreachedPasswordError } from "./hibp";

const PW = "correct horse battery staple";
const SHA1 = createHash("sha1").update(PW).digest("hex").toUpperCase();
const SUFFIX = SHA1.slice(5);

function mockRange(bodyLines: string[], ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      text: async () => bodyLines.join("\r\n"),
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("assertNotBreached", () => {
  it("throws when the suffix is present with a non-zero count", async () => {
    mockRange([`${SUFFIX}:42`, "00000000000000000000000000000000000:9"]);
    await expect(assertNotBreached(PW)).rejects.toBeInstanceOf(BreachedPasswordError);
  });

  it("passes when the suffix is absent", async () => {
    mockRange(["1111111111111111111111111111111111:5"]);
    await expect(assertNotBreached(PW)).resolves.toBeUndefined();
  });

  it("passes when the suffix is present but count is 0 (padding)", async () => {
    mockRange([`${SUFFIX}:0`]);
    await expect(assertNotBreached(PW)).resolves.toBeUndefined();
  });

  it("fails open on a non-200 response", async () => {
    mockRange(["whatever"], false);
    await expect(assertNotBreached(PW)).resolves.toBeUndefined();
  });

  it("fails open on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(assertNotBreached(PW)).resolves.toBeUndefined();
  });
});
