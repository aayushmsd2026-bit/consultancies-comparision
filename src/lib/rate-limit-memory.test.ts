import { describe, expect, it } from "vitest";
import { allowRequest } from "./rate-limit-memory";

describe("allowRequest", () => {
  it("allows up to the limit, then blocks, then allows again after the window", () => {
    const key = `test-${Math.random()}`;
    expect(allowRequest(key, 2, 1000, 0)).toBe(true);
    expect(allowRequest(key, 2, 1000, 10)).toBe(true);
    expect(allowRequest(key, 2, 1000, 20)).toBe(false);
    expect(allowRequest(key, 2, 1000, 1001)).toBe(true);
  });

  it("counts each visitor separately", () => {
    expect(allowRequest("a-visitor", 1, 1000, 0)).toBe(true);
    expect(allowRequest("another-visitor", 1, 1000, 0)).toBe(true);
  });
});
