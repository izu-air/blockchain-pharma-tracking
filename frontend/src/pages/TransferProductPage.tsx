import { useState } from "react";
import { saveProductEvent } from "../lib/api";
import { isValidAddress, transferProduct, updateStatus } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { ResultMessage } from "../components/ResultMessage";
import type { ExtendedProductStatus } from "../types/product";

/**
 * Two operations are intentionally on the same page because both target a
 * single product by its blockchain product ID:
 *
 *   * `transferProduct` — move ownership to another supply-chain wallet
 *   * `updateStatus`    — change lifecycle state (InTransit → Delivered → Sold)
 *
 * Reuses the same numeric on-chain product ID field; never asks the user
 * for a DB primary key or a human-readable serial number.
 */
export default function TransferProductPage() {
  const [blockchainProductId, setBlockchainProductId] = useState("1");
  const [newOwner, setNewOwner] = useState("");
  const [status, setStatus] = useState<ExtendedProductStatus>(2);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const productIdValid =
      /^\d+$/.test(blockchainProductId) && Number(blockchainProductId) > 0;
  const newOwnerValid = isValidAddress(newOwner);

  async function run(action: "transfer" | "status") {
    if (!productIdValid) {
      setError(
        "Blockchain product ID должен быть положительным числом. " +
        "Серийный номер (SN-…) и название препарата нужно вводить на странице верификации, не здесь."
      );
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
        ? await transferProduct(blockchainProductId, newOwner.trim())
        : await updateStatus(blockchainProductId, status);

      setTxHash(hash);
      await saveProductEvent({
        blockchainProductId: Number(blockchainProductId),
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
        <p className="mt-1 text-sm text-slate-400">
          Передаёт владение существующим продуктом другому участнику цепочки.
          ID продукта — числовой on-chain идентификатор, выданный смарт-контрактом
          при <code>createProduct</code>.
        </p>
        <div className="mt-5 space-y-4">
          <Field
            label="Blockchain product ID (число)"
            help="Числовой ID, например 1, 2, 17. Не путать с серийным номером SN-… (это строка на упаковке)."
            value={blockchainProductId}
            onChange={setBlockchainProductId}
            inputMode="numeric"
            pattern="\d+"
          />
          <Field
            label="Адрес нового владельца"
            help="Ethereum-адрес (0x + 40 hex), зарегистрированный как производитель, дистрибьютор или аптека."
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
        <p className="mt-1 text-sm text-slate-400">
          Меняет статус продукта в его жизненном цикле.  Допустимая
          последовательность: Произведён → В пути → Доставлен → Продан.
        </p>
        <div className="mt-5 space-y-4">
          <Field
            label="Blockchain product ID (число)"
            help="Тот же числовой ID, что и в форме передачи."
            value={blockchainProductId}
            onChange={setBlockchainProductId}
            inputMode="numeric"
            pattern="\d+"
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Новый статус</span>
            <select
              className="input"
              value={status}
              onChange={(event) => setStatus(Number(event.target.value) as ExtendedProductStatus)}
            >
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

function Field({
  label, value, onChange, placeholder, pattern, maxLength, inputMode, help
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  pattern?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  help?: string;
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
      {help && <span className="mt-1 block text-xs text-slate-500">{help}</span>}
    </label>
  );
}
