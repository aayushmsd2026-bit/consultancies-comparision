# CLAUDE.md — Project brief

Read this file fully before you write any code. Read `DESIGN.md` before you write any UI.

## 1. What we are building

An independent website where students rate and review study-abroad consultancies in Nepal.
Think "Trustpilot for education consultancies in Nepal".

The site answers one question for a student or parent:

> "Can I trust this consultancy before I pay them?"

Site name: not decided. Use the constant `SITE_NAME` from `src/config/site.ts` everywhere.
Never hard-code the name. Default value for now: `"[SITE_NAME]"`.

## 2. Why it matters

- More than 100,000 Nepali students take permission (NOC) to study abroad every year.
- Fraud by some consultancies is a known problem. Police and the Ministry of Education tell students to check registration before paying.
- No independent review site exists. Students only find "top 10" lists with ads, Google Maps stars, and testimonials on the consultancy's own site.

## 3. Who uses it

| User | What they want |
| --- | --- |
| Student (17 to 28, on a phone, often slow data) | Check a consultancy fast. Read real experiences. Compare two or three. |
| Parent | Simple proof that a consultancy is registered and safe. Nepali language. |
| Past applicant | Write a review in 3 minutes. |
| Consultancy staff | See their page. Reply to reviews. Later: claim the profile. |
| Admin (the owner, one person, part-time) | Approve or reject reviews in a few minutes a week. |

The owner has a full-time job. **Low maintenance is a hard requirement.** Prefer simple, boring, reliable choices. No feature may need daily manual work.

## 4. The rules of trust (never break these)

1. Ratings cannot be bought. No paid plan may change a score or a ranking.
2. No review is removed for money. Reviews are removed only if they break the review policy.
3. Ads and sponsored content are always labelled.
4. Rankings use one public formula (section 9).
5. Proof documents are private. They are never shown publicly.
6. **Never invent reviews, ratings, quotes or statistics about real consultancies.** All development seed data must use clearly fictional consultancy names (for example "Example Education Pvt. Ltd."). Real consultancy data comes only from an import script that the owner runs.

## 5. Scope of version 1 (MVP)

Build these pages. Nothing more.

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Home | Search box, registration checker, latest reviews, top-rated by country |
| `/consultancies` | Directory | List with search, filters (country, city, registered, rating) and sort |
| `/consultancies/[slug]` | Consultancy profile | Registration status, branches, countries, score breakdown, reviews, replies |
| `/review/new` | Write a review | 3-minute form in short steps |
| `/compare` | Compare | Two or three consultancies side by side |
| `/check` | Registration checker | Type a name, see if it is on the ministry list |
| `/guides` and `/guides/[slug]` | Guides | Articles in MDX: how to choose, red flags, normal fees |
| `/review-policy`, `/about`, `/privacy`, `/terms` | Trust pages | How reviews are checked, how to report, who runs the site |
| `/report/[reviewId]` | Report a review | Simple form |
| `/admin` | Admin (private) | Review queue: approve, reject, ask for proof. Reports queue. Consultancy editor. CSV import. |

**Out of scope for v1:** mobile app, chat, payments, university search, visa tools, paid plans, lead forms, ads. Leave clean extension points, but do not build them.

## 6. Tech stack

- **Next.js** (latest stable, App Router) with **TypeScript** (strict).
- **Tailwind CSS** with design tokens as CSS variables (see `DESIGN.md`).
- **Supabase**: Postgres, Auth, Storage, Row Level Security.
- **Auth:** Google sign-in first. Phone OTP behind a feature flag (it costs money per SMS).
- **Forms:** React Hook Form + Zod. Validate on client and server.
- **i18n:** `next-intl`. English (`en`) and Nepali (`ne`). All UI text lives in message files. No hard-coded strings.
- **Guides:** MDX files in the repo.
- **Hosting:** Vercel free tier. Supabase free tier.
- **Tests:** Vitest for logic (ranking formula, validation). Playwright for three flows: search to profile, write a review, admin approves a review.

If a newer stable version of a library changes an API, follow the current official docs. Do not guess from memory.

## 7. Data model

Use Supabase migrations in `supabase/migrations`. Use UUID primary keys and `created_at` / `updated_at` on every table.

**consultancies**
`id, slug (unique), name, name_ne, registration_status (registered | not_found | expired | unknown), registration_number, registration_source_url, registration_checked_at, official_grade (nullable), website, phone, email, description, countries (text[]), is_claimed (bool, default false), avg_score, review_count, verified_review_count, rank_score`

**branches**
`id, consultancy_id, city, district, address, phone, is_head_office`

**profiles** (one per auth user)
`id (= auth.users.id), display_name, role (user | admin), created_at`

**reviews**
`id, consultancy_id, branch_id (nullable), user_id, status (pending | approved | rejected | needs_proof), country, study_level (bachelor | master | phd | diploma | language | other), intake_year, outcome (visa_granted | visa_refused | withdrew | in_process), service_charge_npr (nullable int), extra_costs_npr (nullable int), extra_costs_note, rating_honesty, rating_communication, rating_documents, rating_speed, rating_after_visa (each 1 to 5, after_visa nullable), overall (computed average), went_well (text), went_badly (text), would_recommend (bool), is_verified (bool, default false), invited_by_consultancy (bool, default false), display_name_choice (name | initials | anonymous), rejection_reason (nullable), approved_at`

Constraint: one review per `(user_id, consultancy_id)`.

**review_proofs**
`id, review_id, storage_path, uploaded_at, checked_at, deleted_at`
Files go in a **private** Storage bucket. Only the uploader and admins can read them.

**replies**
`id, review_id, consultancy_id, author_user_id, body, status (pending | approved | rejected)`

**reports**
`id, review_id, reporter_user_id (nullable), reason (fake | abusive | personal_info | not_first_hand | other), details, status (open | resolved)`

**audit_log**
`id, actor_user_id, action, target_table, target_id, note, created_at`
Write a row for every admin action.

### Row Level Security

- Public can read consultancies, branches, **approved** reviews and **approved** replies only.
- A user can insert a review, and read or edit their own review while it is `pending` or `needs_proof`.
- Only admins can change `status`, `is_verified`, or anything on consultancies.
- Proofs: uploader can insert and read their own. Admin can read and delete. Nobody else.
- Never expose `user_id`, email or phone of a reviewer in any public query or API response.

## 8. Key flows

**Find and check**
Home search (with typeahead) -> profile page. The profile shows the registration badge at the top, then the overall score, then the score breakdown, then reviews. A student should get the answer in under 10 seconds.

**Write a review (target: 3 minutes)**
1. Pick consultancy and branch (search). If it is missing, the user can suggest a new one. An admin approves it.
2. Your case: country, level, intake year, outcome.
3. Money: service charge and extra costs (both optional).
4. Ratings: five sliders or star rows.
5. Your story: what went well, what went badly, would you recommend.
6. Optional proof upload. Explain clearly: "Only our team sees this. We delete it after checking."
7. Sign in (if not signed in yet) and submit. Save the draft in the browser so nothing is lost at sign-in.
8. Thank-you screen: "We read every review before it goes live."

Sign-in comes **last**, not first. Let people write before asking for an account.

**Moderate (admin, must be fast)**
Queue of pending reviews, newest first. Each card shows the full review, the proof (if any), and flags (see below). Keyboard shortcuts: `A` approve, `R` reject (asks for a reason), `P` ask for proof, `V` mark verified. Approving recalculates the consultancy's scores.

**Automatic flags for the admin** (flags never auto-reject)
- More than 3 reviews for one consultancy in 24 hours.
- Account created less than 1 hour before the review.
- Very short text with a 5 or 1 rating.
- Review text contains a phone number, email, or a staff member's full name.

**Report a review**
Any visitor can report. Reports land in the admin queue.

**Consultancy reply**
For v1: a consultancy emails the owner; the admin posts the reply on their behalf from the admin panel. Mark it "Reply from the consultancy".

## 9. Ranking formula (public)

Use a Bayesian average so that a consultancy with 2 perfect reviews does not beat one with 80 good reviews.

```
rank_score = (v / (v + m)) * R + (m / (v + m)) * C
```

- `R` = the consultancy's average overall score from approved reviews
- `v` = its number of approved reviews
- `m` = 5 (minimum reviews to count fully; keep it in config)
- `C` = the average overall score across all approved reviews on the site

Verified reviews count with weight 1.5. Unverified with weight 1.0.
Show a consultancy's score only when it has at least 3 approved reviews. Below that, show "Not enough reviews yet".
Put this logic in one pure, tested function. Explain the formula in plain words on `/review-policy`.

## 10. Seed data and import

- `supabase/seed.sql`: 12 fictional consultancies, about 60 fictional reviews, for development only. Use obviously fake names.
- `scripts/import-consultancies.ts`: reads a CSV (`name, registration_number, address, city, district, phone, website, countries`) and upserts consultancies and branches. The owner will fill the CSV from the Ministry of Education's approved list. Include a sample CSV with fictional rows.
- A banner must show in non-production environments: "Demo data. Not real reviews."

## 11. SEO (search is the main growth channel)

- Each profile page targets the search "[consultancy name] review".
- Server-render all public pages. Use static generation with revalidation where possible.
- Title pattern: `{Consultancy name} reviews, fees and registration status | {SITE_NAME}`.
- Add JSON-LD: `Organization` on profiles. Add `AggregateRating` only when the page has 3 or more approved reviews.
- Generate `sitemap.xml` and `robots.txt`. Add Open Graph images per profile (name, score, registration badge).
- Clean URLs. `hreflang` for `en` and `ne`.

## 12. Performance and accessibility (hard requirements)

- Mobile first. Design at 360px width first.
- Lighthouse on mobile: Performance 90+, Accessibility 100, SEO 100.
- Largest Contentful Paint under 2.5 seconds on a slow 4G profile.
- WCAG 2.2 AA: contrast, focus states, labels, keyboard use everywhere.
- Respect `prefers-reduced-motion`.
- Use `next/image` and `next/font`. No layout shift.
- Nepali text must render correctly in Devanagari with a proper font.

## 13. Privacy and safety

- Collect the minimum. Reviewers choose how their name shows: full name, initials, or anonymous.
- Proof files are private and are deleted after checking. Add an admin button for this.
- Rate-limit review submission, report submission and search.
- Sanitize all user text. Never render user input as HTML.
- No secrets in the repo. Use `.env.local` and provide `.env.example`.
- The `/terms` and `/review-policy` pages will be reviewed by a lawyer. Write clear drafts and mark them `DRAFT` in a comment at the top of each file.

## 14. Project conventions

- Folder layout: `src/app` (routes), `src/components`, `src/lib` (logic, no React), `src/config`, `messages/` (i18n), `content/guides` (MDX), `supabase/`, `scripts/`.
- Server Components by default. Client Components only where interaction needs them.
- Small, typed, pure functions in `src/lib`. Test them.
- Commit in small steps with clear messages.
- Keep a `README.md` with setup steps written for a non-developer: how to create the Supabase project, set env variables, run locally, and deploy to Vercel.
- Keep a `TODO.md` of anything left unfinished or any decision the owner must make.

## 15. How to work with the owner

- The owner is not a professional developer. Explain choices in short, simple sentences.
- Before a big step, state the plan in a few lines. Then do it.
- When something needs the owner (an API key, a Supabase setting, a decision), stop and say exactly what to do, step by step.
- Do not add features that are not in this file. Suggest them in `TODO.md` instead.
- After each phase, run lint, type-check and tests. Fix what fails. Then give a short summary of what was built and how to see it.
