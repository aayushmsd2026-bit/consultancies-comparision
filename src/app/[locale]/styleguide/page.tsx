import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, PenLine } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { LanguageSwitch } from "@/components/ui/language-switch";
import { Monogram } from "@/components/ui/monogram";
import { ProgressLine, Stepper } from "@/components/ui/progress";
import { RatingBars } from "@/components/ui/rating-bars";
import { RegistrationBadge } from "@/components/ui/registration-badge";
import { ReviewCard } from "@/components/ui/review-card";
import { ScoreDial } from "@/components/ui/score-dial";
import { ReviewCardSkeleton } from "@/components/ui/skeleton";
import { OutcomeTag } from "@/components/ui/tag";
import { CONTRAST_PAIRS, PALETTE, WADA, type TokenName } from "@/config/palette";
import { IS_PRODUCTION } from "@/config/site";
import { contrastRatio } from "@/lib/color";
import { formatDate } from "@/lib/dates";
import { formatScore } from "@/lib/format";
import { OUTCOMES, REGISTRATION_STATUSES } from "@/lib/types";
import { ChipsDemo, ChoiceDemo, FeedbackDemo, FieldsDemo, InputsDemo, SearchDemo, TabsDemo } from "./demos";
import { sampleConsultancies, sampleReview } from "./fixtures";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Shows the same content twice: in light mode and in dark mode. */
function Specimen({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className="mt-16">
      <h2 className="text-title">{title}</h2>
      <div className={wide ? "mt-6 grid gap-4" : "mt-6 grid gap-4 xl:grid-cols-2"}>
        {(["light", "dark"] as const).map((mode) => (
          <div key={mode} data-theme={mode} className="min-w-0 rounded-block p-5 ring-1 ring-line sm:p-8">
            {children}
          </div>
        ))}
      </div>
    </section>
  );
}

function Swatches({ mode }: { mode: "light" | "dark" }) {
  const tokens = Object.entries(PALETTE[mode]) as [TokenName, string][];
  return (
    <div data-theme={mode} className="rounded-block p-5 ring-1 ring-line sm:p-8">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tokens.map(([name, hex]) => (
          <li key={name} className="flex items-center gap-3">
            <span className="size-12 shrink-0 rounded-control ring-1 ring-line-strong" style={{ background: `var(--color-${name})` }} />
            <span className="min-w-0 text-micro">
              <span className="block truncate font-semibold">{name}</span>
              <span className="tabular block text-ink-soft">{hex}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function StyleguidePage() {
  // The styleguide is a working tool. It is never shown on the real, live site.
  if (IS_PRODUCTION) notFound();

  const t = await getTranslations("styleguide");
  const locale = await getLocale();
  const review = sampleReview(locale);
  const worst = Math.min(
    ...(["light", "dark"] as const).flatMap((mode) =>
      CONTRAST_PAIRS.map(({ fg, bg }) => contrastRatio(PALETTE[mode][fg], PALETTE[mode][bg])),
    ),
  );
  const steps = locale === "ne" ? ["कन्सल्टेन्सी", "तपाईंको केस", "रेटिङ", "तपाईंको कथा"] : ["Consultancy", "Your case", "Ratings", "Your story"];

  return (
    <div className="page py-12">
      <h1 className="text-display">{t("title")}</h1>
      <p className="mt-4 max-w-prose text-lead text-ink-soft">{t("intro")}</p>

      <section className="mt-16">
        <h2 className="text-title">{t("palette")}</h2>
        <p className="mt-2 max-w-prose text-ink-soft">
          {t("paletteNote", {
            number: WADA.combination,
            names: [WADA.signature, WADA.spark, WADA.ink].map((c) => `${c.name} ${c.hex}`).join(", "),
          })}{" "}
          <span className="tabular">
            {CONTRAST_PAIRS.length * 2} / {CONTRAST_PAIRS.length * 2} ✓ ≥ {worst.toFixed(1)}:1
          </span>
        </p>
        <div className="mt-6 grid h-40 grid-cols-[6fr_3fr_1fr] overflow-hidden rounded-block" aria-hidden="true">
          <div className="bg-paper ring-1 ring-line ring-inset" />
          <div data-theme="dark" />
          <div className="grid grid-rows-[5fr_1fr]">
            <div className="bg-signature" />
            <div className="bg-spark" />
          </div>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Swatches mode="light" />
          <Swatches mode="dark" />
        </div>
      </section>

      <Specimen title={t("type")}>
        <p className="font-display text-hero">Aa अ</p>
        <p className="mt-6 font-display text-display">{review.consultancyName}</p>
        <p className="mt-4 font-display text-title">{t("intro")}</p>
        <p className="mt-4 text-lead">{review.wentWell}</p>
        <p className="mt-4 max-w-prose text-body">{review.wentBadly}</p>
        <p className="mt-4 text-small text-ink-soft">{review.reply?.body}</p>
        <p className="tabular mt-4 font-display text-numeral">{formatScore(4.2, locale)}</p>
      </Specimen>

      <Specimen title={t("sections.buttons")}>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/review/new" icon={<PenLine aria-hidden="true" className="size-5" />}>
            {steps[0]}
          </ButtonLink>
          <Button variant="secondary">{steps[1]}</Button>
          <Button variant="inverse">{steps[3]}</Button>
          <Button variant="quiet" iconAfter={<ArrowRight aria-hidden="true" className="size-5" />}>
            {steps[2]}
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="lg">{steps[0]}</Button>
          <Button loading>{steps[1]}</Button>
          <Button disabled>{steps[2]}</Button>
        </div>
      </Specimen>

      <Specimen title={t("sections.search")}>
        <SearchDemo size="hero" />
        <div className="mt-8 max-w-md">
          <SearchDemo size="md" />
        </div>
      </Specimen>

      <Specimen title={t("sections.badges")}>
        <div className="flex flex-wrap gap-2">
          {REGISTRATION_STATUSES.map((status) => (
            <RegistrationBadge key={status} status={status} />
          ))}
        </div>
        <div className="mt-6 grid gap-4">
          {REGISTRATION_STATUSES.map((status) => (
            <RegistrationBadge
              key={status}
              status={status}
              size="lg"
              checkedOn={status === "unknown" ? null : formatDate("2026-10-29T06:00:00Z", locale)}
              sourceUrl={status === "unknown" ? null : "https://example.com/official-list"}
            />
          ))}
        </div>
      </Specimen>

      <Specimen title={t("sections.score")}>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <ScoreDial score={4.2} />
          <RatingBars ratings={review.ratings} className="flex-1" />
        </div>
        <div className="mt-8 flex items-center gap-6">
          <ScoreDial score={2.1} size="md" />
          <ScoreDial score={5} size="md" />
        </div>
      </Specimen>

      <Specimen title={t("sections.inputs")}>
        <InputsDemo />
        <div className="mt-8">
          <ChoiceDemo />
        </div>
      </Specimen>

      <Specimen title={t("sections.review")}>
        <ReviewCard
          review={review}
          date={formatDate(review.approvedAt, locale)}
          replyDate={formatDate(review.reply!.createdAt, locale)}
        />
        <ReviewCard
          className="mt-4"
          showConsultancy
          review={{ ...review, displayName: null, isVerified: false, wouldRecommend: false, outcome: "visa_refused", overall: 2.3, reply: null }}
          date={formatDate(review.approvedAt, locale)}
        />
      </Specimen>

      <Specimen title={t("sections.chips")}>
        <ChipsDemo />
        <div className="mt-4 flex flex-wrap gap-2">
          {OUTCOMES.map((outcome) => (
            <OutcomeTag key={outcome} outcome={outcome} />
          ))}
        </div>
      </Specimen>

      <Specimen title={t("sections.tabs")}>
        <TabsDemo size="big" />
        <div className="mt-8">
          <TabsDemo size="md" />
        </div>
      </Specimen>

      <Specimen title={t("sections.progress")}>
        <ProgressLine current={3} total={7} />
        <Stepper className="mt-8" steps={steps} current={2} />
      </Specimen>

      <Specimen title={t("sections.fields")}>
        <FieldsDemo />
      </Specimen>

      <Specimen title={t("sections.feedback")}>
        <FeedbackDemo />
        <EmptyState
          className="mt-6"
          title={review.consultancyName}
          body={review.wentWell}
          action={<Button>{steps[0]}</Button>}
        />
        <div className="mt-6">
          <ReviewCardSkeleton />
        </div>
      </Specimen>

      <Specimen title={t("sections.monogram")}>
        <div className="flex flex-wrap items-end gap-3">
          {sampleConsultancies.map((c) => (
            <Monogram key={c.slug} name={c.name} size="lg" />
          ))}
          <Monogram name="Fictional Visa Point" size="md" />
          <Monogram name="Made-up Scholars" size="sm" />
        </div>
      </Specimen>

      <Specimen title={t("sections.navigation")} wide>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              { label: steps[0], href: "/consultancies" },
              { label: sampleConsultancies[0].city!, href: "/consultancies" },
              { label: review.consultancyName },
            ]}
          />
          <LanguageSwitch />
        </div>
        <div className="mt-6 overflow-hidden rounded-card ring-1 ring-line">
          <Header />
        </div>
        <div className="relative mt-6 h-16 overflow-hidden rounded-card ring-1 ring-line">
          <BottomTabBar preview />
        </div>
        <div className="mt-6 overflow-hidden rounded-card ring-1 ring-line">
          <Footer />
        </div>
      </Specimen>
    </div>
  );
}
