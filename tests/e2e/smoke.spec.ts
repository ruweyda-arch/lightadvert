import { expect, test } from "@playwright/test";

// Smoke only. Real acceptance coverage (A1–A8) lands in Milestone 9 with a
// seeded database. The generous timeouts absorb Next's on-demand dev compile.

test("landing page links to staff sign in", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /internal work tracking/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: /staff sign in/i }).click();
  await page.waitForURL(/\/login/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /^sign in$/i })).toBeVisible();
});

test("forgot-password page renders its form", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
});

test("reset-password with no token shows the link-problem message", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByRole("heading", { name: /link problem/i })).toBeVisible();
});
