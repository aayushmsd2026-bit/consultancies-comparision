import { describe, expect, it } from "vitest";
import { formatNpr, formatNumber, formatPercent, formatScore, localizeDigits } from "./format";

describe("number formatting", () => {
  it("groups the Nepali way", () => {
    expect(formatNumber(0, "en")).toBe("0");
    expect(formatNumber(999, "en")).toBe("999");
    expect(formatNumber(45000, "en")).toBe("45,000");
    expect(formatNumber(125000, "en")).toBe("1,25,000");
    expect(formatNumber(12345678, "en")).toBe("1,23,45,678");
  });

  it("uses Devanagari digits on Nepali pages", () => {
    expect(formatNumber(125000, "ne")).toBe("१,२५,०००");
    expect(localizeDigits("2026", "ne")).toBe("२०२६");
    expect(localizeDigits("2026", "en")).toBe("2026");
  });

  it("writes scores with one decimal", () => {
    expect(formatScore(4, "en")).toBe("4.0");
    expect(formatScore(4.25, "en")).toBe("4.3");
    expect(formatScore(4.2, "ne")).toBe("४.२");
  });

  it("writes money and percent", () => {
    expect(formatNpr(45000, "en")).toBe("Rs 45,000");
    expect(formatNpr(200000, "ne")).toBe("रु २,००,०००");
    expect(formatPercent(0.724, "en")).toBe("72%");
  });

  it("handles negative and broken numbers", () => {
    expect(formatNumber(-1500, "en")).toBe("-1,500");
    expect(formatNumber(-0.01, "en", 1)).toBe("0.0");
    expect(formatNumber(Number.NaN, "en")).toBe("");
  });
});
