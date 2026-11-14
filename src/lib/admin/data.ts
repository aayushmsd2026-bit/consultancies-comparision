import "server-only";
import { computeFlags, type ReviewFlag } from "@/lib/review/flags";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Outcome, RegistrationStatus, StudyLevel } from "@/lib/types";
import { requireAdmin } from "./auth";

/** What the admin screens read. Every function checks the admin role first. */

export const QUEUE_STATUSES = ["pending", "needs_proof", "approved", "rejected"] as const;
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export type AdminReview = {
  id: string;
  status: QueueStatus;
  createdAt: string;
  consultancy: { name: string; slug: string; listingStatus: string };
  reviewer: { name: string | null; email: string | null };
  country: string;
  studyLevel: StudyLevel;
  intakeYear: number;
  outcome: Outcome;
  serviceChargeNpr: number | null;
  extraCostsNpr: number | null;
  extraCostsNote: string | null;
  ratings: (number | null)[];
  overall: number;
  wentWell: string;
  wentBadly: string;
  wouldRecommend: boolean;
  isVerified: boolean;
  invitedByConsultancy: boolean;
  displayNameChoice: string;
  rejectionReason: string | null;
  flags: ReviewFlag[];
  proofs: { id: string; deleted: boolean }[];
  replies: { id: string; body: string }[];
};

const DAY = 24 * 60 * 60 * 1000;

export async function getQueue(status: QueueStatus): Promise<AdminReview[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "*, consultancies(name, slug, listing_status), profiles(display_name), review_proofs(id, deleted_at), replies(id, body)",
    )
    .eq("status", status)
    // Newest first, as the brief asks.
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Could not load the queue: ${error.message}`);
  const rows = data ?? [];

  // For the "more than 3 reviews for one consultancy in 24 hours" flag.
  const consultancyIds = [...new Set(rows.map((row) => row.consultancy_id as string))];
  const oldest = Math.min(...rows.map((row) => Date.parse(row.created_at)));
  const { data: nearby } = consultancyIds.length
    ? await supabase
        .from("reviews")
        .select("consultancy_id, created_at")
        .in("consultancy_id", consultancyIds)
        .gte("created_at", new Date(oldest - DAY).toISOString())
    : { data: [] };

  // The reviewer's email, so the admin can write to them about proof. Admin screens only.
  const admin = getAdminClient();
  const emails = new Map<string, string | null>();
  await Promise.all(
    [...new Set(rows.map((row) => row.user_id as string))].map(async (userId) => {
      const { data: found } = await admin.auth.admin.getUserById(userId);
      emails.set(userId, found.user?.email ?? found.user?.phone ?? null);
    }),
  );

  return rows.map((row) => {
    const at = Date.parse(row.created_at);
    const burst = (nearby ?? []).filter(
      (other) => other.consultancy_id === row.consultancy_id && Math.abs(Date.parse(other.created_at) - at) <= DAY,
    ).length;
    const ratings = [row.rating_honesty, row.rating_communication, row.rating_documents, row.rating_speed, row.rating_after_visa];
    return {
      id: row.id,
      status: row.status,
      createdAt: row.created_at,
      consultancy: {
        name: row.consultancies?.name ?? "?",
        slug: row.consultancies?.slug ?? "",
        listingStatus: row.consultancies?.listing_status ?? "approved",
      },
      reviewer: { name: row.profiles?.display_name ?? null, email: emails.get(row.user_id) ?? null },
      country: row.country,
      studyLevel: row.study_level,
      intakeYear: row.intake_year,
      outcome: row.outcome,
      serviceChargeNpr: row.service_charge_npr,
      extraCostsNpr: row.extra_costs_npr,
      extraCostsNote: row.extra_costs_note,
      ratings,
      overall: Number(row.overall),
      wentWell: row.went_well,
      wentBadly: row.went_badly,
      wouldRecommend: row.would_recommend,
      isVerified: row.is_verified,
      invitedByConsultancy: row.invited_by_consultancy,
      displayNameChoice: row.display_name_choice,
      rejectionReason: row.rejection_reason,
      flags: computeFlags({
        wentWell: row.went_well,
        wentBadly: row.went_badly,
        ratings: ratings.filter((value): value is number => value !== null),
        reviewsForConsultancyIn24h: burst,
      }),
      proofs: (row.review_proofs ?? []).map((proof: { id: string; deleted_at: string | null }) => ({
        id: proof.id,
        deleted: proof.deleted_at !== null,
      })),
      replies: row.replies ?? [],
    } satisfies AdminReview;
  });
}

export async function getQueueCounts(): Promise<Record<QueueStatus | "reports" | "suggestions", number>> {
  const { supabase } = await requireAdmin();
  const count = async (table: string, column: string, value: string) =>
    (await supabase.from(table).select("id", { count: "exact", head: true }).eq(column, value)).count ?? 0;
  const [pending, needsProof, approved, rejected, reports, suggestions] = await Promise.all([
    count("reviews", "status", "pending"),
    count("reviews", "status", "needs_proof"),
    count("reviews", "status", "approved"),
    count("reviews", "status", "rejected"),
    count("reports", "status", "open"),
    count("consultancies", "listing_status", "pending"),
  ]);
  return { pending, needs_proof: needsProof, approved, rejected, reports, suggestions };
}

export type AdminReport = {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  review: { id: string; status: string; wentWell: string; wentBadly: string; consultancyName: string; consultancySlug: string };
};

export async function getOpenReports(): Promise<AdminReport[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("reports")
    .select("id, reason, details, created_at, reviews(id, status, went_well, went_badly, consultancies(name, slug))")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Could not load the reports: ${error.message}`);
  type Joined = { id: string; status: string; went_well: string; went_badly: string; consultancies: { name: string; slug: string } | null };
  return (data ?? []).map((row) => {
    const review = row.reviews as unknown as Joined;
    return {
      id: row.id,
      reason: row.reason,
      details: row.details,
      createdAt: row.created_at,
      review: {
        id: review.id,
        status: review.status,
        wentWell: review.went_well,
        wentBadly: review.went_badly,
        consultancyName: review.consultancies?.name ?? "?",
        consultancySlug: review.consultancies?.slug ?? "",
      },
    };
  });
}

export type AdminConsultancyRow = {
  id: string;
  slug: string;
  name: string;
  listingStatus: string;
  registrationStatus: RegistrationStatus;
  reviewCount: number;
  city: string | null;
};

export async function listAdminConsultancies(query: string): Promise<AdminConsultancyRow[]> {
  const { supabase } = await requireAdmin();
  const q = query.replace(/[%_,()\\*"]/g, " ").trim().slice(0, 80);
  let request = supabase
    .from("consultancies")
    .select("id, slug, name, listing_status, registration_status, review_count, branches(city, is_head_office)")
    // Suggestions waiting for approval come first.
    .order("listing_status", { ascending: false })
    .order("name")
    .limit(100);
  if (q) request = request.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  const { data, error } = await request;
  if (error) throw new Error(`Could not load consultancies: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    listingStatus: row.listing_status,
    registrationStatus: row.registration_status,
    reviewCount: row.review_count,
    city: (row.branches as { city: string | null; is_head_office: boolean }[]).find((b) => b.is_head_office)?.city ?? null,
  }));
}

export async function getAdminConsultancy(consultancyId: string) {
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(consultancyId)) return null;
  const { data } = await supabase
    .from("consultancies")
    .select("*, branches(id, city, district, address, phone, is_head_office)")
    .eq("id", consultancyId)
    .maybeSingle();
  return data;
}

export type AuditRow = { id: string; createdAt: string; actor: string; action: string; table: string; targetId: string | null; note: string | null };

export async function getAuditLog(): Promise<AuditRow[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, created_at, action, target_table, target_id, note, profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Could not load the audit log: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    actor: (row.profiles as unknown as { display_name: string | null } | null)?.display_name ?? "admin",
    action: row.action,
    table: row.target_table,
    targetId: row.target_id,
    note: row.note,
  }));
}
