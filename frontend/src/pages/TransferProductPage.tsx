import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { saveProductEvent } from "../lib/api";
import {
  getProduct, getProductIdBySerial, isValidAddress, transferProduct, updateStatus
} from "../lib/contract";
import { useWallet } from "../context/WalletContext";
import { humanizeError } from "../lib/errors";
import {
  isPositiveIntegerString, STATUS_LABELS_RU, validateStatusTransition
} from "../lib/validation";
import { ResultMessage } from "../components/ResultMessage";
import type { ExtendedProductStatus } from "../types/product";

const FORWARD_STATUSES: ExtendedProductStatus[] = [1, 2, 3];

export default function TransferProductPage() {
  const wallet = useWallet();
  const [productInput, setProductInput] = useState("1");
  const [resolvedProductId, setResolvedProductId] = useState("");
  const [resolveError, setResolveError] = useState("");
  const [resolving, setResolving] = useState(false);

  const [newOwner, setNewOwner] = useState("");
  const [status, setStatus] = useState<ExtendedProductStatus>(2);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Live snapshot of the product, used to drive the status form UX
  const [currentStatus, setCurrentStatus] = useState<ExtendedProductStatus | null>(null);
  const [currentOwner, setCurrentOwner] = useState<string>("");
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productError, setProductError] = useState("");

  const productIdValid = isPositiveIntegerString(resolvedProductId);
  const newOwnerValid = isValidAddress(newOwner);
  const transition = currentStatus != null
      ? validateStatusTransition(currentStatus, status)
      : { ok: true } as const;

  const ownerMismatch = Boolean(
    currentOwner && wallet.address &&
    currentOwner.toLowerCase() !== wallet.address.toLowerCase()
  );

  const resolveProductId = useCallback(async () => {
    const raw = productInput.trim();
    setResolveError("");
    if (!raw) {
      setResolvedProductId("");
      return;
    }
    if (/^\d+$/.test(raw)) {
      setResolvedProductId(raw);
      return;
    }
    setResolving(true);
    try {
      const id = await getProductIdBySerial(raw);
      const idStr = id.toString();
      if (!/^\d+$/.test(idStr) || idStr === "0") {
        setResolvedProductId("");
        setResolveError("Серийный номер не найден в смарт-контракте.");
        return;
      }
      setResolvedProductId(idStr);
    } catch (exception) {
      setResolvedProductId("");
      setResolveError(humanizeError(exception,
        "Не удалось найти продукт по серийному номеру."));
    } finally {
      setResolving(false);
    }
  }, [productInput]);

  useEffect(() => {
    const handle = setTimeout(() => { void resolveProductId(); }, 300);
    return () => clearTimeout(handle);
  }, [resolveProductId]);

  const loadCurrentProduct = useCallback(async () => {
    if (!isPositiveIntegerString(resolvedProductId)) {
      setCurrentStatus(null);
      setCurrentOwner("");
      setProductError("");
      return;
    }
    setLoadingProduct(true);
    setProductError("");
    try {
      const product = await getProduct(resolvedProductId);
      setCurrentStatus(Number(product.status) as ExtendedProductStatus);
      setCurrentOwner(String(product.currentOwner ?? ""));
    } catch (exception) {
      setCurrentStatus(null);
      setCurrentOwner("");
      setProductError(humanizeError(exception, "Не удалось загрузить продукт."));
    } finally {
      setLoadingProduct(false);
    }
  }, [resolvedProductId]);

  useEffect(() => { void loadCurrentProduct(); }, [loadCurrentProduct]);

  async function run(action: "transfer" | "status") {
    if (!productIdValid) {
      setError(
        "ID продукта не распознан. Введите числовой on-chain ID (1, 2, 3…) " +
        "или серийный номер вида SN-… — мы автоматически найдём его в контракте."
      );
      return;
    }
    if (ownerMismatch) {
      setError(
        `Текущий владелец продукта — ${currentOwner}. ` +
        `Сначала получите его передачей от этого адреса. ` +
        `Подключённый кошелёк: ${wallet.address || "не подключён"}.`
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
        ? await transferProduct(resolvedProductId, newOwner.trim())
        : await updateStatus(resolvedProductId, status);

      setTxHash(hash);
      await saveProductEvent({
        blockchainProductId: Number(resolvedProductId),
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
          В поле ниже можно ввести либо числовой on-chain ID,{" "}
          либо серийный номер с QR-кода (вида SN-…) — он будет автоматически
          разрешён в числовой ID.
        </p>
        <div className="mt-5 space-y-4">
          <ProductIdField
            value={productInput}
            onChange={setProductInput}
            resolving={resolving}
            resolved={resolvedProductId}
            error={resolveError}
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
            disabled={loading || !productIdValid || !newOwnerValid || ownerMismatch}
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
          <ProductIdField
            value={productInput}
            onChange={setProductInput}
            resolving={resolving}
            resolved={resolvedProductId}
            error={resolveError}
            help="Тот же ID, что и в форме передачи."
          />
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">
            {loadingProduct ? (
              <span className="inline-flex items-center gap-2 text-slate-400">
                <Loader2 className="animate-spin" size={14} /> Загрузка статуса…
              </span>
            ) : currentStatus != null ? (
              <div className="space-y-2">
                <div>
                  Текущий статус:{" "}
                  <span className="font-semibold text-emerald-300">
                    {STATUS_LABELS_RU[currentStatus]}
                  </span>
                </div>
                {currentOwner && (
                  <div className="text-xs text-slate-400">
                    Текущий владелец: <span className="break-all font-mono">{currentOwner}</span>
                  </div>
                )}
              </div>
            ) : productError ? (
              <span className="text-amber-300">{productError}</span>
            ) : (
              <span className="text-slate-500">Введите ID, чтобы увидеть текущий статус.</span>
            )}
          </div>

          {ownerMismatch && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-100">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
              <div className="min-w-0">
                <p className="font-semibold">Вы не текущий владелец этого продукта.</p>
                <p className="mt-1 break-words">
                  Контракт примет передачу/смену статуса только от владельца{" "}
                  <span className="break-all font-mono">{currentOwner}</span>.
                </p>
                <p className="mt-1 text-xs text-amber-200/80">
                  Подключённый кошелёк MetaMask: <span className="break-all font-mono">
                  {wallet.address || "не подключён"}</span>. Сначала получите продукт
                  передачей от текущего владельца — либо переключитесь на его аккаунт.
                </p>
              </div>
            </div>
          )}

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
              loading || !productIdValid || currentStatus == null || !transition.ok || ownerMismatch
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

function ProductIdField({
  value, onChange, resolving, resolved, error, help
}: {
  value: string;
  onChange: (value: string) => void;
  resolving: boolean;
  resolved: string;
  error: string;
  help?: string;
}) {
  const isSerial = value.trim() !== "" && !/^\d+$/.test(value.trim());
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        ID продукта (число) или серийный номер
      </span>
      <input
        className="input font-mono"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="1, 2, 17… либо SN-DEMO-001"
        autoComplete="off"
        spellCheck={false}
        required
      />
      <div className="mt-1 text-xs text-slate-500">
        {help ?? "Принимаем оба формата: числовой ID контракта и серийный номер с QR."}
      </div>
      {isSerial && (
        <div className="mt-1 text-xs">
          {resolving ? (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Loader2 className="animate-spin" size={12} />
              Поиск по серийному номеру…
            </span>
          ) : resolved ? (
            <span className="text-emerald-300">
              Найден on-chain ID: <span className="font-mono">{resolved}</span>
            </span>
          ) : error ? (
            <span className="text-red-400">{error}</span>
          ) : null}
        </div>
      )}
    </label>
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
