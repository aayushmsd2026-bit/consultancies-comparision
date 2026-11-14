import { expect, test } from "@playwright/test";

test("home page opens in English", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("home page opens in Nepali", async ({ page }) => {
  await page.goto("/ne");
  await expect(page.locator("html")).toHaveAttribute("lang", "ne");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("जाँच्नुहोस्");
});

test("the bare address sends the visitor to a language", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(en|ne)$/);
});

for (const locale of ["en", "ne"]) {
  test(`styleguide fits the screen without sideways scrolling (${locale})`, async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    await page.goto(`/${locale}/styleguide`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    // No hydration or script errors.
    expect(problems).toEqual([]);
  });
}
