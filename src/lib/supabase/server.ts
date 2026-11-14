import "server-only";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/**
 * A database client that acts as the signed-in visitor. It reads the sign-in
 * cookie, so the security rules know who is asking. Create a new one for each request.
 */
export async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot set cookies. The proxy refreshes the session instead.
        }
      },
    },
  });
}

export type SessionUser = { id: string; email: string | null; isAdmin: boolean; displayName: string | null };

/**
 * The signed-in person, checked with the sign-in server. Null when nobody is signed in.
 * Asked once per page request, however many parts of the page need it.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;
  // Who is signed in can only be known when a real visitor asks. Never ahead of time.
  await connection();
  const supabase = await getServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", data.user.id)
    .maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    isAdmin: profile?.role === "admin",
    displayName: profile?.display_name ?? null,
  };
});
