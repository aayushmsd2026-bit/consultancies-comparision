import type { CSSProperties } from "react";

const settle = (x: string, y: string, r: string, delay: number): CSSProperties =>
  ({ "--settle-x": x, "--settle-y": y, "--settle-r": r, animationDelay: `${delay}ms` }) as CSSProperties;

/**
 * The one "wow" moment of the home page: the three Wada colours as simple
 * shapes that slide in and settle when the page first opens.
 * Decoration only. Hidden from screen readers. With reduced motion they simply appear.
 */
export function HeroBlocks() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] overflow-hidden md:block"
    >
      <div
        className="absolute top-[12%] right-[-8%] h-[58%] w-[70%] animate-settle rounded-block bg-ink"
        style={settle("120px", "-40px", "8deg", 80)}
      />
      <div
        className="absolute right-[38%] bottom-[10%] size-[min(22vw,18rem)] animate-settle rounded-full bg-spark"
        style={settle("-90px", "70px", "0deg", 220)}
      />
      <div
        className="absolute top-[30%] right-[12%] h-[34%] w-[26%] animate-settle rounded-t-full bg-paper"
        style={settle("0px", "110px", "-6deg", 360)}
      />
      <div
        className="absolute top-[8%] right-[52%] size-[min(6vw,5rem)] animate-settle rounded-[1rem] bg-signature-strong"
        style={settle("60px", "-80px", "24deg", 480)}
      />
    </div>
  );
}
