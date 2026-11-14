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

`npm run test:e2e` needs two things on your computer:

1. Docker, with the local database running (`npm run db:start`). The tests use the fictional demo data.
2. A browser for the tests. Install it once:

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

## Set up Supabase (the database)

Supabase stores the consultancies, the reviews and the proof files. It is free for a site this size.

### 1. Create the project

1. Go to <https://supabase.com> and sign up.
2. Click **New project**.
3. Name: anything, for example `consultancy-reviews-dev`.
4. Database password: click **Generate a password**. **Save it** in a password manager. You need it in step 3.
5. Region: choose **South Asia (Mumbai)**. It is the closest to Nepal.
6. Click **Create new project** and wait about two minutes.

### 2. Copy the keys

1. In the Supabase dashboard open **Project Settings** (the gear icon), then **API Keys**.
2. Open the file `.env.local` on your computer.
3. Paste three values:
   - `NEXT_PUBLIC_SUPABASE_URL`: the project URL. It looks like `https://abcdefgh.supabase.co`.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the **publishable** key. It starts with `sb_publishable_`.
   - `SUPABASE_SECRET_KEY`: the **secret** key. It starts with `sb_secret_`. Never share this one.

### 3. Create the tables

The part of the project URL before `.supabase.co` is your **project ref**, for example `abcdefgh`.

```bash
npx supabase login
```

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

It asks for the database password from step 1. Then:

```bash
npx supabase db push
```

This creates every table and every security rule from `supabase/migrations`.

### 4. Add the demo data (not on the live site)

Only for a development project. **Never** do this on the production database.

```bash
npx supabase db push --include-seed
```

This adds 12 fictional consultancies and about 60 fictional reviews.

### 5. Look at the data

In the Supabase dashboard:

- **Table Editor**: every table. Try `consultancies` and `reviews`.
- **Table Editor**, then the view `public_reviews`: this is exactly what the public can see. It has no user id, email or phone.
- **Storage**: the private bucket `proofs`.
- **Authentication**, then **Users**: the fictional demo reviewers.

### Make your own account an admin

Sign in on the site once (from Phase 5). Then in Supabase open **SQL Editor** and run this, with your own email:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Import the real consultancy list

`data/consultancies.csv` holds the 924 consultancies from the Ministry of Education PDF in
`data/source/`. It was made by `scripts/ministry-pdf-to-csv.py`. Read the notes in `TODO.md`
before you import it.

First check the file. This writes nothing:

```bash
npm run import -- --file data/consultancies.csv --dry-run
```

Then import. Give the public link to the official list, so visitors can check it themselves:

```bash
npm run import -- --file data/consultancies.csv --source-url https://LINK-TO-THE-OFFICIAL-LIST
```

- The import adds and updates consultancies and branches. It never creates or changes a review.
- You can run it again with a newer file. Nothing is doubled.
- Every consultancy in the file is marked **Registered**. To import without that mark, add `--status unknown`.
- To try it safely, use the fictional file `data/sample-consultancies.csv`.

## A database on your own computer (optional, for developers)

With Docker installed, you can run a full copy of Supabase locally. The tests use it.

| Command | What it does |
| --- | --- |
| `npm run db:start` | Starts local Supabase and loads the tables and demo data. |
| `npm run db:reset` | Wipes the local database and loads everything again. |
| `npm run db:stop` | Stops it. |
| `npm run seed:build` | Rebuilds `supabase/seed.sql` after you change `supabase/seed-data.ts`. |

## Google sign-in and Vercel

These steps are added to this file when each phase is built:

- Google sign-in: Phase 5.
- Deploying to Vercel: Phase 9.
