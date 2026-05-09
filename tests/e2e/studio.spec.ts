import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../test/fixtures/realdata/numeric-strings-project.json",
);

test("edits a step pattern and exposes repo/support links", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto("/meshtrack-studio/");

  await expect(
    page.getByRole("heading", { name: "Meshtrack Studio" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /star on github/i }),
  ).toHaveAttribute("href", "https://github.com/baditaflorin/meshtrack-studio");
  await expect(
    page.getByRole("link", { name: /support via paypal/i }),
  ).toHaveAttribute("href", "https://www.paypal.com/paypalme/florinbadita");

  const step = page.getByRole("button", { name: "Kick pulse step 2 off" });
  await step.click();
  await expect(
    page.getByRole("button", { name: "Kick pulse step 2 on" }),
  ).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("imports a messy real-data fixture and surfaces repairs", async ({
  page,
}) => {
  await page.goto("/meshtrack-studio/");

  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await expect(page.locator(".project-title input")).toHaveValue(
    "Sheet Import",
  );
  await expect(page.locator(".import-summary-line").nth(0)).toContainText(
    /confidence/i,
  );
  await expect(page.locator(".import-summary-line").nth(1)).toContainText(
    /compatibility repair/i,
  );
  await page.getByText("Import report").click();
  await expect(
    page.getByText(/Converted numeric-looking text into numbers/i),
  ).toBeVisible();
});
