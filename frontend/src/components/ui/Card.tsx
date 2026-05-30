import type { ReactNode } from "react";

type Accent = "emerald" | "sky" | "violet" | "amber" | "rose";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Tighter padding for inner subsection cards. */
  dense?: boolean;
  /** Renders without padding so embedded surfaces (lists, tables) bleed edge-to-edge. */
  unpadded?: boolean;
  /** Hover/focus lift + emerald rim glow (use on linked cards). */
  interactive?: boolean;
  /** Adds a 2px gradient strip across the top edge. */
  accent?: Accent;
}

const ACCENT_CLASS: Record<Accent, string> = {
  emerald: "panel-accent-emerald",
  sky:     "panel-accent-sky",
  violet:  "panel-accent-violet",
  amber:   "panel-accent-amber",
  rose:    "panel-accent-rose"
};

/**
 * The base content surface.  Every page section is wrapped in <Card> so
 * spacing, border radius, backdrop blur and shadow stay consistent.
 *
 * Pass `interactive` when the card itself is a link / button so it gets
 * the hover lift + emerald rim glow.  Pass `accent="emerald"` (etc.) to
 * add a coloured top strip — useful for grouping cards by section.
 */
export function Card({
  children, className = "", dense, unpadded, interactive, accent
}: CardProps) {
  const padding = unpadded ? "" : dense ? "p-3 sm:p-4" : "p-4 sm:p-5";
  const accentClass = accent ? ACCENT_CLASS[accent] : "";
  const interactiveClass = interactive ? "panel-interactive" : "";
  return (
    <section
      className={`panel ${padding} ${accentClass} ${interactiveClass} ${className}`
        .replace(/\s+/g, " ").trim()}
    >
      {children}
    </section>
  );
}

/**
 * Header strip inside a Card — short title + optional eyebrow + actions.
 */
export function CardHeader({
  eyebrow, title, description, actions
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && (
          <h2 className="mt-1 text-lg font-semibold leading-snug text-slate-50">
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-1 max-w-prose text-sm leading-snug text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      )}
    </header>
  );
}
