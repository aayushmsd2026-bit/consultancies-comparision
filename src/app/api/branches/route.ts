import { NextResponse, type NextRequest } from "next/server";
import { getConsultancy } from "@/lib/data/public";
import { allowRequest } from "@/lib/rate-limit-memory";

/** The branches of one consultancy, for the "Which branch?" question: GET /api/branches?slug=example-education */
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(`branches:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return NextResponse.json({ branches: [] });

  const consultancy = await getConsultancy(slug, "en");
  const branches = (consultancy?.branches ?? []).map((branch) => ({
    id: branch.id,
    label: [branch.city, branch.address].filter(Boolean).join(" · "),
  }));
  return NextResponse.json({ branches }, { headers: { "Cache-Control": "public, s-maxage=300" } });
}
