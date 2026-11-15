import { expect, test } from "@playwright/test";

/** Guides and trust pages: the text lives in content/ as MDX files. */

test("the guides page lists the three guides", async ({ page }) => {
  await page.goto("/en/guides");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Guides");
  for (const title of [
    "How to choose a study-abroad consultancy",
    "Ten red flags before you pay",
    "How to check if a consultancy is registered",
  ]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
  await page.getByRole("link", { name: /Ten red flags before you pay/ }).click();
  await expect(page).toHaveURL(/\/en\/guides\/ten-red-flags-before-you-pay$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ten red flags before you pay");
  await expect(page.getByRole("navigation", { name: "You are here" })).toContainText("Guides");
});

test("a Nepali guide keeps the visitor in Nepali when they follow a link", async ({ page }) => {
  await page.goto("/ne/guides/how-to-check-registration");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("कन्सल्टेन्सी दर्ता छ कि छैन कसरी जाँच्ने");
  await page.getByRole("main").getByRole("link", { name: "दर्ता जाँच" }).click();
  await expect(page).toHaveURL(/\/ne\/check$/);
});

test("the review policy explains the trust rules and the ranking formula with the real numbers", async ({ page }) => {
  await page.goto("/en/review-policy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Review policy");
  await expect(page.getByText("Draft. This page has not been checked by a lawyer yet.")).toHaveCount(0);
  await expect(page.getByText("Ratings cannot be bought.").first()).toBeVisible();
  // These numbers come from src/config/ranking.ts, so the page cannot drift from the code.
  await expect(page.getByText(/A verified review counts as\s+1\.5\s+reviews/)).toBeVisible();
  await expect(page.getByText(/at least\s+3\s+approved reviews/)).toBeVisible();
  await expect(page.getByText("rank score = (v ÷ (v + m)) × R + (m ÷ (v + m)) × C")).toBeVisible();
  await expect(page.getByText(/is 5\./)).toBeVisible();
});

for (const [path, title] of [
  ["/en/about", "About"],
  ["/en/privacy", "Privacy"],
  ["/en/terms", "Terms of use"],
  ["/ne/review-policy", "समीक्षा नीति"],
  ["/ne/about", "हाम्रो बारेमा"],
  ["/ne/privacy", "गोपनीयता"],
  ["/ne/terms", "प्रयोगका सर्तहरू"],
  ["/ne/guides", "मार्गदर्शन"],
  ["/ne/guides/ten-red-flags-before-you-pay", "पैसा तिर्नुअघि दसवटा खतराका सङ्केत"],
  ["/en/guides/how-to-choose-a-consultancy", "How to choose a study-abroad consultancy"],
] as const) {
  test(`${path} opens, fits the screen and has no script errors`, async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });
}

test("every link in the footer leads to a real page", async ({ page }) => {
  await page.goto("/en");
  const hrefs = await page.locator("footer a").evaluateAll((links) => links.map((a) => a.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThanOrEqual(9);
  for (const href of new Set(hrefs)) {
    const response = await page.request.get(href);
    expect(response.status(), href).toBe(200);
  }
});
