import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility checks (WCAG 2.2 AA) with axe, the standard automatic checker,
 * plus keyboard checks that a tool cannot do by itself.
 */

const PAGES = [
  "/en",
  "/ne",
  "/en/consultancies",
  "/en/consultancies/example-education",
  "/ne/consultancies/example-education",
  "/en/consultancies/pretend-abroad-services",
  "/en/check?q=example",
  "/en/compare?c=example-education,made-up-scholars",
  "/en/review/new",
  "/en/guides",
  "/en/guides/ten-red-flags-before-you-pay",
  "/ne/review-policy",
  "/en/styleguide",
];

async function scan(page: Page) {
  // Let entrance animations finish, so colours are measured at full strength.
  await page.waitForTimeout(700);
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]);
  // The styleguide shows the header and footer a second time on purpose, so their names repeat there.
  if (page.url().includes("/styleguide")) builder = builder.disableRules(["landmark-unique"]);
  const results = await builder.analyze();
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.html.slice(0, 120)}`);
}

for (const path of PAGES) {
  test(`no accessibility problems on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });
}

for (const path of ["/en", "/en/consultancies/example-education", "/en/review/new", "/en/styleguide"]) {
  test(`no accessibility problems in dark mode on ${path}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });
}

test("keyboard: the skip link is first and jumps to the content", async ({ page, browserName }, testInfo) => {
  test.skip(testInfo.project.name === "phone", "Phones have no Tab key.");
  await page.goto("/en");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  expect(browserName).toBeTruthy();
});

test("keyboard: every focused control on the home page shows a visible focus ring", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "phone", "Phones have no Tab key.");
  await page.goto("/en");
  const seen: string[] = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      // The ring is drawn on the element itself or, for hidden radio inputs, on its label.
      const target = el.matches("input.sr-only") ? (el.closest("label") ?? el) : el;
      const style = getComputedStyle(target);
      return {
        name: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || el.tagName).trim().slice(0, 40),
        outline: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2,
      };
    });
    if (!info) continue;
    seen.push(info.name);
    expect(info.outline, `"${info.name}" has no visible focus ring`).toBe(true);
  }
  expect(seen.length).toBeGreaterThan(8);
});

test("keyboard: Ctrl+K opens search and the arrow keys pick a result", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The search shortcut is for desktop keyboards.");
  await page.goto("/en/guides");
  // The shortcut is wired up once the page's scripts have started.
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Search a consultancy" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("combobox")).toBeFocused();
  await page.keyboard.type("fictional");
  await expect(page.getByRole("option", { name: /Fictional Futures/ })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/consultancies\/fictional-futures$/);
});

test("keyboard: tabs move with the arrow keys", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "phone", "Phones have no arrow keys.");
  await page.goto("/en");
  const first = page.getByRole("tab").first();
  await first.focus();
  await page.keyboard.press("ArrowRight");
  const second = page.getByRole("tab").nth(1);
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute("aria-selected", "true");
});

test("touch targets on the phone layout are at least 44px tall", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "Checked on the phone layout.");
  await page.goto("/en/consultancies/example-education");
  const small = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("a[href], button, select, input:not([type=hidden]), summary")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || el.closest(".sr-only") || el.classList.contains("sr-only")) continue;
      // Links inside a sentence follow the text size. Everything else must be easy to tap.
      const inline = getComputedStyle(el).display === "inline";
      if (!inline && rect.height < 44) out.push(`${el.tagName} "${(el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(rect.height)}px`);
    }
    return out;
  });
  expect(small).toEqual([]);
});
