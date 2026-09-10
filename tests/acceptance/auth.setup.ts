import { test as setup, type Page } from "@playwright/test";

import { ADMIN, ANN, PASSWORD } from "./fixture";

async function login(page: Page, email: string, statePath: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 30_000 });
  await page.context().storageState({ path: statePath });
}

setup("authenticate admin", async ({ page }) => {
  await login(page, ADMIN.email, "tests/acceptance/.auth/admin.json");
});

setup("authenticate ann", async ({ page }) => {
  await login(page, ANN.email, "tests/acceptance/.auth/ann.json");
});
