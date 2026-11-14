import type {
  Branch,
  ConsultancyCardData,
  ConsultancyDetail,
  Outcome,
  PublicReply,
  RegistrationStatus,
  ReviewWithCosts,
  StudyLevel,
} from "@/lib/types";

/** Shapes of database rows, as the API returns them. */
export type BranchRow = {
  id: string;
  city: string | null;
  district: string | null;
  address: string | null;
  phone: string | null;
  is_head_office: boolean;
};

export type ConsultancyRow = {
  id: string;
  slug: string;
  name: string;
  name_ne: string | null;
  registration_status: RegistrationStatus;
  registration_number: string | null;
  registration_source_url: string | null;
  registration_checked_at: string | null;
  official_grade: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  countries: string[];
  is_claimed: boolean;
  avg_score: number | null;
  review_count: number;
  verified_review_count: number;
  score_visible: boolean;
  branches?: BranchRow[];
};

export type PublicReviewRow = {
  id: string;
  consultancy_slug: string;
  consultancy_name: string;
  consultancy_name_ne: string | null;
  display_name: string | null;
  country: string;
  study_level: StudyLevel;
  intake_year: number;
  outcome: Outcome;
  service_charge_npr: number | null;
  extra_costs_npr: number | null;
  rating_honesty: number;
  rating_communication: number;
  rating_documents: number;
  rating_speed: number;
  rating_after_visa: number | null;
  overall: number;
  went_well: string;
  went_badly: string;
  would_recommend: boolean;
  is_verified: boolean;
  approved_at: string;
};

export const CONSULTANCY_CARD_COLUMNS =
  "id, slug, name, name_ne, registration_status, countries, avg_score, review_count, verified_review_count, score_visible, branches(city, is_head_office)";

function sortedBranches(rows: BranchRow[] | undefined): BranchRow[] {
  return [...(rows ?? [])].sort((a, b) => Number(b.is_head_office) - Number(a.is_head_office));
}

/** On Nepali pages we show the Nepali name when we have one. */
function localName(row: { name: string; name_ne: string | null }, locale: string): string {
  return locale === "ne" && row.name_ne ? row.name_ne : row.name;
}

export function toCard(row: ConsultancyRow, locale: string): ConsultancyCardData {
  const branches = sortedBranches(row.branches);
  const cities = [...new Set(branches.map((b) => b.city).filter((city): city is string => !!city))];
  return {
    slug: row.slug,
    name: localName(row, locale),
    nameNe: row.name_ne,
    city: cities[0] ?? null,
    cities,
    countries: row.countries ?? [],
    registrationStatus: row.registration_status,
    // Never show a score below 3 approved reviews.
    score: row.score_visible && row.avg_score !== null ? Number(row.avg_score) : null,
    reviewCount: row.review_count,
    verifiedReviewCount: row.verified_review_count,
  };
}

export function toBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    city: row.city,
    district: row.district,
    address: row.address,
    phone: row.phone,
    isHeadOffice: row.is_head_office,
  };
}

export function toDetail(row: ConsultancyRow, locale: string): ConsultancyDetail {
  return {
    ...toCard(row, locale),
    id: row.id,
    registrationNumber: row.registration_number,
    registrationSourceUrl: row.registration_source_url,
    registrationCheckedAt: row.registration_checked_at,
    officialGrade: row.official_grade,
    website: row.website,
    phone: row.phone,
    email: row.email,
    description: row.description,
    isClaimed: row.is_claimed,
    branches: sortedBranches(row.branches).map(toBranch),
  };
}

export function toReview(row: PublicReviewRow, locale: string, reply: PublicReply | null = null): ReviewWithCosts {
  return {
    id: row.id,
    consultancySlug: row.consultancy_slug,
    consultancyName: locale === "ne" && row.consultancy_name_ne ? row.consultancy_name_ne : row.consultancy_name,
    displayName: row.display_name,
    country: row.country,
    studyLevel: row.study_level,
    intakeYear: row.intake_year,
    outcome: row.outcome,
    ratings: {
      honesty: row.rating_honesty,
      communication: row.rating_communication,
      documents: row.rating_documents,
      speed: row.rating_speed,
      afterVisa: row.rating_after_visa,
    },
    overall: Number(row.overall),
    wentWell: row.went_well,
    wentBadly: row.went_badly,
    wouldRecommend: row.would_recommend,
    isVerified: row.is_verified,
    approvedAt: row.approved_at,
    reply,
    serviceChargeNpr: row.service_charge_npr,
    extraCostsNpr: row.extra_costs_npr,
  };
}
