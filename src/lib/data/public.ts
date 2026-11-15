/**
 * Everything the public pages read from the database.
 *
 * Each function is cached ("use cache") and tagged. Pages are served from the
 * cache, which keeps the site fast on slow data and light on the database.
 * When an admin approves a review or edits a consultancy, the matching tags
 * are refreshed (see src/lib/data/tags.ts).
 *
 * These functions use the public key only. They can never see pending reviews,
 * proof files or who wrote a review.
 */
import { cacheLife, cacheTag } from "next/cache";
import { getPublicClient } from "@/lib/supabase/public";
import type { ConsultancyCardData, ConsultancyDetail, PublicReply, ReviewWithCosts } from "@/lib/types";
import {
  CONSULTANCY_CARD_COLUMNS,
  toCard,
  toDetail,
  toReview,
  type ConsultancyRow,
  type PublicReviewRow,
} from "./mappers";
import { TAGS } from "./tags";

export const DIRECTORY_PAGE_SIZE = 24;
export const DIRECTORY_SORTS = ["rating", "reviews", "name"] as const;
export type DirectorySort = (typeof DIRECTORY_SORTS)[number];

export type DirectoryFilters = {
  q?: string;
  country?: string;
  city?: string;
  registeredOnly?: boolean;
  minRating?: number;
  sort?: DirectorySort;
  page?: number;
};

/** Keeps a search text safe inside a database filter. */
function cleanQuery(text: string): string {
  return text.replace(/[%_,()\\*"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function getSiteStats(): Promise<{ reviews: number; consultancies: number; verifiedReviews: number }> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.reviews, TAGS.consultancies);

  const db = getPublicClient();
  if (!db) return { reviews: 0, consultancies: 0, verifiedReviews: 0 };
  const [reviews, verified, consultancies] = await Promise.all([
    db.from("public_reviews").select("id", { count: "exact", head: true }),
    db.from("public_reviews").select("id", { count: "exact", head: true }).eq("is_verified", true),
    db.from("consultancies").select("id", { count: "exact", head: true }),
  ]);
  return {
    reviews: reviews.count ?? 0,
    verifiedReviews: verified.count ?? 0,
    consultancies: consultancies.count ?? 0,
  };
}

/** Adds the approved consultancy replies to a list of reviews. */
async function attachReplies(rows: PublicReviewRow[], locale: string): Promise<ReviewWithCosts[]> {
  const db = getPublicClient();
  if (!db || rows.length === 0) return [];
  const { data } = await db
    .from("public_replies")
    .select("review_id, body, created_at")
    .in("review_id", rows.map((row) => row.id))
    .order("created_at", { ascending: true });
  const replies = new Map<string, PublicReply>();
  for (const reply of data ?? []) {
    if (!replies.has(reply.review_id)) replies.set(reply.review_id, { body: reply.body, createdAt: reply.created_at });
  }
  return rows.map((row) => toReview(row, locale, replies.get(row.id) ?? null));
}

export async function getLatestReviews(locale: string, limit = 4): Promise<ReviewWithCosts[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.reviews);

  const db = getPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("public_reviews")
    .select("*")
    .order("approved_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load the latest reviews: ${error.message}`);
  return attachReplies((data ?? []) as PublicReviewRow[], locale);
}

/** The best-ranked consultancies for one study destination. Only those with a visible score. */
export async function getTopRatedByCountry(country: string, locale: string, limit = 4): Promise<ConsultancyCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.consultancies, TAGS.reviews);

  const db = getPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("consultancies")
    .select(CONSULTANCY_CARD_COLUMNS)
    .contains("countries", [country])
    .eq("score_visible", true)
    .order("rank_score", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load top rated consultancies: ${error.message}`);
  return ((data ?? []) as unknown as ConsultancyRow[]).map((row) => toCard(row, locale));
}

export async function listConsultancies(
  filters: DirectoryFilters,
  locale: string,
): Promise<{ items: ConsultancyCardData[]; total: number; page: number; pageCount: number }> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.consultancies, TAGS.reviews);

  const db = getPublicClient();
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  if (!db) return { items: [], total: 0, page, pageCount: 0 };

  // Filtering by city needs the branch to be part of the match ("!inner").
  const columns = filters.city
    ? CONSULTANCY_CARD_COLUMNS.replace("branches(", "branches!inner(")
    : CONSULTANCY_CARD_COLUMNS;
  let query = db.from("consultancies").select(columns, { count: "exact" });

  const q = cleanQuery(filters.q ?? "");
  if (q) query = query.or(`name.ilike.%${q}%,name_ne.ilike.%${q}%`);
  if (filters.country) query = query.contains("countries", [filters.country]);
  if (filters.city) query = query.eq("branches.city", filters.city);
  if (filters.registeredOnly) query = query.eq("registration_status", "registered");
  if (filters.minRating) query = query.eq("score_visible", true).gte("avg_score", filters.minRating);

  const sort = filters.sort ?? "rating";
  if (sort === "name") {
    query = query.order("name");
  } else if (sort === "reviews") {
    query = query.order("review_count", { ascending: false }).order("name");
  } else {
    // Consultancies with a visible score first, by the public ranking formula.
    query = query
      .order("score_visible", { ascending: false })
      .order("rank_score", { ascending: false })
      .order("name");
  }

  const from = (page - 1) * DIRECTORY_PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + DIRECTORY_PAGE_SIZE - 1);
  if (error) {
    // Asking for a page past the end is not a failure. It is an empty page.
    if (error.code === "PGRST103") return { items: [], total: 0, page, pageCount: 0 };
    throw new Error(`Could not load the directory: ${error.message}`);
  }

  let rows = (data ?? []) as unknown as ConsultancyRow[];
  if (filters.city && rows.length > 0) {
    // The city filter trimmed the branch list to that city. Load all cities for the cards.
    const { data: all } = await db
      .from("branches")
      .select("consultancy_id, city, is_head_office")
      .in("consultancy_id", rows.map((row) => row.id));
    rows = rows.map((row) => ({
      ...row,
      branches: (all ?? []).filter((b) => b.consultancy_id === row.id) as unknown as ConsultancyRow["branches"],
    }));
  }

  const total = count ?? 0;
  return {
    items: rows.map((row) => toCard(row, locale)),
    total,
    page,
    pageCount: Math.ceil(total / DIRECTORY_PAGE_SIZE),
  };
}

/** Cities that have at least one listed branch, biggest first. */
export async function getCities(): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.consultancies);

  const db = getPublicClient();
  if (!db) return [];
  const { data } = await db
    .from("public_cities")
    .select("city, consultancy_count")
    .order("consultancy_count", { ascending: false })
    .order("city")
    .limit(60);
  return (data ?? []).map((row) => row.city as string);
}

export async function getConsultancy(slug: string, locale: string): Promise<ConsultancyDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.consultancies, TAGS.consultancy(slug));

  const db = getPublicClient();
  if (!db) return null;
  const { data, error } = await db
    .from("consultancies")
    .select("*, branches(id, city, district, address, phone, is_head_office)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load the consultancy: ${error.message}`);
  return data ? toDetail(data as ConsultancyRow, locale) : null;
}

/** Every approved review of one consultancy, newest first. */
export async function getConsultancyReviews(slug: string, locale: string): Promise<ReviewWithCosts[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.reviews, TAGS.consultancy(slug));

  const db = getPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("public_reviews")
    .select("*")
    .eq("consultancy_slug", slug)
    .order("approved_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(`Could not load the reviews: ${error.message}`);
  return attachReplies((data ?? []) as PublicReviewRow[], locale);
}

/** Search by name for the typeahead and the registration checker. Forgives small typos. */
export async function searchConsultancies(query: string, locale: string, limit = 8): Promise<ConsultancyCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.consultancies);

  const db = getPublicClient();
  const q = query.trim().slice(0, 80);
  if (!db || q.length < 2) return [];
  const { data, error } = await db
    .rpc("search_consultancies", { query: q, max_results: limit })
    .select(CONSULTANCY_CARD_COLUMNS);
  if (error) throw new Error(`Search failed: ${error.message}`);
  return ((data ?? []) as unknown as ConsultancyRow[]).map((row) => toCard(row, locale));
}

/** The slugs of the best-ranked consultancies. Their pages are built ahead of time. */
export async function getTopSlugs(limit = 50): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.consultancies);

  const db = getPublicClient();
  if (!db) return [];
  const { data } = await db
    .from("consultancies")
    .select("slug")
    .order("score_visible", { ascending: false })
    .order("rank_score", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => row.slug as string);
}

/** One approved review, for the "report this review" page. */
export async function getPublicReview(id: string, locale: string): Promise<ReviewWithCosts | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.reviews);

  const db = getPublicClient();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("public_reviews").select("*").eq("id", id).maybeSingle();
  return data ? toReview(data as PublicReviewRow, locale) : null;
}

/** Every listed consultancy, for the sitemap. */
export async function getAllConsultancySlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.consultancies);

  const db = getPublicClient();
  if (!db) return [];
  const all: { slug: string; updatedAt: string }[] = [];
  for (let from = 0; from < 40_000; from += 1000) {
    const { data } = await db.from("consultancies").select("slug, updated_at").order("slug").range(from, from + 999);
    all.push(...(data ?? []).map((row) => ({ slug: row.slug as string, updatedAt: row.updated_at as string })));
    if (!data || data.length < 1000) break;
  }
  return all;
}
