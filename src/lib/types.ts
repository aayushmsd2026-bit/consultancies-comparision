/**
 * Shapes of the data the public site shows.
 * These never contain a reviewer's user id, email or phone.
 */

export const REGISTRATION_STATUSES = ["registered", "not_found", "expired", "unknown"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const OUTCOMES = ["visa_granted", "visa_refused", "withdrew", "in_process"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const STUDY_LEVELS = ["bachelor", "master", "phd", "diploma", "language", "other"] as const;
export type StudyLevel = (typeof STUDY_LEVELS)[number];

export const RATING_KEYS = ["honesty", "communication", "documents", "speed", "afterVisa"] as const;
export type RatingKey = (typeof RATING_KEYS)[number];

/** Each rating is 1 to 5. After-visa support can be missing. */
export type Ratings = {
  honesty: number;
  communication: number;
  documents: number;
  speed: number;
  afterVisa: number | null;
};

export type PublicReply = {
  body: string;
  createdAt: string; // ISO date
};

export type PublicReview = {
  id: string;
  consultancySlug: string;
  consultancyName: string;
  /** Already shaped by the reviewer's choice: full name, initials, or null for anonymous. */
  displayName: string | null;
  country: string; // code from src/config/countries.ts
  studyLevel: StudyLevel;
  intakeYear: number;
  outcome: Outcome;
  ratings: Ratings;
  overall: number;
  wentWell: string;
  wentBadly: string;
  wouldRecommend: boolean;
  isVerified: boolean;
  approvedAt: string; // ISO date
  reply: PublicReply | null;
};

export type ConsultancySummary = {
  slug: string;
  name: string;
  nameNe: string | null;
  city: string | null;
  registrationStatus: RegistrationStatus;
  /** Null when there are fewer than 3 approved reviews. Never show an empty score. */
  score: number | null;
  reviewCount: number;
};
