import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Render footer area (typically action buttons). */
  footer?: ReactNode;
  /** Hide the close (×) button. */
  hideClose?: boolean;
  /** Mobile sheet variant — slides from bottom on small screens. */
  variant?: "modal" | "sheet";
  children: ReactNode;
  /** ARIA label when there is no visible title. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Accessible modal dialog.
 *
 * <ul>
 *   <li><kbd>Esc</kbd> closes the dialog.</li>
 *   <li>Click outside the panel closes the dialog.</li>
 *   <li>Initial focus moves to the close button; focus is trapped inside
 *       so <kbd>Tab</kbd> never escapes to the page underneath.</li>
 *   <li>Body scroll is locked while open.</li>
 *   <li>Renders into <code>document.body</code> via a portal so z-index
 *       and overflow contexts of the parent tree cannot clip it.</li>
 * </ul>
 */
export function Dialog({
  open, onClose, title, description, footer, hideClose,
  variant = "modal", children, ariaLabel, className = ""
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll & trap focus
  useEffect(() => {
    if (!open) return;

    // 1. lock background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 2. esc to close
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]),' +
          ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (event.shiftKey && active === first) {
          last.focus();
          event.preventDefault();
        } else if (!event.shiftKey && active === last) {
          first.focus();
          event.preventDefault();
        }
      }
    };

    // 3. focus the dialog itself on open so Tab works from the very first press
    const lastActive = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => panelRef.current?.focus());

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lastActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const node = (
    <div className="backdrop" onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={title ? "dialog-title" : undefined}
        aria-describedby={description ? "dialog-desc" : undefined}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        className={[
          variant === "sheet"
            ? "fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] w-full overflow-auto rounded-t-2xl border-t border-white/10 bg-slate-900 p-4 shadow-2xl animate-scale-in sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-auto sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:p-5"
            : "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl outline-none animate-scale-in sm:p-5",
          className
        ].join(" ")}
      >
        {(title || !hideClose) && (
          <header className="mb-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id="dialog-title" className="break-words text-base font-semibold text-slate-50">
                  {title}
                </h2>
              )}
              {description && (
                <p id="dialog-desc" className="mt-1 text-sm leading-snug text-slate-400">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="button-ghost"
              >
                <X size={18} />
              </button>
            )}
          </header>
        )}
        <div>{children}</div>
        {footer && <footer className="mt-4 flex flex-wrap justify-end gap-2">{footer}</footer>}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
