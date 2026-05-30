import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, ShieldAlert, XCircle } from "lucide-react";

type Tone = "info" | "success" | "warning" | "danger" | "neutral";

const TONE: Record<Tone, { border: string; bg: string; text: string; icon: typeof Info }> = {
  info:    { border: "border-sky-500/40",     bg: "bg-sky-950/30",     text: "text-sky-100",     icon: Info },
  success: { border: "border-emerald-500/40", bg: "bg-emerald-950/30", text: "text-emerald-100", icon: CheckCircle2 },
  warning: { border: "border-amber-500/40",   bg: "bg-amber-950/30",   text: "text-amber-100",   icon: ShieldAlert },
  danger:  { border: "border-red-500/40",     bg: "bg-red-950/40",     text: "text-red-100",     icon: XCircle },
  neutral: { border: "border-slate-600/40",   bg: "bg-slate-900/60",   text: "text-slate-100",   icon: AlertCircle }
};

interface Props {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  /** `role="alert"` for live regions; defaults to true for danger/warning. */
  live?: boolean;
  /** Slot rendered on the right (close button / action). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Universal alert/banner used for inline error/notice messages.
 * Replaces the ad-hoc rounded-xl border-red-500/40 div blocks scattered
 * across the codebase so error states feel coherent.
 */
export function Alert({
  tone = "neutral", title, children, icon, live, actions, className = ""
}: Props) {
  const t = TONE[tone];
  const Icon = t.icon;
  const isLive = live ?? (tone === "danger" || tone === "warning");

  return (
    <div
      role={isLive ? "alert" : undefined}
      aria-live={isLive ? "polite" : undefined}
      className={`rounded-xl border ${t.border} ${t.bg} ${t.text} p-3 sm:p-4 ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0" aria-hidden="true">
          {icon ?? <Icon size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          {title && <p className="font-semibold leading-snug">{title}</p>}
          {children && (
            <div className={`break-words leading-snug ${title ? "mt-1 text-sm opacity-90" : "text-sm"}`}>
              {children}
            </div>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
