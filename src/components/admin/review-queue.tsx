"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { isCountryCode } from "@/config/countries";
import { Link, useRouter } from "@/i18n/navigation";
import {
  approveReviewAction,
  askForProofAction,
  deleteProofAction,
  getProofUrlAction,
  postReplyAction,
  rejectReviewAction,
  setVerifiedAction,
  type ActionResult,
} from "@/lib/admin/actions";
import type { AdminReview } from "@/lib/admin/data";
import { cn } from "@/lib/cn";
import { formatNpr } from "@/lib/format";

const button =
  "inline-flex min-h-9 items-center gap-1.5 rounded-[0.5rem] border border-line-strong px-3 font-semibold hover:bg-paper-sunk disabled:opacity-50";
const key = "rounded border border-line-strong px-1 font-mono text-micro";

const REJECT_REASONS = ["notFirstHand", "personalInfo", "abusive", "duplicate", "noProof"] as const;

/**
 * The moderation queue. Built for speed: the keyboard does everything.
 *   J / K  move down / up        A  approve        R  reject (asks for a reason)
 *   P      ask for proof         V  verified on/off O  show the proof
 * Flags only inform. Nothing is ever rejected automatically.
 */
export function ReviewQueue({ reviews, dates }: { reviews: AdminReview[]; dates: Record<string, string> }) {
  const t = useTranslations("admin.queue");
  const tCountry = useTranslations("countries");
  const tOutcome = useTranslations("ui.outcome");
  const tLevel = useTranslations("ui.studyLevel");
  const toast = useToast();
  const router = useRouter();

  const [items, setItems] = useState(reviews);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState<AdminReview | null>(null);
  const [reason, setReason] = useState("");
  const [proofUrls, setProofUrls] = useState<Record<string, { url: string; isPdf: boolean }>>({});
  const cards = useRef<(HTMLElement | null)[]>([]);

  // A fresh list from the server replaces ours (after a tab change or a refresh).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setItems(reviews);
      setSelected(0);
    });
    return () => cancelAnimationFrame(id);
  }, [reviews]);

  const current = items[Math.min(selected, items.length - 1)] as AdminReview | undefined;

  const act = useCallback(
    async (review: AdminReview, work: () => Promise<ActionResult>, done: string, options: { remove?: boolean; patch?: Partial<AdminReview> } = {}) => {
      if (busy) return;
      setBusy(true);
      const result = await work();
      setBusy(false);
      if (!result.ok) return toast(result.error, "bad");
      toast(done);
      setItems((list) =>
        options.remove
          ? list.filter((item) => item.id !== review.id)
          : list.map((item) => (item.id === review.id ? { ...item, ...options.patch } : item)),
      );
      // Update the counters in the menu.
      router.refresh();
    },
    [busy, toast, router],
  );

  const approve = useCallback(
    (review: AdminReview) => act(review, () => approveReviewAction(review.id), t("done.approve"), { remove: review.status !== "approved" }),
    [act, t],
  );
  const askProof = useCallback(
    (review: AdminReview) => act(review, () => askForProofAction(review.id), t("done.askProof"), { remove: review.status !== "needs_proof" }),
    [act, t],
  );
  const toggleVerified = useCallback(
    (review: AdminReview) =>
      act(review, () => setVerifiedAction(review.id, !review.isVerified), review.isVerified ? t("done.unverify") : t("done.verify"), {
        patch: { isVerified: !review.isVerified },
      }),
    [act, t],
  );

  const showProof = useCallback(
    async (review: AdminReview) => {
      const proof = review.proofs.find((p) => !p.deleted);
      if (!proof) return;
      if (proofUrls[proof.id]) {
        return setProofUrls((urls) => Object.fromEntries(Object.entries(urls).filter(([id]) => id !== proof.id)));
      }
      const result = await getProofUrlAction(proof.id);
      if (!result.ok) return toast(result.error, "bad");
      setProofUrls((urls) => ({ ...urls, [proof.id]: { url: result.url, isPdf: result.isPdf } }));
    },
    [proofUrls, toast],
  );

  async function removeProof(review: AdminReview, proofId: string) {
    if (!window.confirm(t("proof.confirmDelete"))) return;
    await act(review, () => deleteProofAction(proofId), t("done.proofDeleted"), {
      patch: { proofs: review.proofs.map((p) => (p.id === proofId ? { ...p, deleted: true } : p)) },
    });
  }

  function openReject(review: AdminReview) {
    setReason("");
    setRejecting(review);
  }

  async function confirmReject() {
    if (!rejecting) return;
    const review = rejecting;
    if (reason.trim().length < 3) return;
    setRejecting(null);
    await act(review, () => rejectReviewAction(review.id, reason), t("done.reject"), { remove: review.status !== "rejected" });
  }

  // Keyboard shortcuts. They pause while a text box or the reject window has the focus.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (rejecting || target.closest("input, textarea, select, dialog, [contenteditable]")) return;
      const move = (to: number) => {
        const next = Math.max(0, Math.min(items.length - 1, to));
        setSelected(next);
        cards.current[next]?.scrollIntoView({ block: "nearest" });
      };
      const pressed = event.key.toLowerCase();
      if (pressed === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        return move(selected + 1);
      }
      if (pressed === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        return move(selected - 1);
      }
      if (!current) return;
      if (pressed === "a") void approve(current);
      else if (pressed === "r") {
        // Stop the letter "r" from landing in the reason box that opens.
        event.preventDefault();
        openReject(current);
      } else if (pressed === "p") void askProof(current);
      else if (pressed === "v") void toggleVerified(current);
      else if (pressed === "o") void showProof(current);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items.length, selected, current, rejecting, approve, askProof, toggleVerified, showProof]);

  if (items.length === 0) return <p className="py-10 text-body font-semibold">{t("empty")}</p>;

  return (
    <>
      <p className="mb-3 text-ink-soft">{t("shortcuts")}</p>
      <ol className="grid gap-3">
        {items.map((review, i) => {
          const isSelected = review.id === current?.id;
          const proof = review.proofs.find((p) => !p.deleted);
          const shownProof = proof ? proofUrls[proof.id] : undefined;
          const country = isCountryCode(review.country) ? review.country : "OTHER";
          return (
            <li key={review.id}>
              <article
                ref={(el) => {
                  cards.current[i] = el;
                }}
                aria-current={isSelected ? "true" : undefined}
                onClick={() => setSelected(i)}
                className={cn(
                  "rounded-[0.75rem] border bg-paper-raised p-3",
                  isSelected ? "border-ink ring-2 ring-ink" : "border-line-strong",
                )}
              >
                <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-sans text-body font-semibold">
                    <Link href={`/consultancies/${review.consultancy.slug}`} className="underline underline-offset-2">
                      {review.consultancy.name}
                    </Link>
                  </h2>
                  <span className="tabular text-ink-soft">{dates[review.id]}</span>
                  <span>
                    {t("reviewer")}: {review.reviewer.name ?? "—"} · {review.reviewer.email ?? "—"} ({t("showsAs")}{" "}
                    {review.displayNameChoice})
                  </span>
                  <span className={cn("font-semibold", review.isVerified ? "text-ok" : "text-ink-soft")}>
                    {review.isVerified ? t("verified") : t("notVerified")}
                  </span>
                  {review.consultancy.listingStatus === "pending" && (
                    <span className="rounded bg-warn-tint px-1.5 font-semibold text-warn">{t("listingPending")}</span>
                  )}
                </header>

                {review.flags.length > 0 && (
                  <ul aria-label={t("flags.title")} className="mt-2 flex flex-wrap gap-1.5">
                    {review.flags.map((flag) => (
                      <li key={flag} className="rounded bg-warn-tint px-1.5 py-0.5 font-semibold text-warn">
                        ⚑ {t(`flags.${flag}`)}
                      </li>
                    ))}
                  </ul>
                )}

                <dl className="mt-2 grid gap-x-6 gap-y-1 md:grid-cols-2">
                  <div>
                    <dt className="inline font-semibold">{t("case")}: </dt>
                    <dd className="inline">
                      {tCountry(country)} · {tLevel(review.studyLevel)} · {review.intakeYear} · {tOutcome(review.outcome)} ·{" "}
                      {review.wouldRecommend ? t("recommends") : t("doesNotRecommend")}
                      {review.invitedByConsultancy && ` · ${t("invited")}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">{t("ratings")}: </dt>
                    <dd className="tabular inline">
                      {review.ratings.map((value) => value ?? "–").join(" · ")} = {review.overall.toFixed(2)} {t("overall")}
                    </dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="inline font-semibold">{t("money")}: </dt>
                    <dd className="tabular inline">
                      {t("charge")} {review.serviceChargeNpr === null ? "–" : formatNpr(review.serviceChargeNpr, "en")} · {t("extra")}{" "}
                      {review.extraCostsNpr === null ? "–" : formatNpr(review.extraCostsNpr, "en")}
                      {review.extraCostsNote && ` (${review.extraCostsNote})`}
                    </dd>
                  </div>
                </dl>

                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div>
                    <h3 className="font-sans text-small font-semibold text-ok">{t("wentWell")}</h3>
                    <p className="whitespace-pre-line break-words text-body">{review.wentWell}</p>
                  </div>
                  <div>
                    <h3 className="font-sans text-small font-semibold text-bad">{t("wentBadly")}</h3>
                    <p className="whitespace-pre-line break-words text-body">{review.wentBadly}</p>
                  </div>
                </div>

                {review.rejectionReason && (
                  <p className="mt-2">
                    <span className="font-semibold">{t("rejectedBecause")}:</span> {review.rejectionReason}
                  </p>
                )}

                {shownProof &&
                  (shownProof.isPdf ? (
                    <p className="mt-2">
                      <a href={shownProof.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                        {t("proof.openPdf")}
                      </a>
                    </p>
                  ) : (
                    // A short-lived private link. next/image is for public images, so a plain <img> is right here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shownProof.url} alt={t("proof.alt")} className="mt-2 max-h-[70vh] max-w-full rounded border border-line-strong" />
                  ))}

                <footer className="mt-3 flex flex-wrap items-center gap-2">
                  {review.status !== "approved" && (
                    <button type="button" className={cn(button, "border-ok text-ok")} disabled={busy} onClick={() => approve(review)}>
                      <kbd className={key}>A</kbd> {t("approve")}
                    </button>
                  )}
                  {review.status !== "rejected" && (
                    <button type="button" className={cn(button, "border-bad text-bad")} disabled={busy} onClick={() => openReject(review)}>
                      <kbd className={key}>R</kbd> {t("reject")}
                    </button>
                  )}
                  {review.status !== "needs_proof" && (
                    <button type="button" className={button} disabled={busy} onClick={() => askProof(review)}>
                      <kbd className={key}>P</kbd> {t("askProof")}
                    </button>
                  )}
                  <button type="button" className={button} disabled={busy} onClick={() => toggleVerified(review)}>
                    <kbd className={key}>V</kbd> {review.isVerified ? t("unverify") : t("verify")}
                  </button>
                  <span className="mx-1 text-ink-soft">|</span>
                  {proof ? (
                    <>
                      <button type="button" className={button} onClick={() => showProof(review)}>
                        <kbd className={key}>O</kbd> {shownProof ? t("proof.hide") : t("proof.show")}
                      </button>
                      <button type="button" className={button} disabled={busy} onClick={() => removeProof(review, proof.id)}>
                        {t("proof.delete")}
                      </button>
                    </>
                  ) : (
                    <span className="text-ink-soft">{review.proofs.length > 0 ? t("proof.deleted") : t("proof.none")}</span>
                  )}
                </footer>

                {review.status === "approved" && <ReplyBox review={review} />}
              </article>
            </li>
          );
        })}
      </ol>

      <Dialog
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title={t("rejectTitle")}
        actions={
          <>
            <button type="button" className={button} onClick={() => setRejecting(null)}>
              {t("cancel")}
            </button>
            <button type="button" className={cn(button, "border-bad bg-bad text-paper hover:bg-bad")} onClick={confirmReject}>
              {t("confirmReject")}
            </button>
          </>
        }
      >
        <p className="text-small text-ink-soft">{t("rejectHint")}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {REJECT_REASONS.map((value) => (
            <button key={value} type="button" className={cn(button, "text-small")} onClick={() => setReason(t(`reasons.${value}`))}>
              {t(`reasons.${value}`)}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-small font-semibold" htmlFor="reject-reason">
          {t("rejectReason")}
        </label>
        <input
          id="reject-reason"
          data-autofocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void confirmReject();
            }
          }}
          className="mt-1 min-h-11 w-full rounded-[0.5rem] border border-line-strong bg-paper px-3 text-body"
        />
      </Dialog>
    </>
  );
}

/** Post a reply on behalf of the consultancy. For now they email the owner, who pastes it here. */
function ReplyBox({ review }: { review: AdminReview }) {
  const t = useTranslations("admin.queue.reply");
  const toast = useToast();
  const [body, setBody] = useState("");
  const [posted, setPosted] = useState(review.replies);
  const [busy, setBusy] = useState(false);

  async function post() {
    setBusy(true);
    const result = await postReplyAction(review.id, body);
    setBusy(false);
    if (!result.ok) return toast(result.error, "bad");
    toast(t("posted"));
    setPosted((list) => [...list, { id: String(Date.now()), body }]);
    setBody("");
  }

  return (
    <details className="mt-3 border-t border-line pt-2">
      <summary className="cursor-pointer font-semibold">{t("open")}</summary>
      {posted.length > 0 && (
        <div className="mt-2">
          <p className="font-semibold">{t("existing")}:</p>
          <ul className="list-disc pl-5">
            {posted.map((reply) => (
              <li key={reply.id} className="whitespace-pre-line">
                {reply.body}
              </li>
            ))}
          </ul>
        </div>
      )}
      <label className="mt-2 block font-semibold" htmlFor={`reply-${review.id}`}>
        {t("label")}
      </label>
      <p className="text-ink-soft">{t("hint")}</p>
      <textarea
        id={`reply-${review.id}`}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="mt-1 w-full rounded-[0.5rem] border border-line-strong bg-paper p-2 text-body"
      />
      <button type="button" className={cn(button, "mt-2")} disabled={busy || body.trim().length < 3} onClick={post}>
        {t("post")}
      </button>
    </details>
  );
}
