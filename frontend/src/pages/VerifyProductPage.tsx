import { CheckCircle2, Search, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { getMetadata } from "../lib/api";
import { getBatch, getProduct, getProductBySerial, verifyProduct, verifyProductBySerial } from "../lib/contract";
import { formatAddress, formatBlockchainDate, statusLabels } from "../lib/status";
import type { Product, ProductBatch, ProductMetadata, VerificationResult } from "../types/product";

export default function VerifyProductPage() {
  const [params] = useSearchParams();
  const [productId, setProductId] = useState("1");
  const [serialNumber, setSerialNumber] = useState(params.get("serial") || "");
  const [product, setProduct] = useState<Product | null>(null);
  const [batch, setBatch] = useState<ProductBatch | null>(null);
  const [metadata, setMetadata] = useState<ProductMetadata | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get("serial")) {
      verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify() {
    setLoading(true);
    setError("");
    setVerified(null);
    setProduct(null);

    try {
      const loadedProduct = serialNumber.trim()
        ? await getProductBySerial(serialNumber.trim())
        : await getProduct(productId);
      const [loadedMetadata, loadedVerification, loadedBatch] = await Promise.all([
        getMetadata(loadedProduct.id.toString()),
        serialNumber.trim() ? verifyProductBySerial(serialNumber.trim()) : verifyProduct(productId),
        getBatch(loadedProduct.batchId.toString())
      ]);
      setProduct(loadedProduct);
      setBatch(loadedBatch);
      setMetadata(loadedMetadata);
      setVerification(loadedVerification);
      setVerified(loadedVerification.authentic);
    } catch (exception) {
      setVerified(false);
      setError(exception instanceof Error ? exception.message : "Продукт не найден в контракте");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Consumer verification</p>
        <h2 className="mt-2 text-2xl font-semibold">Проверка подлинности</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input className="input" placeholder="Serial number из QR" value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} />
          <input className="input" placeholder="или blockchain product ID" value={productId} onChange={(event) => setProductId(event.target.value)} />
          <button className="button" onClick={verify} disabled={loading}>
            <Search size={18} />
            {loading ? "Проверка..." : "Проверить"}
          </button>
        </div>
      </section>

      {verified !== null && (
      <section className={`panel flex items-center gap-3 ${verified ? "border-emerald-500/40" : "border-red-500/40"}`}>
          {verified ? <CheckCircle2 className="text-primary" /> : <XCircle className="text-red-400" />}
          <div>
            <h3 className="font-semibold">{verified ? "Подлинность подтверждена" : "Подлинность не подтверждена"}</h3>
            <p className="text-sm text-slate-300">
              {verified ? "Продукт найден в smart contract." : error || "Запись о продукте отсутствует."}
            </p>
          </div>
        </section>
      )}

      {verification && (
        <section className="grid gap-4 md:grid-cols-4">
          <Info label="Владелец" value={formatAddress(verification.currentOwner)} />
          <Info label="Статус" value={statusLabels[verification.status]} />
          <Info label="Отозван" value={verification.recalled ? "Да" : "Нет"} />
          <Info label="Годен до" value={formatBlockchainDate(verification.expirationDate)} />
        </section>
      )}

      {product && <ProductCard product={product} metadata={metadata} batch={batch} verification={verification} />}
      {product && (
        <section className="panel w-fit">
          <QRCodeSVG value={`${window.location.origin}/verify?serial=${encodeURIComponent(product.serialNumber)}`} size={160} />
          <p className="mt-2 text-center text-xs text-slate-300">QR verification URL</p>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel">
      <p className="text-xs uppercase text-stone-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
