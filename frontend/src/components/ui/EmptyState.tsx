import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface Props {
  /** Custom icon — defaults to inbox glyph. */
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Primary CTA + optional secondary slot. */
  action?: ReactNode;
  className?: string;
}

/**
 * Friendly empty/zero-state placeholder.  Use whenever a list, query or
 * search result legitimately has nothing to show — never display a bare
 * empty container, it makes users think the page is broken.
 */
export function EmptyState({ icon, title, description, action, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl border border-dashed
                  border-slate-700/60 bg-slate-950/30 p-8 text-center ${className}`.trim()}
      role="status"
    >
      <span className="rounded-full bg-slate-800/70 p-3 text-slate-400" aria-hidden="true">
        {icon ?? <Inbox size={22} />}
      </span>
      {title && <p className="text-sm font-semibold text-slate-200">{title}</p>}
      {description && (
        <p className="max-w-md text-sm leading-snug text-slate-400">{description}</p>
      )}
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
