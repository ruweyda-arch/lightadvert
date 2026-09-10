import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { PASSWORD } from "./fixture";
import { fixture } from "./fixture-data";

const fx = fixture();

const estimateForm = (page: Page) =>
  page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Effort estimate" }) });

const reassignForm = (page: Page) =>
  page.locator("form").filter({ has: page.getByRole("heading", { name: "Reassign" }) });

const personTotal = (page: Page, name: string) =>
  page.locator("summary").filter({ hasText: name });

// ---------------------------------------------------------------------------

test.describe("acceptance — admin", () => {
  test.use({ storageState: "tests/acceptance/.auth/admin.json" });

  test("A2 — estimate edit needs a reason and produces an audit entry", async ({
    page,
  }) => {
    await page.goto(`/app/admin/tasks/${fx.inProgressTaskId}`);

    const est = estimateForm(page);
    await expect(est.locator('input[name="reason"]')).toBeVisible();
    await expect(est.locator('input[name="reason"]')).toHaveAttribute("required", "");

    await est.getByRole("combobox").selectOption("8");
    await est.locator('input[name="reason"]').fill("acceptance A2");
    await est.getByRole("button", { name: /update estimate/i }).click();
    await expect(page.getByText("Estimate updated.")).toBeVisible();

    await page.reload();
    await expect(page.getByText("ESTIMATE_CHANGED")).toBeVisible();
    await expect(page.getByText(/5 → 8/)).toBeVisible();
    await expect(page.getByText(/acceptance A2/)).toBeVisible();
  });

  test("A3 — a locked period freezes its tasks; later periods stay editable", async ({
    page,
  }) => {
    await page.goto("/app/admin/periods");
    const lockMonth = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Lock a month" }) });
    await lockMonth.locator('input[name="month"]').fill("2026-01");
    await lockMonth.getByRole("button", { name: /lock month/i }).click();
    await expect(page.getByText("Month locked.")).toBeVisible();

    // January task (approved 15 Jan) — edit refused.
    await page.goto(`/app/admin/tasks/${fx.janTaskId}`);
    await estimateForm(page).getByRole("combobox").selectOption("13");
    await estimateForm(page).locator('input[name="reason"]').fill("change locked");
    await estimateForm(page).getByRole("button", { name: /update estimate/i }).click();
    await expect(page.getByText(/locked pay period/i)).toBeVisible();

    // February task (approved 2 Feb) — edit allowed, then reverted.
    await page.goto(`/app/admin/tasks/${fx.febTaskId}`);
    await estimateForm(page).getByRole("combobox").selectOption("8");
    await estimateForm(page).locator('input[name="reason"]').fill("A3 edit");
    await estimateForm(page).getByRole("button", { name: /update estimate/i }).click();
    await expect(page.getByText("Estimate updated.")).toBeVisible();

    await page.reload();
    await estimateForm(page).getByRole("combobox").selectOption("5");
    await estimateForm(page).locator('input[name="reason"]').fill("A3 revert");
    await estimateForm(page).getByRole("button", { name: /update estimate/i }).click();
    await expect(page.getByText("Estimate updated.")).toBeVisible();
  });

  test("A4 — a task is credited to the pay period of its Approval Date", async ({
    page,
  }) => {
    await page.goto("/app/admin/reports?from=2026-02-01&to=2026-02-28");
    await personTotal(page, "Ann Editor").click();
    await expect(page.getByText("February work")).toBeVisible();
    await expect(page.getByText("January work")).toHaveCount(0);

    await page.goto("/app/admin/reports?from=2026-01-01&to=2026-01-31");
    await expect(personTotal(page, "Ann Editor")).toContainText("8 pts");
    await personTotal(page, "Ann Editor").click();
    await expect(page.getByText("January work")).toBeVisible();
    await expect(page.getByText("February work")).toHaveCount(0);
  });

  test("A5 — reassigning then approving credits the new assignee only", async ({
    page,
  }) => {
    await page.goto(`/app/admin/tasks/${fx.febTaskId}`);
    await reassignForm(page).getByRole("combobox").selectOption({ label: "Ben Designer" });
    await reassignForm(page).locator('input[name="reason"]').fill("acceptance A5");
    await reassignForm(page).getByRole("button", { name: /^reassign$/i }).click();
    await expect(page.getByText("Task reassigned.")).toBeVisible();

    await page.goto("/app/admin/reports?from=2026-02-01&to=2026-02-28");
    await expect(personTotal(page, "Ben Designer")).toContainText("5 pts");
    await expect(personTotal(page, "Ann Editor")).toContainText("0 pts");
  });

  test("A6 — the report filters by the Task's stamped Role, not the person's", async ({
    page,
  }) => {
    await page.goto(
      `/app/admin/reports?from=2026-01-01&to=2026-01-31&role=${fx.roles["Video Editor"]}`,
    );
    // Ann's primary is Content Creator, but her January task is stamped Video Editor.
    await expect(personTotal(page, "Ann Editor")).toContainText("8 pts");

    await page.goto(
      `/app/admin/reports?from=2026-01-01&to=2026-01-31&role=${fx.roles["Content Creator"]}`,
    );
    await expect(personTotal(page, "Ann Editor")).toContainText("0 pts");
  });

  test("A7 — CSV totals reconcile with the on-screen report", async ({ page }) => {
    await page.goto("/app/admin/reports?from=2026-01-01&to=2026-01-31");
    await expect(personTotal(page, "Ann Editor")).toContainText("8 pts");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: /download csv/i }).click(),
    ]);
    const csv = readFileSync(await download.path(), "utf8");
    expect(csv).toContain("Ann Editor,,,,8,TOTAL");
    expect(csv).toContain("Company,,,,8,GRAND TOTAL");
  });

  test("A8 — a deactivated staff member: no login, no assignment, still on reports", async ({
    page,
    browser,
  }) => {
    page.on("dialog", (d) => d.accept());

    await page.goto("/app/admin/staff");
    const benRow = page
      .locator("div")
      .filter({ hasText: "ben@e2e.test" })
      .filter({ has: page.getByRole("button", { name: "Deactivate" }) })
      .last();
    await benRow.getByRole("button", { name: "Deactivate" }).click();
    await expect(page.getByText("Status updated.")).toBeVisible();

    await page.goto("/app/admin/tasks");
    await expect(page.locator('select[name="assignee"]')).not.toContainText(
      "Ben Designer",
    );

    await page.goto("/app/admin/reports?from=2026-02-01&to=2026-02-28");
    await expect(personTotal(page, "Ben Designer")).toContainText("5 pts");

    const ctx = await browser.newContext();
    const fresh = await ctx.newPage();
    await fresh.goto("/login");
    await fresh.getByLabel("Email").fill("ben@e2e.test");
    await fresh.getByLabel("Password").fill(PASSWORD);
    await fresh.getByRole("button", { name: /^sign in$/i }).click();
    await fresh.waitForURL(/\/login/);
    await expect(fresh.getByText(/deactivated/i)).toBeVisible();
    await ctx.close();
  });
});

// ---------------------------------------------------------------------------

test.describe("acceptance — staff", () => {
  test.use({ storageState: "tests/acceptance/.auth/ann.json" });

  test("A1 — a staff member has no way to approve/complete a task", async ({ page }) => {
    await page.goto(`/app/tasks/${fx.reviewTaskId}`);
    await expect(page.getByText("REVIEW")).toBeVisible();
    await expect(page.getByRole("button", { name: /approve|complete/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^start$/i })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /submit for review/i }),
    ).toHaveCount(0);
  });
});
