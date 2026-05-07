import { CheckCircle2, Search, XCircle } from "lucide-react";
import { useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { getMetadata } from "../lib/api";
import { getBatch, getProduct, verifyProduct } from "../lib/contract";
import { formatAddress, formatBlockchainDate, statusLabels } from "../lib/status";
import type { Product, ProductBatch, ProductMetadata, VerificationResult } from "../types/product";

export default function VerifyProductPage() {
  const [productId, setProductId] = useState("1");
  const [product, setProduct] = useState<Product | null>(null);
  const [batch, setBatch] = useState<ProductBatch | null>(null);
  const [metadata, setMetadata] = useState<ProductMetadata | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    setError("");
    setVerified(null);
    setProduct(null);

    try {
      const loadedProduct = await getProduct(productId);
      const [loadedMetadata, loadedVerification, loadedBatch] = await Promise.all([
        getMetadata(productId),
        verifyProduct(productId),
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
        <h2 className="text-xl font-semibold">Проверка подлинности</h2>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input className="input md:max-w-xs" value={productId} onChange={(event) => setProductId(event.target.value)} />
          <button className="button" onClick={verify} disabled={loading}>
            <Search size={18} />
            {loading ? "Проверка..." : "Проверить"}
          </button>
        </div>
      </section>

      {verified !== null && (
      <section className={`panel flex items-center gap-3 ${verified ? "border-green-200" : "border-red-200"}`}>
          {verified ? <CheckCircle2 className="text-primary" /> : <XCircle className="text-red-600" />}
          <div>
            <h3 className="font-semibold">{verified ? "Подлинность подтверждена" : "Подлинность не подтверждена"}</h3>
            <p className="text-sm text-stone-600">
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
