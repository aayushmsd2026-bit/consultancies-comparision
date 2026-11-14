/**
 * Writes src/styles/tokens.css from src/config/palette.ts.
 * Run: npm run tokens
 */
import { writeFileSync } from "node:fs";
import { buildTokensCss } from "../src/lib/tokens-css";

writeFileSync("src/styles/tokens.css", buildTokensCss());
console.log("Wrote src/styles/tokens.css");
