import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, Hash, Loader2, RefreshCw, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { saveBatchMetadata, saveMetadata, saveProductEvent } from "../lib/api";
import {
  createBatch, createProduct, keccakOfFile, metadataHash, temperatureHash
} from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { buildVerifyUrl } from "../lib/qr";
import { toUnixDate } from "../lib/status";
import { ResultMessage } from "../components/ResultMessage";

type SaveStatus =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success" }
  | { kind: "error"; message: string };

interface FileHash {
  name: string;
  size: number;
  hash: string;
}

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

  // Status — on-chain
  const [batchTxHash, setBatchTxHash] = useState("");
  const [productTxHash, setProductTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Status — off-chain (separate so the user sees BOTH outcomes)
  const [batchOffChain, setBatchOffChain] = useState<SaveStatus>({ kind: "idle" });
  const [productOffChain, setProductOffChain] = useState<SaveStatus>({ kind: "idle" });

  const [temperatureFile, setTemperatureFile] = useState<FileHash | null>(null);
  const [certificateFile, setCertificateFile] = useState<FileHash | null>(null);

  // Derived: the hashes that will actually be sent to the contract.
  const effectiveTemperatureHash = temperatureFile?.hash ?? temperatureHash(temperatureLog);
  const effectiveMetadataHash    = certificateFile?.hash ?? metadataHash(`${batchNumber}; ${description}`);

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

  async function persistBatchOffChain(onChainBatchId: string) {
    setBatchOffChain({ kind: "pending" });
    try {
      await saveBatchMetadata({
        blockchainBatchId: Number(onChainBatchId),
        batchNumber: batchNumber.trim(),
        manufacturerName: "MetaMask manufacturer",
        productionDate,
        expirationDate,
        metadataHash: effectiveMetadataHash,
        temperatureHash: effectiveTemperatureHash
      });
      setBatchOffChain({ kind: "success" });
    } catch (metaException) {
      setBatchOffChain({
        kind: "error",
        message: humanizeError(metaException, "Backend не принял метаданные партии.")
      });
    }
  }

  async function persistProductOffChain(onChainProductId: string, txHash: string) {
    setProductOffChain({ kind: "pending" });
    try {
      await saveMetadata({
        blockchainProductId: Number(onChainProductId),
        batchNumber: batchNumber.trim(),
        expirationDate,
        description: `${description} Serial: ${serialNumber.trim()}`
      });
      await saveProductEvent({
        blockchainProductId: Number(onChainProductId),
        eventType: "PRODUCT_CREATED",
        transactionHash: txHash
      });
      setProductOffChain({ kind: "success" });
    } catch (metaException) {
      setProductOffChain({
        kind: "error",
        message: humanizeError(metaException, "Backend не принял метаданные продукта.")
      });
    }
  }

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
    setBatchOffChain({ kind: "idle" });

    try {
      const result = await createBatch(
        toUnixDate(productionDate),
        toUnixDate(expirationDate),
        temperatureFile ? `__filehash__:${effectiveTemperatureHash}` : temperatureLog,
        certificateFile ? `__filehash__:${effectiveMetadataHash}`    : `${batchNumber}; ${description}`,
        { temperatureHashOverride: temperatureFile?.hash, metadataHashOverride: certificateFile?.hash }
      );
      setBatchId(result.batchId);
      setBatchTxHash(result.txHash);
      if (result.batchId) {
        // Best-effort, but status is now SURFACED to the user.
        void persistBatchOffChain(result.batchId);
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
    setProductOffChain({ kind: "idle" });

    try {
      const result = await createProduct(batchId, name.trim(), serialNumber.trim());
      setProductTxHash(result.txHash);
      setProductId(result.productId);

      if (result.productId) {
        void persistProductOffChain(result.productId, result.txHash);
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
          label="Температурный журнал (текст)"
          value={temperatureLog}
          onChange={setTemperatureLog}
          help="Хешируется через ethers.id(...) и сохраняется on-chain. Сам журнал хранится off-chain."
        />
        <FileHashField
          label="… или загрузите файл температурного журнала"
          file={temperatureFile}
          onChange={setTemperatureFile}
          accept=".csv,.txt,.pdf,.json,.log"
          helpWhenEmpty="Если файл задан, он перебивает текстовое поле сверху и keccak256 будет считаться от его байтов."
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
        <FileHashField
          label="Сертификат соответствия (файл) — перекроет метаданные"
          file={certificateFile}
          onChange={setCertificateFile}
          accept=".pdf,.p7s,.sig,.zip,.xml"
          helpWhenEmpty="Если приложить файл, on-chain metadataHash будет считаться от его байтов."
        />

        <HashSummary
          temperatureHash={effectiveTemperatureHash}
          metadataHash={effectiveMetadataHash}
          fromFile={Boolean(temperatureFile || certificateFile)}
        />
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
              Партия создана on-chain. ID:{" "}
              <span className="font-mono font-semibold text-emerald-300">{batchId}</span>
            </span>
          </div>
        )}
        {batchTxHash && (
          <div className="mt-2">
            <ResultMessage txHash={batchTxHash} />
          </div>
        )}
        {batchId && (
          <OffChainStatusPanel
            status={batchOffChain}
            label="Сохранение метаданных партии в backend"
            onRetry={() => void persistBatchOffChain(batchId)}
          />
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

        {productId && (
          <OffChainStatusPanel
            status={productOffChain}
            label="Сохранение метаданных продукта в backend"
            onRetry={() => void persistProductOffChain(productId, productTxHash)}
          />
        )}
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

function OffChainStatusPanel({
  status, label, onRetry
}: {
  status: SaveStatus;
  label: string;
  onRetry: () => void;
}) {
  if (status.kind === "idle") return null;
  if (status.kind === "pending") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-950/30 p-2 text-sm text-sky-200">
        <Loader2 className="animate-spin" size={16} /> {label}…
      </div>
    );
  }
  if (status.kind === "success") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2 text-sm text-emerald-200">
        <CheckCircle2 size={16} /> {label}: успешно.
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 text-sm">
      <div className="flex items-start gap-2 text-amber-200">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">On-chain транзакция прошла, но backend не сохранил метаданные.</p>
          <p className="mt-1 break-words text-amber-100/90">{status.message}</p>
          <p className="mt-1 text-xs text-amber-300/80">
            Продукт уже существует в смарт-контракте, но в кабинетах он может не появиться,
            пока индексатор не догонит событие или вы не нажмёте «Повторить сохранение».
          </p>
        </div>
      </div>
      <button type="button" className="button-secondary inline-flex items-center gap-2" onClick={onRetry}>
        <RefreshCw size={14} /> Повторить сохранение метаданных
      </button>
    </div>
  );
}

function ProductQrPanel({ productId, serialNumber }: { productId: string; serialNumber: string }) {
  const qrUrl = useMemo(
    () => buildVerifyUrl(undefined, serialNumber),
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

function FileHashField({
  label, file, onChange, accept, helpWhenEmpty
}: {
  label: string;
  file: FileHash | null;
  onChange: (file: FileHash | null) => void;
  accept?: string;
  helpWhenEmpty?: string;
}) {
  const [hashing, setHashing] = useState(false);
  const [hashError, setHashError] = useState("");

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    setHashError("");
    const f = event.target.files?.[0];
    if (!f) {
      onChange(null);
      return;
    }
    setHashing(true);
    try {
      const hash = await keccakOfFile(f);
      onChange({ name: f.name, size: f.size, hash });
    } catch (exception) {
      onChange(null);
      setHashError((exception as Error).message ?? "Не удалось хешировать файл.");
    } finally {
      setHashing(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-slate-950/30 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <FileUp size={14} className="text-slate-400" />
        {label}
      </div>
      <input
        type="file"
        accept={accept}
        onChange={handlePick}
        className="block w-full text-sm text-slate-300
                   file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600
                   file:px-3 file:py-1 file:text-sm file:font-semibold file:text-white
                   hover:file:bg-emerald-500"
      />
      {hashing && (
        <div className="inline-flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="animate-spin" size={12} /> Считаем keccak256…
        </div>
      )}
      {hashError && (
        <div className="text-xs text-red-400">{hashError}</div>
      )}
      {file && (
        <div className="space-y-1 rounded-md border border-emerald-500/30 bg-emerald-950/30 p-2 text-xs">
          <div className="flex items-center justify-between gap-2 text-emerald-200">
            <span className="min-w-0 truncate">
              {file.name} <span className="text-emerald-400/80">({(file.size / 1024).toFixed(1)} КиБ)</span>
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-white/20 px-2 py-0.5 text-slate-300 hover:bg-white/5"
              onClick={() => onChange(null)}
            >
              <X size={10} /> убрать
            </button>
          </div>
          <div className="break-all font-mono text-[11px] text-emerald-100">
            {file.hash}
          </div>
        </div>
      )}
      {!file && helpWhenEmpty && (
        <div className="text-xs text-slate-500">{helpWhenEmpty}</div>
      )}
    </div>
  );
}

function HashSummary({
  temperatureHash, metadataHash, fromFile
}: {
  temperatureHash: string;
  metadataHash: string;
  fromFile: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-xs">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
        <Hash size={14} className="text-slate-400" />
        Хеши, которые попадут в on-chain транзакцию
        {fromFile && (
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
            из файла
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div>
          <div className="text-slate-400">temperatureHash</div>
          <div className="break-all font-mono text-[11px] text-slate-200">{temperatureHash}</div>
        </div>
        <div>
          <div className="text-slate-400">metadataHash</div>
          <div className="break-all font-mono text-[11px] text-slate-200">{metadataHash}</div>
        </div>
      </div>
      <p className="mt-2 leading-snug text-slate-500">
        Контракт сохраняет только эти 32-байтовые значения. Сами файлы / тексты
        остаются у вас — потребитель сможет сверить хеш позже, скачав документ
        по тому же серийному номеру.
      </p>
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

