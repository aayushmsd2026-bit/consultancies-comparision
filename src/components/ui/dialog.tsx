"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Buttons at the bottom. */
  actions?: ReactNode;
  className?: string;
};

/**
 * A window on top of the page. Built on the browser's own <dialog>, which keeps
 * the keyboard inside it and closes on Escape.
 * Give one field inside it the attribute data-autofocus to start the cursor there.
 */
export function Dialog({ open, onClose, title, children, actions, className }: Props) {
  const t = useTranslations("ui.dialog");
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Put the cursor where the visitor will type: mark that field with data-autofocus.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the dark area around the window closes it.
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[min(100%-2rem,34rem)] rounded-block bg-paper-raised p-0 text-ink shadow-soft",
        "backdrop:bg-black/50 open:animate-fade-in",
        "max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none",
        className,
      )}
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-heading">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="press -mt-2 -mr-2 grid size-12 shrink-0 place-items-center rounded-full hover:bg-paper-sunk"
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">{t("close")}</span>
          </button>
        </div>
        <div className="mt-3">{children}</div>
        {actions && <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div>}
      </div>
    </dialog>
  );
}
