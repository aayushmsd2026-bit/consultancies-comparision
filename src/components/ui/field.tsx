import { useId, type ComponentProps, type ReactNode } from "react";
import { ChevronDown, CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Shows "(optional)" after the label. Pass the translated word. */
  optionalLabel?: string;
  children: ReactNode;
  className?: string;
};

/** Label on top, hint and error below. Shared by TextField, TextArea and Select. */
function FieldShell({ id, label, hint, error, optionalLabel, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-body font-semibold">
        {label}
        {optionalLabel && <span className="font-normal text-ink-soft"> ({optionalLabel})</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 text-small text-ink-soft">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-small font-semibold text-bad">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const control =
  "w-full rounded-control border-2 border-line-strong bg-paper-raised px-4 text-body text-ink " +
  "placeholder:text-ink-soft transition-colors duration-150 hover:border-ink focus:border-ink " +
  "aria-invalid:border-bad disabled:opacity-50";

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  return cn(hint && `${id}-hint`, error && `${id}-error`) || undefined;
}

type Extra = {
  label: string;
  hint?: string;
  error?: string;
  optionalLabel?: string;
  wrapperClassName?: string;
};

export function TextField({
  label,
  hint,
  error,
  optionalLabel,
  wrapperClassName,
  className,
  id: givenId,
  ...rest
}: Extra & ComponentProps<"input">) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <FieldShell {...{ id, label, hint, error, optionalLabel }} className={wrapperClassName}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "min-h-14", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  optionalLabel,
  wrapperClassName,
  className,
  id: givenId,
  rows = 5,
  ...rest
}: Extra & ComponentProps<"textarea">) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <FieldShell {...{ id, label, hint, error, optionalLabel }} className={wrapperClassName}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "py-3 leading-relaxed", className)}
        {...rest}
      />
    </FieldShell>
  );
}

/** The phone's own picker. It is the easiest to use with one thumb. */
export function Select({
  label,
  hint,
  error,
  optionalLabel,
  wrapperClassName,
  className,
  id: givenId,
  children,
  ...rest
}: Extra & ComponentProps<"select">) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <FieldShell {...{ id, label, hint, error, optionalLabel }} className={wrapperClassName}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(control, "min-h-14 appearance-none pr-12", className)}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-ink-soft"
        />
      </div>
    </FieldShell>
  );
}
