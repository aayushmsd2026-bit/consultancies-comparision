import { PALETTE, WADA, type TokenName } from "@/config/palette";

function block(tokens: Record<TokenName, string>, indent: string): string {
  return Object.entries(tokens)
    .map(([name, hex]) => `${indent}--color-${name}: ${hex};`)
    .join("\n");
}

/** Builds src/styles/tokens.css from the palette. Pure: same palette, same text. */
export function buildTokensCss(): string {
  return `/*
 * GENERATED FILE. Do not edit by hand.
 * Source: src/config/palette.ts. Rebuild with: npm run tokens
 *
 * Sanzo Wada combination ${WADA.combination}:
 *   ${WADA.signature.name} ${WADA.signature.hex}, ${WADA.spark.name} ${WADA.spark.hex}, ${WADA.ink.name} ${WADA.ink.hex}
 */

/* Light mode. "@theme" also tells Tailwind these colours exist (bg-paper, text-ink, ...). */
@theme {
  --color-*: initial;
${block(PALETTE.light, "  ")}
}

/* Dark mode when the phone or computer is set to dark. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${block(PALETTE.dark, "    ")}
  }
}

/* Force one mode on any part of a page: <section data-theme="dark">. */
[data-theme="light"] {
  color-scheme: light;
${block(PALETTE.light, "  ")}
}

[data-theme="dark"] {
  color-scheme: dark;
${block(PALETTE.dark, "  ")}
}
`;
}
