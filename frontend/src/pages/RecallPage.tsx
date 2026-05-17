import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { ResultMessage } from "../components/ResultMessage";
import { saveProductEvent } from "../lib/api";
import { recallBatch, unrecallBatch } from "../lib/contract";
import { humanizeError } from "../lib/errors";

export default function RecallPage() {
  const [batchId, setBatchId] = useState("1");
  const [reason, setReason] = useState("Нарушение температурного режима при транспортировке");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const batchIdValid = /^\d+$/.test(batchId) && Number(batchId) > 0;
  const reasonValid = reason.trim().length >= 5;

  async function handleRecall(event: React.FormEvent, mode: "recall" | "unrecall") {
    event.preventDefault();
    if (!batchIdValid) {
      setError("ID партии должен быть положительным числом.");
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
          ? await recallBatch(batchId, reason.trim())
          : await unrecallBatch(batchId, reason.trim());
      setTxHash(hash);
      await saveProductEvent({
        blockchainProductId: Number(batchId),
        eventType: mode === "recall" ? "BATCH_RECALLED" : "BATCH_UNRECALLED",
        transactionHash: hash
      });
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
    <div className="panel max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <ShieldAlert className="text-red-600" />
        <div>
          <h2 className="text-xl font-semibold">Отзыв партии</h2>
          <p className="text-sm text-slate-400">Доступно только роли регулятора в smart contract.</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={(event) => handleRecall(event, "recall")}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">ID партии</span>
          <input
            className="input"
            value={batchId}
            onChange={(event) => setBatchId(event.target.value)}
            inputMode="numeric"
            pattern="\d+"
            autoComplete="off"
            required
          />
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
            {reason.length} / 500 символов
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
            onClick={(event) => handleRecall(event, "unrecall")}
          >
            Снять отзыв
          </button>
        </div>
      </form>

      <div className="mt-4">
        <ResultMessage error={error} txHash={txHash} />
      </div>
    </div>
  );
}
