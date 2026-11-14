import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Reads .env.local, the same file the site uses. */
function env(name: string): string {
  if (process.env[name]) return process.env[name]!;
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((row) => row.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} is missing from .env.local`);
  return line.slice(name.length + 1).trim();
}

let client: SupabaseClient | null = null;

/** A database client with full rights, for preparing and checking test data. Local database only. */
export function adminDb(): SupabaseClient {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  if (!/127\.0\.0\.1|localhost/.test(url)) {
    throw new Error("The browser tests create and delete data. They only run against the local database.");
  }
  client ??= createClient(url, env("SUPABASE_SECRET_KEY"), { auth: { persistSession: false } });
  return client;
}

export type TestUser = { id: string; email: string; password: string };

/** Creates a fictional person who can sign in with the test sign-in form. */
export async function createTestUser(label: string, options: { admin?: boolean } = {}): Promise<TestUser> {
  const email = `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.invalid`;
  const password = `Test-${crypto.randomUUID()}`;
  const { data, error } = await adminDb().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Test Person" },
  });
  if (error || !data.user) throw new Error(`Could not create a test user: ${error?.message}`);
  if (options.admin) {
    await adminDb().from("profiles").update({ role: "admin" }).eq("id", data.user.id);
  }
  return { id: data.user.id, email, password };
}

/** Removes the test person and, with them, everything they wrote. */
export async function deleteTestUser(user: TestUser | undefined): Promise<void> {
  if (user) await adminDb().auth.admin.deleteUser(user.id);
}

/** Forgets earlier "too many requests" counts, so repeated test runs do not block each other. */
export async function resetRateLimits(): Promise<void> {
  await adminDb().from("rate_limits").delete().neq("key", "");
}
