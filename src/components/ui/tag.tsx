import { CircleCheck, CircleX, Hourglass, Undo2, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { Outcome } from "@/lib/types";

const styles: Record<Outcome, { icon: LucideIcon; className: string }> = {
  visa_granted: { icon: CircleCheck, className: "bg-ok-tint text-ok" },
  visa_refused: { icon: CircleX, className: "bg-bad-tint text-bad" },
  in_process: { icon: Hourglass, className: "bg-warn-tint text-warn" },
  withdrew: { icon: Undo2, className: "bg-paper-sunk text-ink-soft" },
};

/** Shows how the reviewer's case ended. Always an icon and a word, never colour alone. */
export function OutcomeTag({ outcome, className }: { outcome: Outcome; className?: string }) {
  const t = useTranslations("ui.outcome");
  const { icon: Icon, className: tone } = styles[outcome];
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-small font-semibold",
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {t(outcome)}
    </span>
  );
}
