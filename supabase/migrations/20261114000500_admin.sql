-- =============================================================================
-- 5. Helpers for the admin area
-- =============================================================================

-- Writes the scores of every consultancy in one go.
-- The numbers are worked out in the app by the one ranking function (src/lib/ranking.ts).
-- This function only stores them. It runs with the caller's rights, so the
-- security rules still apply: only an admin (or the server) can change consultancies.
--
-- scores: [{ "id": "...", "avg_score": 4.2, "review_count": 12, "verified_review_count": 5, "rank_score": 4.05 }, ...]
-- default_rank: the rank score of a consultancy with no approved reviews (the site average).
create or replace function public.apply_consultancy_scores(scores jsonb, default_rank numeric)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.consultancies c
  set avg_score = s.avg_score,
      review_count = s.review_count,
      verified_review_count = s.verified_review_count,
      rank_score = s.rank_score
  from jsonb_to_recordset(scores)
    as s(id uuid, avg_score numeric, review_count integer, verified_review_count integer, rank_score numeric)
  where c.id = s.id
    and (c.avg_score, c.review_count, c.verified_review_count, c.rank_score)
      is distinct from (s.avg_score, s.review_count, s.verified_review_count, s.rank_score);

  -- Consultancies that have no approved reviews (any more).
  update public.consultancies c
  set avg_score = null, review_count = 0, verified_review_count = 0, rank_score = default_rank
  where not exists (select 1 from jsonb_to_recordset(scores) as s(id uuid) where s.id = c.id)
    and (c.avg_score is not null or c.review_count <> 0 or c.rank_score is distinct from default_rank);
end;
$$;

revoke all on function public.apply_consultancy_scores(jsonb, numeric) from public, anon;
grant execute on function public.apply_consultancy_scores(jsonb, numeric) to authenticated, service_role;

-- Admins can read the proof list and files (already allowed) and need to see
-- who suggested a consultancy.
grant select on public.consultancy_suggestions to authenticated;

create policy "Admins can read suggestions"
  on public.consultancy_suggestions for select
  to authenticated
  using ((select public.is_admin()));
