import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { searchConsultancies } from "@/lib/data/public";
import { allowRequest } from "@/lib/rate-limit-memory";
import type { ConsultancySummary } from "@/lib/types";

/**
 * Search suggestions: GET /api/search?q=example&locale=en
 * Returns only what the suggestion list shows.
 * Limited to 300 requests a minute per internet address. Many students can share one
 * address on a mobile network or a college Wi-Fi, so the limit is generous.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(`search:${ip}`, 300, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const params = request.nextUrl.searchParams;
  const query = (params.get("q") ?? "").trim().slice(0, 80);
  const requested = params.get("locale");
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  if (query.length < 2) return NextResponse.json({ results: [] });

  const found = await searchConsultancies(query.toLowerCase(), locale, 8);
  const results: ConsultancySummary[] = found.map((c) => ({
    slug: c.slug,
    name: c.name,
    nameNe: c.nameNe,
    city: c.city,
    registrationStatus: c.registrationStatus,
    score: c.score,
    reviewCount: c.reviewCount,
  }));

  return NextResponse.json(
    { results },
    // The same search from many visitors is answered by the network edge for a minute.
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
