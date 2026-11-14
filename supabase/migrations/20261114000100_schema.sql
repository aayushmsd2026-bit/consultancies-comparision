-- =============================================================================
-- 1. Tables
-- The data model from CLAUDE.md section 7, plus the decisions in section 16.
-- Security rules are in the next migration file.
-- =============================================================================

-- Lets search forgive small spelling mistakes.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- Keeps updated_at correct on every change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- consultancies
-- -----------------------------------------------------------------------------
create table public.consultancies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 200),
  name_ne text,
  -- "pending" = suggested by a reviewer and not yet approved by the admin. Hidden from the public.
  listing_status text not null default 'approved' check (listing_status in ('approved', 'pending')),
  registration_status text not null default 'unknown'
    check (registration_status in ('registered', 'not_found', 'expired', 'unknown')),
  registration_number text,
  registration_source_url text,
  registration_checked_at timestamptz,
  official_grade text,
  website text,
  phone text,
  email text,
  description text,
  countries text[] not null default '{}',
  is_claimed boolean not null default false,
  -- The four numbers below are written only by the score recalculation (src/lib/ranking.ts).
  avg_score numeric(3, 2) check (avg_score between 1 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  verified_review_count integer not null default 0 check (verified_review_count >= 0),
  rank_score numeric(6, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index consultancies_name_trgm on public.consultancies using gin (name extensions.gin_trgm_ops);
create index consultancies_name_ne_trgm on public.consultancies using gin (name_ne extensions.gin_trgm_ops);
create index consultancies_rank on public.consultancies (rank_score desc);
create index consultancies_countries on public.consultancies using gin (countries);

create trigger consultancies_updated_at before update on public.consultancies
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- branches
-- -----------------------------------------------------------------------------
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  consultancy_id uuid not null references public.consultancies (id) on delete cascade,
  city text,
  district text,
  address text,
  phone text,
  is_head_office boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index branches_consultancy on public.branches (consultancy_id);
create index branches_city on public.branches (city);

create trigger branches_updated_at before update on public.branches
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- profiles: one row per signed-in person
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates the profile when someone signs in for the first time.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  consultancy_id uuid not null references public.consultancies (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'needs_proof')),
  country text not null check (char_length(country) between 2 and 5),
  study_level text not null
    check (study_level in ('bachelor', 'master', 'phd', 'diploma', 'language', 'other')),
  intake_year integer not null check (intake_year between 2000 and 2100),
  outcome text not null check (outcome in ('visa_granted', 'visa_refused', 'withdrew', 'in_process')),
  service_charge_npr integer check (service_charge_npr between 0 and 100000000),
  extra_costs_npr integer check (extra_costs_npr between 0 and 100000000),
  extra_costs_note text check (char_length(extra_costs_note) <= 500),
  rating_honesty smallint not null check (rating_honesty between 1 and 5),
  rating_communication smallint not null check (rating_communication between 1 and 5),
  rating_documents smallint not null check (rating_documents between 1 and 5),
  rating_speed smallint not null check (rating_speed between 1 and 5),
  rating_after_visa smallint check (rating_after_visa between 1 and 5),
  -- The plain average of the ratings that were given. The database works it out.
  overall numeric(3, 2) generated always as (
    round(
      (rating_honesty + rating_communication + rating_documents + rating_speed
        + coalesce(rating_after_visa, 0))::numeric
      / (4 + (rating_after_visa is not null)::integer),
      2
    )
  ) stored,
  went_well text not null check (char_length(went_well) between 1 and 3000),
  went_badly text not null check (char_length(went_badly) between 1 and 3000),
  would_recommend boolean not null,
  is_verified boolean not null default false,
  invited_by_consultancy boolean not null default false,
  display_name_choice text not null default 'anonymous'
    check (display_name_choice in ('name', 'initials', 'anonymous')),
  rejection_reason text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One review per person per consultancy.
  constraint reviews_one_per_user_per_consultancy unique (user_id, consultancy_id)
);

create index reviews_public_list on public.reviews (consultancy_id, approved_at desc)
  where status = 'approved';
create index reviews_queue on public.reviews (status, created_at desc);
create index reviews_user on public.reviews (user_id);

create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- review_proofs: the files live in a private Storage bucket
-- -----------------------------------------------------------------------------
create table public.review_proofs (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  checked_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index review_proofs_review on public.review_proofs (review_id);

create trigger review_proofs_updated_at before update on public.review_proofs
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- replies: "Reply from the consultancy", posted by the admin on their behalf
-- -----------------------------------------------------------------------------
create table public.replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  consultancy_id uuid not null references public.consultancies (id) on delete cascade,
  author_user_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 3000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index replies_review on public.replies (review_id);

create trigger replies_updated_at before update on public.replies
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- reports: any visitor can report a review
-- -----------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  reporter_user_id uuid references public.profiles (id) on delete set null,
  reason text not null check (reason in ('fake', 'abusive', 'personal_info', 'not_first_hand', 'other')),
  details text check (char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_queue on public.reports (status, created_at desc);

create trigger reports_updated_at before update on public.reports
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- consultancy_suggestions: who suggested a missing consultancy (private)
-- -----------------------------------------------------------------------------
create table public.consultancy_suggestions (
  id uuid primary key default gen_random_uuid(),
  consultancy_id uuid not null references public.consultancies (id) on delete cascade,
  suggested_by uuid references public.profiles (id) on delete set null,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger consultancy_suggestions_updated_at before update on public.consultancy_suggestions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- audit_log: one row for every admin action
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index audit_log_recent on public.audit_log (created_at desc);

-- -----------------------------------------------------------------------------
-- rate_limits: simple counters for "not too many requests"
-- -----------------------------------------------------------------------------
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (key, window_start)
);
