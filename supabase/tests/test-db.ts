/**
 * A throw-away Postgres database that runs inside the test (PGlite).
 * It loads the real migration files, so the tests check the real security rules.
 * No Supabase account and no internet are needed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

/**
 * The parts Supabase provides before our migrations run: the three roles,
 * the auth schema, the storage schema and the default permissions.
 * Kept as close to a real Supabase project as these tests need.
 */
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    instance_id uuid,
    aud text,
    role text,
    email text,
    phone text,
    raw_app_meta_data jsonb not null default '{}',
    raw_user_meta_data jsonb not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant all on all tables in schema auth to service_role;

  create schema storage;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null,
    owner uuid,
    created_at timestamptz not null default now()
  );
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1]
  $$;
  grant usage on schema storage to anon, authenticated, service_role;
  grant all on all tables in schema storage to anon, authenticated, service_role;

  create schema extensions;
  grant usage on schema extensions to anon, authenticated, service_role;

  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

export type Role = "anon" | "authenticated" | "service_role";
export type Row = Record<string, unknown>;

export type TestDb = {
  /** Run SQL as the database owner. Used to set up test data. */
  admin: (sql: string, params?: unknown[]) => Promise<Row[]>;
  /** Run a whole SQL file as the database owner. */
  exec: (sql: string) => Promise<void>;
  /** Run SQL the way the website would: as a visitor, a signed-in person or the server. */
  as: (who: { role: Role; userId?: string }, sql: string, params?: unknown[]) => Promise<Row[]>;
  close: () => Promise<void>;
};

export async function createTestDb(): Promise<TestDb> {
  const db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(SUPABASE_STUB);

  const dir = join(process.cwd(), "supabase", "migrations");
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }

  return {
    admin: async (sql, params) => (await db.query<Row>(sql, params)).rows,
    exec: async (sql) => {
      await db.exec(sql);
    },
    as: ({ role, userId }, sql, params) =>
      db.transaction(async (tx) => {
        await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId ?? ""]);
        await tx.exec(`set local role ${role}`);
        return (await tx.query<Row>(sql, params)).rows;
      }),
    close: () => db.close(),
  };
}
