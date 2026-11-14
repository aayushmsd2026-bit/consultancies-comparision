import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  body?: string;
  /** Usually one button. */
  action?: ReactNode;
  className?: string;
};

/** A friendly "nothing here yet" block. Shapes from the palette, no stock pictures. */
export function EmptyState({ title, body, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-5 rounded-block bg-paper-sunk p-8 sm:p-12",
        className,
      )}
    >
      <div aria-hidden="true" className="flex items-end gap-2">
        <span className="size-10 rounded-full bg-signature" />
        <span className="h-14 w-10 rounded-t-full bg-ink" />
        <span className="size-6 rounded-[0.5rem] bg-spark" />
      </div>
      <div className="max-w-prose">
        <h3 className="text-heading">{title}</h3>
        {body && <p className="mt-2 text-ink-soft">{body}</p>}
      </div>
      {action}
    </div>
  );
}
