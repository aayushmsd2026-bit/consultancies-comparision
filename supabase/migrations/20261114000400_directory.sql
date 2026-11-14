-- =============================================================================
-- 4. Helpers for the public directory
-- =============================================================================

-- A score is shown only from 3 approved reviews (src/config/ranking.ts, minReviewsToShowScore).
-- Lists sorted by rating put consultancies with a visible score first.
alter table public.consultancies
  add column score_visible boolean generated always as (review_count >= 3) stored;

create index consultancies_directory on public.consultancies (score_visible desc, rank_score desc, name);

-- The cities that have at least one listed branch, for the city filter.
-- security_invoker: the view follows the same rules as the branches table.
create view public.public_cities
with (security_invoker = true)
as
select b.city, count(distinct b.consultancy_id)::integer as consultancy_count
from public.branches b
where b.city is not null and b.city <> ''
group by b.city;

revoke all on public.public_cities from anon, authenticated;
grant select on public.public_cities to anon, authenticated;
