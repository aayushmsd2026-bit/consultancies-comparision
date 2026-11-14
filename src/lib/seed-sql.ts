import {
  branches,
  consultancies,
  replies,
  reports,
  reviews,
  scoreOf,
  suggestedConsultancy,
  users,
} from "../../supabase/seed-data";

/** Writes a value as safe SQL text. */
function q(value: string | number | boolean | null | string[]): string {
  if (value === null) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `array[${value.map(q).join(", ")}]::text[]`;
  return `'${value.replace(/'/g, "''")}'`;
}

function insert(table: string, columns: string[], rows: (string | number | boolean | null | string[])[][]): string {
  if (rows.length === 0) return "";
  const values = rows.map((row) => `  (${row.map(q).join(", ")})`).join(",\n");
  return `insert into ${table}\n  (${columns.join(", ")})\nvalues\n${values};\n`;
}

/** Builds supabase/seed.sql from supabase/seed-data.ts. Same data in, same text out. */
export function buildSeedSql(): string {
  const allConsultancies = [...consultancies, suggestedConsultancy];
  const parts = [
    `-- GENERATED FILE. Do not edit by hand.
-- Source: supabase/seed-data.ts. Rebuild with: npm run seed:build
--
-- DEMO DATA FOR DEVELOPMENT ONLY. Every consultancy, reviewer and review below
-- is fictional. Never load this file into the production database.
`,
    "-- Fictional reviewers. Their addresses end in .invalid and can never receive mail.",
    insert(
      "auth.users",
      ["id", "instance_id", "aud", "role", "email", "raw_app_meta_data", "raw_user_meta_data", "created_at", "updated_at"],
      users.map((user) => [
        user.id,
        "00000000-0000-0000-0000-000000000000",
        "authenticated",
        "authenticated",
        user.email,
        '{"provider": "demo", "providers": ["demo"]}',
        JSON.stringify({ full_name: user.displayName }),
        "2025-10-01T06:00:00Z",
        "2025-10-01T06:00:00Z",
      ]),
    ),
    "-- Fictional consultancies. Scores come from the ranking formula in src/lib/ranking.ts.",
    insert(
      "public.consultancies",
      ["id", "slug", "name", "name_ne", "listing_status", "registration_status", "registration_number", "registration_source_url", "registration_checked_at", "website", "description", "countries", "avg_score", "review_count", "verified_review_count", "rank_score"],
      allConsultancies.map((c) => {
        const score = scoreOf(c.id);
        return [
          c.id, c.slug, c.name, c.nameNe, c.listingStatus, c.registrationStatus, c.registrationNumber,
          c.registrationSourceUrl, c.registrationCheckedAt, c.website, c.description, c.countries,
          score.avgScore === null ? null : Number(score.avgScore.toFixed(2)),
          score.reviewCount, score.verifiedReviewCount, Number(score.rankScore.toFixed(4)),
        ];
      }),
    ),
    insert(
      "public.branches",
      ["id", "consultancy_id", "city", "district", "address", "phone", "is_head_office"],
      branches.map((b) => [b.id, b.consultancyId, b.city, b.district, b.address, b.phone, b.isHeadOffice]),
    ),
    insert(
      "public.consultancy_suggestions",
      ["consultancy_id", "suggested_by", "note"],
      [[suggestedConsultancy.id, users[0].id, "I used this consultancy and could not find it in the list."]],
    ),
    "-- Fictional reviews.",
    insert(
      "public.reviews",
      ["id", "consultancy_id", "branch_id", "user_id", "status", "country", "study_level", "intake_year", "outcome", "service_charge_npr", "extra_costs_npr", "extra_costs_note", "rating_honesty", "rating_communication", "rating_documents", "rating_speed", "rating_after_visa", "went_well", "went_badly", "would_recommend", "is_verified", "invited_by_consultancy", "display_name_choice", "rejection_reason", "created_at", "approved_at"],
      reviews.map((r) => [
        r.id, r.consultancyId, r.branchId, r.userId, r.status, r.country, r.studyLevel, r.intakeYear, r.outcome,
        r.serviceChargeNpr, r.extraCostsNpr, r.extraCostsNote, r.ratings.honesty, r.ratings.communication,
        r.ratings.documents, r.ratings.speed, r.ratings.afterVisa, r.wentWell, r.wentBadly, r.wouldRecommend,
        r.isVerified, r.invitedByConsultancy, r.displayNameChoice, r.rejectionReason, r.createdAt, r.approvedAt,
      ]),
    ),
    insert(
      "public.replies",
      ["id", "review_id", "consultancy_id", "author_user_id", "body", "status", "created_at"],
      replies.map((r) => [r.id, r.reviewId, r.consultancyId, null, r.body, "approved", r.createdAt]),
    ),
    insert(
      "public.reports",
      ["id", "review_id", "reporter_user_id", "reason", "details", "status"],
      reports.map((r) => [r.id, r.reviewId, null, r.reason, r.details, "open"]),
    ),
  ];
  return parts.filter(Boolean).join("\n");
}
