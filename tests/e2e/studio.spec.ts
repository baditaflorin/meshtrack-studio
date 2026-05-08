import { expect, test } from "@playwright/test";

test("edits a step pattern and exposes repo/support links", async ({
  page,
}) => {
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
});
