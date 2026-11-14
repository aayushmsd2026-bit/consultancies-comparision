import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AdminSignIn, AdminSignOut } from "@/components/admin/admin-sign-in";
import { Link } from "@/i18n/navigation";
import { getQueueCounts } from "@/lib/admin/data";
import { getSessionUser } from "@/lib/supabase/server";
import en from "../../../../messages/en.json";

export const metadata: Metadata = {
  title: "Admin",
  // The admin area must never appear in a search engine.
  robots: { index: false, follow: false },
};

// The admin area is English only. These are the text groups its interactive parts use.
const adminMessages = { admin: en.admin, ui: en.ui, review: en.review, countries: en.countries };

async function Gate({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user?.isAdmin) {
    return (
      <NextIntlClientProvider locale="en" messages={adminMessages}>
        <AdminSignIn signedInButNotAdmin={!!user} />
      </NextIntlClientProvider>
    );
  }

  const t = await getTranslations({ locale: "en", namespace: "admin" });
  const counts = await getQueueCounts();
  const links = [
    { href: "/admin", label: t("nav.queue"), count: counts.pending },
    { href: "/admin/reports", label: t("nav.reports"), count: counts.reports },
    { href: "/admin/consultancies", label: t("nav.consultancies"), count: counts.suggestions },
    { href: "/admin/import", label: t("nav.import"), count: 0 },
    { href: "/admin/log", label: t("nav.log"), count: 0 },
  ];

  return (
    <NextIntlClientProvider locale="en" messages={adminMessages}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line-strong pb-2">
        <nav aria-label={t("nav.label")}>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-10 items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
                  {link.label}
                  {link.count > 0 && (
                    <span className="tabular rounded-full bg-ink px-2 text-micro text-paper">{link.count}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-ink-soft">
          {t("signedInAs", { name: user.displayName ?? user.email ?? "admin" })} · <AdminSignOut />
        </p>
      </div>
      <div className="pt-4">{children}</div>
    </NextIntlClientProvider>
  );
}

/** Plain, dense and fast. No decoration. Only people with role = admin get past the gate. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page py-4 text-small" lang="en">
      <Suspense fallback={<p className="py-10 text-ink-soft">…</p>}>
        <Gate>{children}</Gate>
      </Suspense>
    </div>
  );
}
