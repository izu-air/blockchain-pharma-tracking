import { AlertTriangle, Lock, ShieldAlert, Unlock } from "lucide-react";
import { useState } from "react";
import { ResultMessage } from "../components/ResultMessage";
import { saveProductEvent } from "../lib/api";
import { blockProduct, recallBatch, unblockProduct, unrecallBatch } from "../lib/contract";
import { useWallet } from "../context/WalletContext";
import { humanizeError } from "../lib/errors";
import { hasAnyRole } from "../lib/roles";

export default function RecallPage() {
  const wallet = useWallet();
  const allowed = !wallet.address
      ? "no-wallet"
      : hasAnyRole(wallet.roles, ["REGULATOR", "ADMIN"])
          ? "ok"
          : "wrong-role";

  return (
    <div className="max-w-3xl space-y-6">
      {allowed !== "ok" && <RolePrecheckBanner kind={allowed} address={wallet.address} />}
      <RecallBatchPanel />
      <BlockProductPanel />
    </div>
  );
}

function RolePrecheckBanner({ kind, address }: { kind: "no-wallet" | "wrong-role"; address: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-100">
      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-300" />
      <div className="min-w-0">
        {kind === "no-wallet" ? (
          <>
            <p className="font-semibold">Кошелёк не подключён.</p>
            <p className="mt-1">
              Операции отзыва партии и блокировки упаковки требуют подписи MetaMask.
              Подключите кошелёк с on-chain ролью <span className="font-mono">REGULATOR_ROLE</span> —
              кнопка в правом верхнем углу.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold">У вашего кошелька нет роли регулятора в смарт-контракте.</p>
            <p className="mt-1 break-words">
              Подключён <span className="break-all font-mono">{address}</span>.
              Контракт примет recall / block только от адреса с ролью{" "}
              <span className="font-mono">REGULATOR_ROLE</span>.  Запросите её у администратора
              запросом <span className="font-mono">POST /api/users/{`{id}`}/role</span> либо
              войдите другим кошельком.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function RecallBatchPanel() {
  const [blockchainBatchId, setBlockchainBatchId] = useState("1");
  const [reason, setReason] = useState("Нарушение температурного режима при транспортировке");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const batchIdValid =
      /^\d+$/.test(blockchainBatchId) && Number(blockchainBatchId) > 0;
  const reasonValid = reason.trim().length >= 5;

  async function handle(event: React.FormEvent, mode: "recall" | "unrecall") {
    event.preventDefault();
    if (!batchIdValid) {
      setError(
        "Blockchain batch ID должен быть положительным числом " +
        "(тот же, что выдаёт contract.createBatch). Не вводите сюда BATCH-2026-001 — " +
        "это бизнес-метка, она хранится в off-chain метаданных."
      );
      return;
    }
    if (!reasonValid) {
      setError("Причина должна быть не короче 5 символов.");
      return;
    }
    setLoading(true);
    setError("");
    setTxHash("");

    try {
      const hash = mode === "recall"
          ? await recallBatch(blockchainBatchId, reason.trim())
          : await unrecallBatch(blockchainBatchId, reason.trim());
      setTxHash(hash);
      // Indexer is the source of truth — this manual write is only a UX cache.
      // For batch events there's no per-product record to make.
      await saveProductEvent({
        blockchainProductId: 0,
        eventType: mode === "recall" ? "BATCH_RECALLED" : "BATCH_UNRECALLED",
        transactionHash: hash
      }).catch(() => undefined);
    } catch (exception) {
      setError(humanizeError(
          exception,
          mode === "recall"
              ? "Не удалось отозвать партию."
              : "Не удалось восстановить партию."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="mb-4 flex items-center gap-3">
        <ShieldAlert className="text-red-600" />
        <div>
          <h2 className="text-xl font-semibold">Отзыв партии</h2>
          <p className="text-sm text-slate-400">
            Помечает всю партию как отозванную одной операцией.  Доступно только роли
            регулятора в smart contract.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={(event) => handle(event, "recall")}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">ID партии (число)</span>
          <input
            className="input font-mono"
            value={blockchainBatchId}
            onChange={(event) => setBlockchainBatchId(event.target.value)}
            inputMode="numeric"
            pattern="\d+"
            autoComplete="off"
            placeholder="например: 1, 2, 17"
            required
          />
          <span className="mt-1 block text-xs text-slate-500">
            Числовой ID, который контракт выдал при <code>createBatch</code>.
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Причина отзыва</span>
          <textarea
            className="input min-h-24 break-words"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            required
          />
          <span className="mt-1 block text-xs text-slate-500">
            {reason.length} / 500 символов — сохраняется on-chain в событии BatchRecalled.
          </span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="button" disabled={loading || !batchIdValid || !reasonValid}>
            {loading ? "Операция..." : "Отозвать партию"}
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={loading || !batchIdValid || !reasonValid}
            onClick={(event) => handle(event, "unrecall")}
          >
            Снять отзыв
          </button>
        </div>
      </form>

      <div className="mt-4">
        <ResultMessage error={error} txHash={txHash} />
      </div>
    </section>
  );
}

function BlockProductPanel() {
  const [productId, setProductId] = useState("1");
  const [reason, setReason] = useState("Поступила жалоба на конкретную упаковку.");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const productIdValid = /^\d+$/.test(productId) && Number(productId) > 0;
  const reasonValid = reason.trim().length >= 5;

  async function handle(event: React.FormEvent, mode: "block" | "unblock") {
    event.preventDefault();
    if (!productIdValid) {
      setError("Blockchain product ID должен быть положительным числом, выданным контрактом при createProduct.");
      return;
    }
    if (!reasonValid) {
      setError("Причина должна быть не короче 5 символов.");
      return;
    }
    setLoading(true);
    setError("");
    setTxHash("");

    try {
      const hash = mode === "block"
        ? await blockProduct(productId, reason.trim())
        : await unblockProduct(productId, reason.trim());
      setTxHash(hash);
      await saveProductEvent({
        blockchainProductId: Number(productId),
        eventType: mode === "block" ? "PRODUCT_BLOCKED" : "PRODUCT_UNBLOCKED",
        transactionHash: hash
      }).catch(() => undefined);
    } catch (exception) {
      setError(humanizeError(
        exception,
        mode === "block"
          ? "Не удалось заблокировать упаковку."
          : "Не удалось снять блокировку."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="mb-4 flex items-center gap-3">
        <Lock className="text-amber-400" />
        <div>
          <h2 className="text-xl font-semibold">Блокировка отдельной упаковки</h2>
          <p className="text-sm text-slate-400">
            Точечная мера: блокирует одну конкретную упаковку, не трогая
            остальные продукты в партии.  Любые операции с этой упаковкой
            (передача, смена статуса) будут отклоняться контрактом до тех
            пор, пока регулятор не снимет блокировку.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={(event) => handle(event, "block")}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Blockchain product ID (число)</span>
          <input
            className="input font-mono"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            inputMode="numeric"
            pattern="\d+"
            autoComplete="off"
            placeholder="например: 1, 2, 17"
            required
          />
          <span className="mt-1 block text-xs text-slate-500">
            Числовой ID конкретной упаковки, который контракт вернул при{" "}
            <code>createProduct</code>.
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Причина</span>
          <textarea
            className="input min-h-24 break-words"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            required
          />
          <span className="mt-1 block text-xs text-slate-500">
            {reason.length} / 500 символов — сохраняется on-chain в событии ProductBlocked.
          </span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            className="button bg-amber-600 hover:bg-amber-500"
            disabled={loading || !productIdValid || !reasonValid}
          >
            <Lock size={14} className="mr-1 inline" />
            {loading ? "Операция..." : "Заблокировать упаковку"}
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={loading || !productIdValid || !reasonValid}
            onClick={(event) => handle(event, "unblock")}
          >
            <Unlock size={14} className="mr-1 inline" />
            Снять блокировку
          </button>
        </div>
      </form>

      <div className="mt-4">
        <ResultMessage error={error} txHash={txHash} />
      </div>
    </section>
  );
}
