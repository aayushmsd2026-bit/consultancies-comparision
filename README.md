# Consultancy reviews for Nepal

An independent website where students rate and review study-abroad consultancies in Nepal.

| File | What it is for |
| --- | --- |
| [`README.md`](README.md) | This file. How to run, set up, deploy and look after the site. |
| [`LAUNCH.md`](LAUNCH.md) | The checklist for launch day and the first week. |
| [`TODO.md`](TODO.md) | What is left, what only you can do, and what was not tested. |
| [`QUALITY.md`](QUALITY.md) | Speed, accessibility and search-engine scores. |
| [`CLAUDE.md`](CLAUDE.md) and [`DESIGN.md`](DESIGN.md) | The original brief and design brief, with the decisions made on the way. |

The site name is not decided yet. It is set in one place: `src/config/site.ts`.

**In short, from nothing to a live site:** run it on your computer (below), set up Supabase,
set up Google sign-in, then follow "Put the site online".

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

The site starts without changing anything in it. It then shows a note that the database is not connected.
To see consultancies and reviews, do "Set up Supabase" below and paste the three keys into this file.

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
| `npm run test` | Runs the fast tests: ranking formula, form rules, colours, translations, and the database security rules. |
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
| `content/` | The guides and the trust pages (review policy, about, privacy, terms), one file per language. |
| `supabase/` | The database structure and demo data. |
| `scripts/` | Small helper programs, for example the consultancy import. |
| `data/` | Source lists, for example the ministry list of consultancies. |
| `tests/e2e` | Browser tests. |

## Search engines

- Every public page has a title, a description, its own address and a link to the other language.
- `/sitemap.xml` lists every page and every consultancy. `/robots.txt` tells search engines what to skip.
- Each consultancy has its own preview picture for shared links, with its name, score and registration badge.
- **Search engines are kept out until you say the site is live.** Everything except the real site
  (`NEXT_PUBLIC_SITE_ENV=production`) is marked "do not index", because it holds demo data.
- Set `NEXT_PUBLIC_SITE_URL` to your real address on Vercel. All links for search engines are built from it.

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

All interface text is in `messages/en.json` and `messages/ne.json`. Change the words there.
Both files must have the same keys. A test fails if one is missing.

## Guides and trust pages

Long text is written as simple files in the `content` folder:

- `content/guides/en` and `content/guides/ne`: the guides.
- `content/pages/en` and `content/pages/ne`: review policy, about, privacy and terms.

Open a file and change the words. A line starting with `##` is a heading. `**bold**` makes text bold.

At the top of each file is a small block called `meta` with the title and description.
Trust pages also have `draft: true`. That shows a yellow "Draft" note on the page.
Change it to `draft: false` once a lawyer has checked the page. Do this in both languages.

To add a guide: copy an existing guide file in both language folders, change the text, then add it to the list in `src/lib/content.ts`.

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

## The admin area

Open <http://localhost:3000/en/admin> and sign in with your admin account (see "Make your own account an admin" above).
Anyone else sees only a sign-in box. The admin area is in English only.

### Clear the review queue fast

The queue shows pending reviews, newest first. One review is always selected (dark outline).
Use the keyboard:

| Key | What it does |
| --- | --- |
| `J` / `K` | Move down / up |
| `O` | Show or hide the proof file |
| `V` | Mark as verified, or remove the mark |
| `A` | Approve. The review goes public and the scores are recalculated. |
| `R` | Reject. Pick a reason or type one, then press `Enter`. |
| `P` | Ask for proof. The review moves to the "Needs proof" tab. |

Yellow flags point at things to look at twice (a phone number, a very short 5-star review, many reviews in one day).
A flag never rejects anything. You decide.

After you have checked a proof file, click **Delete proof file**. We promise reviewers that we do this.

### The other screens

- **Reports**: reviews that visitors reported. Keep the review or reject it. Both close the report.
- **Consultancies**: search, add and edit. Set the registration status and the date last checked here.
  Consultancies suggested by reviewers are marked "Suggested, not approved". Open one, set **Listing** to **Approved** and save.
- **Approved tab, "Post a reply from the consultancy"**: when a consultancy emails you a reply, paste it here.
- **CSV import**: the same import as the command below, in the browser. It checks the file first.
- **Audit log**: every admin action, with the time and who did it. It cannot be edited.

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

## Set up Google sign-in

People write their review first and sign in at the very end. Google sign-in is free.
You need about 15 minutes. Do it once for each Supabase project.

### 1. Create the Google side

1. Go to <https://console.cloud.google.com> and sign in.
2. At the top, click the project menu, then **New project**. Name it, for example, `consultancy-reviews`. Click **Create**.
3. In the search bar type **OAuth consent screen** and open it. If it asks you to get started, do so:
   - App name: your site name.
   - User support email: your email.
   - Audience: **External**.
   - Contact email: your email. Finish.
4. Open **Clients** (or **Credentials**), then **Create client** (or **Create credentials**, **OAuth client ID**).
   - Application type: **Web application**.
   - Name: `Supabase`.
   - Under **Authorised redirect URIs** click **Add URI** and paste this, with your own project ref:
     `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Click **Create**.
5. Copy the **Client ID** and the **Client secret**. Keep the secret private.
6. On the consent screen page, click **Publish app** so that anyone with a Google account can sign in.

### 2. Tell Supabase about it

1. In the Supabase dashboard open **Authentication**, then **Sign In / Providers**.
2. Open **Google**. Switch it on. Paste the Client ID and the Client secret. Save.
3. Open **Authentication**, then **URL Configuration**.
   - **Site URL**: the address of your site, for example `https://your-site.com`. While you only test on your computer, use `http://localhost:3000`.
   - **Redirect URLs**: add `http://localhost:3000/**` and, later, `https://your-site.com/**`.

### 3. Test it yourself

1. Start the site (`npm run dev`) and open <http://localhost:3000/en/review/new>.
2. Search for **Demo Visa Guide** and answer the questions. Each screen has one question.
3. On the proof screen, add any small photo, or skip it.
4. On the last screen click **Continue with Google**. Sign in. You come back to the same screen and nothing is lost.
5. Click **Send my review**. You see "Thank you".
6. In Supabase open **Table Editor**, then `reviews`. Your review is there with status `pending`. The public cannot see it yet.
7. If you added a file: open **Storage**, then `proofs`. It is in a folder named after your user id.

To test "report a review": open any consultancy profile, find a review and click **Report this review**.

### Sign-in options that are switched off

| Setting in `.env.local` | What it does |
| --- | --- |
| `NEXT_PUBLIC_FEATURE_PHONE_OTP=true` | Adds sign-in with a code sent by SMS. Every SMS costs money, and you must first set up an SMS provider in Supabase (**Authentication**, **Sign In / Providers**, **Phone**). Leave it off unless you decide to pay. |
| `NEXT_PUBLIC_FEATURE_DEV_LOGIN=true` | Adds a plain email and password box for testing without Google. It is never shown on the live site. Create the test person in Supabase: **Authentication**, **Users**, **Add user**. |

On the production Supabase project, switch off the **Email** provider (**Authentication**, **Sign In / Providers**) so nobody can create an account with a made-up email.

## Put the site online

The code is already on GitHub. Vercel takes it from there and puts it on the internet. It is free for a site this size.
Follow the steps in order. Use [`LAUNCH.md`](LAUNCH.md) as your checklist on launch day.

### Step 1. A first deploy, to see that it works

1. Go to <https://vercel.com> and sign up with your GitHub account.
2. Click **Add New**, then **Project**.
3. Find `consultancies-comparision` in the list and click **Import**. If it is not in the list, click **Adjust GitHub App Permissions** and give Vercel access to this one repository.
4. Do not change any build setting. Vercel knows this is a Next.js project.
5. Click **Deploy** and wait about two minutes.

You get an address like `https://consultancies-comparision.vercel.app`. The site opens, with a yellow note that
the database is not connected yet. That is expected.

From now on, every change pushed to GitHub is deployed by itself.

### Step 2. A second Supabase project for the real site

Keep two Supabase projects, so tests can never touch real reviews:

| Project | Used by | Demo data |
| --- | --- | --- |
| `consultancy-reviews-dev` | Your computer and Vercel previews | Yes |
| `consultancy-reviews-prod` | The live site only | **Never** |

1. Create the production project the same way as in "Set up Supabase" above. Region: **South Asia (Mumbai)**. Save the database password.
2. Create its tables. Use the production project ref:

```bash
npx supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF
```

```bash
npx supabase db push
```

**Do not add `--include-seed` here.** The production database must start empty.

3. Check in the Supabase dashboard: **Table Editor**, `consultancies` and `reviews` have 0 rows. **Storage** has a private bucket `proofs`.
4. Link your computer back to the development project, so you do not change production by accident:

```bash
npx supabase link --project-ref YOUR_DEVELOPMENT_PROJECT_REF
```

### Step 3. Tell Vercel the settings

In Vercel open your project, then **Settings**, then **Environment Variables**. Add each name and value.
For each one, choose which environment it is for.

| Name | Production | Preview |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your real address, for example `https://your-site.com`. No slash at the end. | Leave empty |
| `NEXT_PUBLIC_SITE_ENV` | `production` | Leave empty. Previews then show "Demo data" and stay hidden from search engines. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Your contact email | Same |
| `NEXT_PUBLIC_SUPABASE_URL` | URL of the **production** project | URL of the **development** project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key of the **production** project | Publishable key of the **development** project |
| `SUPABASE_SECRET_KEY` | Secret key of the **production** project. Tick **Sensitive**. | Secret key of the **development** project |
| `NEXT_PUBLIC_FEATURE_PHONE_OTP` | `false` | `false` |
| `NEXT_PUBLIC_FEATURE_DEV_LOGIN` | `false` | `false` |

Then open **Deployments**, click the three dots on the newest one and choose **Redeploy**. Settings are read when the site is built.

### Step 4. Your own address (domain)

1. Buy a domain from any registrar.
2. In Vercel: **Settings**, **Domains**, **Add**. Type the domain and follow the instructions Vercel shows for your registrar.
3. Set `NEXT_PUBLIC_SITE_URL` to the new address and redeploy.

### Step 5. Google sign-in for the live site

Repeat "Set up Google sign-in" for the production project:

1. In Google Cloud, open your OAuth client and add a second **Authorised redirect URI**:
   `https://YOUR_PRODUCTION_PROJECT_REF.supabase.co/auth/v1/callback`
2. In the **production** Supabase project: switch on Google with the same Client ID and secret.
3. **Authentication**, **URL Configuration**: set **Site URL** to your real address and add `https://your-site.com/**` to **Redirect URLs**.
4. **Authentication**, **Sign In / Providers**: switch **Email** off.

### Step 6. Make yourself the admin and load the consultancies

1. Open the live site, start a review and sign in with Google once. You do not have to send the review.
2. In the production Supabase project, open **SQL Editor** and run the "Make your own account an admin" command from above.
3. Open `https://your-site.com/en/admin`. You should see the empty review queue.
4. Import the consultancy list. The easy way: **CSV import** in the admin area. Upload `data/consultancies.csv`, click **Check the file**, then **Import now**.
   Read the notes about the list in `TODO.md` first.

### Step 7. Go through the launch checklist

Open [`LAUNCH.md`](LAUNCH.md) and tick every box.

## Backups

The free Supabase plan keeps **no automatic backups**. Make your own, once a week. It takes one minute.

Link to the production project, save two files, then link back to development:

```bash
npx supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF
```

```bash
npx supabase db dump -f backups/structure.sql
```

```bash
npx supabase db dump --data-only -f backups/data.sql
```

```bash
npx supabase link --project-ref YOUR_DEVELOPMENT_PROJECT_REF
```

- The `backups` folder is ignored by Git, because it holds private data. Copy the two files to a safe place, for example a private cloud drive.
- Proof files are not in the backup. That is on purpose: they are deleted after checking.
- If you ever need to restore, ask a developer. The two files hold everything.

## When something goes wrong on the live site

- **The site is down or shows an error.** In Vercel open **Deployments**. Click the last deployment that worked, then the three dots, then **Promote to Production**. The site goes back to that version in seconds.
- **To see what happened.** Vercel: **Logs**. Supabase: **Logs**.
- **A page shows old information.** Pages are kept for up to an hour to stay fast. Changes made in the admin area appear at once. Changes made directly in Supabase can take an hour, or redeploy to refresh everything.
- **"Project paused" in Supabase.** The free plan pauses a project after a week with no visitors at all. Open the dashboard and click **Restore**.
