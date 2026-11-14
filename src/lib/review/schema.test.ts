import { describe, expect, it } from "vitest";
import { cleanText, reportSchema, reviewSchema, type ReviewInput } from "./schema";

const good: ReviewInput = {
  consultancySlug: "example-education",
  suggestedName: null,
  suggestedCity: null,
  branchId: null,
  country: "AU",
  studyLevel: "bachelor",
  intakeYear: new Date().getFullYear(),
  outcome: "visa_granted",
  serviceChargeNpr: 45000,
  extraCostsNpr: null,
  extraCostsNote: null,
  ratingHonesty: 5,
  ratingCommunication: 4,
  ratingDocuments: 4,
  ratingSpeed: 3,
  ratingAfterVisa: null,
  wentWell: "They explained every document clearly.",
  wentBadly: "The phone was rarely answered.",
  wouldRecommend: true,
  invitedByConsultancy: false,
  displayNameChoice: "initials",
};

const errorsOf = (input: unknown) => {
  const result = reviewSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
};

describe("cleanText", () => {
  it("removes invisible characters and tidies spacing", () => {
    expect(cleanText("  Hello​   world \r\n\r\n\r\n\r\nBye\u0007  ")).toBe("Hello world\n\nBye");
  });

  it("keeps Nepali text as it is", () => {
    expect(cleanText("राम्रो  सेवा।")).toBe("राम्रो सेवा।");
  });

  it("does not turn text into HTML or strip angle brackets silently", () => {
    // We never render user text as HTML, so the characters stay as plain text.
    expect(cleanText("<b>bold</b>")).toBe("<b>bold</b>");
  });
});

describe("reviewSchema", () => {
  it("accepts a good review", () => {
    expect(reviewSchema.safeParse(good).success).toBe(true);
  });

  it("needs a consultancy or a suggestion", () => {
    expect(errorsOf({ ...good, consultancySlug: null })).toEqual({ consultancySlug: "required" });
    expect(reviewSchema.safeParse({ ...good, consultancySlug: null, suggestedName: "Made-up New Place" }).success).toBe(true);
  });

  it("rejects ratings outside 1 to 5", () => {
    expect(errorsOf({ ...good, ratingHonesty: 0 })).toHaveProperty("ratingHonesty");
    expect(errorsOf({ ...good, ratingSpeed: 6 })).toHaveProperty("ratingSpeed");
    expect(errorsOf({ ...good, ratingDocuments: 3.5 })).toHaveProperty("ratingDocuments");
    expect(errorsOf({ ...good, ratingCommunication: undefined })).toHaveProperty("ratingCommunication");
  });

  it("rejects text that is too short or too long", () => {
    expect(errorsOf({ ...good, wentWell: "ok" })).toEqual({ wentWell: "tooShort" });
    expect(errorsOf({ ...good, wentBadly: "x".repeat(2001) })).toEqual({ wentBadly: "tooLong" });
    // Padding with spaces does not get around the minimum.
    expect(errorsOf({ ...good, wentWell: "ok          " })).toEqual({ wentWell: "tooShort" });
  });

  it("rejects wrong money amounts", () => {
    expect(errorsOf({ ...good, serviceChargeNpr: -1 })).toEqual({ serviceChargeNpr: "notNegative" });
    expect(errorsOf({ ...good, extraCostsNpr: 99_000_000 })).toEqual({ extraCostsNpr: "tooMuch" });
    expect(errorsOf({ ...good, serviceChargeNpr: 100.5 })).toEqual({ serviceChargeNpr: "wholeNumber" });
  });

  it("rejects unknown choices and far-away years", () => {
    expect(errorsOf({ ...good, country: "XX" })).toHaveProperty("country");
    expect(errorsOf({ ...good, outcome: "won_lottery" })).toHaveProperty("outcome");
    expect(errorsOf({ ...good, intakeYear: 1999 })).toEqual({ intakeYear: "required" });
    expect(errorsOf({ ...good, consultancySlug: "Not A Slug" })).toHaveProperty("consultancySlug");
  });

  it("does not let a visitor set fields that only an admin decides", () => {
    const parsed = reviewSchema.parse({ ...good, status: "approved", isVerified: true, userId: "someone-else" });
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("isVerified");
    expect(parsed).not.toHaveProperty("userId");
  });
});

describe("reportSchema", () => {
  it("accepts a report and rejects a bad reason", () => {
    const id = "e0000000-0000-4000-8000-000000000001";
    expect(reportSchema.safeParse({ reviewId: id, reason: "fake", details: "" }).success).toBe(true);
    expect(reportSchema.safeParse({ reviewId: id, reason: "because", details: "" }).success).toBe(false);
    expect(reportSchema.safeParse({ reviewId: "1", reason: "fake", details: "" }).success).toBe(false);
  });
});
