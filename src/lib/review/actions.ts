"use server";

import { headers } from "next/headers";
import { consultancySlug } from "@/lib/import/consultancy-csv";
import { getAdminClient } from "@/lib/supabase/admin";
import { getPublicClient } from "@/lib/supabase/public";
import { getServerClient, getSessionUser } from "@/lib/supabase/server";
import { reportSchema, reviewSchema } from "./schema";

/**
 * What the visitor's browser may ask the server to do with reviews.
 * Every action checks the input again and checks who is asking.
 * Answers are short codes. The form turns them into sentences.
 */

export type SubmitReviewResult =
  | { ok: true; reviewId: string; userId: string }
  | { ok: false; error: "notSignedIn" | "invalid" | "tooMany" | "alreadyReviewed" | "consultancyMissing" | "unknown" };

export async function submitReviewAction(input: unknown): Promise<SubmitReviewResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "notSignedIn" };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  const admin = getAdminClient();
  // No more than 5 reviews per person per day. The database enforces the same limit again.
  const { data: allowed } = await admin.rpc("hit_rate_limit", {
    limit_key: `review:${user.id}`,
    max_hits: 5,
    window_seconds: 86_400,
  });
  if (allowed === false) return { ok: false, error: "tooMany" };

  // Find the consultancy, or create a hidden "pending" one from the suggestion.
  let consultancyId: string | null = null;
  if (data.consultancySlug) {
    const { data: found } = await getPublicClient()!
      .from("consultancies")
      .select("id")
      .eq("slug", data.consultancySlug)
      .maybeSingle();
    consultancyId = found?.id ?? null;
  } else if (data.suggestedName && data.suggestedName.length >= 2) {
    const base = consultancySlug(data.suggestedName) || "suggested";
    const suffix = crypto.randomUUID().slice(0, 6);
    const { data: created, error } = await admin
      .from("consultancies")
      .insert({ slug: `${base}-${suffix}`.slice(0, 100), name: data.suggestedName, listing_status: "pending" })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "unknown" };
    consultancyId = created.id;
    await admin.from("consultancy_suggestions").insert({ consultancy_id: created.id, suggested_by: user.id });
    if (data.suggestedCity) {
      await admin.from("branches").insert({ consultancy_id: created.id, city: data.suggestedCity, is_head_office: true });
    }
  }
  if (!consultancyId) return { ok: false, error: "consultancyMissing" };

  // A branch must belong to the chosen consultancy.
  let branchId = data.branchId;
  if (branchId) {
    const { data: branch } = await admin.from("branches").select("consultancy_id").eq("id", branchId).maybeSingle();
    if (branch?.consultancy_id !== consultancyId) branchId = null;
  }

  // The review is saved as the signed-in person, so the database rules apply:
  // it is always "pending" and never "verified" at this point.
  const supabase = await getServerClient();
  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      consultancy_id: consultancyId,
      branch_id: branchId,
      user_id: user.id,
      country: data.country,
      study_level: data.studyLevel,
      intake_year: data.intakeYear,
      outcome: data.outcome,
      service_charge_npr: data.serviceChargeNpr,
      extra_costs_npr: data.extraCostsNpr,
      extra_costs_note: data.extraCostsNote || null,
      rating_honesty: data.ratingHonesty,
      rating_communication: data.ratingCommunication,
      rating_documents: data.ratingDocuments,
      rating_speed: data.ratingSpeed,
      rating_after_visa: data.ratingAfterVisa,
      went_well: data.wentWell,
      went_badly: data.wentBadly,
      would_recommend: data.wouldRecommend,
      invited_by_consultancy: data.invitedByConsultancy,
      display_name_choice: data.displayNameChoice,
    })
    .select("id")
    .single();

  if (error || !review) {
    if (error?.code === "23505") return { ok: false, error: "alreadyReviewed" };
    if (error?.message.includes("Too many reviews")) return { ok: false, error: "tooMany" };
    console.error("submitReviewAction failed", error?.code, error?.message);
    return { ok: false, error: "unknown" };
  }
  return { ok: true, reviewId: review.id, userId: user.id };
}

/** Records that a proof file was uploaded for the signed-in person's own review. */
export async function attachProofAction(reviewId: string, storagePath: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };
  // The file must sit in this person's own folder for this review.
  if (!storagePath.startsWith(`${user.id}/${reviewId}/`) || storagePath.includes("..")) return { ok: false };
  const supabase = await getServerClient();
  const { error } = await supabase.from("review_proofs").insert({ review_id: reviewId, storage_path: storagePath });
  return { ok: !error };
}

export type SubmitReportResult = { ok: true } | { ok: false; error: "required" | "tooMany" | "notFound" | "unknown" };

/** Any visitor can report a review. Limited to 5 reports an hour per visitor. */
export async function submitReportAction(input: unknown): Promise<SubmitReportResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "required" };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const admin = getAdminClient();
  const { data: allowed } = await admin.rpc("hit_rate_limit", {
    limit_key: `report:${ip}`,
    max_hits: 5,
    window_seconds: 3600,
  });
  if (allowed === false) return { ok: false, error: "tooMany" };

  // Only reviews the public can see can be reported.
  const { data: review } = await getPublicClient()!
    .from("public_reviews")
    .select("id")
    .eq("id", parsed.data.reviewId)
    .maybeSingle();
  if (!review) return { ok: false, error: "notFound" };

  const user = await getSessionUser();
  const { error } = await admin.from("reports").insert({
    review_id: parsed.data.reviewId,
    reporter_user_id: user?.id ?? null,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });
  return error ? { ok: false, error: "unknown" } : { ok: true };
}
