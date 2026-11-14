import { describe, expect, it } from "vitest";
import { computeFlags, type FlagInput } from "./flags";

const base: FlagInput = {
  wentWell: "They explained every document I needed and my file was ready early.",
  wentBadly: "The office was hard to reach by phone and I had to visit three times.",
  ratings: [4, 3, 5, 4],
  reviewsForConsultancyIn24h: 1,
};

describe("computeFlags", () => {
  it("raises nothing for an ordinary review", () => {
    expect(computeFlags(base)).toEqual([]);
  });

  it("flags more than 3 reviews for one consultancy in 24 hours", () => {
    expect(computeFlags({ ...base, reviewsForConsultancyIn24h: 3 })).toEqual([]);
    expect(computeFlags({ ...base, reviewsForConsultancyIn24h: 4 })).toEqual(["burst"]);
  });

  it("flags very short text with all 5s or all 1s", () => {
    expect(computeFlags({ ...base, wentWell: "Best ever.", wentBadly: "Nothing bad.", ratings: [5, 5, 5, 5] })).toEqual(["short_extreme"]);
    expect(computeFlags({ ...base, wentWell: "Nothing.", wentBadly: "Very bad.", ratings: [1, 1, 1, 1, 1] })).toEqual(["short_extreme"]);
    // Short but mixed ratings, or extreme but detailed: no flag.
    expect(computeFlags({ ...base, wentWell: "Fine.", wentBadly: "Slow.", ratings: [5, 4, 5, 5] })).toEqual([]);
    expect(computeFlags({ ...base, ratings: [5, 5, 5, 5] })).toEqual([]);
  });

  it("flags phone numbers, also with spaces, a country code or Nepali digits", () => {
    for (const text of ["Call 9800000000 now", "my number is +977 98-0000-0000", "फोन ९८००००००००", "landline 01-4000000"]) {
      expect(computeFlags({ ...base, wentBadly: text }), text).toContain("phone");
    }
    // Money and years are not phone numbers.
    expect(computeFlags({ ...base, wentBadly: "I paid Rs 45,000 in 2025 and 20000 more later for documents." })).toEqual([]);
  });

  it("flags email addresses", () => {
    expect(computeFlags({ ...base, wentWell: "Write to someone@example.com for details about this." })).toContain("email");
  });

  it("makes a rough guess at staff names", () => {
    expect(computeFlags({ ...base, wentBadly: "Mr. Demo Person shouted at me in the office." })).toContain("name");
    expect(computeFlags({ ...base, wentBadly: "Sample madam was very rude to my father that day." })).toContain("name");
    expect(computeFlags({ ...base, wentBadly: "The counsellor was rude to my father that day." })).not.toContain("name");
  });
});
