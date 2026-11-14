import { Fraunces, Inter, Noto_Sans_Devanagari } from "next/font/google";

/**
 * Three fonts, all open, all loaded through next/font (self-hosted, no layout shift).
 *
 * Display: Fraunces. A sharp serif with real character, for headlines and big numbers.
 * Text:    Inter. Clean and very readable on cheap phone screens.
 * Nepali:  Noto Sans Devanagari. One variable file covers every weight.
 */
export const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export const fontText = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const fontDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-deva",
  display: "swap",
  // Only Nepali pages need it. The browser fetches it when it meets Devanagari text.
  preload: false,
});

export const fontVariables = [
  fontDisplay.variable,
  fontText.variable,
  fontDevanagari.variable,
].join(" ");
