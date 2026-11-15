# TODO

Things left unfinished, and decisions only the owner can make.

## Decisions already made (owner said: "I trust your decisions")

These were open questions in the brief. They are now settled and recorded in `CLAUDE.md` section 16.

1. The "account created less than 1 hour ago" flag is dropped. Sign-in comes last, so it would fire on almost every review.
2. Consultancies get a `listing_status` (`approved` or `pending`). A consultancy suggested by a reviewer stays hidden until the admin approves it.
3. Ranking weights: a verified review counts as 1.5 reviews everywhere in the formula. The profile shows the weighted average. The Bayesian rank score is used only for sorting.
4. Guides for v1: how to choose, ten red flags, how to check registration. A "normal fees" guide waits until there are sources for the numbers.
5. The home page has no separate checker box. The home search shows the registration badge in its results and links to `/check`.
6. Home sections that need data (big numbers, latest reviews, top rated) hide themselves until there is enough real data.
7. The "staff member's full name" flag is a rough guess only (words after Mr, Ms, sir, madam and similar). Phone numbers and emails are detected reliably.
8. Dates: Bikram Sambat on Nepali pages, AD on English pages.
9. Every address starts with `/en` or `/ne`.
10. Code is pushed straight to the `main` branch. The repo was empty and has one owner.

## Design choices you can change

- **Palette.** I chose Wada combination 166 (Grenadine Pink, Naples Yellow, Deep Slate Green). The two runners-up were 232 (Carmine, Pinkish Cinnamon, Deep Indigo: bolder, but red reads as "danger") and 343 (Burnt Sienna, Ivory Buff, Deep Grayish Olive, Vandar Poel's Blue: earthy and calm). To switch, use the "Change the palette" prompt in `PROMPTS.md`.
- **Fonts.** Fraunces for headlines, Inter for text, Noto Sans Devanagari for Nepali.
- **Numbers on Nepali pages** use Devanagari digits (४.२) and Bikram Sambat dates.

## The owner must do

The order to do things in is in `README.md` ("Put the site online") and `LAUNCH.md`.

- [ ] Decide the site name. Then change `SITE_NAME` in `src/config/site.ts`.
- [ ] Buy a domain.
- [ ] Create a Supabase account and two projects: one for development, one for production.
- [ ] Create a Vercel account and import the GitHub repository.
- [ ] Create a Google Cloud project for Google sign-in.
- [ ] Set a real contact email (`NEXT_PUBLIC_CONTACT_EMAIL`).
- [ ] Ask a native Nepali speaker to check all Nepali text. It was written by an AI.
- [ ] Ask a lawyer to check `/terms`, `/privacy` and `/review-policy` before launch.
- [ ] Put a weekly backup reminder in your calendar.

## What was not tested

Everything here was built and tested against a local copy of Supabase with fictional data. These things need a real account or a real device, so I could not test them:

- The real Google sign-in button.
- A real deploy on Vercel. I did check that the site builds and opens with no database settings, as on a first deploy.
- The commands that send the tables to a hosted Supabase project (`supabase link`, `supabase db push`). The same migration files were applied to the local Supabase.
- Phone sign-in by SMS (switched off).
- A real phone, a real screen reader, and a slow real network.

## The ministry list (data/)

Your PDF is saved in `data/source/`. It is converted to `data/consultancies.csv` (924 rows, no errors in a dry run). Nothing has been imported into any real database.

- [ ] **Confirm what the list means before launch.** Its title says it lists consultancies that **applied for renewal** for fiscal year 2081/82. That may not be the same as "currently approved". The import marks every row "Registered". If you are not sure, import with `--status unknown`.
- [ ] Find the public web address of the list. It is shown next to every registration badge (`--source-url`).
- [ ] The list has no registration numbers, phone numbers, websites or countries. Those columns are empty.
- [ ] Open `data/consultancies.csv` in a spreadsheet and look at the `check` column:
  - 137 rows have no address in the PDF.
  - 29 rows have an address but the city was not recognised.
  - 7 rows have Nepali text that the PDF did not give back correctly. Retype those addresses from the PDF.
  - 24 rows have a very long name or a "previously called" note. Shorten the name. The web address of the page is made from it.
- [ ] City and district are a best guess from the address. Spot-check them.

## Search engines, speed and accessibility

Scores and the full checklist are in `QUALITY.md`.

- [ ] Test on your own phone, and with a screen reader if you can (TalkBack on Android). I could only test in an emulated phone.
- [ ] After launch, add the site to Google Search Console and submit `/sitemap.xml`.
- [ ] Preview pictures for shared links are in English only. The picture font has no Nepali letters. Adding a Nepali font file would fix it.
- [ ] The preview pictures show the placeholder site name until `SITE_NAME` is set.

## Guides and trust pages (content/)

The text is in `content/guides` and `content/pages`, one file per language. You can edit the words directly.

- [ ] **Lawyer review.** `review-policy`, `privacy` and `terms` are drafts. Each shows a yellow "Draft" note. After the review, set `draft: false` at the top of the file (in both languages) and the note disappears.
- [ ] **About page.** Add who runs the site. Set a real contact address with `NEXT_PUBLIC_CONTACT_EMAIL` (it is `contact@example.com` now).
- [ ] **Native Nepali review.** All seven Nepali files in `content/` and everything in `messages/ne.json` were written by an AI.
- [ ] **Facts to verify before launch.** I kept the advice general and gave no fees or numbers. These statements still need your check:
  - Consultancies need approval from the Ministry of Education, Science and Technology, and can show an approval letter.
  - A branch office needs its own approval, separate from the head office. (In "How to check registration". Remove the sentence if this is not the rule.)
  - The Ministry publishes notices and lists of approved consultancies.
  - A student who was cheated can complain to the Ministry and to the police.
  - Some colleges pay consultancies a commission per student, and this is not illegal.
  - A false document can block a student from a country "for years".
  - The privacy page says people under 16 should use the site with a parent. Choose the right age with the lawyer.
  - The terms say the laws of Nepal apply.
- No "normal fees" guide yet. It needs sourced numbers from you.

## Admin area

- **Nobody is told automatically.** When you press "Ask for proof" or reject a review, the reviewer gets no message. The queue shows their email so you can write to them yourself. Automatic emails would be a new feature.
- The demo reviewers show no email in the queue. Real reviewers do.
- Reviews of a consultancy that is still "Suggested, not approved" stay hidden even after you approve the review. Approve the consultancy too.
- The admin area is English only.

## Sign-in and the review form

- [ ] Follow "Set up Google sign-in" in `README.md`. I could not test the real Google button from here. Everything around it is tested with the test sign-in.
- [ ] On the production Supabase project, switch off the Email provider.
- The form has 11 short screens: consultancy, country, course, outcome, money, ratings, what went well, what went badly, recommend and name, proof, send. Single-choice screens move on by themselves.
- Phone sign-in is built but switched off. It is untested, because it needs a paid SMS provider.
- A person cannot edit a review from the site after sending it. The database allows edits while a review is pending. A "my reviews" page would be a new feature.
- The name shown on a review comes from the Google account. There is no "change my name" page.

## Public pages: small gaps

- **"Most helpful" sort.** `DESIGN.md` asks for it, but the data model has no "helpful" votes. Reviews can be sorted by newest, verified first, highest and lowest score. Adding helpful votes is a new feature to decide on.
- **Unknown consultancy addresses** show the "This page does not exist" page and are marked "do not index" for search engines. Because pages are streamed, the technical status code can still be 200.
- The compare page highlights the **lower** typical service charge as the better value.

## Database notes

- Scores are recalculated in the app with the one ranking function, by reading all approved reviews. This is simple and correct. It is fast enough for tens of thousands of reviews. Revisit only if the site grows far beyond that.
- A person can post at most 5 reviews in 24 hours. This limit is in the database.

## Ideas, not built (out of scope for v1)

- Automatic checks on GitHub for every change (GitHub Actions).
- Consultancies claiming their own profile. The `is_claimed` field is ready for it.
- Emails to reviewers (review approved, proof needed).
- "Helpful" votes on reviews, and a "most helpful" sort.
- A "my reviews" page where a person can edit a pending review.
- A "normal fees" guide, once there are sourced numbers.
- Nepali text in the preview pictures for shared links.
- An automatic weekly backup.
