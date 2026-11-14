import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { ClientMessages } from "@/components/client-messages";
import { ReviewForm } from "@/components/review/review-form";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_NAME } from "@/config/site";
import { getConsultancy } from "@/lib/data/public";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("review");
  return { title: t("metaTitle", { siteName: SITE_NAME }), description: t("metaDescription") };
}

/** "Write a review" on a profile links here with ?c=the-consultancy, so the first answer is filled in. */
async function Form({ searchParams }: Pick<PageProps<"/[locale]/review/new">, "searchParams">) {
  const params = await searchParams;
  const slug = Array.isArray(params.c) ? params.c[0] : params.c;
  const locale = await getLocale();
  const consultancy = slug && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ? await getConsultancy(slug, locale) : null;

  return (
    <ClientMessages namespaces={["review"]}>
      <ReviewForm
        initialConsultancy={consultancy ? { slug: consultancy.slug, name: consultancy.name, city: consultancy.city } : null}
      />
    </ClientMessages>
  );
}

export default function NewReviewPage({ searchParams }: PageProps<"/[locale]/review/new">) {
  return (
    <div className="page py-8 md:py-14">
      <Suspense
        fallback={
          <div aria-hidden="true" className="mx-auto max-w-xl">
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="mt-12 h-10 w-4/5" />
            <Skeleton className="mt-6 h-14 w-full" />
          </div>
        }
      >
        <Form searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
