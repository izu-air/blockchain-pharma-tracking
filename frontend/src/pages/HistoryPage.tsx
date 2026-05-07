import { useState } from "react";
import { HistoryTimeline } from "../components/HistoryTimeline";
import { ProductCard } from "../components/ProductCard";
import { getMetadata } from "../lib/api";
import { getProduct, getProductHistory } from "../lib/contract";
import type { Product, ProductHistoryItem, ProductMetadata } from "../types/product";

export default function HistoryPage() {
  const [productId, setProductId] = useState("1");
  const [product, setProduct] = useState<Product | null>(null);
  const [metadata, setMetadata] = useState<ProductMetadata | null>(null);
  const [history, setHistory] = useState<ProductHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [loadedProduct, loadedHistory, loadedMetadata] = await Promise.all([
        getProduct(productId),
        getProductHistory(productId),
        getMetadata(productId)
      ]);
      setProduct(loadedProduct);
      setHistory(loadedHistory);
      setMetadata(loadedMetadata);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Не удалось загрузить историю");
      setProduct(null);
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

      {product && <ProductCard product={product} metadata={metadata} />}
      <HistoryTimeline history={history} />
    </div>
  );
}
