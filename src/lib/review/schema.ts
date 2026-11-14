/**
 * The rules a review must follow. The same rules run in the browser (for
 * friendly messages while typing) and on the server (which is the one we trust).
 *
 * Error messages here are short codes. The form turns them into sentences
 * from the message files (review.errors.*).
 */
import { z } from "zod";
import { COUNTRIES } from "@/config/countries";
import { OUTCOMES, STUDY_LEVELS } from "@/lib/types";

export const REVIEW_LIMITS = {
  textMin: 10,
  textMax: 2000,
  noteMax: 300,
  moneyMax: 10_000_000,
  nameMax: 120,
  proofMaxBytes: 5 * 1024 * 1024,
  proofTypes: ["image/jpeg", "image/png", "application/pdf"],
} as const;

/**
 * Cleans text typed by a visitor: removes invisible control characters,
 * tidies spaces and blank lines. The text is always shown as plain text, never as HTML.
 */
export function cleanText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const text = (min: number, max: number) =>
  z.string().transform(cleanText).pipe(z.string().min(min, "tooShort").max(max, "tooLong"));

const rating = z.number("required").int().min(1, "required").max(5);
const money = z.number().int("wholeNumber").min(0, "notNegative").max(REVIEW_LIMITS.moneyMax, "tooMuch").nullable();

export const intakeYearRange = (now = new Date()) => ({
  min: now.getFullYear() - 10,
  max: now.getFullYear() + 2,
});

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(100);

export const reviewSchema = z
  .object({
    /** The consultancy picked from the list. Empty when the reviewer suggests a new one. */
    consultancySlug: slug.nullable(),
    /** A consultancy that is missing from the list. The admin approves it before anything is public. */
    suggestedName: z.string().transform(cleanText).pipe(z.string().max(REVIEW_LIMITS.nameMax, "tooLong")).nullable(),
    suggestedCity: z.string().transform(cleanText).pipe(z.string().max(60, "tooLong")).nullable(),
    branchId: z.uuid().nullable(),
    country: z.enum(COUNTRIES, "required"),
    studyLevel: z.enum(STUDY_LEVELS, "required"),
    intakeYear: z.number("required").int(),
    outcome: z.enum(OUTCOMES, "required"),
    serviceChargeNpr: money,
    extraCostsNpr: money,
    extraCostsNote: z.string().transform(cleanText).pipe(z.string().max(REVIEW_LIMITS.noteMax, "tooLong")).nullable(),
    ratingHonesty: rating,
    ratingCommunication: rating,
    ratingDocuments: rating,
    ratingSpeed: rating,
    ratingAfterVisa: rating.nullable(),
    wentWell: text(REVIEW_LIMITS.textMin, REVIEW_LIMITS.textMax),
    wentBadly: text(REVIEW_LIMITS.textMin, REVIEW_LIMITS.textMax),
    wouldRecommend: z.boolean("required"),
    invitedByConsultancy: z.boolean(),
    displayNameChoice: z.enum(["name", "initials", "anonymous"], "required"),
  })
  .superRefine((value, ctx) => {
    const hasSuggestion = (value.suggestedName ?? "").length >= 2;
    if (!value.consultancySlug && !hasSuggestion) {
      ctx.addIssue({ code: "custom", path: ["consultancySlug"], message: "required" });
    }
    const { min, max } = intakeYearRange();
    if (value.intakeYear < min || value.intakeYear > max) {
      ctx.addIssue({ code: "custom", path: ["intakeYear"], message: "required" });
    }
  });

export type ReviewInput = z.input<typeof reviewSchema>;
export type ReviewData = z.output<typeof reviewSchema>;

export const REPORT_REASONS = ["fake", "abusive", "personal_info", "not_first_hand", "other"] as const;

export const reportSchema = z.object({
  reviewId: z.uuid(),
  reason: z.enum(REPORT_REASONS, "required"),
  details: z.string().transform(cleanText).pipe(z.string().max(1000, "tooLong")),
});

export type ReportData = z.output<typeof reportSchema>;
