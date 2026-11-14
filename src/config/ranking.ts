/**
 * Numbers used by the public ranking formula (CLAUDE.md section 9).
 * They are explained in plain words on /review-policy. If you change one, change that page too.
 */
export const RANKING = {
  /** "m": how many reviews a consultancy needs before its own average counts more than the site average. */
  priorWeight: 5,
  /** A verified review counts as this many reviews. */
  verifiedWeight: 1.5,
  /** An unverified review counts as this many reviews. */
  unverifiedWeight: 1,
  /** Below this many approved reviews we show "Not enough reviews yet" instead of a score. */
  minReviewsToShowScore: 3,
} as const;

export type RankingConfig = typeof RANKING;
