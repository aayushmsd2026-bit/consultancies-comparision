import { describe, expect, it } from "vitest";
import { formatDate } from "./dates";

describe("formatDate", () => {
  it("writes AD dates on English pages", () => {
    expect(formatDate("2026-10-29T06:00:00Z", "en")).toBe("29 Oct 2026");
  });

  it("writes Bikram Sambat dates on Nepali pages", () => {
    expect(formatDate("2026-10-29T06:00:00Z", "ne")).toBe("१२ कार्तिक २०८३");
    expect(formatDate("2024-04-13T06:00:00Z", "ne")).toBe("१ बैशाख २०८१");
  });

  it("uses the day in Nepal, not the day in London", () => {
    // 20:00 UTC is already the next day in Kathmandu (UTC+5:45).
    expect(formatDate("2026-10-28T20:00:00Z", "en")).toBe("29 Oct 2026");
    expect(formatDate("2026-10-28T20:00:00Z", "ne")).toBe("१२ कार्तिक २०८३");
  });

  it("returns an empty string for a broken date", () => {
    expect(formatDate("not a date", "en")).toBe("");
  });
});
