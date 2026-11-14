import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** Five small stars that only show a value. For picking a value use StarInput. */
export function Stars({
  value,
  label,
  className,
}: {
  value: number;
  /** Text for screen readers, for example "4.2 out of 5". */
  label: string;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span role="img" aria-label={label} className={cn("inline-flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn(
            "size-4",
            n <= rounded ? "fill-signature-graphic text-signature-graphic" : "text-line-strong",
          )}
        />
      ))}
    </span>
  );
}
