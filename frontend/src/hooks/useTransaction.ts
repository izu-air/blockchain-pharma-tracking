import { useCallback, useRef, useState } from "react";
import { humanizeError } from "../lib/errors";

/**
 * Generic state machine for a blockchain write operation.
 *
 * Used by every page that mutates on-chain state (transfer, status update,
 * recall, register).  The hook turns ad-hoc try/catch + setLoading code
 * into a single predictable lifecycle:
 *
 *   idle
 *     → awaiting-wallet     ("Подтвердите подпись в MetaMask")
 *     → submitted           ("Транзакция отправлена")
 *     → confirming          ("Ожидание подтверждения в блокчейне")
 *     → backend-sync        ("Сохраняем метаданные в backend")
 *     → confirmed | failed | partial
 *
 * The caller passes an async `run()` that returns a `txHash`.  Optional
 * `syncBackend()` is called after the on-chain tx confirms — it may fail
 * without invalidating the transaction itself, in which case the hook
 * settles in {@code partial}.
 */
export type TxStep =
  | "idle"
  | "awaiting-wallet"
  | "submitted"
  | "confirming"
  | "backend-sync"
  | "confirmed"
  | "failed"
  | "partial";

export interface TxState {
  step: TxStep;
  txHash: string;
  error: string;
  /** Soft warning when the chain confirmed but a follow-up step failed. */
  warning: string;
  /** When step is confirmed/failed/partial, true means user can retry. */
  retryable: boolean;
}

export interface TxRunner {
  /** The actual on-chain call.  Must return the transaction hash. */
  run(): Promise<string>;
  /** Optional follow-up backend cache write. */
  syncBackend?(txHash: string): Promise<void>;
  /** Optional friendly description shown in the stepper header. */
  description?: string;
}

interface UseTransactionOptions {
  /** Reset to idle this many ms after a terminal state. 0 = never. */
  autoResetMs?: number;
}

export function useTransaction(opts: UseTransactionOptions = {}) {
  const [state, setState] = useState<TxState>({
    step: "idle",
    txHash: "",
    error: "",
    warning: "",
    retryable: false
  });
  const lastRunner = useRef<TxRunner | null>(null);
  const autoResetTimer = useRef<number | null>(null);

  const reset = useCallback(() => {
    if (autoResetTimer.current) {
      window.clearTimeout(autoResetTimer.current);
      autoResetTimer.current = null;
    }
    setState({ step: "idle", txHash: "", error: "", warning: "", retryable: false });
  }, []);

  const settle = useCallback((next: Partial<TxState>) => {
    setState((prev) => ({ ...prev, ...next }));
    if (opts.autoResetMs && opts.autoResetMs > 0) {
      autoResetTimer.current = window.setTimeout(reset, opts.autoResetMs);
    }
  }, [opts.autoResetMs, reset]);

  const start = useCallback(async (runner: TxRunner) => {
    lastRunner.current = runner;
    setState({ step: "awaiting-wallet", txHash: "", error: "", warning: "", retryable: false });
    let hash = "";
    try {
      hash = await runner.run();
      // run() resolves AFTER tx.wait() in our contract.ts wrappers, so the
      // tx is already mined.  Show the post-mining message briefly so the
      // user understands the chain side is done.
      setState((prev) => ({ ...prev, step: "confirming", txHash: hash }));
    } catch (exception) {
      const message = humanizeError(exception, "Не удалось выполнить операцию.");
      setState({
        step: "failed",
        txHash: hash,
        error: message,
        warning: "",
        retryable: true
      });
      return;
    }

    if (runner.syncBackend) {
      setState((prev) => ({ ...prev, step: "backend-sync" }));
      try {
        await runner.syncBackend(hash);
      } catch (exception) {
        // Backend cache miss is non-fatal — chain remains authoritative.
        const message = humanizeError(
          exception,
          "Транзакция прошла, но не удалось сохранить метаданные в backend."
        );
        settle({ step: "partial", warning: message, retryable: false });
        return;
      }
    }
    settle({ step: "confirmed", retryable: false });
  }, [settle]);

  const retry = useCallback(() => {
    const r = lastRunner.current;
    if (r) void start(r);
  }, [start]);

  return { state, start, retry, reset };
}
