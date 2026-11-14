import { cn } from "@/lib/cn";

// Palette pairs only. The pair is picked from the name, so one consultancy always gets the same tile.
const tones = [
  "bg-signature text-signature-ink",
  "bg-spark text-spark-ink",
  "bg-ink text-paper",
  "bg-ok-tint text-ok",
  "bg-signature-tint text-signature-strong",
] as const;

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

const sizes = {
  sm: "size-10 rounded-[0.75rem] text-body",
  md: "size-14 rounded-control text-heading",
  lg: "size-20 rounded-card text-title",
} as const;

/** A coloured tile with the first letter. We show no consultancy logos in version 1. */
export function Monogram({
  name,
  letter: letterFrom,
  size = "md",
  className,
}: {
  /** Decides the colour. Use something that never changes, like the slug. */
  name: string;
  /** Text to take the letter from. Defaults to `name`. */
  letter?: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const letter = [...(letterFrom ?? name).trim()][0]?.toUpperCase() ?? "?";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center font-display font-semibold leading-none",
        sizes[size],
        tones[hash(name) % tones.length],
        className,
      )}
    >
      {letter}
    </span>
  );
}
