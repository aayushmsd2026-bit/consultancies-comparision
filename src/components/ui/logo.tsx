import { SITE_NAME } from "@/config/site";
import { cn } from "@/lib/cn";

/** The mark: the three palette colours as simple shapes. Then the site name. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span aria-hidden="true" className="relative block size-8 shrink-0">
        <span className="absolute inset-0 rounded-[0.6rem] bg-ink" />
        <span className="absolute top-1.5 left-1.5 size-3 rounded-full bg-signature" />
        <span className="absolute right-1.5 bottom-1.5 size-2 rounded-[0.2rem] bg-spark" />
      </span>
      <span className="font-display text-heading font-semibold tracking-tight">{SITE_NAME}</span>
    </span>
  );
}
