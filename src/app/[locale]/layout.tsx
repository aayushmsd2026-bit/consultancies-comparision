import type { Metadata, Viewport } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ClientMessages } from "@/components/client-messages";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import { DemoBanner } from "@/components/ui/demo-banner";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { ToastProvider } from "@/components/ui/toast";
import { fontVariables } from "@/config/fonts";
import { PALETTE } from "@/config/palette";
import { IS_PRODUCTION, SITE_NAME, SITE_URL } from "@/config/site";
import { routing } from "@/i18n/routing";
import "./globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    metadataBase: new URL(SITE_URL),
    title: t("title", { siteName: SITE_NAME }),
    description: t("description"),
    openGraph: { siteName: SITE_NAME, type: "website" },
    // Test and preview sites hold demo data and must not be indexed.
    ...(!IS_PRODUCTION && { robots: { index: false, follow: false } }),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PALETTE.light.paper },
    { media: "(prefers-color-scheme: dark)", color: PALETTE.dark.paper },
  ],
};

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations("common");

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-ink px-6 py-3 font-semibold text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t("skipToContent")}
        </a>
        <ClientMessages>
          <ToastProvider>
            <DemoBanner />
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
            <BottomTabBar />
          </ToastProvider>
        </ClientMessages>
      </body>
    </html>
  );
}
