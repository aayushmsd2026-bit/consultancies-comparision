"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

type Tone = "ok" | "bad";
type Toast = { id: number; message: string; tone: Tone };
type ShowToast = (message: string, tone?: Tone) => void;

const ToastContext = createContext<ShowToast | null>(null);

/** Call `const toast = useToast()` and then `toast("Saved")`. */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>.");
  return show;
}

/** Small messages that appear for a few seconds near the bottom of the screen. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("ui.toast");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ShowToast>(
    (message, tone = "ok") => {
      const id = nextId.current++;
      // Keep at most three on screen.
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            data-theme="dark"
            className="pointer-events-auto flex w-full max-w-md animate-fade-in items-center gap-3 rounded-control py-2 pr-2 pl-4 shadow-soft"
          >
            {toast.tone === "ok" ? (
              <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-ok" />
            ) : (
              <CircleAlert aria-hidden="true" className="size-5 shrink-0 text-bad" />
            )}
            <p className={cn("flex-1 py-2 text-small font-medium")}>{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="press grid size-12 shrink-0 place-items-center rounded-full hover:bg-paper-raised"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{t("dismiss")}</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
