import { CornerDownRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

type Props = {
  body: string;
  /** Already formatted date. */
  date: string;
  className?: string;
};

/** The consultancy's answer, nested under a review. Posted by the admin on their behalf. */
export function ReplyBlock({ body, date, className }: Props) {
  const t = useTranslations("ui.reply");
  return (
    <div className={cn("rounded-control bg-paper-sunk p-4 sm:p-5", className)}>
      <p className="flex items-start gap-2 text-small font-semibold">
        <CornerDownRight aria-hidden="true" className="mt-1 size-4 shrink-0" />
        <span>
          {t("title")} <span className="font-normal whitespace-nowrap text-ink-soft">· {date}</span>
        </span>
      </p>
      {/* User text is rendered as plain text. Never as HTML. */}
      <p className="mt-2 whitespace-pre-line break-words">{body}</p>
    </div>
  );
}
