"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { FileCheck2, Lock, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  hint?: string;
  /** The reassuring line, for example "Only our team sees this. We delete it after checking." */
  privacyNote?: string;
  /** File types, for example "image/jpeg,image/png,application/pdf". */
  accept: string;
  maxBytes: number;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  className?: string;
};

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

/** Pick one file by tapping or by dropping it. Checks type and size before accepting. */
export function FileUpload({
  label,
  hint,
  privacyNote,
  accept,
  maxBytes,
  file,
  onChange,
  error,
  className,
}: Props) {
  const t = useTranslations("ui.upload");
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const shownError = error ?? localError;

  function take(next: File | undefined) {
    if (!next) return;
    const allowed = accept.split(",").map((type) => type.trim());
    if (!allowed.includes(next.type)) {
      setLocalError(t("wrongType"));
      return;
    }
    if (next.size > maxBytes) {
      setLocalError(t("tooBig", { size: formatSize(maxBytes) }));
      return;
    }
    setLocalError(null);
    onChange(next);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    take(event.dataTransfer.files[0]);
  }

  function clear() {
    onChange(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.focus();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-body font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 text-small text-ink-soft">
          {hint}
        </p>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative rounded-card border-2 border-dashed p-5 transition-colors duration-150",
          dragging ? "border-ink bg-signature-tint" : "border-line-strong bg-paper-raised",
          "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          aria-describedby={cn(hint && `${id}-hint`, shownError && `${id}-error`) || undefined}
          aria-invalid={shownError ? true : undefined}
          onChange={(e) => take(e.target.files?.[0])}
          className={cn("absolute inset-0 size-full cursor-pointer opacity-0", file && "pointer-events-none")}
          tabIndex={file ? -1 : 0}
        />
        {file ? (
          <div className="flex items-center gap-3">
            <FileCheck2 aria-hidden="true" className="size-8 shrink-0 text-ok" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{file.name}</p>
              <p className="tabular text-small text-ink-soft">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={clear}
              className="press relative grid size-12 shrink-0 place-items-center rounded-full hover:bg-paper-sunk"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{t("remove", { name: file.name })}</span>
            </button>
          </div>
        ) : (
          <div className="pointer-events-none flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-paper-sunk">
              <Upload aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-semibold">{t("choose")}</p>
              <p className="text-small text-ink-soft">{t("limits", { size: formatSize(maxBytes) })}</p>
            </div>
          </div>
        )}
      </div>

      {privacyNote && (
        <p className="flex items-start gap-2 text-small text-ink-soft">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {privacyNote}
        </p>
      )}
      <p id={`${id}-error`} role="alert" className="text-small font-semibold text-bad empty:hidden">
        {shownError}
      </p>
    </div>
  );
}
