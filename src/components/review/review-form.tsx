"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Hourglass, Send, Undo2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { ConsultancySearch } from "@/components/consultancy/consultancy-search";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { Select, TextArea, TextField } from "@/components/ui/field";
import { FileUpload } from "@/components/ui/file-upload";
import { Monogram } from "@/components/ui/monogram";
import { ProgressLine } from "@/components/ui/progress";
import { StarInput } from "@/components/ui/star-input";
import { useToast } from "@/components/ui/toast";
import { COUNTRIES } from "@/config/countries";
import { localizeDigits } from "@/lib/format";
import { attachProofAction, submitReviewAction } from "@/lib/review/actions";
import { clearDraft, loadDraft, loadDraftFile, saveDraft, saveDraftFile } from "@/lib/review/draft";
import { intakeYearRange, REVIEW_LIMITS, reviewSchema, type ReviewData, type ReviewInput } from "@/lib/review/schema";
import { getBrowserClient } from "@/lib/supabase/browser";
import { OUTCOMES, STUDY_LEVELS, type Outcome } from "@/lib/types";
import { SignInPanel, useSignedIn } from "./sign-in-panel";

type Picked = { slug: string; name: string; city: string | null };
type BranchOption = { id: string; label: string };
type ErrorCode = "required" | "tooShort" | "tooLong" | "wholeNumber" | "notNegative" | "tooMuch";

/** The screens, in order, and the answers each one checks before moving on. */
const STEPS: { id: string; fields: FieldPath<ReviewInput>[] }[] = [
  { id: "consultancy", fields: ["consultancySlug", "suggestedName", "suggestedCity"] },
  { id: "country", fields: ["country"] },
  { id: "course", fields: ["studyLevel", "intakeYear"] },
  { id: "outcome", fields: ["outcome"] },
  { id: "money", fields: ["serviceChargeNpr", "extraCostsNpr", "extraCostsNote"] },
  { id: "ratings", fields: ["ratingHonesty", "ratingCommunication", "ratingDocuments", "ratingSpeed", "ratingAfterVisa"] },
  { id: "well", fields: ["wentWell"] },
  { id: "badly", fields: ["wentBadly"] },
  { id: "final", fields: ["wouldRecommend", "displayNameChoice"] },
  { id: "proof", fields: [] },
  { id: "send", fields: [] },
];

// Nothing is chosen for the visitor. Every answer starts empty.
const EMPTY = {
  consultancySlug: null,
  suggestedName: null,
  suggestedCity: null,
  branchId: null,
  serviceChargeNpr: null,
  extraCostsNpr: null,
  extraCostsNote: null,
  ratingAfterVisa: null,
  wentWell: "",
  wentBadly: "",
  invitedByConsultancy: false,
  displayNameChoice: "initials",
} as unknown as ReviewInput;

const outcomeIcons: Record<Outcome, typeof CircleCheck> = {
  visa_granted: CircleCheck,
  visa_refused: CircleX,
  in_process: Hourglass,
  withdrew: Undo2,
};

/** Turns "45,000" or "रु ४५०००" into 45000. Empty text means "prefer not to say". */
function parseMoney(text: string): number | null {
  const ascii = text.replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d))).replace(/[^\d.]/g, "");
  return ascii === "" ? null : Number(ascii);
}

export function ReviewForm({ initialConsultancy }: { initialConsultancy: Picked | null }) {
  const t = useTranslations("review");
  const tCountry = useTranslations("countries");
  const tOutcome = useTranslations("ui.outcome");
  const tLevel = useTranslations("ui.studyLevel");
  const tRating = useTranslations("ui.ratings");
  const locale = useLocale();
  const toast = useToast();
  const user = useSignedIn();

  const form = useForm<ReviewInput, unknown, ReviewData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { ...EMPTY, consultancySlug: initialConsultancy?.slug ?? null },
    // Answers are checked only when "Continue" is pressed. Checking when a field loses
    // focus would make messages appear or vanish under the visitor's thumb and move the button.
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  const { control, register, setValue, getValues, trigger, watch, formState, setError, clearErrors } = form;

  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Picked | null>(initialConsultancy);
  const [suggesting, setSuggesting] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [proof, setProof] = useState<File | null>(null);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<{ proofFailed: boolean } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const current = STEPS[step];
  const years = useMemo(() => {
    const { min, max } = intakeYearRange();
    return Array.from({ length: max - min + 1 }, (_, i) => max - i);
  }, []);

  // Bring back an unfinished review (for example after signing in with Google).
  useEffect(() => {
    let cancelled = false;
    const draft = loadDraft<ReviewInput>();
    const restore = async () => {
      if (draft && !cancelled) {
        const draftPicked = (draft.extra?.picked as Picked | null | undefined) ?? null;
        // A link like "Write a review" on a profile wins over an old draft for another consultancy.
        const sameTarget = !initialConsultancy || draftPicked?.slug === initialConsultancy.slug;
        if (sameTarget) {
          form.reset({ ...EMPTY, ...draft.values });
          setPicked(draftPicked ?? initialConsultancy);
          setSuggesting(Boolean(draft.extra?.suggesting));
          setStep(Math.min(Math.max(0, draft.step), STEPS.length - 1));
          const file = await loadDraftFile();
          if (!cancelled && file) setProof(file);
        }
      }
      if (!cancelled) setReady(true);
    };
    void restore();
    return () => {
      cancelled = true;
    };
    // Runs once when the form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save every change in this browser.
  useEffect(() => {
    if (!ready || done) return;
    saveDraft({ values: getValues(), step, extra: { picked, suggesting } });
    // React Hook Form's watch() is fine here: it only feeds the saved draft.
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((values, { name }) => {
      saveDraft({ values, step, extra: { picked, suggesting } });
      // An error message goes away as soon as the visitor starts to fix that answer.
      if (name) clearErrors(name);
    });
    return () => subscription.unsubscribe();
  }, [ready, done, step, picked, suggesting, watch, getValues, clearErrors]);

  // The branches of the chosen consultancy.
  useEffect(() => {
    if (!picked) return;
    const controller = new AbortController();
    fetch(`/api/branches?slug=${picked.slug}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body: { branches: BranchOption[] }) => setBranches(body.branches ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [picked]);

  // Each new screen starts at its question, for screen readers and keyboards.
  useEffect(() => {
    if (ready && step > 0) headingRef.current?.focus();
  }, [step, ready]);

  const errorText = (name: FieldPath<ReviewInput>): string | undefined => {
    const message = formState.errors[name as keyof typeof formState.errors]?.message as ErrorCode | undefined;
    if (!message) return undefined;
    return t.has(`errors.${message}`) ? t(`errors.${message}`) : t("errors.required");
  };

  async function goNext() {
    // The first screen needs a consultancy from the list, or the name of a missing one.
    if (current.id === "consultancy") {
      const { consultancySlug: slug, suggestedName } = getValues();
      if (!slug && (suggestedName ?? "").trim().length < 2) {
        setError("consultancySlug", { message: "required" });
        return;
      }
    }
    if (await trigger(current.fields, { shouldFocus: true })) {
      setServerError(null);
      setStep((n) => Math.min(n + 1, STEPS.length - 1));
    }
  }
  const goBack = () => setStep((n) => Math.max(0, n - 1));

  function pick(item: Picked | null) {
    setPicked(item);
    setBranches([]);
    setValue("consultancySlug", item?.slug ?? null);
    clearErrors("consultancySlug");
    setValue("branchId", null);
  }

  function startOver() {
    void clearDraft();
    form.reset({ ...EMPTY, consultancySlug: initialConsultancy?.slug ?? null });
    setPicked(initialConsultancy);
    setSuggesting(false);
    setProof(null);
    setStep(0);
  }

  async function send(data: ReviewData) {
    setSending(true);
    setServerError(null);
    const result = await submitReviewAction(data);
    if (!result.ok) {
      setSending(false);
      setServerError(t(`errors.${result.error}`));
      return;
    }

    // The proof goes straight from this browser into the private bucket.
    let proofFailed = false;
    if (proof) {
      const extension = proof.type === "application/pdf" ? "pdf" : proof.type === "image/png" ? "png" : "jpg";
      const path = `${result.userId}/${result.reviewId}/proof-${Date.now()}.${extension}`;
      const { error } = await getBrowserClient().storage.from("proofs").upload(path, proof, { contentType: proof.type });
      proofFailed = !!error || !(await attachProofAction(result.reviewId, path)).ok;
    }

    await clearDraft();
    setSending(false);
    setDone({ proofFailed });
    window.scrollTo({ top: 0 });
  }

  const onInvalid = () => {
    // Something earlier in the form is wrong. Go to the first screen that has a problem.
    const firstBad = STEPS.findIndex((s) => s.fields.some((field) => formState.errors[field as keyof typeof formState.errors]));
    if (firstBad >= 0) setStep(firstBad);
    toast(t("errors.invalid"), "bad");
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center" role="status">
        {/* One small celebration, under a second. */}
        <div aria-hidden="true" className="relative mx-auto size-28">
          <span className="absolute inset-0 animate-pop rounded-full bg-signature" />
          <span className="absolute -top-1 -right-2 size-8 animate-pop rounded-full bg-spark [animation-delay:150ms]" />
          <span className="absolute -bottom-1 -left-3 size-6 animate-pop rounded-[0.5rem] bg-ink [animation-delay:250ms]" />
          <CircleCheck className="absolute inset-0 m-auto size-14 animate-pop text-signature-ink [animation-delay:120ms]" strokeWidth={1.75} />
        </div>
        <h1 className="mt-8 text-display">{t("thanks.title")}</h1>
        <p className="mt-4 text-lead text-ink-soft">{t("thanks.body")}</p>
        {done.proofFailed && <p className="mt-4 font-semibold text-warn">{t("thanks.proofFailed")}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {picked && <ButtonLink href={`/consultancies/${picked.slug}`}>{t("thanks.profile")}</ButtonLink>}
          <ButtonLink href="/" variant="secondary">
            {t("thanks.home")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  const stepTitle = t(`steps.${current.id as "consultancy"}.title`);
  const isLast = step === STEPS.length - 1;
  const moneyField = (name: "serviceChargeNpr" | "extraCostsNpr", label: string, hint: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          label={label}
          hint={hint}
          optionalLabel={t("optional")}
          inputMode="numeric"
          autoComplete="off"
          value={field.value === null || field.value === undefined ? "" : String(field.value)}
          onChange={(e) => field.onChange(parseMoney(e.target.value))}
          onBlur={field.onBlur}
          error={errorText(name)}
        />
      )}
    />
  );

  return (
    <form
      noValidate
      aria-busy={!ready}
      onSubmit={(event) => {
        event.preventDefault();
        if (isLast) void form.handleSubmit(send, onInvalid)(event);
        else void goNext();
      }}
      className="mx-auto max-w-xl"
    >
      <ProgressLine current={step + 1} total={STEPS.length} />

      <div key={current.id} className="mt-8 animate-fade-in">
        <h1 ref={headingRef} tabIndex={-1} className="text-title outline-none">
          {stepTitle}
        </h1>

        <div className="mt-6 grid gap-6">
          {current.id === "consultancy" &&
            (suggesting ? (
              <>
                <p className="text-ink-soft">{t("steps.consultancy.missingHint")}</p>
                <TextField
                  label={t("steps.consultancy.name")}
                  autoComplete="off"
                  maxLength={REVIEW_LIMITS.nameMax}
                  {...register("suggestedName", {
                    setValueAs: (v: string) => v || null,
                    onChange: () => clearErrors("consultancySlug"),
                  })}
                  error={errorText("consultancySlug") ?? errorText("suggestedName")}
                />
                <TextField
                  label={t("steps.consultancy.city")}
                  optionalLabel={t("optional")}
                  autoComplete="off"
                  {...register("suggestedCity", { setValueAs: (v: string) => v || null })}
                />
                <p>
                  <Button
                    variant="quiet"
                    onClick={() => {
                      setSuggesting(false);
                      setValue("suggestedName", null);
                      setValue("suggestedCity", null);
                    }}
                  >
                    {t("steps.consultancy.backToSearch")}
                  </Button>
                </p>
              </>
            ) : picked ? (
              <>
                <div>
                  <p className="text-small text-ink-soft">{t("steps.consultancy.selected")}</p>
                  <div className="mt-2 flex items-center gap-3 rounded-card bg-paper-raised p-4 shadow-soft">
                    <Monogram name={picked.slug} letter={picked.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-heading font-semibold break-words">{picked.name}</p>
                      {picked.city && <p className="text-small text-ink-soft">{picked.city}</p>}
                    </div>
                    <Button variant="quiet" onClick={() => pick(null)}>
                      {t("steps.consultancy.change")}
                    </Button>
                  </div>
                </div>
                {branches.length > 1 && (
                  <Select
                    label={t("steps.consultancy.branch")}
                    optionalLabel={t("optional")}
                    {...register("branchId", { setValueAs: (v: string) => v || null })}
                  >
                    <option value="">{t("steps.consultancy.anyBranch")}</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.label}
                      </option>
                    ))}
                  </Select>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-ink-soft">{t("steps.consultancy.hint")}</p>
                  <ConsultancySearch onPick={(item) => pick({ slug: item.slug, name: item.name, city: item.city })} />
                  {errorText("consultancySlug") && (
                    <p role="alert" className="mt-2 text-small font-semibold text-bad">
                      {errorText("consultancySlug")}
                    </p>
                  )}
                </div>
                <p>
                  <Button variant="quiet" onClick={() => setSuggesting(true)}>
                    {t("steps.consultancy.missing")}
                  </Button>
                </p>
              </>
            ))}

          {current.id === "country" && (
            <Controller
              control={control}
              name="country"
              render={({ field }) => (
                <ChoiceCards
                  legend={stepTitle}
                  hideLegend
                  name="country"
                  columns={2}
                  value={field.value ?? null}
                  onChange={(value) => {
                    field.onChange(value);
                    // A single choice: move on straight away.
                    setStep((n) => n + 1);
                  }}
                  choices={COUNTRIES.map((code) => ({ value: code, label: tCountry(code) }))}
                  error={errorText("country")}
                />
              )}
            />
          )}

          {current.id === "course" && (
            <>
              <Select label={t("steps.course.level")} defaultValue="" {...register("studyLevel")} error={errorText("studyLevel")}>
                <option value="" disabled>
                  {t("steps.course.choose")}
                </option>
                {STUDY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {tLevel(level)}
                  </option>
                ))}
              </Select>
              <Select
                label={t("steps.course.year")}
                defaultValue=""
                {...register("intakeYear", { setValueAs: (v: string) => (v === "" ? undefined : Number(v)) })}
                error={errorText("intakeYear")}
              >
                <option value="" disabled>
                  {t("steps.course.choose")}
                </option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {localizeDigits(year, locale)}
                  </option>
                ))}
              </Select>
            </>
          )}

          {current.id === "outcome" && (
            <Controller
              control={control}
              name="outcome"
              render={({ field }) => (
                <ChoiceCards
                  legend={stepTitle}
                  hideLegend
                  name="outcome"
                  value={field.value ?? null}
                  onChange={(value) => {
                    field.onChange(value);
                    setStep((n) => n + 1);
                  }}
                  choices={OUTCOMES.map((outcome) => {
                    const Icon = outcomeIcons[outcome];
                    return { value: outcome, label: tOutcome(outcome), icon: <Icon aria-hidden="true" className="size-6 shrink-0" /> };
                  })}
                  error={errorText("outcome")}
                />
              )}
            />
          )}

          {current.id === "money" && (
            <>
              <p className="text-ink-soft">{t("steps.money.hint")}</p>
              {moneyField("serviceChargeNpr", t("steps.money.charge"), t("steps.money.chargeHint"))}
              {moneyField("extraCostsNpr", t("steps.money.extra"), t("steps.money.extraHint"))}
              {watch("extraCostsNpr") ? (
                <TextField
                  label={t("steps.money.note")}
                  optionalLabel={t("optional")}
                  maxLength={REVIEW_LIMITS.noteMax}
                  {...register("extraCostsNote", { setValueAs: (v: string) => v || null })}
                  error={errorText("extraCostsNote")}
                />
              ) : null}
            </>
          )}

          {current.id === "ratings" && (
            <>
              <p className="text-ink-soft">{t("steps.ratings.hint")}</p>
              {(
                [
                  ["ratingHonesty", "honesty"],
                  ["ratingCommunication", "communication"],
                  ["ratingDocuments", "documents"],
                  ["ratingSpeed", "speed"],
                ] as const
              ).map(([name, key]) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <StarInput
                      label={tRating(key)}
                      name={name}
                      value={field.value ?? null}
                      onChange={field.onChange}
                      error={errorText(name)}
                    />
                  )}
                />
              ))}
              <Controller
                control={control}
                name="ratingAfterVisa"
                render={({ field }) => (
                  <div>
                    <StarInput
                      label={tRating("afterVisa")}
                      hint={t("steps.ratings.afterVisaHint")}
                      name="ratingAfterVisa"
                      value={field.value ?? null}
                      onChange={field.onChange}
                    />
                    {field.value !== null && field.value !== undefined && (
                      <Button variant="quiet" className="mt-1" onClick={() => field.onChange(null)}>
                        {t("steps.ratings.notYet")}
                      </Button>
                    )}
                  </div>
                )}
              />
            </>
          )}

          {(current.id === "well" || current.id === "badly") &&
            (() => {
              const name = current.id === "well" ? "wentWell" : "wentBadly";
              const length = (watch(name) ?? "").length;
              return (
                <div>
                  <TextArea
                    label={stepTitle}
                    hint={t(`steps.${current.id}.hint`)}
                    placeholder={t(`steps.${current.id}.placeholder`)}
                    rows={6}
                    maxLength={REVIEW_LIMITS.textMax}
                    {...register(name)}
                    error={errorText(name)}
                    className="[&]:text-body"
                  />
                  <p className="tabular mt-2 text-right text-small text-ink-soft">
                    {t("textCount", {
                      n: localizeDigits(length, locale),
                      max: localizeDigits(REVIEW_LIMITS.textMax, locale),
                    })}
                  </p>
                </div>
              );
            })()}

          {current.id === "final" && (
            <>
              <Controller
                control={control}
                name="wouldRecommend"
                render={({ field }) => (
                  <ChoiceCards
                    legend={t("steps.final.recommend")}
                    name="wouldRecommend"
                    columns={2}
                    value={field.value === undefined ? null : field.value ? "yes" : "no"}
                    onChange={(value) => field.onChange(value === "yes")}
                    choices={[
                      { value: "yes", label: t("steps.final.yes") },
                      { value: "no", label: t("steps.final.no") },
                    ]}
                    error={errorText("wouldRecommend")}
                  />
                )}
              />
              <label className="flex min-h-12 cursor-pointer items-start gap-3">
                <input type="checkbox" className="mt-1 size-5 accent-(--color-ink)" {...register("invitedByConsultancy")} />
                <span>{t("steps.final.invited")}</span>
              </label>
              <Controller
                control={control}
                name="displayNameChoice"
                render={({ field }) => (
                  <ChoiceCards
                    legend={t("steps.final.nameTitle")}
                    name="displayNameChoice"
                    value={field.value ?? null}
                    onChange={field.onChange}
                    choices={[
                      { value: "initials", label: t("steps.final.initials"), hint: t("steps.final.initialsHint") },
                      { value: "name", label: t("steps.final.name"), hint: t("steps.final.nameHint") },
                      { value: "anonymous", label: t("steps.final.anonymous"), hint: t("steps.final.anonymousHint") },
                    ]}
                  />
                )}
              />
            </>
          )}

          {current.id === "proof" && (
            <>
              <p className="text-ink-soft">{t("steps.proof.hint")}</p>
              <FileUpload
                label={t("steps.proof.label")}
                privacyNote={t("steps.proof.privacy")}
                accept={REVIEW_LIMITS.proofTypes.join(",")}
                maxBytes={REVIEW_LIMITS.proofMaxBytes}
                file={proof}
                onChange={(file) => {
                  setProof(file);
                  void saveDraftFile(file);
                }}
              />
            </>
          )}

          {current.id === "send" && (
            <>
              {user === undefined ? null : user ? (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card bg-paper-sunk p-4">
                  <span className="min-w-0 break-all">{t("steps.send.signedInAs", { email: user.label })}</span>
                  <Button variant="quiet" onClick={() => void getBrowserClient().auth.signOut()}>
                    {t("steps.send.signOut")}
                  </Button>
                </p>
              ) : (
                <SignInPanel returnPath={`/${locale}/review/new`} />
              )}
              {serverError && (
                <p role="alert" className="rounded-card bg-bad-tint p-4 font-semibold text-bad">
                  {serverError}
                </p>
              )}
              {/* The reassuring note sits right next to the send button. */}
              <p className="text-ink-soft">{t("steps.send.promise")}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button variant="quiet" onClick={goBack} icon={<ArrowLeft aria-hidden="true" className="size-5" />}>
            {t("back")}
          </Button>
        ) : (
          <span />
        )}
        {isLast ? (
          <Button type="submit" size="lg" loading={sending} disabled={!user} icon={<Send aria-hidden="true" className="size-5" />}>
            {sending ? t("steps.send.sending") : t("steps.send.submit")}
          </Button>
        ) : (
          <Button type="submit" size="lg" iconAfter={<ArrowRight aria-hidden="true" className="size-5" />}>
            {(current.id === "money" && watch("serviceChargeNpr") === null && watch("extraCostsNpr") === null) ||
            (current.id === "proof" && !proof)
              ? t("skip")
              : t("next")}
          </Button>
        )}
      </div>

      {step > 0 && (
        <p className="mt-8 text-center">
          <Button variant="quiet" className="text-small text-ink-soft" onClick={startOver}>
            {t("startOver")}
          </Button>
        </p>
      )}
    </form>
  );
}
