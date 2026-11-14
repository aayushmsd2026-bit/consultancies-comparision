import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Sends "/" to "/en" or "/ne" and remembers the visitor's language.
export default createMiddleware(routing);

export const config = {
  // Run on pages only. Skip API routes, Next.js internals and files with a dot (images, sitemap.xml).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
