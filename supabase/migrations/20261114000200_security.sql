-- =============================================================================
-- 2. Security rules (Row Level Security)
--
-- In plain words:
--   * The public can read approved consultancies, their branches, approved
--     reviews and approved replies. Nothing else.
--   * The public never reads the "reviews" table itself. It reads the view
--     "public_reviews", which has no user id, no email and no phone in it.
--   * A signed-in person can add a review, and read or edit their own review
--     while it is waiting (pending or needs_proof).
--   * Only an admin can change a status, mark a review verified, or change
--     anything on a consultancy.
--   * Proof files: the uploader can add and read their own. An admin can read
--     and delete. Nobody else.
-- =============================================================================

-- True when the signed-in person is an admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- True for an admin, and for the server itself (service role, SQL editor, seed).
-- Visitors and normal signed-in people connect as "anon" or "authenticated".
create or replace function public.is_privileged()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user not in ('anon', 'authenticated') or public.is_admin();
$$;

-- "Sita Kumari Sharma" -> "S. K. S."
create or replace function public.initials(full_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    array_to_string(
      array(
        select upper(left(part, 1)) || '.'
        from unnest(regexp_split_to_array(btrim(coalesce(full_name, '')), '\s+')) as part
        where part <> ''
      ),
      ' '
    ),
    ''
  );
$$;

-- -----------------------------------------------------------------------------
-- Switch Row Level Security on for every table. With no rule, nobody gets in.
-- -----------------------------------------------------------------------------
alter table public.consultancies enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.review_proofs enable row level security;
alter table public.replies enable row level security;
alter table public.reports enable row level security;
alter table public.consultancy_suggestions enable row level security;
alter table public.audit_log enable row level security;
alter table public.rate_limits enable row level security;

-- Visitors who are not signed in have no business in these tables at all.
revoke all on public.profiles, public.reviews, public.review_proofs, public.replies,
  public.reports, public.consultancy_suggestions, public.audit_log, public.rate_limits
  from anon;
-- Nobody but the server touches these.
revoke all on public.rate_limits, public.consultancy_suggestions from authenticated;
-- Visitors can only read consultancies and branches, never write.
revoke insert, update, delete, truncate on public.consultancies, public.branches from anon;

-- -----------------------------------------------------------------------------
-- consultancies and branches
-- -----------------------------------------------------------------------------
create policy "Anyone can read approved consultancies"
  on public.consultancies for select
  to anon, authenticated
  using (listing_status = 'approved');

create policy "Admins can do everything with consultancies"
  on public.consultancies for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone can read branches of approved consultancies"
  on public.branches for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.consultancies c
      where c.id = consultancy_id and c.listing_status = 'approved'
    )
  );

create policy "Admins can do everything with branches"
  on public.branches for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "People can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "People can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- A person may change their display name. Never their role.
revoke insert, update, delete, truncate on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
create policy "People can read their own reviews"
  on public.reviews for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "People can add their own review"
  on public.reviews for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "People can edit their own waiting review"
  on public.reviews for update
  to authenticated
  using (user_id = (select auth.uid()) and status in ('pending', 'needs_proof'))
  with check (user_id = (select auth.uid()));

create policy "Admins can update any review"
  on public.reviews for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete reviews"
  on public.reviews for delete
  to authenticated
  using ((select public.is_admin()));

revoke truncate on public.reviews from authenticated;

-- A new review from a normal person always starts clean:
-- pending, not verified, no approval date. Whatever they send.
create or replace function public.reviews_guard_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_privileged() then
    new.status := 'pending';
    new.is_verified := false;
    new.approved_at := null;
    new.rejection_reason := null;

    -- At most 5 new reviews per person in 24 hours.
    if (
      select count(*) from public.reviews
      where user_id = new.user_id and created_at > now() - interval '24 hours'
    ) >= 5 then
      raise exception 'Too many reviews in one day' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger reviews_guard_insert before insert on public.reviews
  for each row execute function public.reviews_guard_insert();

-- A normal person can fix their text and ratings. They cannot touch the fields
-- that only an admin decides.
create or replace function public.reviews_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_privileged() then
    if new.status is distinct from old.status
      or new.is_verified is distinct from old.is_verified
      or new.approved_at is distinct from old.approved_at
      or new.rejection_reason is distinct from old.rejection_reason
      or new.user_id is distinct from old.user_id
      or new.consultancy_id is distinct from old.consultancy_id
    then
      raise exception 'Only an admin can change this field' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger reviews_guard_update before update on public.reviews
  for each row execute function public.reviews_guard_update();

-- -----------------------------------------------------------------------------
-- review_proofs
-- -----------------------------------------------------------------------------
create policy "Uploaders and admins can read proofs"
  on public.review_proofs for select
  to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.reviews r
      where r.id = review_id and r.user_id = (select auth.uid())
    )
  );

create policy "Uploaders can add a proof to their own review"
  on public.review_proofs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id and r.user_id = (select auth.uid())
    )
  );

create policy "Admins can update proofs"
  on public.review_proofs for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete proofs"
  on public.review_proofs for delete
  to authenticated
  using ((select public.is_admin()));

revoke truncate on public.review_proofs from authenticated;

-- -----------------------------------------------------------------------------
-- replies, reports, audit_log: admin only. The public reads replies through a view.
-- Reports are written by the server after a rate-limit check.
-- -----------------------------------------------------------------------------
create policy "Admins can do everything with replies"
  on public.replies for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can do everything with reports"
  on public.reports for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can read the audit log"
  on public.audit_log for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can write the audit log"
  on public.audit_log for insert
  to authenticated
  with check ((select public.is_admin()) and actor_user_id = (select auth.uid()));

-- The audit log is a record. Nobody edits or deletes it through the app.
revoke update, delete, truncate on public.audit_log from authenticated;

-- -----------------------------------------------------------------------------
-- Public views. These are the ONLY way the public reads reviews and replies.
-- They list the safe columns one by one. There is no user id in them.
-- -----------------------------------------------------------------------------
create view public.public_reviews
with (security_invoker = false)
as
select
  r.id,
  r.consultancy_id,
  c.slug as consultancy_slug,
  c.name as consultancy_name,
  c.name_ne as consultancy_name_ne,
  r.branch_id,
  case r.display_name_choice
    when 'name' then p.display_name
    when 'initials' then public.initials(p.display_name)
    else null
  end as display_name,
  r.country,
  r.study_level,
  r.intake_year,
  r.outcome,
  r.service_charge_npr,
  r.extra_costs_npr,
  r.rating_honesty,
  r.rating_communication,
  r.rating_documents,
  r.rating_speed,
  r.rating_after_visa,
  r.overall,
  r.went_well,
  r.went_badly,
  r.would_recommend,
  r.is_verified,
  r.approved_at
from public.reviews r
join public.consultancies c on c.id = r.consultancy_id
join public.profiles p on p.id = r.user_id
where r.status = 'approved' and c.listing_status = 'approved';

create view public.public_replies
with (security_invoker = false)
as
select
  rp.id,
  rp.review_id,
  rp.consultancy_id,
  rp.body,
  rp.created_at
from public.replies rp
join public.reviews r on r.id = rp.review_id
where rp.status = 'approved' and r.status = 'approved';

revoke all on public.public_reviews, public.public_replies from anon, authenticated;
grant select on public.public_reviews, public.public_replies to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Search by name, forgiving of small spelling mistakes. Approved listings only.
-- -----------------------------------------------------------------------------
create or replace function public.search_consultancies(query text, max_results integer default 8)
returns setof public.consultancies
language sql
stable
set search_path = ''
as $$
  select c.*
  from public.consultancies c
  where c.listing_status = 'approved'
    and char_length(btrim(query)) >= 2
    and (
      c.name ilike '%' || btrim(query) || '%'
      or c.name_ne ilike '%' || btrim(query) || '%'
      -- "exampel educaton" still finds "Example Education Pvt. Ltd."
      or extensions.word_similarity(btrim(query), c.name) > 0.45
    )
  order by
    (c.name ilike btrim(query) || '%') desc,
    (c.name ilike '%' || btrim(query) || '%') desc,
    extensions.word_similarity(btrim(query), c.name) desc,
    c.rank_score desc
  limit least(greatest(max_results, 1), 50);
$$;

-- -----------------------------------------------------------------------------
-- Rate limit helper. Returns true when the request is allowed.
-- Example: select public.hit_rate_limit('report:1.2.3.4', 5, 3600);
-- Only the server may call it.
-- -----------------------------------------------------------------------------
create or replace function public.hit_rate_limit(limit_key text, max_hits integer, window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / window_seconds) * window_seconds);
  hits integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (limit_key, bucket, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into hits;

  -- Tidy up old counters now and then.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;

  return hits <= max_hits;
end;
$$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
