import { describe, expect, it } from "vitest";
import { contrastRatio, hexToOklch, hexToRgb, oklchToHex, rgbToHex } from "./color";

describe("colour maths", () => {
  it("reads and writes hex", () => {
    expect(rgbToHex(hexToRgb("#f48067"))).toBe("#f48067");
    expect(() => hexToRgb("red")).toThrow();
  });

  it("goes to OKLCH and back without changing the colour", () => {
    for (const hex of ["#f48067", "#fbe6a0", "#112f2c", "#000000", "#ffffff", "#3366cc"]) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });

  it("knows the reference values", () => {
    expect(hexToOklch("#ffffff").l).toBeCloseTo(1, 3);
    expect(hexToOklch("#ff0000").h).toBeCloseTo(29.23, 1);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it("pulls impossible colours back onto the screen", () => {
    const hex = oklchToHex({ l: 0.9, c: 0.4, h: 30 });
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(hexToOklch(hex).l).toBeCloseTo(0.9, 1);
  });
});
