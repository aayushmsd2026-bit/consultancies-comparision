import { describe, expect, it } from "vitest";
import { computeConsultancyStats } from "./stats";
import type { Outcome, ReviewWithCosts } from "./types";

function review(changes: Partial<ReviewWithCosts> = {}): ReviewWithCosts {
  return {
    id: "r",
    consultancySlug: "example-education",
    consultancyName: "Example Education Pvt. Ltd.",
    displayName: null,
    country: "AU",
    studyLevel: "bachelor",
    intakeYear: 2026,
    outcome: "visa_granted",
    ratings: { honesty: 4, communication: 4, documents: 4, speed: 4, afterVisa: null },
    overall: 4,
    wentWell: "Good.",
    wentBadly: "Slow.",
    wouldRecommend: true,
    isVerified: false,
    approvedAt: "2026-10-01T00:00:00Z",
    reply: null,
    serviceChargeNpr: null,
    extraCostsNpr: null,
    ...changes,
  };
}

const outcomes = (...list: Outcome[]) => list.map((outcome) => review({ outcome }));

describe("computeConsultancyStats", () => {
  it("has nothing to say with no reviews", () => {
    expect(computeConsultancyStats([])).toMatchObject({
      reviewCount: 0,
      verifiedShare: null,
      visaGrantedShare: null,
      serviceChargeRange: null,
      ratingAverages: null,
    });
  });

  it("works out the verified share", () => {
    const stats = computeConsultancyStats([review({ isVerified: true }), review(), review(), review()]);
    expect(stats.verifiedShare).toBe(0.25);
  });

  it("counts the visa share over finished cases only", () => {
    const stats = computeConsultancyStats(
      outcomes("visa_granted", "visa_granted", "visa_granted", "visa_refused", "in_process", "withdrew"),
    );
    expect(stats.decidedCount).toBe(4);
    expect(stats.visaGrantedShare).toBe(0.75);
  });

  it("does not show a visa share from fewer than 3 finished cases", () => {
    expect(computeConsultancyStats(outcomes("visa_granted", "visa_refused", "in_process")).visaGrantedShare).toBeNull();
  });

  it("gives the middle half of the service charges", () => {
    const charges = [20000, 30000, 40000, 50000, 200000];
    const stats = computeConsultancyStats(charges.map((serviceChargeNpr) => review({ serviceChargeNpr })));
    // One very high amount does not stretch the range.
    expect(stats.serviceChargeRange).toEqual({ low: 30000, high: 50000, count: 5 });
  });

  it("does not show a charge range from fewer than 4 amounts", () => {
    const stats = computeConsultancyStats([20000, 30000, null, 0].map((serviceChargeNpr) => review({ serviceChargeNpr })));
    expect(stats.serviceChargeRange).toBeNull();
  });

  it("averages each rating and skips missing after-visa ratings", () => {
    const stats = computeConsultancyStats([
      review({ ratings: { honesty: 5, communication: 3, documents: 4, speed: 2, afterVisa: 4 } }),
      review({ ratings: { honesty: 3, communication: 3, documents: 2, speed: 4, afterVisa: null } }),
    ]);
    expect(stats.ratingAverages).toEqual({ honesty: 4, communication: 3, documents: 3, speed: 3, afterVisa: 4 });
  });
});
