"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  /** Wait this many milliseconds. Use it to reveal a row of items one after another. */
  delay?: number;
  as?: "div" | "li" | "section";
};

/**
 * Fades and lifts its content 14px when it scrolls into view. Once.
 * Content already on screen when the page loads is never hidden.
 * With "reduce motion" switched on, it only fades (see globals.css).
 */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    // Already visible: leave it alone.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    const hide = requestAnimationFrame(() => setState("hidden"));
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(hide);
      io.disconnect();
    };
  }, []);

  return (
    <Tag
      // @ts-expect-error one ref type for three possible tags
      ref={ref}
      data-reveal={state === "idle" ? undefined : state}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
