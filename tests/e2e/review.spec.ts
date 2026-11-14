import { expect, test, type Page } from "@playwright/test";
import { adminDb, createTestUser, deleteTestUser, resetRateLimits, type TestUser } from "./helpers";

/**
 * Flow 2: write a review. Sign-in comes last, and the draft survives leaving the page.
 * Needs the local database (npm run db:start) and NEXT_PUBLIC_FEATURE_DEV_LOGIN=true in .env.local.
 */

// A tiny valid PNG image, used as the "proof" file.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

let user: TestUser | undefined;

test.beforeAll(async () => {
  await resetRateLimits();
});

test.afterEach(async () => {
  await deleteTestUser(user);
  user = undefined;
});

const next = (page: Page) => page.getByRole("button", { name: /^(Continue|Skip this)$/ }).click();

async function pickStars(page: Page, question: string, stars: number) {
  await page.getByRole("group", { name: question }).locator("label", { hasText: `${stars} stars` }).click();
}

test("flow 2: a visitor writes a review, signs in at the end, and it waits for approval", async ({ page }, testInfo) => {
  user = await createTestUser(`review-${testInfo.project.name}`);
  const wentWell = `They explained every document clearly. (${testInfo.project.name} ${Date.now()})`;

  // No sign-in is asked for at the start.
  await page.goto("/en/review/new?c=demo-visa-guide");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Which consultancy did you use?");
  await expect(page.getByText("Demo Visa Guide")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Step 1 of 11");
  await next(page);

  // One question per screen. A single choice moves on by itself.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Which country did you apply to?");
  await page.locator("label", { hasText: "Australia" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What did you apply for?");
  await next(page); // nothing chosen yet
  await expect(page.getByText("Please answer this question.").first()).toBeVisible();
  await page.getByLabel("Study level").selectOption("master");
  await page.getByLabel("Intake year").selectOption(String(new Date().getFullYear()));
  await next(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How did it end?");
  await page.locator("label", { hasText: "Visa granted" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How much did you pay them?");
  await page.getByLabel(/Service charge/).fill("45,000");
  await next(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rate your experience");
  await pickStars(page, "Honesty", 5);
  await pickStars(page, "Communication", 4);
  await pickStars(page, "Documents", 4);
  await next(page); // one rating is still missing
  await expect(page.getByText("Please answer this question.")).toBeVisible();
  await pickStars(page, "Speed", 3);
  await next(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What went well?");
  await page.getByLabel("What went well?").fill("ok");
  await next(page);
  await expect(page.getByText("Please write a little more.")).toBeVisible();
  await page.getByLabel("What went well?").fill(wentWell);
  await next(page);

  await page.getByLabel("What went badly?").fill("The phone was rarely answered in the afternoon.");
  await next(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Almost done");
  await page.locator("label", { hasText: /^Yes$/ }).click();
  await next(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Add proof, if you can");
  await expect(page.getByText("Only our team sees this. We delete it after checking.")).toBeVisible();
  await page.getByLabel("Proof file").setInputFiles({ name: "visa.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("visa.png", { exact: true })).toBeVisible();
  await next(page);

  // The last screen asks for sign-in. Leaving and coming back (as Google sign-in does) loses nothing.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Send your review");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send my review" })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Send your review");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("visa.png", { exact: true })).toBeVisible();
  await next(page);

  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText(`Signed in as ${user.email}`)).toBeVisible();
  await expect(page.getByText("We read every review before it goes live.")).toBeVisible();

  await page.getByRole("button", { name: "Send my review" }).click();
  await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible();
  await expect(page.getByText("We read every review before it goes live.")).toBeVisible();

  // In the database: saved as pending, never verified, with the proof in the private bucket.
  const db = adminDb();
  const { data: review } = await db
    .from("reviews")
    .select("id, status, is_verified, service_charge_npr, study_level, overall, display_name_choice")
    .eq("user_id", user.id)
    .single();
  expect(review).toMatchObject({
    status: "pending",
    is_verified: false,
    service_charge_npr: 45000,
    study_level: "master",
    overall: 4,
    display_name_choice: "initials",
  });
  const { data: proofs } = await db.from("review_proofs").select("storage_path").eq("review_id", review!.id);
  expect(proofs).toHaveLength(1);
  expect(proofs![0].storage_path.startsWith(`${user.id}/${review!.id}/`)).toBe(true);
  const { data: file } = await db.storage.from("proofs").download(proofs![0].storage_path);
  expect(file?.size).toBe(PNG.length);

  // The public cannot see it yet.
  await page.goto("/en/consultancies/demo-visa-guide");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Demo Visa Guide");
  await expect(page.getByText(wentWell)).toHaveCount(0);

  // The draft is gone. A second review of the same consultancy is refused.
  await page.goto("/en/review/new?c=demo-visa-guide");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Which consultancy did you use?");
  await db.storage.from("proofs").remove([proofs![0].storage_path]);
});

test("a visitor can suggest a consultancy that is missing", async ({ page }) => {
  await page.goto("/en/review/new");
  await page.getByRole("button", { name: "I cannot find it" }).click();
  await next(page);
  await expect(page.getByText("Please answer this question.")).toBeVisible();
  await page.getByLabel("Consultancy name").fill("Brand New Made-up Consultancy");
  await page.getByLabel(/City/).fill("Pokhara");
  await next(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Which country did you apply to?");
});

test("the review form works in Nepali", async ({ page }) => {
  await page.goto("/ne/review/new");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("तपाईंले कुन कन्सल्टेन्सीको सेवा लिनुभयो?");
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "चरण १ / ११");
});

test("any visitor can report a review", async ({ page }) => {
  const db = adminDb();
  const { data: review } = await db.from("public_reviews").select("id, consultancy_name").limit(1).single();
  const before = (await db.from("reports").select("id", { count: "exact", head: true }).eq("review_id", review!.id)).count ?? 0;

  await page.goto(`/en/report/${review!.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Report this review");
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByText("Please choose a reason.")).toBeVisible();
  await page.locator("label", { hasText: "It looks fake" }).click();
  await page.getByLabel("More detail").fill("Written by the browser test.");
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible();

  const after = (await db.from("reports").select("id", { count: "exact", head: true }).eq("review_id", review!.id)).count ?? 0;
  expect(after).toBe(before + 1);
  await db.from("reports").delete().eq("details", "Written by the browser test.");
});
