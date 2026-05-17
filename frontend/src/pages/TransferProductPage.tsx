import { useState } from "react";
import { saveProductEvent } from "../lib/api";
import { isValidAddress, transferProduct, updateStatus } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { ResultMessage } from "../components/ResultMessage";
import type { ExtendedProductStatus } from "../types/product";

export default function TransferProductPage() {
  const [productId, setProductId] = useState("1");
  const [newOwner, setNewOwner] = useState("");
  const [status, setStatus] = useState<ExtendedProductStatus>(2);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const productIdValid = /^\d+$/.test(productId) && Number(productId) > 0;
  const newOwnerValid = isValidAddress(newOwner);

  async function run(action: "transfer" | "status") {
    if (!productIdValid) {
      setError("ID продукта должен быть положительным числом.");
      return;
    }
    if (action === "transfer" && !newOwnerValid) {
      setError("Адрес нового владельца должен начинаться с 0x и содержать 40 hex-символов.");
      return;
    }
    setLoading(true);
    setError("");
    setTxHash("");

    try {
      const hash = action === "transfer"
        ? await transferProduct(productId, newOwner.trim())
        : await updateStatus(productId, status);

      setTxHash(hash);
      await saveProductEvent({
        blockchainProductId: Number(productId),
        eventType: action === "transfer" ? "PRODUCT_TRANSFERRED" : "STATUS_UPDATED",
        transactionHash: hash
      });
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось выполнить операцию."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel">
        <h2 className="text-xl font-semibold">Передача продукта</h2>
        <div className="mt-5 space-y-4">
          <Field label="ID продукта" value={productId} onChange={setProductId} inputMode="numeric" pattern="\d+" />
          <Field
            label="Адрес нового владельца"
            value={newOwner}
            onChange={setNewOwner}
            placeholder="0x..."
            pattern="0x[0-9a-fA-F]{40}"
            maxLength={42}
          />
          {newOwner && !newOwnerValid && (
            <p className="text-xs text-red-400">
              Адрес должен начинаться с 0x и содержать ровно 40 hex-символов.
            </p>
          )}
          <button
            className="button"
            disabled={loading || !productIdValid || !newOwnerValid}
            onClick={() => run("transfer")}
          >
            Передать владельцу
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">Обновление статуса</h2>
        <div className="mt-5 space-y-4">
          <Field label="ID продукта" value={productId} onChange={setProductId} inputMode="numeric" pattern="\d+" />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Новый статус</span>
            <select className="input" value={status} onChange={(event) => setStatus(Number(event.target.value) as ExtendedProductStatus)}>
              <option value={1}>В пути</option>
              <option value={2}>Доставлен</option>
              <option value={3}>Продан</option>
            </select>
          </label>
          <button className="button" disabled={loading || !productIdValid} onClick={() => run("status")}>
            Обновить статус
          </button>
        </div>
      </section>

      <div className="lg:col-span-2">
        <ResultMessage error={error} txHash={txHash} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, pattern, maxLength, inputMode }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  pattern?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        className="input"
        value={value}
        placeholder={placeholder}
        pattern={pattern}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}
