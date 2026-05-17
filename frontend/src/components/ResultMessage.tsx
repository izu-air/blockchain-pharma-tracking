import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface Props {
  error?: string;
  txHash?: string;
  /** Сообщение успешной операции (опционально, выводится вместо txHash). */
  success?: string;
}

export function ResultMessage({ error, txHash, success }: Props) {
  if (!error && !txHash && !success) return null;

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200"
      >
        <p className="break-words leading-snug">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-100">
      {success && <p className="break-words leading-snug">{success}</p>}
      {txHash && (
        <div className={`flex items-center gap-2 ${success ? "mt-2" : ""}`}>
          <span className="shrink-0">Транзакция:</span>
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-emerald-200">
            {txHash}
          </code>
          <CopyButton value={txHash} />
        </div>
      )}
    </div>
  );
}

export function CopyButton({ value, label = "Скопировать" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="shrink-0 rounded-md p-1 text-emerald-300 hover:bg-emerald-500/15"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
