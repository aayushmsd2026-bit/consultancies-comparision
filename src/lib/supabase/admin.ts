import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * A database client with the secret key. It skips the security rules, so it is
 * used only on the server, only after our own checks (admin role, rate limits).
 * Never import this file from a client component.
 */
export function getAdminClient(): SupabaseClient {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !secret) {
    throw new Error("SUPABASE_SECRET_KEY is not set. See README.md, \"Set up Supabase\".");
  }
  return createClient(SUPABASE_URL, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
