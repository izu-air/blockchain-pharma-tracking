import {
  AlertTriangle, CheckCircle2, ExternalLink, Loader2, RefreshCw, Wallet, XCircle, Database
} from "lucide-react";
import { Alert } from "./ui/Alert";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { CopyButton } from "./ResultMessage";
import { explorerTxUrl } from "../lib/explorer";
import type { TxState } from "../hooks/useTransaction";

interface Props {
  state: TxState;
  chainId: number | null;
  /** Called when user clicks "Повторить" on a failed transaction. */
  onRetry?: () => void;
  /** Called when user dismisses a settled state. */
  onDismiss?: () => void;
  /** Optional descriptive context (e.g. "Передача продукта SN-001"). */
  title?: string;
}

const STEPS: Array<{
  key: TxState["step"];
  label: string;
  icon: typeof Wallet;
  hint: string;
}> = [
  { key: "awaiting-wallet", label: "Подпись в кошельке", icon: Wallet,
    hint: "Подтвердите транзакцию в MetaMask." },
  { key: "submitted",       label: "Отправлено", icon: Loader2,
    hint: "Транзакция отправлена в сеть." },
  { key: "confirming",      label: "Подтверждение в блокчейне", icon: Loader2,
    hint: "Ждём, пока майнеры включат транзакцию в блок." },
  { key: "backend-sync",    label: "Сохранение метаданных", icon: Database,
    hint: "Backend кэширует событие для аналитики." },
  { key: "confirmed",       label: "Готово", icon: CheckCircle2,
    hint: "Транзакция подтверждена и закэширована." }
];

/**
 * Visual stepper for the {@link useTransaction} hook.  Shows the user
 * exactly which phase the operation is in, exposes explorer / copy
 * actions for the tx hash, and surfaces a Retry button on failure.
 */
export function TxStepper({ state, chainId, onRetry, onDismiss, title }: Props) {
  if (state.step === "idle") return null;

  const explorerUrl = explorerTxUrl(chainId, state.txHash);
  const currentIdx = STEPS.findIndex(s => s.key === state.step);

  return (
    <section
      role="status"
      aria-live="polite"
      className="panel space-y-4 border-emerald-500/20"
    >
      <header className="flex flex-wrap items-center gap-2">
        {title && <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-100">{title}</p>}
        <StatusPill step={state.step} />
      </header>

      {/* Step progress */}
      <ol className="grid gap-2 sm:grid-cols-5">
        {STEPS.map((s, idx) => {
          const isActive   = state.step === s.key;
          const isComplete = state.step === "confirmed"
            ? idx <= STEPS.findIndex(x => x.key === "confirmed")
            : currentIdx > idx;
          const palette = isActive
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : isComplete
              ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
              : "border-slate-700 bg-slate-950/40 text-slate-500";
          const Icon = s.icon;
          return (
            <li key={s.key} className={`rounded-lg border p-2 ${palette}`}>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                {isActive ? (
                  <Icon className={Icon === Loader2 ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden="true" />
                ) : (
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{s.label}</span>
              </div>
              {isActive && <p className="mt-1 text-[11px] leading-snug opacity-90">{s.hint}</p>}
            </li>
          );
        })}
      </ol>

      {/* tx hash row */}
      {state.txHash && (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/50 p-2 text-xs">
          <span className="shrink-0 text-slate-400">tx:</span>
          <code className="min-w-0 flex-1 truncate font-mono text-slate-300">{state.txHash}</code>
          <CopyButton value={state.txHash} label="Скопировать tx hash" />
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button-ghost"
              title="Открыть в блок-эксплорере"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}

      {/* Failure path */}
      {state.step === "failed" && (
        <Alert tone="danger" title="Транзакция не выполнена">
          {state.error}
          {state.retryable && onRetry && (
            <div className="mt-3">
              <Button variant="primary" size="sm" leadingIcon={<RefreshCw size={14} />} onClick={onRetry}>
                Повторить
              </Button>
            </div>
          )}
        </Alert>
      )}

      {/* Partial success */}
      {state.step === "partial" && (
        <Alert tone="warning" title="Транзакция прошла, но не всё сохранено">
          {state.warning} On-chain запись успешна, индексатор подхватит её автоматически в течение пары минут.
        </Alert>
      )}

      {(state.step === "confirmed" || state.step === "partial" || state.step === "failed") && onDismiss && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={onDismiss}>Закрыть</Button>
        </div>
      )}
    </section>
  );
}

function StatusPill({ step }: { step: TxState["step"] }) {
  switch (step) {
    case "awaiting-wallet":
      return <Badge tone="amber" icon={<Wallet size={12} />}>Кошелёк</Badge>;
    case "submitted":
    case "confirming":
      return <Badge tone="sky" icon={<Loader2 className="h-3 w-3 animate-spin" />}>В обработке</Badge>;
    case "backend-sync":
      return <Badge tone="sky" icon={<Database size={12} />}>Сохранение</Badge>;
    case "confirmed":
      return <Badge tone="emerald" icon={<CheckCircle2 size={12} />}>Готово</Badge>;
    case "partial":
      return <Badge tone="amber" icon={<AlertTriangle size={12} />}>Частично</Badge>;
    case "failed":
      return <Badge tone="red" icon={<XCircle size={12} />}>Ошибка</Badge>;
    default:
      return null;
  }
}
