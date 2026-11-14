import { RANKING, type RankingConfig } from "@/config/ranking";
import type { Ratings } from "@/lib/types";

/**
 * THE RANKING FORMULA. One place, pure functions, no database.
 *
 *   rank_score = (v / (v + m)) * R + (m / (v + m)) * C
 *
 *   R = the consultancy's average overall score (approved reviews only)
 *   v = how many approved reviews it has
 *   m = 5 (see src/config/ranking.ts)
 *   C = the average overall score of all approved reviews on the site
 *
 * A verified review counts as 1.5 reviews, an unverified one as 1.
 * That weight is used everywhere: in R, in v and in C.
 *
 * No payment, plan or setting can enter this function. It only sees reviews.
 */

export type ReviewForRanking = {
  consultancyId: string;
  /** 1 to 5. */
  overall: number;
  isVerified: boolean;
};

export type ConsultancyScore = {
  /** R. Null when the consultancy has no approved reviews. */
  avgScore: number | null;
  /** Plain count of approved reviews. */
  reviewCount: number;
  verifiedReviewCount: number;
  /** Used only to sort lists. */
  rankScore: number;
  /** False below 3 approved reviews: show "Not enough reviews yet". */
  showScore: boolean;
};

/** A review's overall score: the plain average of the ratings that were given. */
export function overallOf(ratings: Ratings): number {
  const given = [
    ratings.honesty,
    ratings.communication,
    ratings.documents,
    ratings.speed,
    ratings.afterVisa,
  ].filter((value): value is number => value !== null);
  return given.reduce((sum, value) => sum + value, 0) / given.length;
}

/** The Bayesian average itself. */
export function bayesianRank(R: number, v: number, C: number, m: number): number {
  if (v + m === 0) return C;
  return (v / (v + m)) * R + (m / (v + m)) * C;
}

/** The score of a consultancy that has no approved reviews. */
export function emptyScore(siteAverage: number | null): ConsultancyScore {
  return {
    avgScore: null,
    reviewCount: 0,
    verifiedReviewCount: 0,
    rankScore: siteAverage ?? 0,
    showScore: false,
  };
}

/**
 * Takes every approved review on the site and returns the scores of every
 * consultancy that has at least one. Give it approved reviews only.
 */
export function computeScores(
  reviews: readonly ReviewForRanking[],
  config: RankingConfig = RANKING,
): { siteAverage: number | null; byConsultancy: Map<string, ConsultancyScore> } {
  const weightOf = (review: ReviewForRanking) =>
    review.isVerified ? config.verifiedWeight : config.unverifiedWeight;

  let siteWeight = 0;
  let siteSum = 0;
  const groups = new Map<string, { weight: number; sum: number; count: number; verified: number }>();

  for (const review of reviews) {
    const weight = weightOf(review);
    siteWeight += weight;
    siteSum += weight * review.overall;

    const group = groups.get(review.consultancyId) ?? { weight: 0, sum: 0, count: 0, verified: 0 };
    group.weight += weight;
    group.sum += weight * review.overall;
    group.count += 1;
    if (review.isVerified) group.verified += 1;
    groups.set(review.consultancyId, group);
  }

  const siteAverage = siteWeight > 0 ? siteSum / siteWeight : null;
  const byConsultancy = new Map<string, ConsultancyScore>();

  for (const [consultancyId, group] of groups) {
    const R = group.sum / group.weight;
    byConsultancy.set(consultancyId, {
      avgScore: R,
      reviewCount: group.count,
      verifiedReviewCount: group.verified,
      rankScore: bayesianRank(R, group.weight, siteAverage ?? R, config.priorWeight),
      showScore: group.count >= config.minReviewsToShowScore,
    });
  }

  return { siteAverage, byConsultancy };
}
