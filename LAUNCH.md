# Launch checklist

Tick every box before you tell anyone about the site. The steps to set things up are in [`README.md`](README.md), "Put the site online".

## 1. Before launch day

Decisions and text:

- [ ] The site has a name. `SITE_NAME` in `src/config/site.ts` is changed.
- [ ] A lawyer has read the review policy, privacy page and terms. `draft: false` is set in those files, in both languages.
- [ ] The About page says who runs the site. `NEXT_PUBLIC_CONTACT_EMAIL` is a real mailbox that you read.
- [ ] A native Nepali reader has checked `messages/ne.json` and the files in `content/`.
- [ ] You have confirmed what the ministry list means, and you have its public link (see `TODO.md`).

Setup:

- [ ] Production Supabase project exists, with tables, **without** demo data.
- [ ] All environment variables are set in Vercel for **Production** (README, step 3).
- [ ] `NEXT_PUBLIC_SITE_ENV` is `production` for Production only.
- [ ] Your domain works and `NEXT_PUBLIC_SITE_URL` matches it exactly.
- [ ] Google sign-in works on the live address. The Email provider is switched off in production Supabase.
- [ ] Your account has `role = admin` in production.
- [ ] The consultancy list is imported. The count on the Check page looks right.

## 2. Test on your own phone

Use mobile data, not Wi-Fi. That is how most students will see it.

Finding and checking:

- [ ] The home page opens fast. There is **no** yellow "Demo data" bar.
- [ ] Type three letters of a consultancy name. Suggestions appear with a registration badge.
- [ ] Tap a suggestion. The profile shows the name, the city and the badge at the top.
- [ ] A consultancy with no reviews shows "Not enough reviews yet", not a score of zero.
- [ ] The Check page: a real name gives the right answer. A made-up name gives "Not found on our list".
- [ ] Compare two consultancies. You can swipe sideways.
- [ ] Switch to Nepali (ने). Text, numbers and dates are in Nepali. Switch back.
- [ ] Open a guide. Open the review policy.
- [ ] Nothing scrolls sideways by accident. Every button is easy to tap with your thumb.

Writing a review (use a second Google account, not your admin one):

- [ ] Write a full review without signing in until the last screen.
- [ ] Add a photo as proof.
- [ ] Sign in with Google at the end. You come back and nothing is lost.
- [ ] Send it. You see "Thank you".
- [ ] The review is **not** on the public page yet.

Moderating (on a computer, with your admin account):

- [ ] The review is in the queue at `/en/admin`.
- [ ] Press `O`. You see the proof photo.
- [ ] Press `V`, then `A`. The review appears on the public profile with "Verified student".
- [ ] Click **Delete proof file**. In Supabase **Storage**, the file is gone.
- [ ] On the public page, click **Report this review** and send a report. It appears under **Reports**. Resolve it.
- [ ] Reject the test review (press `R`). It disappears from the public page.
- [ ] The **Audit log** shows every step you just took.

Sharing and search engines:

- [ ] Send a profile link to yourself on WhatsApp or Messenger. The preview shows the name and badge.
- [ ] Open `https://your-site.com/robots.txt`. It says `Allow: /`.
- [ ] Open `https://your-site.com/sitemap.xml`. It lists your pages with your real address.
- [ ] Add the site to [Google Search Console](https://search.google.com/search-console) and submit the sitemap.

## 3. What to back up

- [ ] **The database, once a week.** README, "Backups". Put a weekly reminder in your calendar.
- [ ] **Your passwords and keys**, in a password manager: Supabase account, both database passwords, Vercel account, Google Cloud account, domain registrar.
- [ ] **The code** is safe on GitHub. Nothing to do.
- [ ] **`data/consultancies.csv`** after you clean it up. Commit it to GitHub.

Proof files are never backed up. They are deleted after checking.

## 4. What to watch in the first week

Every day, five minutes:

- [ ] **The review queue.** Approve or reject. Nobody should wait more than a few days.
- [ ] **Reports.** Look at each one.
- [ ] **Yellow flags** in the queue. Several reviews for one consultancy in one day can mean a campaign, good or bad.
- [ ] **Your contact mailbox.** Consultancies may write to correct details or to reply to a review.

Twice in the week:

- [ ] **Vercel, Logs.** Look for red error lines. A few are normal. The same error many times is not.
- [ ] **Supabase, Reports.** Database size and requests should be far below the free limits.
- [ ] **Vercel, Usage.** Same: far below the free limits.
- [ ] **Authentication, Users** in Supabase. A sudden wave of new accounts is worth a look.

Once, at the end of the week:

- [ ] Make the first backup and check that the two files are not empty.
- [ ] Google Search Console: are pages being indexed? Any errors?
- [ ] Read the newest reviews on the public site on your phone. Does everything still look right?

## 5. If you get a legal threat or an angry call

- Do not remove a review because someone demands it or offers money. That is the first rule of the site.
- Ask them to use **Report this review** or to email you, in writing.
- Check the review against the review policy. Remove it only if it breaks the policy.
- Offer the consultancy a public reply under the review.
- If a lawyer writes to you, talk to your own lawyer before you answer.
