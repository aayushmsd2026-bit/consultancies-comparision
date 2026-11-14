import { useTranslations } from "next-intl";

// Placeholder. The real home page is built in Phase 4.
export default function HomePage() {
  const t = useTranslations("home");
  return (
    <section className="on-signature bg-signature text-signature-ink">
      <div className="page py-section">
        <h1 className="text-hero">{t("heroTitle")}</h1>
        <p className="mt-6 max-w-prose text-lead">{t("heroBody")}</p>
      </div>
    </section>
  );
}
