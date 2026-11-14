import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/color";
import { buildTokensCss } from "@/lib/tokens-css";
import { CONTRAST_PAIRS, PALETTE, WADA } from "./palette";

describe("brand palette", () => {
  it("names the Wada combination and its colours", () => {
    expect(WADA.combination).toBe(166);
    expect(WADA.signature.name).toBe("Grenadine Pink");
  });

  for (const mode of ["light", "dark"] as const) {
    describe(`${mode} mode contrast`, () => {
      for (const { fg, bg, min, use } of CONTRAST_PAIRS) {
        it(`${fg} on ${bg} is at least ${min}:1 (${use})`, () => {
          const ratio = contrastRatio(PALETTE[mode][fg], PALETTE[mode][bg]);
          expect(ratio, `${PALETTE[mode][fg]} on ${PALETTE[mode][bg]}`).toBeGreaterThanOrEqual(min);
        });
      }
    });
  }

  it("the CSS file matches palette.ts (run `npm run tokens` if this fails)", () => {
    const onDisk = readFileSync("src/styles/tokens.css", "utf8");
    expect(onDisk).toBe(buildTokensCss());
  });
});
