import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

/**
 * Runs before every page request.
 * 1. Sends "/" to "/en" or "/ne" and remembers the visitor's language.
 * 2. For signed-in visitors, keeps the sign-in fresh so it does not expire mid-visit.
 */
export default async function proxy(request: NextRequest) {
  const response = handleI18n(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Visitors who are not signed in have no sign-in cookie. Skip the work for them.
  const signedIn = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
  if (url && key && signedIn) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
          // Pages that set a sign-in cookie must never be stored by a shared cache.
          for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
        },
      },
    });
    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  // Run on pages only. Skip API routes, the sign-in return address, Next.js internals and files (images, sitemap.xml).
  matcher: "/((?!api|auth|_next|_vercel|.*\\..*).*)",
};
