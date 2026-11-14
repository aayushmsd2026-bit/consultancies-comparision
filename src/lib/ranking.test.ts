import { describe, expect, it } from "vitest";
import { RANKING } from "@/config/ranking";
import { bayesianRank, computeScores, emptyScore, overallOf, type ReviewForRanking } from "./ranking";

const review = (consultancyId: string, overall: number, isVerified = false): ReviewForRanking => ({
  consultancyId,
  overall,
  isVerified,
});

const many = (consultancyId: string, overall: number, count: number, isVerified = false) =>
  Array.from({ length: count }, () => review(consultancyId, overall, isVerified));

describe("overallOf", () => {
  it("averages five ratings", () => {
    expect(overallOf({ honesty: 5, communication: 4, documents: 3, speed: 2, afterVisa: 1 })).toBe(3);
  });

  it("leaves out after-visa support when it was not rated", () => {
    expect(overallOf({ honesty: 5, communication: 4, documents: 4, speed: 3, afterVisa: null })).toBe(4);
  });
});

describe("bayesianRank", () => {
  it("is the formula from the brief", () => {
    // v = 10, m = 5, R = 4.5, C = 3  ->  (10/15)*4.5 + (5/15)*3 = 4
    expect(bayesianRank(4.5, 10, 3, 5)).toBeCloseTo(4, 10);
  });

  it("equals the site average with no reviews", () => {
    expect(bayesianRank(0, 0, 3.4, 5)).toBe(3.4);
  });

  it("moves towards the consultancy's own average as reviews grow", () => {
    const few = bayesianRank(5, 2, 3, 5);
    const lots = bayesianRank(5, 200, 3, 5);
    expect(few).toBeLessThan(lots);
    expect(lots).toBeGreaterThan(4.9);
  });
});

describe("computeScores", () => {
  it("returns nothing when there are no reviews", () => {
    const { siteAverage, byConsultancy } = computeScores([]);
    expect(siteAverage).toBeNull();
    expect(byConsultancy.size).toBe(0);
    expect(emptyScore(siteAverage)).toMatchObject({ avgScore: null, rankScore: 0, showScore: false });
  });

  it("2 perfect reviews do not beat 80 good reviews", () => {
    // A normal site: most consultancies sit around 3 to 3.5.
    const rest = [...many("x", 3, 60), ...many("y", 3.5, 60), ...many("z", 2.5, 40)];
    const { byConsultancy } = computeScores([...many("tiny", 5, 2), ...many("big", 4.4, 80), ...rest]);
    expect(byConsultancy.get("tiny")!.avgScore).toBe(5);
    expect(byConsultancy.get("big")!.rankScore).toBeGreaterThan(byConsultancy.get("tiny")!.rankScore);
    // And the tiny one is not shown in "top rated" lists at all.
    expect(byConsultancy.get("tiny")!.showScore).toBe(false);
  });

  it("counts reviews and verified reviews plainly", () => {
    const { byConsultancy } = computeScores([review("a", 4, true), review("a", 2), review("a", 3)]);
    expect(byConsultancy.get("a")).toMatchObject({ reviewCount: 3, verifiedReviewCount: 1 });
  });

  it("gives a verified review the weight of 1.5 reviews in the average", () => {
    // verified 5 (weight 1.5) + unverified 1 (weight 1) -> (7.5 + 1) / 2.5 = 3.4
    const { byConsultancy, siteAverage } = computeScores([review("a", 5, true), review("a", 1)]);
    expect(byConsultancy.get("a")!.avgScore).toBeCloseTo(3.4, 10);
    expect(siteAverage).toBeCloseTo(3.4, 10);
  });

  it("uses the weights for v as well", () => {
    // Site: a has two verified 5s (v = 3), b has three unverified 3s (v = 3).
    // C = (3*5 + 3*3) / 6 = 4.   a: (3/8)*5 + (5/8)*4 = 4.375
    const { byConsultancy } = computeScores([...many("a", 5, 2, true), ...many("b", 3, 3)]);
    expect(byConsultancy.get("a")!.rankScore).toBeCloseTo(4.375, 10);
    expect(byConsultancy.get("b")!.rankScore).toBeCloseTo((3 / 8) * 3 + (5 / 8) * 4, 10);
  });

  it("shows a score only from 3 approved reviews", () => {
    const { byConsultancy } = computeScores([...many("two", 4, 2, true), ...many("three", 4, 3)]);
    // Two verified reviews weigh 3.0, but the rule counts reviews, not weight.
    expect(byConsultancy.get("two")!.showScore).toBe(false);
    expect(byConsultancy.get("three")!.showScore).toBe(true);
    expect(RANKING.minReviewsToShowScore).toBe(3);
  });

  it("gives the same result in any order", () => {
    const list = [review("a", 5, true), review("b", 2), review("a", 3), review("c", 4, true), review("b", 4)];
    const forward = computeScores(list);
    const backward = computeScores([...list].reverse());
    for (const id of ["a", "b", "c"]) {
      expect(backward.byConsultancy.get(id)!.rankScore).toBeCloseTo(forward.byConsultancy.get(id)!.rankScore, 10);
    }
  });

  it("keeps every score between 1 and 5", () => {
    const { byConsultancy } = computeScores([...many("low", 1, 40), ...many("high", 5, 40, true)]);
    for (const score of byConsultancy.values()) {
      expect(score.rankScore).toBeGreaterThanOrEqual(1);
      expect(score.rankScore).toBeLessThanOrEqual(5);
    }
  });
});
