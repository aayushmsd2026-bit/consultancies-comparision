import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet";
type Size = "md" | "lg";

type Common = {
  variant?: Variant;
  size?: Size;
  /** Fill the width of the parent. */
  block?: boolean;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  className?: string;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "on-signature bg-signature text-signature-ink hover:bg-signature-press active:bg-signature-press",
  secondary:
    "border-2 border-ink text-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper",
  quiet:
    "text-ink underline decoration-line-strong decoration-2 underline-offset-4 hover:decoration-ink",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-6 text-body", // 48px tall: a comfortable thumb target
  lg: "min-h-14 px-8 text-lead",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  block,
  className,
}: Pick<Common, "variant" | "size" | "block" | "className">): string {
  return cn(
    "press inline-flex items-center justify-center gap-2 rounded-full font-semibold leading-tight",
    "select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variants[variant],
    sizes[size],
    variant === "quiet" && "px-2",
    block && "w-full",
    className,
  );
}

type ButtonProps = Common &
  Omit<ComponentProps<"button">, "children" | "className"> & {
    /** Shows a spinner and blocks clicks. */
    loading?: boolean;
  };

export function Button({
  variant,
  size,
  block,
  icon,
  iconAfter,
  className,
  children,
  loading,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, block, className })}
      {...rest}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
      ) : (
        icon
      )}
      <span>{children}</span>
      {iconAfter}
    </button>
  );
}

type ButtonLinkProps = Common & Omit<ComponentProps<typeof Link>, "children" | "className">;

/** A link that looks like a button. Use it when a tap goes to another page. */
export function ButtonLink({
  variant,
  size,
  block,
  icon,
  iconAfter,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, block, className })} {...rest}>
      {icon}
      <span>{children}</span>
      {iconAfter}
    </Link>
  );
}
