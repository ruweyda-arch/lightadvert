import { expect, test } from "@playwright/test";

test("landing page links to staff sign in", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /internal work tracking/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: /staff sign in/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});
