# PROMPTS.md — What to paste into Claude Code

## Before you start

1. Make a new empty folder for the project. Example: `consultancy-reviews`.
2. Put `CLAUDE.md` and `DESIGN.md` in that folder. (Claude Code reads `CLAUDE.md` by itself every time.)
3. Open a terminal in that folder and start Claude Code.
4. Paste the prompts below **one at a time**, in order. Wait until each phase is finished and you have looked at the result before you paste the next one.
5. Create a free Supabase account and a free Vercel account when Claude Code asks for them.

Tip: if something looks wrong, say it in plain words. Example: "The search box is too small on my phone. Make it bigger." You do not need technical words.

---

## Prompt 0 — Read and plan (no code yet)

```
Read CLAUDE.md and DESIGN.md fully.

Do not write any code yet. Give me:
1. A short summary of what we are building, in your own words.
2. The build plan as phases, with what I will be able to see at the end of each phase.
3. A list of things you need from me (accounts, keys, decisions).
4. Any part of the two files that is unclear or that you think is a mistake.

Use short, simple sentences. I am not a professional developer.
```

---

## Prompt 1 — Project setup

```
Start Phase 1: project setup.

- Create the Next.js project with TypeScript and Tailwind as described in CLAUDE.md section 6.
- Set up the folder layout from section 14.
- Set up next-intl with English and Nepali.
- Add src/config/site.ts with the SITE_NAME constant.
- Add lint, type-check, Vitest and Playwright.
- Add .env.example and a README.md with setup steps written for a non-developer.
- Create TODO.md.

When done, run lint, type-check and tests. Then tell me the exact command to see the site on my computer.
```

---

## Prompt 2 — Colour and design system

```
Start Phase 2: the design system. Follow DESIGN.md closely.

1. Install the dictionary-of-colour-combinations package. Write scripts/palette-explore.ts and run it.
2. Show me your top 3 Sanzo Wada combinations for this site. For each: the combination number, the colour names, the hex values, which role each colour plays (ink, paper, signature, spark), and one line on the mood. Then tell me which one you recommend and why.
3. Stop and wait for my choice.

After I choose:
4. Create src/config/palette.ts, the CSS variables, the Tailwind mapping, and dark mode.
5. Write the contrast test for every text and background pair. Fix any pair that fails.
6. Set up the fonts (display, text, Devanagari) with next/font and the fluid type scale.
7. Build every component listed in DESIGN.md section 8.
8. Build the /styleguide page that shows every component, in light and dark mode, in English and Nepali.

Be bold with colour, type and layout. Be strict with usability. When done, tell me how to open the styleguide page.
```

---

## Prompt 3 — Database

```
Start Phase 3: the database.

- Tell me step by step how to create the Supabase project and where to paste the keys. Wait for me to finish.
- Write the migrations for every table in CLAUDE.md section 7.
- Write the Row Level Security policies exactly as described. Then write tests that prove: the public cannot read pending reviews, cannot read proof files, and can never see a reviewer's user id, email or phone.
- Create the private Storage bucket for proofs.
- Write supabase/seed.sql with fictional consultancies and fictional reviews only. Follow the rule in section 4, point 6.
- Write scripts/import-consultancies.ts and a sample CSV with fictional rows.
- Write the ranking function from section 9 as one pure function with tests.

When done, summarise what was created and how I can look at the data in the Supabase dashboard.
```

---

## Prompt 4 — Public pages

```
Start Phase 4: the public pages. Follow DESIGN.md section 5 (navigation) and section 6 (page direction).

Build in this order and show me after each one:
1. Header, bottom tab bar, footer, language switch.
2. Home page.
3. Directory page with search, filters and sort.
4. Consultancy profile page. This is the most important page. Spend the most care here.
5. Registration checker.
6. Compare page.

Use the seed data. Show the "Demo data. Not real reviews." banner outside production.
Design for a 360px phone first. Then check tablet and desktop.
Add the motion described in DESIGN.md section 7, including reduced-motion support.

After each page, check it at 360px, 768px and 1440px and fix what looks wrong before you show me.
```

---

## Prompt 5 — Write a review

```
Start Phase 5: sign-in and the review form.

- Set up Supabase Auth with Google sign-in. Tell me step by step what to set in the Google and Supabase dashboards. Put phone OTP behind a feature flag, turned off.
- Build the review form exactly as in CLAUDE.md section 8: one question per screen, sign-in at the end, draft saved in the browser.
- Add the optional proof upload to the private bucket, with the reassuring note.
- Validate with Zod on the client and the server.
- Enforce one review per user per consultancy.
- Add rate limits.
- Build the thank-you screen and the "report a review" form.

Write a Playwright test for the full flow. When done, walk me through how to test it myself.
```

---

## Prompt 6 — Admin

```
Start Phase 6: the admin area. Keep it plain and fast. No decoration.

- Protect /admin so only users with role = admin can open it. Tell me how to make my own account an admin.
- Review queue with the automatic flags from CLAUDE.md section 8.
- Keyboard shortcuts: A approve, R reject with a reason, P ask for proof, V mark verified.
- Proof viewer, and a button to delete the proof after checking.
- Approving a review recalculates the consultancy's scores.
- Reports queue.
- Consultancy editor: add, edit, set registration status and the date last checked.
- Post a reply on behalf of a consultancy.
- CSV import screen that uses the import script.
- Write every admin action to audit_log.

My goal: I should be able to clear 20 reviews in 10 minutes. Write a Playwright test for "admin approves a review and it appears on the public page".
```

---

## Prompt 7 — Content pages

```
Start Phase 7: content and trust pages.

- Set up MDX guides. Write first drafts of three guides in English and Nepali:
  1. How to choose a study-abroad consultancy
  2. Ten red flags before you pay
  3. How to check if a consultancy is registered
  Keep the advice general and practical. Do not name any real consultancy. Do not state fees or numbers as facts unless I give you a source. Mark anything I must verify in TODO.md.
- Write clear drafts of /review-policy, /about, /privacy and /terms. Mark them DRAFT. The review policy must explain the trust rules and the ranking formula in plain words.
- Use the editorial layout from DESIGN.md.
```

---

## Prompt 8 — Search engines, speed and accessibility

```
Start Phase 8: SEO, performance and accessibility.

- Add everything in CLAUDE.md section 11: titles, meta descriptions, JSON-LD, sitemap, robots, Open Graph images, hreflang.
- Run Lighthouse on mobile for home, a profile page, and the review form. Reach Performance 90+, Accessibility 100, SEO 100. Show me the scores before and after.
- Run an accessibility pass: keyboard only, screen reader labels, focus states, contrast, reduced motion.
- Go through the checklist in DESIGN.md section 11 and tick each item, or tell me honestly which ones are not met yet.
```

---

## Prompt 9 — Go live

```
Start Phase 9: deployment.

- Walk me step by step through putting the code on GitHub and deploying to Vercel.
- Tell me which environment variables to set and where.
- Set up a production Supabase project with no seed data.
- Give me a launch checklist: what to test on my own phone, what to back up, what to watch in the first week.
- Update README.md and TODO.md so they are correct and complete.
```

---

## Useful follow-up prompts

**Bring in the real consultancy list**
```
I have filled the CSV with the consultancies from the Ministry of Education's approved list. The file is at data/consultancies.csv. Check the file for errors first and show me any problem rows. Then run the import on the production database. Do not create any reviews.
```

**Change the palette**
```
I want to change the brand palette. Use these colours: [paste the colour names and hex values, or a Wada combination number]. Update src/config/palette.ts only, run the contrast test, and show me the styleguide page.
```

**Set the site name**
```
The site name is now "[your name]". Update SITE_NAME, the metadata, the Open Graph images and the message files. Check that no old name is left anywhere.
```

**Design review**
```
Open the home page and the consultancy profile at 360px and 1440px. Review them like a senior designer at Apple would. List the 10 weakest points, most serious first. Then fix them and show me what changed.
```

**When something breaks**
```
This is not working: [say what you did and what you saw]. Find the cause first and explain it in one or two simple sentences. Then fix it and tell me how to check that it works.
```
