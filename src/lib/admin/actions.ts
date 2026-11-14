"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { COUNTRIES } from "@/config/countries";
import { TAGS } from "@/lib/data/tags";
import { consultancySlug, readConsultancyCsv, type ImportProblem } from "@/lib/import/consultancy-csv";
import { importConsultancies, type ImportSummary } from "@/lib/import/run-import";
import { cleanText } from "@/lib/review/schema";
import { REGISTRATION_STATUSES } from "@/lib/types";
import { requireAdmin } from "./auth";
import { recalculateScores } from "./recalculate";

/**
 * Everything the admin can do. Each action:
 *   1. checks that the person is an admin,
 *   2. makes the change as that person (so the database rules apply too),
 *   3. writes a row to audit_log,
 *   4. refreshes the public pages that show the changed data.
 */

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

type Admin = Awaited<ReturnType<typeof requireAdmin>>;

async function run<T extends object>(work: (admin: Admin) => Promise<T | void>): Promise<ActionResult<T>> {
  try {
    const admin = await requireAdmin();
    const result = await work(admin);
    return { ok: true, ...((result ?? {}) as T) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message !== "not_admin") console.error("Admin action failed:", message);
    return { ok: false, error: message === "not_admin" ? "You are not signed in as an admin." : message };
  }
}

async function audit(admin: Admin, action: string, table: string, id: string | null, note?: string | null) {
  const { error } = await admin.supabase.from("audit_log").insert({
    actor_user_id: admin.user.id,
    action,
    target_table: table,
    target_id: id,
    note: note ?? null,
  });
  if (error) throw new Error(`The action worked, but the audit log could not be written: ${error.message}`);
}

/** Public pages that show reviews or scores are rebuilt on their next visit. */
function refreshPublic(slug?: string | null) {
  updateTag(TAGS.reviews);
  updateTag(TAGS.consultancies);
  if (slug) updateTag(TAGS.consultancy(slug));
}

const id = z.uuid();

async function loadReview(admin: Admin, reviewId: string) {
  const { data, error } = await admin.supabase
    .from("reviews")
    .select("id, status, is_verified, consultancy_id, consultancies(slug)")
    .eq("id", id.parse(reviewId))
    .single();
  if (error || !data) throw new Error("Review not found.");
  const slug = (data.consultancies as unknown as { slug: string } | null)?.slug ?? null;
  return { ...data, slug };
}

// --- Reviews -----------------------------------------------------------------

export async function approveReviewAction(reviewId: string): Promise<ActionResult> {
  return run(async (admin) => {
    const review = await loadReview(admin, reviewId);
    const { error } = await admin.supabase
      .from("reviews")
      .update({ status: "approved", approved_at: new Date().toISOString(), rejection_reason: null })
      .eq("id", review.id);
    if (error) throw new Error(error.message);
    // Approving recalculates the consultancy's scores.
    await recalculateScores(admin.supabase);
    await audit(admin, "review.approve", "reviews", review.id);
    refreshPublic(review.slug);
  });
}

export async function rejectReviewAction(reviewId: string, reason: string): Promise<ActionResult> {
  return run(async (admin) => {
    const cleanReason = cleanText(reason).slice(0, 500);
    if (cleanReason.length < 3) throw new Error("Give a reason for the rejection.");
    const review = await loadReview(admin, reviewId);
    const { error } = await admin.supabase
      .from("reviews")
      .update({ status: "rejected", rejection_reason: cleanReason, approved_at: null })
      .eq("id", review.id);
    if (error) throw new Error(error.message);
    if (review.status === "approved") await recalculateScores(admin.supabase);
    await audit(admin, "review.reject", "reviews", review.id, cleanReason);
    refreshPublic(review.slug);
  });
}

export async function askForProofAction(reviewId: string): Promise<ActionResult> {
  return run(async (admin) => {
    const review = await loadReview(admin, reviewId);
    const { error } = await admin.supabase
      .from("reviews")
      .update({ status: "needs_proof", approved_at: null })
      .eq("id", review.id);
    if (error) throw new Error(error.message);
    if (review.status === "approved") await recalculateScores(admin.supabase);
    await audit(admin, "review.ask_proof", "reviews", review.id);
    refreshPublic(review.slug);
  });
}

export async function setVerifiedAction(reviewId: string, verified: boolean): Promise<ActionResult> {
  return run(async (admin) => {
    const review = await loadReview(admin, reviewId);
    const { error } = await admin.supabase.from("reviews").update({ is_verified: verified }).eq("id", review.id);
    if (error) throw new Error(error.message);
    // A verified review weighs 1.5 in the formula, so public scores change.
    if (review.status === "approved") {
      await recalculateScores(admin.supabase);
      refreshPublic(review.slug);
    }
    await audit(admin, verified ? "review.verify" : "review.unverify", "reviews", review.id);
  });
}

// --- Proofs ------------------------------------------------------------------

/** A link to one proof file that works for one minute. Only an admin can get one. */
export async function getProofUrlAction(proofId: string): Promise<ActionResult<{ url: string; isPdf: boolean }>> {
  return run(async (admin) => {
    const { data: proof } = await admin.supabase
      .from("review_proofs")
      .select("id, storage_path, deleted_at")
      .eq("id", id.parse(proofId))
      .single();
    if (!proof || proof.deleted_at) throw new Error("This proof was already deleted.");
    const { data, error } = await admin.supabase.storage.from("proofs").createSignedUrl(proof.storage_path, 60);
    if (error || !data) throw new Error(`Could not open the proof: ${error?.message}`);
    await audit(admin, "proof.view", "review_proofs", proof.id);
    return { url: data.signedUrl, isPdf: proof.storage_path.endsWith(".pdf") };
  });
}

/** Deletes the file for good and notes when it was checked. We promise reviewers this. */
export async function deleteProofAction(proofId: string): Promise<ActionResult> {
  return run(async (admin) => {
    const { data: proof } = await admin.supabase
      .from("review_proofs")
      .select("id, storage_path")
      .eq("id", id.parse(proofId))
      .single();
    if (!proof) throw new Error("Proof not found.");
    const { error: fileError } = await admin.supabase.storage.from("proofs").remove([proof.storage_path]);
    if (fileError) throw new Error(`Could not delete the file: ${fileError.message}`);
    const now = new Date().toISOString();
    const { error } = await admin.supabase
      .from("review_proofs")
      .update({ checked_at: now, deleted_at: now })
      .eq("id", proof.id);
    if (error) throw new Error(error.message);
    await audit(admin, "proof.delete", "review_proofs", proof.id);
  });
}

// --- Replies and reports -----------------------------------------------------

export async function postReplyAction(reviewId: string, body: string): Promise<ActionResult> {
  return run(async (admin) => {
    const text = cleanText(body);
    if (text.length < 3 || text.length > 3000) throw new Error("Write the reply (3 to 3000 characters).");
    const review = await loadReview(admin, reviewId);
    const { data, error } = await admin.supabase
      .from("replies")
      .insert({
        review_id: review.id,
        consultancy_id: review.consultancy_id,
        author_user_id: admin.user.id,
        body: text,
        status: "approved",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Could not save the reply.");
    await audit(admin, "reply.post", "replies", data.id, "Posted on behalf of the consultancy");
    refreshPublic(review.slug);
  });
}

export async function resolveReportAction(reportId: string, note: string): Promise<ActionResult> {
  return run(async (admin) => {
    const { error } = await admin.supabase.from("reports").update({ status: "resolved" }).eq("id", id.parse(reportId));
    if (error) throw new Error(error.message);
    await audit(admin, "report.resolve", "reports", reportId, cleanText(note).slice(0, 500) || null);
  });
}

// --- Consultancies -----------------------------------------------------------

const optionalText = (max: number) =>
  z.string().transform(cleanText).pipe(z.string().max(max)).transform((value) => value || null);

const consultancySchema = z.object({
  name: z.string().transform(cleanText).pipe(z.string().min(2).max(200)),
  nameNe: optionalText(200),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use small letters, numbers and dashes only.").max(100),
  listingStatus: z.enum(["approved", "pending"]),
  registrationStatus: z.enum(REGISTRATION_STATUSES),
  registrationNumber: optionalText(100),
  registrationSourceUrl: optionalText(500),
  registrationCheckedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  officialGrade: optionalText(50),
  website: optionalText(300),
  phone: optionalText(50),
  email: optionalText(200),
  description: optionalText(3000),
  countries: z.array(z.enum(COUNTRIES)),
  isClaimed: z.boolean(),
});

export type ConsultancyFormInput = z.input<typeof consultancySchema>;

/** Adds a consultancy (no id) or saves changes to one. */
export async function saveConsultancyAction(
  consultancyId: string | null,
  input: ConsultancyFormInput,
): Promise<ActionResult<{ id: string }>> {
  return run(async (admin) => {
    const parsed = consultancySchema.safeParse({ ...input, slug: input.slug || consultancySlug(input.name) });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(`${issue.path.join(".")}: ${issue.message}`);
    }
    const data = parsed.data;
    const row = {
      name: data.name,
      name_ne: data.nameNe,
      slug: data.slug,
      listing_status: data.listingStatus,
      registration_status: data.registrationStatus,
      registration_number: data.registrationNumber,
      registration_source_url: data.registrationSourceUrl,
      // Noon in Nepal, so the date reads the same in every time zone.
      registration_checked_at: data.registrationCheckedOn ? `${data.registrationCheckedOn}T12:00:00+05:45` : null,
      official_grade: data.officialGrade,
      website: data.website,
      phone: data.phone,
      email: data.email,
      description: data.description,
      countries: data.countries,
      is_claimed: data.isClaimed,
    };

    let oldSlug: string | null = null;
    if (consultancyId) {
      const { data: before } = await admin.supabase.from("consultancies").select("slug").eq("id", id.parse(consultancyId)).single();
      oldSlug = before?.slug ?? null;
    }
    const query = consultancyId
      ? admin.supabase.from("consultancies").update(row).eq("id", consultancyId).select("id").single()
      : admin.supabase.from("consultancies").insert(row).select("id").single();
    const { data: saved, error } = await query;
    if (error || !saved) {
      throw new Error(error?.code === "23505" ? "Another consultancy already uses this web address (slug)." : (error?.message ?? "Not saved."));
    }
    await audit(admin, consultancyId ? "consultancy.update" : "consultancy.create", "consultancies", saved.id, data.name);
    refreshPublic(data.slug);
    if (oldSlug && oldSlug !== data.slug) updateTag(TAGS.consultancy(oldSlug));
    return { id: saved.id as string };
  });
}

const branchSchema = z.object({
  city: optionalText(80),
  district: optionalText(80),
  address: optionalText(300),
  phone: optionalText(50),
  isHeadOffice: z.boolean(),
});

export async function addBranchAction(consultancyId: string, input: z.input<typeof branchSchema>): Promise<ActionResult> {
  return run(async (admin) => {
    const data = branchSchema.parse(input);
    if (!data.city && !data.address) throw new Error("Give a city or an address.");
    const { data: saved, error } = await admin.supabase
      .from("branches")
      .insert({
        consultancy_id: id.parse(consultancyId),
        city: data.city,
        district: data.district,
        address: data.address,
        phone: data.phone,
        is_head_office: data.isHeadOffice,
      })
      .select("id, consultancies(slug)")
      .single();
    if (error || !saved) throw new Error(error?.message ?? "Not saved.");
    await audit(admin, "branch.create", "branches", saved.id, data.city);
    refreshPublic((saved.consultancies as unknown as { slug: string } | null)?.slug);
  });
}

export async function deleteBranchAction(branchId: string): Promise<ActionResult> {
  return run(async (admin) => {
    const { data: branch } = await admin.supabase
      .from("branches")
      .select("id, city, consultancies(slug)")
      .eq("id", id.parse(branchId))
      .single();
    if (!branch) throw new Error("Branch not found.");
    const { error } = await admin.supabase.from("branches").delete().eq("id", branch.id);
    if (error) throw new Error(error.message);
    await audit(admin, "branch.delete", "branches", branch.id, branch.city);
    refreshPublic((branch.consultancies as unknown as { slug: string } | null)?.slug);
  });
}

// --- CSV import --------------------------------------------------------------

const importOptionsSchema = z.object({
  registrationStatus: z.enum(REGISTRATION_STATUSES),
  sourceUrl: z.string().trim().max(500),
  checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dryRun: z.boolean(),
});

export type ImportActionResult = ActionResult<{ summary: ImportSummary; problems: ImportProblem[]; consultancies: number; branches: number }>;

/** Checks a CSV file and, unless it is a dry run, imports it. Uses the same code as scripts/import-consultancies.ts. */
export async function importCsvAction(csvText: string, options: z.input<typeof importOptionsSchema>): Promise<ImportActionResult> {
  return run(async (admin) => {
    if (csvText.length > 900_000) throw new Error("The file is too big for this screen. Use the import script instead.");
    const settings = importOptionsSchema.parse(options);
    const { consultancies, problems } = readConsultancyCsv(csvText);
    if (consultancies.length === 0) {
      throw new Error(problems[0] ? `Line ${problems[0].line}: ${problems[0].message}` : "The file has no rows.");
    }
    const summary = await importConsultancies(admin.supabase, consultancies, {
      registrationStatus: settings.registrationStatus,
      sourceUrl: settings.sourceUrl || null,
      checkedAt: `${settings.checkedOn}T12:00:00+05:45`,
      dryRun: settings.dryRun,
    });
    if (!settings.dryRun) {
      await audit(
        admin,
        "consultancy.import",
        "consultancies",
        null,
        `Added ${summary.consultanciesAdded}, updated ${summary.consultanciesUpdated}. Branches added ${summary.branchesAdded}.`,
      );
      refreshPublic();
    }
    return {
      summary,
      problems: problems.slice(0, 200),
      consultancies: consultancies.length,
      branches: consultancies.reduce((sum, c) => sum + c.branches.length, 0),
    };
  });
}
