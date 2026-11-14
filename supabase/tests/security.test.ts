import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./test-db";

/**
 * These tests prove the trust rules of the site at the database level:
 *   - the public cannot read pending reviews
 *   - the public cannot read proof files
 *   - the public can never see a reviewer's user id, email or phone
 * and the other rules from CLAUDE.md section 7.
 */

// Fixed ids so the tests are easy to read.
const SITA = "11111111-1111-4111-8111-111111111111"; // a reviewer
const HARI = "22222222-2222-4222-8222-222222222222"; // another signed-in person
const ADMIN = "99999999-9999-4999-8999-999999999999";
const OPEN_CONSULTANCY = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const HIDDEN_CONSULTANCY = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const THIRD_CONSULTANCY = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const APPROVED_REVIEW = "a0000000-0000-4000-8000-000000000001";
const PENDING_REVIEW = "a0000000-0000-4000-8000-000000000002";
const PROOF_PATH = `${SITA}/${PENDING_REVIEW}/visa.jpg`;

const anon = { role: "anon" } as const;
const sita = { role: "authenticated", userId: SITA } as const;
const hari = { role: "authenticated", userId: HARI } as const;
const admin = { role: "authenticated", userId: ADMIN } as const;
const server = { role: "service_role" } as const;

const REVIEW_COLUMNS = `consultancy_id, user_id, country, study_level, intake_year, outcome,
  rating_honesty, rating_communication, rating_documents, rating_speed, rating_after_visa,
  went_well, went_badly, would_recommend, display_name_choice`;
const reviewValues = (consultancy: string, user: string) =>
  `'${consultancy}', '${user}', 'AU', 'bachelor', 2026, 'visa_granted', 5, 4, 4, 3, null,
   'Clear advice.', 'Slow replies.', true, 'initials'`;

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();

  await db.admin(`
    insert into auth.users (id, email, phone, raw_user_meta_data) values
      ('${SITA}', 'sita@example.invalid', '+9779800000001', '{"full_name": "Sita Kumari Sharma"}'),
      ('${HARI}', 'hari@example.invalid', '+9779800000002', '{"name": "Hari Thapa"}'),
      ('${ADMIN}', 'owner@example.invalid', null, '{"full_name": "Site Owner"}')
  `);
  await db.admin(`update public.profiles set role = 'admin' where id = '${ADMIN}'`);

  await db.admin(`
    insert into public.consultancies (id, slug, name, listing_status, registration_status) values
      ('${OPEN_CONSULTANCY}', 'example-education', 'Example Education Pvt. Ltd.', 'approved', 'registered'),
      ('${HIDDEN_CONSULTANCY}', 'suggested-not-approved', 'Suggested But Not Approved', 'pending', 'unknown'),
      ('${THIRD_CONSULTANCY}', 'sample-study-centre', 'Sample Study Centre', 'approved', 'unknown')
  `);
  await db.admin(`
    insert into public.branches (consultancy_id, city, is_head_office) values
      ('${OPEN_CONSULTANCY}', 'Kathmandu', true),
      ('${HIDDEN_CONSULTANCY}', 'Pokhara', true)
  `);

  await db.admin(`
    insert into public.reviews (id, status, approved_at, ${REVIEW_COLUMNS}) values
      ('${APPROVED_REVIEW}', 'approved', now(), ${reviewValues(OPEN_CONSULTANCY, HARI)}),
      ('${PENDING_REVIEW}', 'pending', null, ${reviewValues(OPEN_CONSULTANCY, SITA)})
  `);
  await db.admin(
    `insert into public.review_proofs (review_id, storage_path) values ('${PENDING_REVIEW}', '${PROOF_PATH}')`,
  );
  await db.admin(
    `insert into storage.objects (bucket_id, name, owner) values ('proofs', '${PROOF_PATH}', '${SITA}')`,
  );
  await db.admin(`
    insert into public.replies (review_id, consultancy_id, author_user_id, body, status) values
      ('${APPROVED_REVIEW}', '${OPEN_CONSULTANCY}', '${ADMIN}', 'Thank you.', 'approved'),
      ('${APPROVED_REVIEW}', '${OPEN_CONSULTANCY}', '${ADMIN}', 'Draft reply.', 'pending')
  `);
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe("the public cannot read pending reviews", () => {
  it("a visitor cannot open the reviews table at all", async () => {
    await expect(db.as(anon, "select * from public.reviews")).rejects.toThrow(/permission denied/);
  });

  it("a visitor sees only approved reviews in the public view", async () => {
    const rows = await db.as(anon, "select id from public.public_reviews");
    expect(rows.map((row) => row.id)).toEqual([APPROVED_REVIEW]);
  });

  it("a signed-in person cannot see someone else's pending review", async () => {
    const rows = await db.as(hari, "select id from public.reviews where id = $1", [PENDING_REVIEW]);
    expect(rows).toEqual([]);
  });

  it("the writer can see their own pending review", async () => {
    const rows = await db.as(sita, "select id from public.reviews");
    expect(rows.map((row) => row.id)).toEqual([PENDING_REVIEW]);
  });

  it("a visitor sees only approved replies", async () => {
    const rows = await db.as(anon, "select body from public.public_replies");
    expect(rows).toEqual([{ body: "Thank you." }]);
    await expect(db.as(anon, "select * from public.replies")).rejects.toThrow(/permission denied/);
  });

  it("reviews of a consultancy that is not approved yet stay hidden", async () => {
    await db.admin(`
      insert into public.reviews (status, approved_at, ${REVIEW_COLUMNS})
      values ('approved', now(), ${reviewValues(HIDDEN_CONSULTANCY, HARI)})
    `);
    const rows = await db.as(anon, "select consultancy_slug from public.public_reviews");
    expect(rows).toEqual([{ consultancy_slug: "example-education" }]);
  });
});

describe("the public cannot read proof files", () => {
  it("a visitor cannot read the proof list", async () => {
    await expect(db.as(anon, "select * from public.review_proofs")).rejects.toThrow(/permission denied/);
  });

  it("a visitor sees no files in storage", async () => {
    expect(await db.as(anon, "select name from storage.objects")).toEqual([]);
  });

  it("another signed-in person sees no proofs and no files", async () => {
    expect(await db.as(hari, "select id from public.review_proofs")).toEqual([]);
    expect(await db.as(hari, "select name from storage.objects")).toEqual([]);
  });

  it("the uploader sees their own proof and file", async () => {
    expect(await db.as(sita, "select storage_path from public.review_proofs")).toEqual([{ storage_path: PROOF_PATH }]);
    expect(await db.as(sita, "select name from storage.objects")).toEqual([{ name: PROOF_PATH }]);
  });

  it("the admin can read proofs", async () => {
    expect(await db.as(admin, "select name from storage.objects")).toHaveLength(1);
    expect(await db.as(admin, "select id from public.review_proofs")).toHaveLength(1);
  });

  it("nobody can upload into another person's folder", async () => {
    await expect(
      db.as(hari, `insert into storage.objects (bucket_id, name) values ('proofs', '${SITA}/x/fake.jpg')`),
    ).rejects.toThrow(/row-level security/);
    await expect(
      db.as(hari, `insert into public.review_proofs (review_id, storage_path) values ('${PENDING_REVIEW}', 'x')`),
    ).rejects.toThrow(/row-level security/);
  });

  it("only the admin can delete a proof file", async () => {
    await db.as(sita, `delete from storage.objects where name = '${PROOF_PATH}'`);
    expect(await db.admin("select name from storage.objects")).toHaveLength(1);
  });

  it("the bucket is private", async () => {
    expect(await db.admin("select public from storage.buckets where id = 'proofs'")).toEqual([{ public: false }]);
  });
});

describe("the public can never see who wrote a review", () => {
  it("the public views have no user id, email or phone column", async () => {
    const rows = await db.admin(`
      select table_name, column_name from information_schema.columns
      where table_schema = 'public' and table_name in ('public_reviews', 'public_replies')
    `);
    const columns = rows.map((row) => String(row.column_name));
    expect(columns.length).toBeGreaterThan(10);
    for (const column of columns) {
      expect(column).not.toMatch(/user_id|email|phone|author/);
    }
  });

  it("no row of the public view contains a reviewer's id, email or phone", async () => {
    const rows = await db.as(anon, "select * from public.public_reviews");
    const dump = JSON.stringify(rows);
    for (const secret of [SITA, HARI, "example.invalid", "+97798"]) {
      expect(dump).not.toContain(secret);
    }
  });

  it("a visitor cannot read profiles or the sign-in accounts", async () => {
    await expect(db.as(anon, "select * from public.profiles")).rejects.toThrow(/permission denied/);
    await expect(db.as(anon, "select * from auth.users")).rejects.toThrow(/permission denied/);
    await expect(db.as(hari, "select * from auth.users")).rejects.toThrow(/permission denied/);
  });

  it("a signed-in person can read only their own profile", async () => {
    const rows = await db.as(hari, "select id from public.profiles");
    expect(rows).toEqual([{ id: HARI }]);
  });

  it("shows the name the way the reviewer chose", async () => {
    const show = async (choice: string) => {
      await db.admin(`update public.reviews set display_name_choice = '${choice}' where id = '${APPROVED_REVIEW}'`);
      const [row] = await db.as(anon, "select display_name from public.public_reviews");
      return row.display_name;
    };
    expect(await show("name")).toBe("Hari Thapa");
    expect(await show("initials")).toBe("H. T.");
    expect(await show("anonymous")).toBeNull();
  });

  it("every table and view a visitor can read is on the approved list", async () => {
    const rows = await db.admin(`
      select distinct table_name from information_schema.role_table_grants
      where grantee = 'anon' and table_schema = 'public' and privilege_type = 'SELECT'
      order by table_name
    `);
    expect(rows.map((row) => row.table_name)).toEqual([
      "branches",
      "consultancies",
      "public_cities",
      "public_replies",
      "public_reviews",
    ]);
  });
});

describe("writing a review", () => {
  it("a visitor who is not signed in cannot add a review", async () => {
    await expect(
      db.as(anon, `insert into public.reviews (${REVIEW_COLUMNS}) values (${reviewValues(THIRD_CONSULTANCY, SITA)})`),
    ).rejects.toThrow(/permission denied/);
  });

  it("nobody can add a review in another person's name", async () => {
    await expect(
      db.as(hari, `insert into public.reviews (${REVIEW_COLUMNS}) values (${reviewValues(THIRD_CONSULTANCY, SITA)})`),
    ).rejects.toThrow(/row-level security/);
  });

  it("a new review is always pending and unverified, whatever is sent", async () => {
    await db.as(
      sita,
      `insert into public.reviews (status, is_verified, approved_at, ${REVIEW_COLUMNS})
       values ('approved', true, now(), ${reviewValues(THIRD_CONSULTANCY, SITA)})`,
    );
    const [row] = await db.admin(
      `select status, is_verified, approved_at, overall from public.reviews
       where user_id = '${SITA}' and consultancy_id = '${THIRD_CONSULTANCY}'`,
    );
    expect(row).toMatchObject({ status: "pending", is_verified: false, approved_at: null });
    // 5, 4, 4, 3 and no after-visa rating -> 4.00
    expect(Number(row.overall)).toBe(4);
  });

  it("allows one review per person per consultancy", async () => {
    await expect(
      db.as(sita, `insert into public.reviews (${REVIEW_COLUMNS}) values (${reviewValues(THIRD_CONSULTANCY, SITA)})`),
    ).rejects.toThrow(/reviews_one_per_user_per_consultancy/);
  });

  it("the writer can fix their text while the review waits", async () => {
    await db.as(sita, `update public.reviews set went_well = 'Edited.' where id = '${PENDING_REVIEW}'`);
    expect(await db.admin(`select went_well from public.reviews where id = '${PENDING_REVIEW}'`)).toEqual([
      { went_well: "Edited." },
    ]);
  });

  it("the writer cannot approve or verify their own review", async () => {
    for (const change of ["status = 'approved'", "is_verified = true", "approved_at = now()"]) {
      await expect(
        db.as(sita, `update public.reviews set ${change} where id = '${PENDING_REVIEW}'`),
      ).rejects.toThrow(/Only an admin/);
    }
  });

  it("the writer cannot edit a review after it is approved", async () => {
    await db.as(hari, `update public.reviews set went_well = 'Changed later.' where id = '${APPROVED_REVIEW}'`);
    const [row] = await db.admin(`select went_well from public.reviews where id = '${APPROVED_REVIEW}'`);
    expect(row.went_well).toBe("Clear advice.");
  });

  it("stops a person who posts too many reviews in one day", async () => {
    const SPAMMER = "33333333-3333-4333-8333-333333333333";
    await db.admin(`insert into auth.users (id, email) values ('${SPAMMER}', 'spam@example.invalid')`);
    const ids = await db.admin(`
      insert into public.consultancies (slug, name)
      select 'made-up-' || n, 'Made-up Consultancy ' || n from generate_series(1, 6) as n
      returning id
    `);
    const spammer = { role: "authenticated", userId: SPAMMER } as const;
    for (const { id } of ids.slice(0, 5)) {
      await db.as(spammer, `insert into public.reviews (${REVIEW_COLUMNS}) values (${reviewValues(String(id), SPAMMER)})`);
    }
    await expect(
      db.as(spammer, `insert into public.reviews (${REVIEW_COLUMNS}) values (${reviewValues(String(ids[5].id), SPAMMER)})`),
    ).rejects.toThrow(/Too many reviews/);
  });
});

describe("only admins decide", () => {
  it("the admin can approve a review and it becomes public", async () => {
    await db.as(
      admin,
      `update public.reviews set status = 'approved', approved_at = now(), is_verified = true where id = '${PENDING_REVIEW}'`,
    );
    const rows = await db.as(anon, "select id, is_verified from public.public_reviews where id = $1", [PENDING_REVIEW]);
    expect(rows).toEqual([{ id: PENDING_REVIEW, is_verified: true }]);
  });

  it("nobody else can change a consultancy", async () => {
    await expect(
      db.as(anon, `update public.consultancies set registration_status = 'registered' where id = '${THIRD_CONSULTANCY}'`),
    ).rejects.toThrow(/permission denied/);
    await db.as(hari, `update public.consultancies set registration_status = 'registered', avg_score = 5 where id = '${THIRD_CONSULTANCY}'`);
    const [row] = await db.admin(`select registration_status, avg_score from public.consultancies where id = '${THIRD_CONSULTANCY}'`);
    expect(row).toEqual({ registration_status: "unknown", avg_score: null });
    await expect(
      db.as(hari, `insert into public.consultancies (slug, name) values ('sneaky', 'Sneaky Listing')`),
    ).rejects.toThrow(/row-level security/);
  });

  it("the admin can change a consultancy", async () => {
    await db.as(admin, `update public.consultancies set registration_status = 'expired' where id = '${THIRD_CONSULTANCY}'`);
    const [row] = await db.admin(`select registration_status from public.consultancies where id = '${THIRD_CONSULTANCY}'`);
    expect(row.registration_status).toBe("expired");
  });

  it("nobody can make themselves an admin", async () => {
    await expect(db.as(hari, `update public.profiles set role = 'admin' where id = '${HARI}'`)).rejects.toThrow(
      /permission denied/,
    );
    await db.as(hari, `update public.profiles set display_name = 'Hari T.' where id = '${HARI}'`);
    expect(await db.admin(`select role, display_name from public.profiles where id = '${HARI}'`)).toEqual([
      { role: "user", display_name: "Hari T." },
    ]);
  });

  it("only admins see reports and the audit log", async () => {
    await db.as(admin, `insert into public.reports (review_id, reason) values ('${APPROVED_REVIEW}', 'fake')`);
    await db.as(admin, `insert into public.audit_log (actor_user_id, action, target_table) values ('${ADMIN}', 'approve', 'reviews')`);
    expect(await db.as(hari, "select id from public.reports")).toEqual([]);
    expect(await db.as(hari, "select id from public.audit_log")).toEqual([]);
    await expect(db.as(anon, "select id from public.reports")).rejects.toThrow(/permission denied/);
    await expect(
      db.as(hari, `insert into public.reports (review_id, reason) values ('${APPROVED_REVIEW}', 'fake')`),
    ).rejects.toThrow(/row-level security/);
    expect(await db.as(admin, "select id from public.reports")).toHaveLength(1);
  });

  it("the audit log cannot be edited", async () => {
    await expect(db.as(admin, "delete from public.audit_log")).rejects.toThrow(/permission denied/);
  });
});

describe("scores", () => {
  it("only an admin can store new scores", async () => {
    const scores = JSON.stringify([
      { id: OPEN_CONSULTANCY, avg_score: 4.5, review_count: 7, verified_review_count: 2, rank_score: 4.1 },
    ]);
    await expect(db.as(anon, "select public.apply_consultancy_scores($1::jsonb, 3.5)", [scores])).rejects.toThrow(/permission denied/);

    // A normal signed-in person can call it, but the security rules stop every change.
    await db.as(hari, "select public.apply_consultancy_scores($1::jsonb, 3.5)", [scores]);
    const [untouched] = await db.admin(`select review_count from public.consultancies where id = '${OPEN_CONSULTANCY}'`);
    expect(untouched.review_count).not.toBe(7);

    await db.as(admin, "select public.apply_consultancy_scores($1::jsonb, 3.5)", [scores]);
    const [stored] = await db.admin(`select avg_score, review_count, rank_score from public.consultancies where id = '${OPEN_CONSULTANCY}'`);
    expect(stored).toMatchObject({ review_count: 7 });
    expect(Number(stored.avg_score)).toBe(4.5);
    // Consultancies without reviews get the site average as their rank score, and no visible score.
    const [empty] = await db.admin(`select avg_score, review_count, rank_score from public.consultancies where id = '${THIRD_CONSULTANCY}'`);
    expect(empty.avg_score).toBeNull();
    expect(Number(empty.rank_score)).toBe(3.5);
  });
});

describe("listings", () => {
  it("a consultancy that is not approved yet is hidden, with its branches", async () => {
    const names = await db.as(anon, "select slug from public.consultancies order by slug");
    expect(names.map((row) => row.slug)).not.toContain("suggested-not-approved");
    expect(await db.as(anon, "select city from public.branches")).toEqual([{ city: "Kathmandu" }]);
  });

  it("the city list only counts listed consultancies", async () => {
    expect(await db.as(anon, "select city, consultancy_count from public.public_cities")).toEqual([
      { city: "Kathmandu", consultancy_count: 1 },
    ]);
  });

  it("the '3 reviews' rule in the database matches the ranking settings", async () => {
    const { RANKING } = await import("../../src/config/ranking");
    await db.admin(`update public.consultancies set review_count = ${RANKING.minReviewsToShowScore - 1} where slug = 'example-education'`);
    expect(await db.admin("select score_visible from public.consultancies where slug = 'example-education'")).toEqual([{ score_visible: false }]);
    await db.admin(`update public.consultancies set review_count = ${RANKING.minReviewsToShowScore} where slug = 'example-education'`);
    expect(await db.admin("select score_visible from public.consultancies where slug = 'example-education'")).toEqual([{ score_visible: true }]);
  });

  it("search finds approved consultancies and forgives a small typo", async () => {
    const exact = await db.as(anon, "select slug from public.search_consultancies('example')");
    // The exact match comes first. Close names ("Sample") may follow.
    expect(exact[0].slug).toBe("example-education");
    const typo = await db.as(anon, "select slug from public.search_consultancies('Exampel Educaton')");
    expect(typo.map((row) => row.slug)).toContain("example-education");
    expect(await db.as(anon, "select slug from public.search_consultancies('suggested')")).toEqual([]);
    const shortTypo = await db.as(anon, "select slug from public.search_consultancies('exampel')");
    expect(shortTypo.map((row) => row.slug)).toContain("example-education");
    expect(await db.as(anon, "select slug from public.search_consultancies('zzzz')")).toEqual([]);
    expect(await db.as(anon, "select slug from public.search_consultancies('e')")).toEqual([]);
  });
});

describe("rate limits", () => {
  it("allows the first hits and then says no", async () => {
    const hit = async () => (await db.as(server, "select public.hit_rate_limit('report:test', 2, 3600) as ok"))[0].ok;
    expect(await hit()).toBe(true);
    expect(await hit()).toBe(true);
    expect(await hit()).toBe(false);
  });

  it("can only be used by the server", async () => {
    await expect(db.as(anon, "select public.hit_rate_limit('x', 1, 60)")).rejects.toThrow(/permission denied/);
    await expect(db.as(hari, "select public.hit_rate_limit('x', 1, 60)")).rejects.toThrow(/permission denied/);
  });
});

describe("demo data", () => {
  it("supabase/seed.sql is up to date and loads into a fresh database", async () => {
    const { readFileSync } = await import("node:fs");
    const { buildSeedSql } = await import("../../src/lib/seed-sql");
    const onDisk = readFileSync("supabase/seed.sql", "utf8");
    // If this fails, run: npm run seed:build
    expect(onDisk).toBe(buildSeedSql());

    const fresh = await createTestDb();
    await fresh.exec(onDisk);
    const [counts] = await fresh.admin(`
      select
        (select count(*)::int from public.consultancies where listing_status = 'approved') as consultancies,
        (select count(*)::int from public.reviews) as reviews,
        (select count(*)::int from public.public_reviews) as public_reviews
    `);
    expect(counts.consultancies).toBe(12);
    expect(Number(counts.reviews)).toBeGreaterThanOrEqual(55);
    expect(Number(counts.public_reviews)).toBeLessThan(Number(counts.reviews));

    // The stored counts match the reviews that are really there.
    const mismatches = await fresh.admin(`
      select c.slug from public.consultancies c
      where c.review_count <> (select count(*) from public.reviews r where r.consultancy_id = c.id and r.status = 'approved')
    `);
    expect(mismatches).toEqual([]);
    await fresh.close();
  }, 60_000);

  it("uses only clearly fictional names", async () => {
    const { consultancies } = await import("../seed-data");
    for (const consultancy of consultancies) {
      expect(consultancy.name).toMatch(/Example|Sample|Demo|Placeholder|Fictional|Made-up|Test Case|Imaginary|Lorem Ipsum|Not-a-Real|Mock|Pretend/);
    }
  });
});
