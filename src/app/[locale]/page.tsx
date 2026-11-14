import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations();

  return (
    <main id="main" className="flex flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-5xl font-semibold tracking-tight">
        {t("home.heroTitle")}
      </h1>
      <p className="max-w-prose text-lg">{t("home.heroBody")}</p>
      <p className="text-base opacity-70">{t("home.setupNote")}</p>
      <nav aria-label={t("language.label")} className="flex gap-4 text-base">
        <Link href="/" locale="en" className="underline">
          {t("language.en")}
        </Link>
        <Link href="/" locale="ne" className="underline">
          {t("language.ne")}
        </Link>
      </nav>
    </main>
  );
}
