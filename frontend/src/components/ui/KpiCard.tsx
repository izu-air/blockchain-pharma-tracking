import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "emerald" | "sky" | "amber" | "rose" | "violet";

interface Props {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  /** e.g. "+12 за неделю".  Positive sign = upward trend. */
  delta?: { value: string; direction: "up" | "down" };
  /** Optional secondary line under the value. */
  hint?: ReactNode;
  className?: string;
}

const TONE_CLASS: Record<Tone, string> = {
  emerald: "icon-halo",
  sky:     "icon-halo icon-halo-sky",
  amber:   "icon-halo icon-halo-amber",
  rose:    "icon-halo icon-halo-rose",
  violet:  "icon-halo icon-halo-violet"
};

const VALUE_TONE: Record<Tone, string> = {
  emerald: "text-emerald-200",
  sky:     "text-sky-200",
  amber:   "text-amber-200",
  rose:    "text-rose-200",
  violet:  "text-violet-200"
};

/**
 * Standout KPI tile: icon halo, big numeric value, optional trend chip.
 * Used in the dashboard analytics strip so metrics feel like first-class
 * citizens rather than slate boxes with numbers in them.
 */
export function KpiCard({
  label, value, icon, tone = "emerald", delta, hint, className = ""
}: Props) {
  return (
    <article
      className={`panel panel-interactive p-4 sm:p-5 ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className={`mt-2 text-3xl font-semibold leading-none tabular-nums ${VALUE_TONE[tone]}`}>
            {value}
          </p>
          {hint && <p className="mt-2 text-xs leading-snug text-slate-500">{hint}</p>}
        </div>
        {icon && (
          <span className={`${TONE_CLASS[tone]} h-10 w-10`} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      {delta && (
        <p className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
          delta.direction === "up" ? "text-emerald-300" : "text-rose-300"
        }`}>
          {delta.direction === "up"
            ? <TrendingUp size={12} aria-hidden="true" />
            : <TrendingDown size={12} aria-hidden="true" />}
          {delta.value}
        </p>
      )}
    </article>
  );
}
