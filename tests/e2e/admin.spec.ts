import { expect, test, type Page } from "@playwright/test";
import { adminDb, createTestUser, deleteTestUser, resetRateLimits, type TestUser } from "./helpers";

/**
 * Flow 3: the admin approves a review and it appears on the public page.
 * Also: only admins get in, keyboard shortcuts, proof viewing and deleting,
 * replies, reports, the consultancy editor, the CSV import and the audit log.
 *
 * These tests change shared data, so they run one after another, and only on the
 * desktop layout (see playwright.config.ts).
 */
test.describe.configure({ mode: "serial" });

const SLUG = "lorem-ipsum-overseas";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const stamp = Date.now();
const WENT_WELL = `Admin flow test ${stamp}: they explained every document clearly.`;
const REPLY = `Thank you for the feedback (${stamp}).`;

let reviewer: TestUser;
let owner: TestUser;
let reviewId: string;
let proofPath: string;
let consultancyId: string;

async function signIn(page: Page, user: TestUser) {
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

const reviewCard = (page: Page) => page.getByRole("article").filter({ hasText: WENT_WELL });

test.beforeAll(async () => {
  await resetRateLimits();
  const db = adminDb();
  reviewer = await createTestUser("reviewer");
  owner = await createTestUser("owner", { admin: true });

  const { data: consultancy } = await db.from("consultancies").select("id").eq("slug", SLUG).single();
  consultancyId = consultancy!.id;
  const { data: review, error } = await db
    .from("reviews")
    .insert({
      consultancy_id: consultancyId,
      user_id: reviewer.id,
      country: "CA",
      study_level: "master",
      intake_year: 2026,
      outcome: "visa_granted",
      service_charge_npr: 40000,
      rating_honesty: 5,
      rating_communication: 5,
      rating_documents: 5,
      rating_speed: 5,
      went_well: WENT_WELL,
      went_badly: "Nothing serious. The office is small.",
      would_recommend: true,
      display_name_choice: "initials",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  reviewId = review!.id;

  proofPath = `${reviewer.id}/${reviewId}/proof.png`;
  await db.storage.from("proofs").upload(proofPath, PNG, { contentType: "image/png" });
  await db.from("review_proofs").insert({ review_id: reviewId, storage_path: proofPath });
});

test.afterAll(async () => {
  const db = adminDb();
  await db.storage.from("proofs").remove([proofPath]);
  await deleteTestUser(reviewer);
  await deleteTestUser(owner);
});

test("only an admin can open the admin area", async ({ page }) => {
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { name: "Admin sign-in" })).toBeVisible();
  await expect(page.getByText("Review queue")).toHaveCount(0);

  // A normal signed-in person is turned away.
  await signIn(page, reviewer);
  await expect(page.getByText("This account is not an admin.")).toBeVisible();
  await expect(page.getByText(WENT_WELL)).toHaveCount(0);
  await page.goto("/en/admin/consultancies");
  await expect(page.getByText("This account is not an admin.")).toBeVisible();
});

test("flow 3: the admin approves a review with the keyboard and it appears on the public page", async ({ page }) => {
  // Before: the public page does not show the review, and has 3 reviews.
  await page.goto(`/en/consultancies/${SLUG}`);
  await expect(page.getByText("Based on 3 reviews")).toBeVisible();
  await expect(page.getByText(WENT_WELL)).toHaveCount(0);

  await page.goto("/en/admin");
  await signIn(page, owner);
  await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();

  // Newest first: our review is at the top and already selected.
  const card = reviewCard(page);
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("aria-current", "true");
  await expect(card).toContainText(reviewer.email);

  // O shows the proof. V marks it verified. A approves.
  await page.keyboard.press("o");
  await expect(card.getByRole("img")).toBeVisible();
  await page.keyboard.press("v");
  await expect(card.getByText("Verified", { exact: true })).toBeVisible();
  await page.keyboard.press("a");
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  await expect(card).toHaveCount(0);

  // The public page shows it straight away, with the verified mark and a new count.
  await page.goto(`/en/consultancies/${SLUG}`);
  await expect(page.getByText("Based on 4 reviews")).toBeVisible();
  const publicCard = page.getByRole("article").filter({ hasText: WENT_WELL });
  await expect(publicCard).toBeVisible();
  await expect(publicCard.getByText("Verified student")).toBeVisible();
  // The reviewer chose "initials". The email is nowhere on the page.
  await expect(publicCard.getByText("T. P.")).toBeVisible();
  expect(await page.content()).not.toContain(reviewer.email);

  // The scores were recalculated with the one formula, and every step is in the audit log.
  const db = adminDb();
  const { data: consultancy } = await db.from("consultancies").select("review_count, verified_review_count").eq("id", consultancyId).single();
  expect(consultancy).toEqual({ review_count: 4, verified_review_count: expect.any(Number) });
  const { data: log } = await db.from("audit_log").select("action").eq("actor_user_id", owner.id);
  expect(log!.map((row) => row.action).sort()).toEqual(["proof.view", "review.approve", "review.verify"]);
});

test("the admin posts a reply on behalf of the consultancy", async ({ page }) => {
  await page.goto("/en/admin?status=approved");
  await signIn(page, owner);
  const card = reviewCard(page);
  await card.getByText("Post a reply from the consultancy").click();
  await card.getByLabel("Reply text").fill(REPLY);
  await card.getByRole("button", { name: "Post reply" }).click();
  await expect(page.getByText("Reply posted")).toBeVisible();

  await page.goto(`/en/consultancies/${SLUG}`);
  const publicCard = page.getByRole("article").filter({ hasText: WENT_WELL });
  await expect(publicCard.getByText("Reply from the consultancy")).toBeVisible();
  await expect(publicCard.getByText(REPLY)).toBeVisible();
});

test("the admin deletes the proof after checking", async ({ page }) => {
  await page.goto("/en/admin?status=approved");
  await signIn(page, owner);
  page.on("dialog", (dialog) => dialog.accept());
  await reviewCard(page).getByRole("button", { name: "Delete proof file" }).click();
  await expect(reviewCard(page).getByText("Proof deleted after checking")).toBeVisible();

  const db = adminDb();
  const { data: proof } = await db.from("review_proofs").select("deleted_at, checked_at").eq("review_id", reviewId).single();
  expect(proof!.deleted_at).not.toBeNull();
  expect(proof!.checked_at).not.toBeNull();
  const { data: file } = await db.storage.from("proofs").download(proofPath);
  expect(file).toBeNull();
});

test("a visitor's report lands in the admin queue and can be resolved", async ({ page }) => {
  const db = adminDb();
  await db.from("reports").insert({ review_id: reviewId, reason: "fake", details: `Report ${stamp}` });

  await page.goto("/en/admin/reports");
  await signIn(page, owner);
  const report = page.getByRole("listitem").filter({ hasText: `Report ${stamp}` });
  await expect(report).toContainText("Looks fake");
  await report.getByRole("button", { name: "Resolve, keep the review" }).click();
  await expect(page.getByText("Report resolved")).toBeVisible();
  await expect(report).toHaveCount(0);

  const { data } = await db.from("reports").select("status").eq("details", `Report ${stamp}`).single();
  expect(data!.status).toBe("resolved");
});

test("rejecting asks for a reason and removes the review from the public page", async ({ page }) => {
  await page.goto("/en/admin?status=approved");
  await signIn(page, owner);
  await reviewCard(page).click(); // select it
  await page.keyboard.press("r");
  const dialog = page.getByRole("dialog", { name: "Reject this review" });
  await expect(dialog).toBeVisible();
  // No reason, no rejection.
  await dialog.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Not a first-hand experience" }).click();
  await dialog.getByLabel("Reason").press("Enter");
  await expect(page.getByText("Rejected", { exact: true })).toBeVisible();

  await page.goto(`/en/consultancies/${SLUG}`);
  await expect(page.getByText("Based on 3 reviews")).toBeVisible();
  await expect(page.getByText(WENT_WELL)).toHaveCount(0);

  const { data } = await adminDb().from("reviews").select("status, rejection_reason").eq("id", reviewId).single();
  expect(data).toEqual({ status: "rejected", rejection_reason: "Not a first-hand experience" });
});

test("the consultancy editor changes the registration status and the date last checked", async ({ page }) => {
  await page.goto("/en/admin/consultancies?q=lorem");
  await signIn(page, owner);
  await page.getByRole("link", { name: /Lorem Ipsum Overseas/ }).click();
  await expect(page.getByRole("heading", { name: /Edit consultancy/ })).toBeVisible();
  await page.getByLabel("Registration status").selectOption("registered");
  await page.getByLabel("Date last checked").fill("2026-11-01");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.goto(`/en/consultancies/${SLUG}`);
  await expect(page.getByText("This consultancy is on the Ministry of Education list.")).toBeVisible();
  await expect(page.getByText("Last checked on 1 Nov 2026")).toBeVisible();

  // Put it back, so other tests see the demo data as it was.
  await adminDb()
    .from("consultancies")
    .update({ registration_status: "unknown", registration_checked_at: null })
    .eq("id", consultancyId);
});

test("the CSV import screen checks a file before importing", async ({ page }) => {
  await page.goto("/en/admin/import");
  await signIn(page, owner);
  await expect(page.getByRole("button", { name: "Import now" })).toBeDisabled();
  await page.getByLabel("CSV file").setInputFiles("data/sample-consultancies.csv");
  await page.getByRole("button", { name: "Check the file" }).click();
  await expect(page.getByText("The file has 5 consultancies and 6 branches.")).toBeVisible();
  await expect(page.getByText(/This would add \d+ consultancies and update \d+/)).toBeVisible();
  await expect(page.getByText("No problems found.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import now" })).toBeEnabled();
});

test("every admin action is in the audit log", async ({ page }) => {
  await page.goto("/en/admin/log");
  await signIn(page, owner);
  await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  for (const action of ["review.approve", "review.verify", "review.reject", "reply.post", "proof.view", "proof.delete", "report.resolve", "consultancy.update"]) {
    await expect(page.getByRole("cell", { name: action, exact: true }).first()).toBeVisible();
  }
});
