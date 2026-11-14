/**
 * THE BRAND PALETTE. This file is the only place colours are decided.
 *
 * Source: Sanzo Wada, "A Dictionary of Color Combinations", Volume 1.
 *
 *   Combination 166
 *     Grenadine Pink     #f48067   -> signature (brand, primary buttons, hero)
 *     Naples Yellow      #fbe6a0   -> spark (small highlights) and the hue of the paper
 *     Deep Slate Green   #112f2c   -> ink (text, dark surfaces)
 *
 * Wada lists these three together. Nothing is mixed in from another plate.
 * Hex values come from the open dataset "dictionary-of-colour-combinations" (MIT).
 * Run `npx tsx scripts/palette-explore.ts 166` to see it.
 *
 * Why 166: it is the Wada combination closest to the mood in DESIGN.md
 * (deep ink, warm paper, coral signature, a spark of yellow), and the ink
 * passes AA as text on the signature colour, so buttons stay readable.
 *
 * To change the palette: change WADA below (keep the three role names), then run
 *   npm run tokens     (rewrites src/styles/tokens.css)
 *   npm run test       (the contrast test must pass)
 * Every tint and shade below is derived in OKLCH from these hues. No new hues are added.
 */
import { hexToOklch, oklchToHex } from "@/lib/color";

export const WADA = {
  combination: 166,
  signature: { name: "Grenadine Pink", hex: "#f48067" },
  spark: { name: "Naples Yellow", hex: "#fbe6a0" },
  ink: { name: "Deep Slate Green", hex: "#112f2c" },
} as const;

type Role = "signature" | "spark" | "ink";

/** A shade of one Wada colour: same hue, new lightness and chroma. */
function shade(role: Role, l: number, c: number): string {
  return oklchToHex({ l, c, h: hexToOklch(WADA[role].hex).h });
}

const light = {
  // Paper: a very light tint of Naples Yellow. Warm, not white.
  paper: shade("spark", 0.975, 0.022),
  "paper-raised": shade("spark", 0.992, 0.01), // cards that sit on paper
  "paper-sunk": shade("spark", 0.945, 0.04), // quiet blocks, input backgrounds
  line: shade("spark", 0.86, 0.035), // hairlines, decoration only
  "line-strong": shade("ink", 0.56, 0.03), // borders of inputs (3:1 on paper)

  ink: WADA.ink.hex,
  "ink-soft": shade("ink", 0.43, 0.035), // secondary text

  signature: WADA.signature.hex,
  "signature-ink": WADA.ink.hex, // text on a signature background
  "signature-strong": shade("signature", 0.52, 0.17), // signature used as text on paper
  "signature-tint": shade("signature", 0.945, 0.03),
  "signature-press": shade("signature", 0.69, 0.15), // pressed state of the primary button
  "signature-graphic": shade("signature", 0.63, 0.17), // rings and bars drawn on paper (3:1)

  spark: WADA.spark.hex,
  "spark-ink": WADA.ink.hex,

  // Meaning colours. Same three hues. Always shown with an icon and a word.
  ok: shade("ink", 0.42, 0.085), // registered
  "ok-tint": shade("ink", 0.93, 0.04),
  warn: shade("spark", 0.47, 0.1), // expired
  "warn-tint": shade("spark", 0.92, 0.09),
  bad: shade("signature", 0.47, 0.17), // not found
  "bad-tint": shade("signature", 0.93, 0.04),

  focus: WADA.ink.hex, // focus ring
} as const;

export type TokenName = keyof typeof light;
type Tokens = Record<TokenName, string>;

// Dark mode: ink becomes the background, paper becomes the text.
const dark: Tokens = {
  paper: WADA.ink.hex,
  "paper-raised": shade("ink", 0.33, 0.04),
  "paper-sunk": shade("ink", 0.235, 0.032),
  line: shade("ink", 0.4, 0.04),
  "line-strong": shade("ink", 0.64, 0.04),

  ink: shade("spark", 0.96, 0.03),
  "ink-soft": shade("spark", 0.84, 0.035),

  signature: WADA.signature.hex,
  "signature-ink": WADA.ink.hex,
  "signature-strong": shade("signature", 0.78, 0.13),
  "signature-tint": shade("signature", 0.36, 0.06),
  "signature-press": shade("signature", 0.69, 0.15),
  "signature-graphic": WADA.signature.hex,

  spark: WADA.spark.hex,
  "spark-ink": WADA.ink.hex,

  ok: shade("ink", 0.86, 0.09),
  "ok-tint": shade("ink", 0.37, 0.06),
  warn: shade("spark", 0.88, 0.11),
  "warn-tint": shade("spark", 0.38, 0.06),
  bad: shade("signature", 0.84, 0.1),
  "bad-tint": shade("signature", 0.37, 0.08),

  focus: WADA.spark.hex,
};

export const PALETTE: { light: Tokens; dark: Tokens } = { light, dark };

/**
 * Every text-on-background pair the interface uses, with the contrast it needs.
 * 4.5 = normal text (WCAG AA). 3 = large text and interface parts.
 * The contrast test checks each pair in light and in dark mode.
 * If you use a new pair in a component, add it here first.
 */
export const CONTRAST_PAIRS: { fg: TokenName; bg: TokenName; min: 3 | 4.5; use: string }[] = [
  { fg: "ink", bg: "paper", min: 4.5, use: "body text" },
  { fg: "ink", bg: "paper-raised", min: 4.5, use: "text on cards" },
  { fg: "ink", bg: "paper-sunk", min: 4.5, use: "text in quiet blocks and inputs" },
  { fg: "ink-soft", bg: "paper", min: 4.5, use: "secondary text" },
  { fg: "ink-soft", bg: "paper-raised", min: 4.5, use: "secondary text on cards" },
  { fg: "ink-soft", bg: "paper-sunk", min: 4.5, use: "secondary text in quiet blocks" },
  { fg: "signature-ink", bg: "signature", min: 4.5, use: "primary button, hero text" },
  { fg: "signature-ink", bg: "signature-press", min: 4.5, use: "pressed primary button" },
  { fg: "signature-strong", bg: "paper", min: 4.5, use: "links, signature-coloured text" },
  { fg: "signature-strong", bg: "paper-raised", min: 4.5, use: "links on cards" },
  { fg: "ink", bg: "signature-tint", min: 4.5, use: "text on soft signature blocks" },
  { fg: "spark-ink", bg: "spark", min: 4.5, use: "text on a spark highlight" },
  { fg: "ok", bg: "ok-tint", min: 4.5, use: "registered badge" },
  { fg: "ok", bg: "paper", min: 4.5, use: "registered text" },
  { fg: "ok", bg: "paper-raised", min: 4.5, use: "registered text on cards" },
  { fg: "warn", bg: "warn-tint", min: 4.5, use: "expired badge" },
  { fg: "warn", bg: "paper", min: 4.5, use: "warning text" },
  { fg: "warn", bg: "paper-raised", min: 4.5, use: "warning text on cards" },
  { fg: "bad", bg: "bad-tint", min: 4.5, use: "not-found badge" },
  { fg: "bad", bg: "paper", min: 4.5, use: "error text" },
  { fg: "bad", bg: "paper-raised", min: 4.5, use: "error text on cards" },
  { fg: "line-strong", bg: "paper", min: 3, use: "input borders" },
  { fg: "line-strong", bg: "paper-raised", min: 3, use: "input borders on cards" },
  { fg: "line-strong", bg: "paper-sunk", min: 3, use: "input borders in quiet blocks" },
  { fg: "focus", bg: "paper", min: 3, use: "focus ring" },
  // On signature backgrounds the focus ring uses signature-ink (pair checked above).
  { fg: "signature-graphic", bg: "paper", min: 3, use: "score ring, rating bars" },
  { fg: "signature-graphic", bg: "paper-raised", min: 3, use: "score ring, rating bars on cards" },
  { fg: "signature-graphic", bg: "paper-sunk", min: 3, use: "rating bars in quiet blocks" },
];
