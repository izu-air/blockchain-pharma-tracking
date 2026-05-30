import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  block?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:   "button",
  secondary: "button-secondary",
  ghost:     "button-ghost",
  danger:    "button-danger",
  link:      "button-link"
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm"
};

/**
 * Cohesive button primitive used across the app. Forwards a ref so it can be
 * focused programmatically (modal close, form submission shortcuts).
 *
 *   <Button variant="primary" loading={tx.submitting} leadingIcon={<Send/>}>
 *     Передать продукт
 *   </Button>
 */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, leadingIcon, trailingIcon,
    block, className = "", disabled, children, ...rest },
  ref
) {
  const variantClass = VARIANT_CLASS[variant];
  // `.button-link` already inlines its sizing; size class only applies to
  // solid/outlined variants.
  const sizeClass = variant === "link" ? "" : SIZE_CLASS[size];
  const widthClass = block ? "w-full" : "";

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      {...rest}
    >
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        : leadingIcon}
      {children && <span className="truncate">{children}</span>}
      {!loading && trailingIcon}
    </button>
  );
});
