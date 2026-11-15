import type { ReactNode } from "react";
import { Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

/** A sentence pulled out of the text and set large in the display typeface. */
export function PullQuote({ children }: { children?: ReactNode }) {
  return (
    <blockquote className="my-12 max-w-3xl border-l-4 border-signature-graphic pl-6 font-display text-title [&_p]:my-0 [&_p]:max-w-none [&_p]:text-[length:inherit] [&_p]:leading-[inherit]">
      {children}
    </blockquote>
  );
}

/** A boxed note. `tone="warn"` is for things that can cost the reader money. */
export function Callout({ children, tone = "info" }: { children?: ReactNode; tone?: "info" | "warn" }) {
  const Icon = tone === "warn" ? TriangleAlert : Info;
  return (
    <aside
      className={cn(
        "my-8 flex max-w-prose gap-4 rounded-card p-5 sm:p-6 [&_p]:my-0 [&_p]:text-body",
        tone === "warn" ? "bg-warn-tint" : "bg-paper-sunk",
      )}
    >
      <Icon aria-hidden="true" className={cn("mt-1 size-6 shrink-0", tone === "warn" ? "text-warn" : "text-ink-soft")} />
      <div className="min-w-0 space-y-3">{children}</div>
    </aside>
  );
}

/** A list of things to tick off. Put a normal markdown list inside it. */
export function Checklist({ children }: { children?: ReactNode }) {
  return (
    <div className="my-8 max-w-prose rounded-card bg-paper-raised p-5 shadow-soft sm:p-8 [&_li]:pl-2 [&_ul]:my-0 [&_ul]:list-['☐__']">
      {children}
    </div>
  );
}
