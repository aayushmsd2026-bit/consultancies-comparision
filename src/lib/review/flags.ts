/**
 * Automatic flags that help the admin spot reviews to look at twice.
 * A flag never rejects or hides anything. A person always decides.
 */
export const REVIEW_FLAGS = ["burst", "short_extreme", "phone", "email", "name"] as const;
export type ReviewFlag = (typeof REVIEW_FLAGS)[number];

export type FlagInput = {
  wentWell: string;
  wentBadly: string;
  /** The five ratings, 1 to 5. Missing ones are left out. */
  ratings: number[];
  /** How many reviews this consultancy received in the 24 hours around this review, this one included. */
  reviewsForConsultancyIn24h: number;
};

const BURST_LIMIT = 3;
const SHORT_TEXT = 40;

// Nepali mobile numbers (97, 98 + 8 digits), landlines, and anything that looks like a long phone number.
const PHONE = /(?:\+?977[\s-]?)?(?:9[678]\d{8}|0\d{1,2}[\s-]?\d{6,7})|\b\d[\d\s-]{8,}\d\b/;
const DEVANAGARI_PHONE = /[०-९]{10}/;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
// A rough guess only: a title followed by one or two capitalised words ("Mr. Ram Sharma", "Sita madam").
const NAME_AFTER_TITLE = /\b(?:Mr|Mrs|Ms|Miss|Dr|Sir|Madam|Ma'am)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/;
const NAME_BEFORE_TITLE = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:sir|madam|ma'am|dai|didi|ji)\b/;

export function computeFlags(input: FlagInput): ReviewFlag[] {
  const flags: ReviewFlag[] = [];
  const text = `${input.wentWell}\n${input.wentBadly}`;

  if (input.reviewsForConsultancyIn24h > BURST_LIMIT) flags.push("burst");

  const allSame = input.ratings.length > 0 && input.ratings.every((value) => value === input.ratings[0]);
  const extreme = allSame && (input.ratings[0] === 5 || input.ratings[0] === 1);
  if (extreme && input.wentWell.trim().length + input.wentBadly.trim().length < SHORT_TEXT) flags.push("short_extreme");

  if (PHONE.test(text) || DEVANAGARI_PHONE.test(text)) flags.push("phone");
  if (EMAIL.test(text)) flags.push("email");
  if (NAME_AFTER_TITLE.test(text) || NAME_BEFORE_TITLE.test(text)) flags.push("name");

  return flags;
}
