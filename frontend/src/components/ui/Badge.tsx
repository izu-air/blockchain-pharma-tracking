import type { ReactNode } from "react";

type Tone = "neutral" | "emerald" | "sky" | "amber" | "red" | "violet" | "slate";

const TONE: Record<Tone, string> = {
  neutral: "border-slate-600/50 bg-slate-800/70 text-slate-200",
  emerald: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
  sky:     "border-sky-500/30 bg-sky-500/15 text-sky-200",
  amber:   "border-amber-500/30 bg-amber-500/15 text-amber-200",
  red:     "border-red-500/40 bg-red-500/15 text-red-200",
  violet:  "border-violet-500/30 bg-violet-500/15 text-violet-200",
  slate:   "border-slate-700 bg-slate-900/60 text-slate-300"
};

interface Props {
  tone?: Tone;
  children: ReactNode;
  /** Decorative icon shown before the label. */
  icon?: ReactNode;
  className?: string;
}

/**
 * Small pill-shaped status tag.  Used for product status, role labels,
 * verification flags ("Подлинно", "Отозвано", "QR подписан").
 */
export function Badge({ tone = "neutral", icon, children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5
                  text-[11px] font-medium leading-none ${TONE[tone]} ${className}`.trim()}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}
