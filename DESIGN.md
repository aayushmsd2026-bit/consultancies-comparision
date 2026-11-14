# DESIGN.md — Design brief

Read `CLAUDE.md` first. This file tells you how the site must look and feel.

## 1. The feeling

**Calm confidence.** A student is about to hand a large sum of family money to a stranger. The site must feel like the one honest, quiet place in a noisy market.

Think like Apple's product pages:

- One idea per screen.
- Very large, confident type.
- Lots of empty space.
- Motion that explains, never motion that decorates.
- Every element earns its place. If you can remove it and nothing is lost, remove it.

Then add one thing Apple does not have: **colour with character**, taken from Sanzo Wada's *A Dictionary of Color Combinations*.

**Be bold in colour, type and layout. Be strict in usability.** When boldness and clarity fight, clarity wins.

Do not make it look like:
- A typical education-consultancy site (stock photos of students, flags, blue gradients, sliders).
- A generic SaaS template (purple gradient, floating cards, emoji icons).
- A crowded directory (ads, sidebars, tiny text).

## 2. Colour — Sanzo Wada

The owner's reference is Sanzo Wada's *A Dictionary of Color Combinations* (Seigensha): Japanese colour combinations from the 1930s. The palettes are unusual, slightly muted and very harmonious. That is the look we want.

### How to source the colours (do this, do not guess hex values)

1. Install the open dataset: `npm install dictionary-of-colour-combinations` (MIT licence). It holds the 348 combinations and 159 named colours from Volume 1, with hex values.
2. Write a small script (`scripts/palette-explore.ts`) that lists the 4-colour and 3-colour combinations with their colour names and hex values.
3. Choose **one** Wada combination as the brand palette. It must be a combination Wada actually listed, not colours mixed from different plates.
4. Record the choice in `src/config/palette.ts` with the combination number and the Wada colour names, as a comment.
5. If the owner later gives a specific plate from **Volume 2**, replace the palette with those values. Keep the token names the same so nothing else changes.

### What to look for in the combination

| Role | What we need | Wada colours to consider (look up exact hex in the dataset) |
| --- | --- | --- |
| Ink (text, dark surfaces) | A very deep blue, green or indigo. Not pure black. | Dark Tyrian Blue, Deep Indigo, Dusky Green, Deep Slate Green |
| Paper (page background) | A warm off-white. Not pure white. | Ivory Buff, Seashell Pink, Cream Yellow, Pale Lemon Yellow |
| Signature (brand, primary buttons, hero) | One strong, memorable colour. | Coral Red, Grenadine Pink, Peacock Blue, Cossack Green, Orange |
| Spark (highlights, small accents) | A bright colour used very little. | Sulphur Yellow, Light Green Yellow, Hermosa Pink |

Suggested starting mood: **deep indigo ink + warm ivory paper + coral-red signature + a small spark of sulphur yellow.** Find the Wada combination closest to this. If a different combination is clearly more beautiful and still passes the checks below, use it and explain why in two lines.

### Rules for using colour

- **60 / 30 / 10.** About 60% paper, 30% ink, 10% signature. Spark is under 2%.
- Go crazy in **big, deliberate blocks**: a full-bleed hero in the signature colour, a full dark section in ink, giant coloured numerals. Keep reading areas calm.
- Derive tints and shades from the Wada colours with `oklch` (for example a 6% signature tint for soft backgrounds). Do not add new hues.
- **Contrast is not optional.** Body text must pass WCAG AA (4.5:1). Large text and UI parts must pass 3:1. Write a small test that checks every text and background token pair. If a Wada colour fails as text, use it only as a background or decoration.
- **Meaning colours** (registered, not found, warning) should come from the same Wada family where possible. Never show meaning by colour alone. Always add an icon and a word.
- Build a **dark mode** from the same palette: ink becomes the background, paper becomes the text.
- Define everything as CSS variables (`--color-ink`, `--color-paper`, `--color-signature`, `--color-spark`, plus tints) and map them in the Tailwind config. No raw hex values in components.

## 3. Typography

- **Display (headlines, big numbers):** one characterful typeface with real personality. A sharp modern serif or a confident grotesk. Choose from open fonts available through `next/font` (for example Fraunces, Instrument Serif, Bricolage Grotesque, Space Grotesk). Pick one and commit.
- **Text (body, UI):** one clean, very readable sans-serif (for example Inter, Geist, Manrope).
- **Nepali (Devanagari):** a proper Devanagari font that pairs well (for example Mukta, Noto Sans Devanagari, Hind). Test real Nepali sentences. Devanagari needs more line height (about 1.7).
- **Scale:** fluid with `clamp()`. Hero headline is huge: about 44px on a phone, up to 120px on a desktop. Body is 17 to 18px. Never smaller than 14px anywhere.
- Tight letter-spacing on big headlines. Generous line height on body text.
- Scores and prices use tabular numbers.
- Headlines are short. Six words or fewer when possible.

## 4. Layout

- Mobile first at 360px. Then 768px, 1024px, 1440px.
- A 4px spacing scale. Sections breathe: 96 to 160px of vertical space between sections on desktop, 64 to 96px on mobile.
- Max text width about 65 characters.
- Full-bleed colour sections alternate with calm paper sections.
- Large corner radius on cards and buttons (16 to 28px). Soft, low shadows or none. Prefer colour and space over borders and shadows.
- No sidebars. No carousels. No pop-ups, except one small, polite cookie or consent note if needed.

## 5. Navigation (must be effortless)

- **Search is the hero.** The home page centres on one large search field: "Search a consultancy". Typeahead shows name, city and registration badge.
- Top bar: logo, Search, Compare, Guides, and one primary button: "Write a review". Nothing else.
- On mobile: a bottom tab bar with four items: Home, Search, Write, Guides. Thumb-friendly targets (at least 48px).
- Language switch (EN / ने) is always visible in the header.
- Breadcrumbs on profile and guide pages.
- A visitor must reach any consultancy profile in two taps from the home page.
- `Cmd/Ctrl + K` opens search on desktop.

## 6. Page direction

**Home**
1. Hero: full-bleed signature colour. One giant line, for example "Check before you pay." Under it, the search field. Nothing else above the fold.
2. Three large facts in giant numerals (reviews, consultancies listed, verified reviews). Count up once when they scroll into view.
3. "How it works" in three steps, each revealed as the user scrolls.
4. Latest reviews as large, quiet cards.
5. Top rated by country: a row of big country tabs (Australia, Japan, UK, USA, Canada and more).
6. Dark ink section: the trust promise. "Ratings cannot be bought." Link to the review policy.
7. Closing call: "Used a consultancy? Tell the next student." with the Write a review button.

**Consultancy profile** (the most important page)
- Top: name, city, and the **registration badge**, large and unmistakable.
- A **score dial**: one big number out of 5 with an animated ring. Next to it, five thin bars for honesty, communication, documents, speed and after-visa support.
- Fact strip: number of reviews, share verified, visa-granted share, typical service charge range.
- Filter chips for reviews: country, outcome, verified only. Sort: newest, most helpful.
- Review cards: outcome tag, country and intake, ratings, the two text answers, "Verified student" mark, consultancy reply nested below.
- Sticky bottom bar on mobile: "Write a review" and "Compare".
- When there are fewer than 3 reviews: a friendly empty state that invites the first review. Never show an empty score.

**Write a review**
- One question per screen, like a calm conversation. A progress line at the top.
- Large tap targets. Star or slider inputs that feel good to use.
- A reassuring note near the proof upload and near the submit button.
- A small celebration on submit (one tasteful animation, under one second).

**Compare**
- Two or three columns. Rows line up: registration, overall score, each rating, visa-granted share, fee range, review count. The better value in each row gets a quiet highlight.
- On mobile: swipe between consultancies with the row labels fixed.

**Registration checker**
- One field, one answer. A big clear result state: registered, not found, or expired, with the date last checked and the source.

**Guides**
- Editorial layout. Big title, generous text, pull quotes in the display typeface, a coloured opening block per guide.

**Admin**
- Plain, dense and fast. No decoration. Function only.

## 7. Motion

- Use motion to show cause and effect: the score ring fills, bars grow, numbers count up, sections fade and rise 12 to 16px as they enter.
- Page changes use the View Transitions API where supported. The consultancy name and score should morph from the list card to the profile header.
- Micro-interactions on buttons, stars and chips: 120 to 200ms, with a soft ease-out.
- One "wow" moment per page at most. The home hero may have one: for example, the Wada colour blocks slide and settle into place on first load.
- Everything must run at 60fps on a mid-range Android phone. Animate only `transform` and `opacity`.
- With `prefers-reduced-motion`, remove all movement and keep simple fades.

## 8. Components to build first

Build these as a small design system in `src/components/ui`, with a `/styleguide` page (dev only) that shows every one in light and dark mode, in English and Nepali:

Button (primary, secondary, quiet), Search field with typeahead, Registration badge (registered, not found, expired, unknown), Score dial, Rating bars, Star input, Slider input, Review card, Reply block, Chip and filter chip, Tag (outcome), Tabs, Stepper and progress line, Text field, Select, File upload, Toast, Empty state, Skeleton loader, Dialog, Breadcrumbs, Language switch, Header, Bottom tab bar, Footer.

Icons: one consistent outline set (for example Lucide). No emoji as icons.

## 9. Imagery

- No stock photos. No flags as decoration. No AI-generated people.
- Use colour blocks, large type, simple geometric shapes from the Wada palette, and clean data graphics.
- Consultancy logos are not shown in v1. Use a coloured monogram tile (first letter, palette colours chosen from the name).

## 10. Voice

- Plain, warm, direct. Short sentences. A 16-year-old and a parent must both understand.
- Honest about limits: "Not enough reviews yet", "Last checked on 12 Kartik 2083".
- Never shout. No exclamation marks in the interface.
- Nepali copy is written naturally, not translated word by word. Mark Nepali strings that need a native review in `TODO.md`.

## 11. Quality bar before you call the design done

- [ ] Works with one hand on a 360px phone.
- [ ] A new visitor finds a consultancy and its registration status in under 10 seconds.
- [ ] Every text and background pair passes the contrast test.
- [ ] Keyboard only: every action is reachable, focus is always visible.
- [ ] Reduced motion mode looks complete, not broken.
- [ ] Nepali pages look as good as English pages.
- [ ] Lighthouse mobile: Performance 90+, Accessibility 100.
- [ ] The `/styleguide` page shows every component in every state.
- [ ] The palette file names the Wada combination number and colour names used.
