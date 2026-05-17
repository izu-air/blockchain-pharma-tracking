import { useMemo, useState } from "react";
import { CheckCircle2, Hash } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { saveBatchMetadata, saveMetadata, saveProductEvent } from "../lib/api";
import { createBatch, createProduct, metadataHash, temperatureHash } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { buildVerifyUrl } from "../lib/qr";
import { toUnixDate } from "../lib/status";
import { ResultMessage } from "../components/ResultMessage";

/**
 * Two-step product registration:
 *   1) Create on-chain batch  -> contract returns a numeric `batchId` (uint256)
 *   2) Create product inside that batch with a user-defined serial number
 *
 * The component intentionally keeps `batchNumber` (free-form business label
 * such as "BATCH-2026-001") separate from `batchId` (numeric on-chain id).
 * `batchId` is filled automatically after step 1 and is read-only by default
 * — manual override is gated behind an explicit toggle and validated.
 */
export default function RegisterProductPage() {
  // Step 1 — batch
  const [batchNumber, setBatchNumber] = useState("BATCH-2026-001");
  const [productionDate, setProductionDate] = useState("2026-05-07");
  const [expirationDate, setExpirationDate] = useState("2027-12-31");
  const [temperatureLog, setTemperatureLog] = useState("2-8C, отклонений не обнаружено");
  const [description, setDescription] = useState("Демонстрационная партия лекарственного препарата.");

  // Step 2 — product (in the batch)
  const [batchId, setBatchId] = useState("");
  const [name, setName] = useState("Парацетамол 500 мг");
  const [serialNumber, setSerialNumber] = useState("SN-DEMO-001");
  const [manualBatchId, setManualBatchId] = useState(false);
  const [productId, setProductId] = useState("");

  // Status
  const [batchTxHash, setBatchTxHash] = useState("");
  const [productTxHash, setProductTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Client-side validation -----------------------------------------------
  const batchIdValid = /^\d+$/.test(batchId) && Number(batchId) > 0;
  const serialValid = /^[A-Za-z0-9._:-]{3,64}$/.test(serialNumber);
  const nameValid = name.trim().length >= 2 && name.trim().length <= 200;
  const batchNumberValid = batchNumber.trim().length >= 2 && batchNumber.trim().length <= 100;
  const datesValid = Boolean(productionDate && expirationDate
      && new Date(expirationDate) > new Date(productionDate)
      && new Date(expirationDate) > new Date());

  const canCreateBatch  = !loading && batchNumberValid && datesValid && temperatureLog.trim().length > 0;
  const canCreateProduct = !loading && batchIdValid && serialValid && nameValid;

  async function handleCreateBatch() {
    setError("");
    if (!batchNumberValid) {
      setError("Номер партии должен быть от 2 до 100 символов.");
      return;
    }
    if (!datesValid) {
      setError("Срок годности должен быть позже даты производства и в будущем.");
      return;
    }
    setLoading(true);
    setBatchTxHash("");

    try {
      const result = await createBatch(
        toUnixDate(productionDate),
        toUnixDate(expirationDate),
        temperatureLog,
        `${batchNumber}; ${description}`
      );
      setBatchId(result.batchId);
      setBatchTxHash(result.txHash);
      // Off-chain metadata best-effort.  Failure here doesn't undo the on-chain batch.
      if (result.batchId) {
        try {
          await saveBatchMetadata({
            blockchainBatchId: Number(result.batchId),
            batchNumber: batchNumber.trim(),
            manufacturerName: "MetaMask manufacturer",
            productionDate,
            expirationDate,
            metadataHash: metadataHash(`${batchNumber}; ${description}`),
            temperatureHash: temperatureHash(temperatureLog)
          });
        } catch (metaException) {
          // Surface but don't block the main flow.
          console.warn("saveBatchMetadata failed:", metaException);
        }
      }
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось создать партию."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!batchIdValid) {
      setError("ID партии (числовой) должен быть положительным числом. Сначала создайте партию на шаге 1.");
      return;
    }
    if (!nameValid) {
      setError("Название препарата должно быть от 2 до 200 символов.");
      return;
    }
    if (!serialValid) {
      setError("Серийный номер: 3–64 символа, только A-Z, a-z, 0-9, точка, двоеточие, дефис, подчёркивание.");
      return;
    }
    setLoading(true);
    setProductTxHash("");
    setProductId("");

    try {
      const result = await createProduct(batchId, name.trim(), serialNumber.trim());
      setProductTxHash(result.txHash);
      setProductId(result.productId);

      if (result.productId) {
        try {
          await saveMetadata({
            blockchainProductId: Number(result.productId),
            batchNumber: batchNumber.trim(),
            expirationDate,
            description: `${description} Serial: ${serialNumber.trim()}`
          });
          await saveProductEvent({
            blockchainProductId: Number(result.productId),
            eventType: "PRODUCT_CREATED",
            transactionHash: result.txHash
          });
        } catch (metaException) {
          console.warn("post-create off-chain save failed:", metaException);
        }
      }
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось зарегистрировать продукт."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel max-w-3xl">
      <h2 className="text-xl font-semibold">Регистрация продукта</h2>
      <p className="mt-1 text-sm text-slate-400">
        Двухшаговый процесс: сначала создаётся партия на блокчейне (она получает числовой
        on-chain ID), затем продукт добавляется в эту партию.
      </p>

      {/* Step 1 — Batch ------------------------------------------------ */}
      <div className="mt-5 space-y-4 rounded-xl border border-white/10 bg-slate-950/50 p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">1</span>
          <h3 className="font-semibold">Создание партии</h3>
        </div>
        <Field
          label="Номер партии (бизнес-метка, не on-chain ID)"
          value={batchNumber}
          onChange={setBatchNumber}
          help="Свободная строка, попадает в метаданные и QR. Например: BATCH-2026-001"
          maxLength={100}
        />
        <Field
          label="Дата производства"
          value={productionDate}
          onChange={setProductionDate}
          type="date"
        />
        <Field
          label="Срок годности"
          value={expirationDate}
          onChange={setExpirationDate}
          type="date"
        />
        <Field
          label="Температурный журнал"
          value={temperatureLog}
          onChange={setTemperatureLog}
          help="Хешируется и сохраняется on-chain. Сам журнал хранится off-chain."
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Описание</span>
          <textarea
            className="input min-h-24 break-words"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
          />
        </label>
        <button
          type="button"
          className="button-secondary"
          disabled={!canCreateBatch}
          onClick={handleCreateBatch}
        >
          {loading ? "Создание…" : batchId ? "Создать ещё одну партию" : "Создать партию"}
        </button>

        {batchId && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2 text-sm">
            <CheckCircle2 className="shrink-0 text-emerald-400" size={18} />
            <span className="text-slate-200">
              Партия создана. On-chain ID:{" "}
              <span className="font-mono font-semibold text-emerald-300">{batchId}</span>
            </span>
          </div>
        )}
        {batchTxHash && (
          <div className="mt-2">
            <ResultMessage txHash={batchTxHash} />
          </div>
        )}
      </div>

      {/* Step 2 — Product ---------------------------------------------- */}
      <form className="mt-5 space-y-4 rounded-xl border border-white/10 bg-slate-950/50 p-4" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">2</span>
          <h3 className="font-semibold">Создание продукта в партии</h3>
        </div>

        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-sm font-medium">
            <Hash size={14} className="text-slate-400" />
            ID партии (on-chain, числовой)
          </span>
          <input
            className="input font-mono"
            value={batchId}
            onChange={(event) => setBatchId(event.target.value)}
            placeholder="заполнится автоматически после шага 1"
            readOnly={!manualBatchId}
            inputMode="numeric"
            pattern="\d+"
            maxLength={20}
            autoComplete="off"
            required
          />
          <span className="mt-1 block text-xs text-slate-500">
            Это <em>не</em> номер партии — это числовой идентификатор, который вернул
            контракт после createBatch.{" "}
            <button
              type="button"
              className="text-emerald-300 underline-offset-2 hover:underline"
              onClick={() => setManualBatchId((value) => !value)}
            >
              {manualBatchId ? "вернуть автозаполнение" : "ввести вручную"}
            </button>
          </span>
          {batchId && !batchIdValid && (
            <span className="mt-1 block text-xs text-red-400">
              Значение должно быть положительным числом (как «1», «2», «3»…).
            </span>
          )}
        </label>

        <Field
          label="Название препарата"
          value={name}
          onChange={setName}
          maxLength={200}
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Серийный номер</span>
          <input
            className="input font-mono"
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
            placeholder="SN-DEMO-001"
            pattern="[A-Za-z0-9._:\-]{3,64}"
            maxLength={64}
            autoComplete="off"
            spellCheck={false}
            required
          />
          <span className="mt-1 block text-xs text-slate-500">
            3–64 символа, латиница / цифры / <code>. : - _</code>. Будет уникальным ключом
            для QR и поиска.
          </span>
          {serialNumber && !serialValid && (
            <span className="mt-1 block text-xs text-red-400">
              Допустимы только латинские буквы, цифры и символы <code>. : - _</code>.
            </span>
          )}
        </label>

        <button className="button" type="submit" disabled={!canCreateProduct}>
          {loading ? "Отправка…" : "Создать продукт"}
        </button>
      </form>

      {productId && (
        <ProductQrPanel productId={productId} serialNumber={serialNumber.trim()} />
      )}

      <div className="mt-4">
        <ResultMessage error={error} txHash={productTxHash} />
      </div>
    </div>
  );
}

/**
 * Render блок с QR + копируемый URL.  URL вычисляется один раз через useMemo,
 * чтобы nonce/timestamp оставались стабильными в рамках одной регистрации
 * (иначе QR обновлялся бы при каждом ре-рендере, и его нельзя было бы
 * распечатать).
 */
function ProductQrPanel({ productId, serialNumber }: { productId: string; serialNumber: string }) {
  const qrUrl = useMemo(
    () => buildVerifyUrl(window.location.origin, serialNumber),
    [serialNumber]
  );
  return (
    <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
      <p className="text-sm text-slate-300">
        Создан продукт. On-chain ID:{" "}
        <span className="font-mono font-semibold text-emerald-300">{productId}</span>
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Серийный номер: <span className="break-all font-mono">{serialNumber}</span>
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="w-fit rounded-xl border border-white/10 bg-slate-950/60 p-4">
          <QRCodeSVG value={qrUrl} size={180} level="M" />
          <p className="mt-2 max-w-[180px] text-center text-xs text-slate-400">
            QR-код для верификации потребителем
          </p>
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-xs text-slate-400">
          <p>URL внутри QR:</p>
          <code className="block max-h-32 overflow-auto break-all rounded-lg border border-white/10 bg-slate-950/70 p-2 font-mono text-[11px] text-slate-300">
            {qrUrl}
          </code>
          <p className="leading-relaxed text-slate-500">
            QR содержит ссылку на /verify с серийным номером, nonce и timestamp.
            Реальная подлинность всегда проверяется по on-chain записи —
            подделать QR можно, но смарт-контракт вернёт «не существует».
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", help, maxLength
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  help?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        required
      />
      {help && <span className="mt-1 block text-xs text-slate-500">{help}</span>}
    </label>
  );
}
