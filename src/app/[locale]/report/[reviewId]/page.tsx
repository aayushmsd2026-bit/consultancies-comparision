import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ClientMessages } from "@/components/client-messages";
import { ReportForm } from "@/components/review/report-form";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { getPublicReview } from "@/lib/data/public";

type Props = PageProps<"/[locale]/report/[reviewId]">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("report");
  // Nothing useful for search engines here.
  return { title: t("metaTitle", { siteName: SITE_NAME }), robots: { index: false } };
}

// Report pages are made when someone asks for one. Next.js needs one example address to check the page.
export function generateStaticParams() {
  return [{ reviewId: "00000000-0000-4000-8000-000000000000" }];
}

async function Report({ params }: Pick<Props, "params">) {
  const { reviewId } = await params;
  const locale = await getLocale();
  const review = await getPublicReview(reviewId, locale);
  if (!review) notFound();
  const t = await getTranslations("report");

  return (
    <>
      <figure className="mt-8 rounded-card bg-paper-sunk p-5">
        <figcaption className="text-small font-semibold text-ink-soft">
          {t("reviewOf", { name: review.consultancyName })}
        </figcaption>
        <blockquote className="mt-2 line-clamp-4 whitespace-pre-line break-words">{review.wentWell}</blockquote>
        <blockquote className="mt-2 line-clamp-4 whitespace-pre-line break-words">{review.wentBadly}</blockquote>
      </figure>
      <div className="mt-8">
        <ClientMessages namespaces={["report"]}>
          <ReportForm reviewId={review.id} consultancySlug={review.consultancySlug} />
        </ClientMessages>
      </div>
    </>
  );
}

export default async function ReportPage({ params }: Props) {
  const t = await getTranslations("report");
  return (
    <div className="page py-10 md:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-title">{t("title")}</h1>
        <p className="mt-3 text-ink-soft">
          {t("intro")}{" "}
          <Link href="/review-policy" className="font-semibold text-ink underline underline-offset-4">
            {t("policyLink")}
          </Link>
        </p>
        <Suspense fallback={<Skeleton className="mt-8 h-64 rounded-card" />}>
          <Report params={params} />
        </Suspense>
      </div>
    </div>
  );
}
