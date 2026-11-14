import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeScores } from "@/lib/ranking";

/**
 * Works out the scores of every consultancy again and stores them.
 * Called after an admin approves, rejects or verifies a review.
 *
 * It reads all approved reviews and runs the ONE ranking function
 * (src/lib/ranking.ts). The site average changes with every approved review,
 * so every rank score can move a little. That is why all of them are redone.
 */
export async function recalculateScores(client: SupabaseClient): Promise<{ reviews: number; consultancies: number }> {
  type Row = { consultancy_id: string; overall: number; is_verified: boolean };
  const approved: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client
      .from("reviews")
      .select("consultancy_id, overall, is_verified")
      .eq("status", "approved")
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(`Could not read reviews: ${error.message}`);
    approved.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) break;
  }

  const { siteAverage, byConsultancy } = computeScores(
    approved.map((row) => ({
      consultancyId: row.consultancy_id,
      overall: Number(row.overall),
      isVerified: row.is_verified,
    })),
  );

  const scores = [...byConsultancy].map(([id, score]) => ({
    id,
    avg_score: score.avgScore === null ? null : Number(score.avgScore.toFixed(2)),
    review_count: score.reviewCount,
    verified_review_count: score.verifiedReviewCount,
    rank_score: Number(score.rankScore.toFixed(4)),
  }));

  const { error } = await client.rpc("apply_consultancy_scores", {
    scores,
    default_rank: Number((siteAverage ?? 0).toFixed(4)),
  });
  if (error) throw new Error(`Could not store the scores: ${error.message}`);
  return { reviews: approved.length, consultancies: scores.length };
}
