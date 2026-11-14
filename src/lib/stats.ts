import { RATING_KEYS, type Ratings, type ReviewWithCosts } from "@/lib/types";

/**
 * The facts shown on a consultancy profile, worked out from its approved reviews.
 * Pure functions. Shares are 0 to 1. Anything without enough data is null.
 */
export type ConsultancyStats = {
  reviewCount: number;
  /** Share of reviews marked "Verified student". */
  verifiedShare: number | null;
  /** Share of finished cases (granted or refused) that ended with a visa. */
  visaGrantedShare: number | null;
  /** Number of finished cases behind visaGrantedShare. */
  decidedCount: number;
  /** The middle half of the service charges reviewers reported. Needs at least 4 amounts. */
  serviceChargeRange: { low: number; high: number; count: number } | null;
  /** Average of each of the five ratings. */
  ratingAverages: Ratings | null;
};

const MIN_CHARGES_FOR_RANGE = 4;

/** The value a given share of the way through a sorted list (0.25 = first quartile). */
function quantile(sorted: number[], share: number): number {
  const position = (sorted.length - 1) * share;
  const below = Math.floor(position);
  const above = Math.ceil(position);
  return sorted[below] + (sorted[above] - sorted[below]) * (position - below);
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export function computeConsultancyStats(reviews: readonly ReviewWithCosts[]): ConsultancyStats {
  const reviewCount = reviews.length;
  if (reviewCount === 0) {
    return {
      reviewCount: 0,
      verifiedShare: null,
      visaGrantedShare: null,
      decidedCount: 0,
      serviceChargeRange: null,
      ratingAverages: null,
    };
  }

  const granted = reviews.filter((r) => r.outcome === "visa_granted").length;
  const refused = reviews.filter((r) => r.outcome === "visa_refused").length;
  const decidedCount = granted + refused;

  const charges = reviews
    .map((r) => r.serviceChargeNpr)
    .filter((value): value is number => value !== null && value > 0)
    .sort((a, b) => a - b);

  const average = (key: (typeof RATING_KEYS)[number]): number | null => {
    const values = reviews.map((r) => r.ratings[key]).filter((v): v is number => v !== null);
    return values.length === 0 ? null : values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  return {
    reviewCount,
    verifiedShare: reviews.filter((r) => r.isVerified).length / reviewCount,
    visaGrantedShare: decidedCount >= 3 ? granted / decidedCount : null,
    decidedCount,
    serviceChargeRange:
      charges.length >= MIN_CHARGES_FOR_RANGE
        ? {
            low: roundTo(quantile(charges, 0.25), 1000),
            high: roundTo(quantile(charges, 0.75), 1000),
            count: charges.length,
          }
        : null,
    ratingAverages: {
      honesty: average("honesty") ?? 0,
      communication: average("communication") ?? 0,
      documents: average("documents") ?? 0,
      speed: average("speed") ?? 0,
      afterVisa: average("afterVisa"),
    },
  };
}
