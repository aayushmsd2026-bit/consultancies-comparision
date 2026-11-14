import { describe, expect, it } from "vitest";
import { bestIndex, compareHref, parseCompareSlugs } from "./compare";

describe("bestIndex", () => {
  it("finds the highest or the lowest value", () => {
    expect(bestIndex([3.2, 4.5, 4.1], "higher")).toBe(1);
    expect(bestIndex([50000, 30000, null], "lower")).toBe(1);
  });

  it("gives no highlight on a tie or with one value", () => {
    expect(bestIndex([4, 4, 3], "higher")).toBeNull();
    expect(bestIndex([4, null], "higher")).toBeNull();
    expect(bestIndex([], "higher")).toBeNull();
  });
});

describe("parseCompareSlugs", () => {
  it("keeps up to three clean, different slugs", () => {
    expect(parseCompareSlugs("a-b, c ,a-b,d,e")).toEqual(["a-b", "c", "d"]);
    expect(parseCompareSlugs(["x", "y"])).toEqual(["x", "y"]);
    expect(parseCompareSlugs("<script>,ok,../etc")).toEqual(["ok"]);
    expect(parseCompareSlugs(undefined)).toEqual([]);
  });

  it("builds the address back", () => {
    expect(compareHref(["a", "b"])).toBe("/compare?c=a,b");
    expect(compareHref([])).toBe("/compare");
  });
});
