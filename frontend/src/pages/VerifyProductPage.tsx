import { Camera, CheckCircle2, Search, XCircle } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { getMetadata } from "../lib/api";
import { getBatch, getProduct, getProductBySerial, verifyProduct, verifyProductBySerial } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { buildVerifyUrl, isQrTimestampStale, parseScan, type ScanPayload } from "../lib/qr";
import { formatAddress, formatBlockchainDate, statusLabels } from "../lib/status";
import type { Product, ProductBatch, ProductMetadata, VerificationResult } from "../types/product";

// QR-сканер тянет html5-qrcode (~250 KB) — грузим только при первом клике.
const QrScanner = lazy(() => import("../components/QrScanner").then(m => ({ default: m.QrScanner })));

export default function VerifyProductPage() {
  const [params, setParams] = useSearchParams();
  const serialFromUrl = params.get("serial")?.trim() ?? "";

  const [productId, setProductId] = useState("1");
  const [serialNumber, setSerialNumber] = useState(serialFromUrl);
  const [product, setProduct] = useState<Product | null>(null);
  const [batch, setBatch] = useState<ProductBatch | null>(null);
  const [metadata, setMetadata] = useState<ProductMetadata | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMeta, setScanMeta] = useState<ScanPayload | null>(null);

  const runVerify = useCallback(async (serial: string, explicitProductId: string | null) => {
    const trimmedSerial = serial.trim();
    const trimmedId = (explicitProductId ?? productId).trim();
    if (!trimmedSerial && !trimmedId) {
      setError("Введите серийный номер или ID продукта.");
      return;
    }
    if (!trimmedSerial && !/^\d+$/.test(trimmedId)) {
      setError("ID продукта должен быть числом.");
      return;
    }

    setLoading(true);
    setError("");
    setVerified(null);
    setProduct(null);
    setBatch(null);
    setMetadata(null);
    setVerification(null);

    try {
      const loadedProduct = trimmedSerial
        ? await getProductBySerial(trimmedSerial)
        : await getProduct(trimmedId);
      const [loadedMetadata, loadedVerification, loadedBatch] = await Promise.all([
        getMetadata(loadedProduct.id.toString()).catch(() => null),
        trimmedSerial ? verifyProductBySerial(trimmedSerial) : verifyProduct(trimmedId),
        getBatch(loadedProduct.batchId.toString())
      ]);
      setProduct(loadedProduct);
      setBatch(loadedBatch);
      setMetadata(loadedMetadata);
      setVerification(loadedVerification);
      setVerified(loadedVerification.authentic);
    } catch (exception) {
      setVerified(false);
      setError(humanizeError(exception, "Продукт не найден в реестре."));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (serialFromUrl) {
      setSerialNumber(serialFromUrl);
      void runVerify(serialFromUrl, null);
    }
    // intentionally exhaustive deps — runVerify is stable for serialFromUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialFromUrl]);

  const handleScanResult = useCallback((raw: string) => {
    setScannerOpen(false);
    const parsed = parseScan(raw);
    if (!parsed) {
      setError("QR-код распознан, но в нём нет валидного серийного номера.");
      return;
    }
    setScanMeta(parsed);
    setSerialNumber(parsed.serial);
    setProductId("");
    setParams({ serial: parsed.serial }, { replace: true });
    void runVerify(parsed.serial, null);
  }, [runVerify, setParams]);

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Consumer verification</p>
        <h2 className="mt-2 text-2xl font-semibold">Проверка подлинности</h2>
        <p className="mt-1 text-sm text-slate-400">
          Сканируйте QR-код с упаковки или введите серийный номер вручную.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <input
            className="input min-w-0 font-mono"
            aria-label="Серийный номер с упаковки"
            placeholder="Серийный номер с упаковки (SN-DEMO-001)"
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void runVerify(serialNumber, null);
              }
            }}
            autoComplete="off"
            spellCheck={false}
            maxLength={128}
          />
          <input
            className="input min-w-0 font-mono"
            aria-label="Blockchain product ID (число)"
            placeholder="или Blockchain product ID (1, 2, 17 …)"
            value={productId}
            inputMode="numeric"
            pattern="\d+"
            onChange={(event) => setProductId(event.target.value)}
            autoComplete="off"
            maxLength={20}
          />
          <button
            type="button"
            className="button-secondary"
            onClick={() => setScannerOpen(true)}
            title="Сканировать QR с камеры"
          >
            <Camera size={18} />
            <span className="hidden sm:inline">QR</span>
          </button>
          <button
            type="button"
            className="button"
            onClick={() => runVerify(serialNumber, null)}
            disabled={loading}
          >
            <Search size={18} />
            <span className="hidden sm:inline">{loading ? "Проверка…" : "Проверить"}</span>
          </button>
        </div>
      </section>

      {error && verified === null && (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
          <p className="break-words leading-snug">{error}</p>
        </div>
      )}

      {verified !== null && (
        <section className={`panel flex items-start gap-3 ${verified ? "border-emerald-500/40" : "border-red-500/40"}`}>
          {verified
            ? <CheckCircle2 className="shrink-0 text-emerald-400" size={28} />
            : <XCircle      className="shrink-0 text-red-400"     size={28} />}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">
              {verified ? "Подлинность подтверждена" : "Подлинность не подтверждена"}
            </h3>
            <p className="mt-1 break-words text-sm text-slate-300">
              {verified
                ? "Продукт найден в смарт-контракте. Ниже — детали и история движения."
                : error || "Запись о продукте отсутствует в реестре."}
            </p>
          </div>
        </section>
      )}

      {verification && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Владелец"   value={formatAddress(verification.currentOwner)} />
          <Info label="Статус"     value={statusLabels[verification.status]} />
          <Info label="Отозван"    value={verification.recalled ? "Да" : "Нет"} />
          <Info label="Годен до"   value={formatBlockchainDate(verification.expirationDate)} />
        </section>
      )}

      {product && (
        <div className="flex flex-wrap gap-3">
          <Link className="button-secondary" to={`/products/${product.id.toString()}`}>
            Открыть полную историю
          </Link>
        </div>
      )}

      {product && <ProductCard product={product} metadata={metadata} batch={batch} verification={verification} />}

      {scanMeta && scanMeta.timestamp && isQrTimestampStale(scanMeta) && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-200">
          <p className="break-words leading-snug">
            ⚠ Этот QR-код был сгенерирован более года назад.
            Возможно, ярлык устарел — проверьте дату годности продукта.
          </p>
        </div>
      )}

      {product && (
        <section className="panel w-fit max-w-full">
          <QRCodeSVG
            value={buildVerifyUrl(undefined, product.serialNumber)}
            size={160}
            level="M"
          />
          <p className="mt-2 text-center text-xs text-slate-400">QR с URL верификации</p>
        </section>
      )}

      {scannerOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70">
            <p className="text-sm text-slate-200">Загрузка сканера…</p>
          </div>
        }>
          <QrScanner
            onClose={() => setScannerOpen(false)}
            onResult={handleScanResult}
          />
        </Suspense>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-slate-100">{value}</p>
    </div>
  );
}
