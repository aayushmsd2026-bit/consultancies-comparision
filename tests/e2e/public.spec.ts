import { expect, test, type Page } from "@playwright/test";

/**
 * The public pages, tested against the fictional demo data (supabase/seed.sql).
 * Start the local database first: npm run db:start
 */

async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "the page must not scroll sideways").toBeLessThanOrEqual(0);
}

test("flow 1: search on the home page leads to a profile with its registration status", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check before you pay.");

  // Two taps from the home page: type, then pick a suggestion.
  const search = page.getByRole("main").getByRole("combobox", { name: "Search a consultancy" });
  await search.fill("exampel"); // a typo on purpose
  const option = page.getByRole("option", { name: /Example Education/ });
  await expect(option).toBeVisible();
  await expect(option).toContainText("Registered");
  await option.click();

  await expect(page).toHaveURL(/\/en\/consultancies\/example-education$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Example Education Pvt. Ltd.");
  await expect(page).toHaveTitle(/Example Education Pvt\. Ltd\. reviews, fees and registration status/);

  // The registration badge comes first, then the score.
  const badge = page.getByText("This consultancy is on the Ministry of Education list.");
  const score = page.getByRole("img", { name: /out of 5/ }).first();
  await expect(badge).toBeVisible();
  await expect(score).toBeVisible();
  const badgeY = (await badge.boundingBox())!.y;
  const scoreY = (await score.boundingBox())!.y;
  expect(badgeY).toBeLessThan(scoreY);

  await expect(page.getByText("Demo data. Not real reviews.")).toBeVisible();
  await expectNoSidewaysScroll(page);
});

test("search works with the keyboard only", async ({ page }) => {
  await page.goto("/en");
  const search = page.getByRole("main").getByRole("combobox", { name: "Search a consultancy" });
  await search.fill("demo visa");
  await expect(page.getByRole("option").first()).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/en\/consultancies\/demo-visa-guide$/);
});

test("the profile never shows an empty score", async ({ page }) => {
  await page.goto("/en/consultancies/pretend-abroad-services");
  await expect(page.getByRole("heading", { name: "Not enough reviews yet" })).toBeVisible();
  await expect(page.getByRole("img", { name: /out of 5/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Write the first review" })).toBeVisible();
});

test("profile reviews can be filtered", async ({ page }) => {
  await page.goto("/en/consultancies/example-education");
  const list = page.locator("section", { has: page.getByRole("heading", { name: "Reviews", exact: true }) });
  await expect(list.getByRole("article").first()).toBeVisible();
  await list.getByRole("button", { name: "Verified only" }).click();
  await expect(list.getByRole("button", { name: "Verified only" })).toHaveAttribute("aria-pressed", "true");
  for (const card of await list.getByRole("article").all()) {
    await expect(card.getByText("Verified student")).toBeVisible();
  }
});

test("an unknown consultancy shows the not-found page", async ({ page }) => {
  await page.goto("/en/consultancies/this-does-not-exist");
  await expect(page.getByRole("heading", { name: "This page does not exist" })).toBeVisible();
});

test("the directory filters by country and registration", async ({ page }) => {
  await page.goto("/en/consultancies");
  await expect(page.getByText("12 consultancies")).toBeVisible();

  await page.getByLabel("Country").selectOption("JP");
  await expect(page).toHaveURL(/country=JP/);
  await expect(page.getByText("3 consultancies")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fictional Futures Consultancy" })).toBeVisible();

  await page.getByRole("button", { name: "Registered only" }).click();
  await expect(page).toHaveURL(/registered=1/);
  await expect(page.getByRole("heading", { name: "Sample Study Abroad Centre" })).toBeVisible();
  await expectNoSidewaysScroll(page);
});

test("the registration checker gives one clear answer", async ({ page }) => {
  await page.goto("/en/check");
  await page.getByLabel("Consultancy name").fill("made-up scholars");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page).toHaveURL(/q=made-up(\+|%20)scholars/);
  await expect(page.getByText("Made-up Scholars Hub")).toBeVisible();
  await expect(page.getByText("Not on the list").first()).toBeVisible();

  await page.goto("/en/check?q=zzzzqqq");
  await expect(page.getByText("Not found on our list")).toBeVisible();
});

test("compare puts consultancies side by side", async ({ page }) => {
  await page.goto("/en/compare?c=example-education,made-up-scholars");
  await expect(page.getByRole("columnheader", { name: /Example Education/ })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /Made-up Scholars Hub/ })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "Overall score" })).toBeVisible();
  await expect(page.getByText("Best in this row").first()).toBeAttached();
  await expectNoSidewaysScroll(page);

  await page.getByRole("link", { name: "Remove Made-up Scholars Hub" }).click();
  await expect(page).toHaveURL(/c=example-education$/);
});

test("Nepali pages show Nepali names, digits and dates", async ({ page }) => {
  await page.goto("/ne/consultancies/example-education");
  await expect(page.locator("html")).toHaveAttribute("lang", "ne");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("उदाहरण एजुकेसन प्रा. लि.");
  await expect(page.getByText("दर्ता भएको").first()).toBeVisible();
  await expect(page.getByText(/२०८३/).first()).toBeVisible();
  await expectNoSidewaysScroll(page);
});

for (const path of ["/en", "/ne", "/en/consultancies", "/ne/consultancies", "/en/check?q=example", "/ne/compare?c=example-education,fictional-futures,demo-visa-guide"]) {
  test(`no sideways scrolling and no script errors on ${path}`, async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expectNoSidewaysScroll(page);
    expect(problems).toEqual([]);
  });
}

test("reduced motion: the page is complete and nothing is hidden", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/consultancies/example-education");
  await expect(page.getByRole("img", { name: /out of 5/ }).first()).toBeVisible();
  await expect(page.getByText("Score breakdown")).toBeVisible();
  const hidden = await page.locator('[data-reveal="hidden"]').count();
  // Hidden blocks may exist below the fold, but they must only fade, never move.
  if (hidden > 0) {
    const transform = await page.locator('[data-reveal="hidden"]').first().evaluate((el) => getComputedStyle(el).transform);
    expect(transform).toBe("none");
  }
});
