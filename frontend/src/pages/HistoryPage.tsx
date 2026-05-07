import { useState } from "react";
import { HistoryTimeline } from "../components/HistoryTimeline";
import { ProductCard } from "../components/ProductCard";
import { getMetadata } from "../lib/api";
import { getBatch, getProduct, getProductHistory, verifyProduct } from "../lib/contract";
import type { Product, ProductBatch, ProductHistoryItem, ProductMetadata, VerificationResult } from "../types/product";

export default function HistoryPage() {
  const [productId, setProductId] = useState("1");
  const [product, setProduct] = useState<Product | null>(null);
  const [batch, setBatch] = useState<ProductBatch | null>(null);
  const [metadata, setMetadata] = useState<ProductMetadata | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [history, setHistory] = useState<ProductHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [loadedProduct, loadedHistory, loadedMetadata, loadedVerification] = await Promise.all([
        getProduct(productId),
        getProductHistory(productId),
        getMetadata(productId),
        verifyProduct(productId)
      ]);
      const loadedBatch = await getBatch(loadedProduct.batchId.toString());
      setProduct(loadedProduct);
      setBatch(loadedBatch);
      setHistory(loadedHistory);
      setMetadata(loadedMetadata);
      setVerification(loadedVerification);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Не удалось загрузить историю");
      setProduct(null);
      setBatch(null);
      setVerification(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel">
        <h2 className="text-xl font-semibold">История продукта</h2>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input className="input md:max-w-xs" value={productId} onChange={(event) => setProductId(event.target.value)} />
          <button className="button" onClick={load} disabled={loading}>{loading ? "Загрузка..." : "Показать историю"}</button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      {product && <ProductCard product={product} metadata={metadata} batch={batch} verification={verification} />}
      <HistoryTimeline history={history} />
    </div>
  );
}
