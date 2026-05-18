import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { saveProductEvent } from "../lib/api";
import { getProduct, isValidAddress, transferProduct, updateStatus } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import {
  isPositiveIntegerString, STATUS_LABELS_RU, validateStatusTransition
} from "../lib/validation";
import { ResultMessage } from "../components/ResultMessage";
import type { ExtendedProductStatus } from "../types/product";

const FORWARD_STATUSES: ExtendedProductStatus[] = [1, 2, 3];

/**
 * Two operations on one page because both target a numeric on-chain
 * product ID:
 *   * transferProduct — move ownership
 *   * updateStatus    — monotonic status machine
 *
 * For the status form we preload the product from the chain so we can
 * disable the current status option and any invalid forward transition —
 * the user never gets to send a tx that we already know will revert.
 */
export default function TransferProductPage() {
  const [blockchainProductId, setBlockchainProductId] = useState("1");
  const [newOwner, setNewOwner] = useState("");
  const [status, setStatus] = useState<ExtendedProductStatus>(2);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Live snapshot of the product, used to drive the status form UX
  const [currentStatus, setCurrentStatus] = useState<ExtendedProductStatus | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productError, setProductError] = useState("");

  const productIdValid = isPositiveIntegerString(blockchainProductId);
  const newOwnerValid = isValidAddress(newOwner);
  const transition = currentStatus != null
      ? validateStatusTransition(currentStatus, status)
      : { ok: true } as const;

  const loadCurrentProduct = useCallback(async () => {
    if (!isPositiveIntegerString(blockchainProductId)) {
      setCurrentStatus(null);
      setProductError("");
      return;
    }
    setLoadingProduct(true);
    setProductError("");
    try {
      const product = await getProduct(blockchainProductId);
      setCurrentStatus(Number(product.status) as ExtendedProductStatus);
    } catch (exception) {
      setCurrentStatus(null);
      setProductError(humanizeError(exception, "Не удалось загрузить продукт."));
    } finally {
      setLoadingProduct(false);
    }
  }, [blockchainProductId]);

  useEffect(() => { void loadCurrentProduct(); }, [loadCurrentProduct]);

  async function run(action: "transfer" | "status") {
    if (!productIdValid) {
      setError(
        "Blockchain product ID должен быть положительным числом. " +
        "Серийный номер (SN-…) вводите на странице «Проверка», не здесь."
      );
      return;
    }
    if (action === "transfer" && !newOwnerValid) {
      setError("Адрес нового владельца должен начинаться с 0x и содержать 40 hex-символов.");
      return;
    }
    if (action === "status") {
      if (currentStatus == null) {
        setError("Дождитесь, пока загрузится текущий статус продукта, и повторите.");
        return;
      }
      if (!transition.ok) {
        setError(transition.reason);
        return;
      }
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
      }).catch(() => undefined);
      // Refresh status snapshot so the UI reflects the new value
      if (action === "status") {
        setCurrentStatus(status);
      } else {
        void loadCurrentProduct();
      }
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось выполнить операцию."));
    } finally {
      setLoading(false);
    }
  }

  const statusOptionDisabled = (option: ExtendedProductStatus): { disabled: boolean; reason: string } => {
    if (currentStatus == null) return { disabled: false, reason: "" };
    const check = validateStatusTransition(currentStatus, option);
    return { disabled: !check.ok, reason: check.ok ? "" : check.reason };
  };

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
            type="button"
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
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">
            {loadingProduct ? (
              <span className="inline-flex items-center gap-2 text-slate-400">
                <Loader2 className="animate-spin" size={14} /> Загрузка статуса…
              </span>
            ) : currentStatus != null ? (
              <span>
                Текущий статус:{" "}
                <span className="font-semibold text-emerald-300">
                  {STATUS_LABELS_RU[currentStatus]}
                </span>
              </span>
            ) : productError ? (
              <span className="text-amber-300">{productError}</span>
            ) : (
              <span className="text-slate-500">Введите ID, чтобы увидеть текущий статус.</span>
            )}
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Новый статус</span>
            <select
              className="input"
              value={status}
              onChange={(event) => setStatus(Number(event.target.value) as ExtendedProductStatus)}
            >
              {FORWARD_STATUSES.map((option) => {
                const info = statusOptionDisabled(option);
                return (
                  <option
                    key={option}
                    value={option}
                    disabled={info.disabled}
                    title={info.reason}
                  >
                    {STATUS_LABELS_RU[option]}{info.disabled ? " — недоступно" : ""}
                  </option>
                );
              })}
            </select>
            {!transition.ok && (
              <span className="mt-1 block text-xs text-amber-400">{transition.reason}</span>
            )}
          </label>
          <button
            type="button"
            className="button"
            disabled={
              loading || !productIdValid || currentStatus == null || !transition.ok
            }
            onClick={() => run("status")}
          >
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
