import "server-only";
import { getServerClient, getSessionUser, type SessionUser } from "@/lib/supabase/server";

/**
 * Every admin page and every admin action starts here.
 * Throws unless the signed-in person has role = admin. The database checks the same again.
 */
/** True when the signed-in person is an admin. Admin pages show nothing at all otherwise. */
export async function isAdminSession(): Promise<boolean> {
  return (await getSessionUser())?.isAdmin === true;
}

export async function requireAdmin(): Promise<{ user: SessionUser; supabase: Awaited<ReturnType<typeof getServerClient>> }> {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("not_admin");
  return { user, supabase: await getServerClient() };
}
