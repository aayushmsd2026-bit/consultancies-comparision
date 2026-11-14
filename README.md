# Consultancy reviews for Nepal

An independent website where students rate and review study-abroad consultancies in Nepal.

- The full plan is in [`CLAUDE.md`](CLAUDE.md).
- The look and feel is in [`DESIGN.md`](DESIGN.md).
- Open questions and things only the owner can do are in [`TODO.md`](TODO.md).

The site name is not decided yet. It is set in one place: `src/config/site.ts`.

---

## See the site on your own computer

You need to do steps 1 to 3 only once.

### 1. Install the tools

1. Install **Node.js** (version 22 or newer) from <https://nodejs.org>. Choose the "LTS" download.
2. Install **Git** from <https://git-scm.com>.

### 2. Get the code

Open a terminal (on Windows: "PowerShell"; on Mac: "Terminal") and run:

```bash
git clone https://github.com/aayushmsd2026-bit/consultancies-comparision.git
```

```bash
cd consultancies-comparision
```

```bash
npm install
```

### 3. Create your settings file

Copy the example settings file. The copy is private and stays on your computer.

Mac or Linux:

```bash
cp .env.example .env.local
```

Windows (PowerShell):

```bash
copy .env.example .env.local
```

You do not need to change anything in it yet. Supabase keys are added in Phase 3.

### 4. Start the site

```bash
npm run dev
```

Then open <http://localhost:3000> in your browser.

- English: <http://localhost:3000/en>
- Nepali: <http://localhost:3000/ne>

To stop the site, press `Ctrl + C` in the terminal.

---

## Check that everything works

| Command | What it does |
| --- | --- |
| `npm run check` | Runs the three checks below, one after another. |
| `npm run lint` | Looks for code mistakes. |
| `npm run typecheck` | Checks that the code fits together. |
| `npm run test` | Runs the fast tests (logic, translations). |
| `npm run test:e2e` | Opens a hidden browser and clicks through the site like a visitor. |

The first time you run `npm run test:e2e` on your computer, run this once before it:

```bash
npx playwright install chromium
```

---

## Where things live

| Folder | What is inside |
| --- | --- |
| `src/app` | The pages. Every page is inside `[locale]` so it works in English and Nepali. |
| `src/components` | Reusable pieces of the interface. |
| `src/lib` | Logic with no interface (for example the ranking formula). |
| `src/config` | Settings: site name, feature switches, colours. |
| `src/i18n` | Language setup. |
| `messages/` | All text on the site. `en.json` is English, `ne.json` is Nepali. |
| `content/guides` | The guide articles. |
| `supabase/` | The database structure and demo data. |
| `scripts/` | Small helper programs, for example the consultancy import. |
| `data/` | Source lists, for example the ministry list of consultancies. |
| `tests/e2e` | Browser tests. |

## The design system

- See every building block on one page: <http://localhost:3000/en/styleguide> (Nepali: `/ne/styleguide`).
  This page is hidden on the real, live site.
- Colours are decided in one file: `src/config/palette.ts`. They come from Sanzo Wada's
  *A Dictionary of Color Combinations*, combination 166.
- After changing a colour, run the two commands below. The first rewrites the CSS file.
  The second checks that all text is still readable.

```bash
npm run tokens
```

```bash
npm run test
```

- To browse other Wada combinations:

```bash
npm run palette
```

## Changing text on the site

All text is in `messages/en.json` and `messages/ne.json`. Change the words there.
Both files must have the same keys. A test fails if one is missing.

## Supabase, Google sign-in and Vercel

These steps are added to this file when each phase is built:

- Supabase project and keys: Phase 3.
- Google sign-in: Phase 5.
- Deploying to Vercel: Phase 9.
