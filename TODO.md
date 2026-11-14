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

- [ ] Decide the site name. Then change `SITE_NAME` in `src/config/site.ts`.
- [ ] Buy a domain.
- [ ] Phase 3: create a free Supabase account and project. Steps will be in `README.md`.
- [ ] Phase 5: create a Google Cloud project for Google sign-in. Steps will be in `README.md`.
- [ ] Connect the GitHub repo to Vercel (free). Doing this early gives a preview link for every change.
- [ ] Ask a native Nepali speaker to check all text in `messages/ne.json`. It was written by an AI.
- [ ] Ask a lawyer to check `/terms` and `/review-policy` before launch.

## The ministry list (data/)

- [ ] Confirm what the list means before launch. Its title says it lists consultancies that **applied for renewal** for fiscal year 2081/82. That may not be the same as "currently approved". The site must not say "registered" unless that is true.
- [ ] Add the public web address of the list (the source link shown next to every registration badge).
- [ ] The list has no registration numbers, phone numbers or websites. Those columns stay empty.

## Ideas, not built (out of scope for v1)

- Automatic checks on GitHub for every change (GitHub Actions).
- Consultancies claiming their own profile.
