import type { ReactNode } from "react";

interface Props {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Right-side actions (buttons / links). */
  actions?: ReactNode;
  /** Optional content rendered below the description (badges, breadcrumb chips). */
  meta?: ReactNode;
  /** Optional icon shown inside the gradient halo to the left of the title. */
  icon?: ReactNode;
  /** Tone of the icon halo. */
  iconTone?: "emerald" | "sky" | "amber" | "rose" | "violet";
  className?: string;
}

const HALO_TONE: Record<NonNullable<Props["iconTone"]>, string> = {
  emerald: "icon-halo",
  sky:     "icon-halo icon-halo-sky",
  amber:   "icon-halo icon-halo-amber",
  rose:    "icon-halo icon-halo-rose",
  violet:  "icon-halo icon-halo-violet"
};

/**
 * Page-level header.  Use at the top of every page; pairs nicely with
 * <Card> sections beneath.  Responsive: actions wrap below the title on
 * small viewports.
 */
export function PageHeader({
  eyebrow, title, description, actions, meta, icon, iconTone = "emerald", className = ""
}: Props) {
  return (
    <header
      className={`relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`.trim()}
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        {icon && (
          <span className={HALO_TONE[iconTone]} aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-1 break-words text-2xl font-semibold leading-tight text-slate-50 sm:text-[1.7rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-prose break-words text-sm leading-snug text-slate-400">
              {description}
            </p>
          )}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
