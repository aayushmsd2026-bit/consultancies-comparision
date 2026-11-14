import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

let client: SupabaseClient | null = null;

/**
 * A database client for public reads. It carries no sign-in, so it can only see
 * what any visitor can see. Returns null when Supabase is not set up yet.
 */
export function getPublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
