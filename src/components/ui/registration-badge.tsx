import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { RegistrationStatus } from "@/lib/types";

const styles: Record<RegistrationStatus, { icon: LucideIcon; className: string }> = {
  registered: { icon: ShieldCheck, className: "bg-ok-tint text-ok" },
  not_found: { icon: ShieldX, className: "bg-bad-tint text-bad" },
  expired: { icon: ShieldAlert, className: "bg-warn-tint text-warn" },
  unknown: { icon: ShieldQuestion, className: "bg-paper-sunk text-ink-soft" },
};

type Props = {
  status: RegistrationStatus;
  /** "lg" is the big, unmistakable badge at the top of a profile. */
  size?: "sm" | "lg";
  /** Already formatted date, for example "12 Kartik 2083". Shown only on the large badge. */
  checkedOn?: string | null;
  /** Link to the official list. Shown only on the large badge. */
  sourceUrl?: string | null;
  className?: string;
};

/**
 * The registration answer. Meaning is carried by an icon and a word, never by colour alone.
 */
export function RegistrationBadge({ status, size = "sm", checkedOn, sourceUrl, className }: Props) {
  const t = useTranslations("ui.registration");
  const { icon: Icon, className: tone } = styles[status];

  if (size === "sm") {
    return (
      <span
        className={cn(
          "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-small font-semibold whitespace-nowrap",
          tone,
          className,
        )}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {t(`${status}.short`)}
      </span>
    );
  }

  return (
    <div className={cn("flex items-start gap-4 rounded-card p-5 sm:p-6", tone, className)}>
      <Icon aria-hidden="true" className="mt-0.5 size-10 shrink-0 sm:size-12" strokeWidth={1.75} />
      <div className="min-w-0">
        <p className="font-display text-heading font-semibold">{t(`${status}.title`)}</p>
        <p className="mt-1 text-small text-ink">{t(`${status}.body`)}</p>
        {(checkedOn || sourceUrl) && (
          <p className="mt-2 text-small text-ink-soft">
            {checkedOn && <span>{t("checkedOn", { date: checkedOn })}</span>}
            {checkedOn && sourceUrl && <span aria-hidden="true"> · </span>}
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-semibold text-ink underline underline-offset-4"
              >
                {t("source")}
              </a>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
