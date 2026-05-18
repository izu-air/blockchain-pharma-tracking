import { useCallback, useEffect, useState } from "react";
import { HistoryTimeline } from "../components/HistoryTimeline";
import { ProductCard } from "../components/ProductCard";
import { getMetadata } from "../lib/api";
import { getBatch, getProduct, getProductHistory, verifyProduct } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import type { Product, ProductBatch, ProductHistoryItem, ProductMetadata, VerificationResult } from "../types/product";

type HistoryPageProps = {
  initialProductId?: string;
};

export default function HistoryPage({ initialProductId }: HistoryPageProps) {
  const [blockchainProductId, setBlockchainProductId] = useState(initialProductId || "1");
  const [product, setProduct] = useState<Product | null>(null);
  const [batch, setBatch] = useState<ProductBatch | null>(null);
  const [metadata, setMetadata] = useState<ProductMetadata | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [history, setHistory] = useState<ProductHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadById = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!/^\d+$/.test(trimmed) || Number(trimmed) <= 0) {
      setError(
        "Blockchain product ID должен быть положительным числом " +
        "(например, 1, 2, 17). Серийный номер SN-… вводите на странице «Проверка»."
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [loadedProduct, loadedHistory, loadedMetadata, loadedVerification] = await Promise.all([
        getProduct(trimmed),
        getProductHistory(trimmed),
        getMetadata(trimmed).catch(() => null),
        verifyProduct(trimmed)
      ]);
      const loadedBatch = await getBatch(loadedProduct.batchId.toString());
      setProduct(loadedProduct);
      setBatch(loadedBatch);
      setHistory(loadedHistory);
      setMetadata(loadedMetadata);
      setVerification(loadedVerification);
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось загрузить историю продукта."));
      setProduct(null);
      setBatch(null);
      setVerification(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialProductId !== undefined && initialProductId !== "") {
      setBlockchainProductId(initialProductId);
    }
  }, [initialProductId]);

  useEffect(() => {
    if (initialProductId !== undefined && initialProductId !== "") {
      void loadById(initialProductId);
    }
  }, [initialProductId, loadById]);

  return (
    <div className="space-y-6">
      <section className="panel">
        <h2 className="text-xl font-semibold">История продукта</h2>
        <p className="mt-1 text-sm text-slate-400">
          Неизменяемая цепочка событий из смарт-контракта и метаданные из backend.
          Введите числовой <strong>Blockchain product ID</strong> (его возвращает
          контракт при создании продукта или его видно в событиях).
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            className="input font-mono md:max-w-xs"
            value={blockchainProductId}
            onChange={(event) => setBlockchainProductId(event.target.value)}
            placeholder="например: 1, 2, 17"
            inputMode="numeric"
            pattern="\d+"
            maxLength={20}
            autoComplete="off"
            aria-label="Blockchain product ID"
          />
          <button className="button" onClick={() => loadById(blockchainProductId)} disabled={loading}>
            {loading ? "Загрузка..." : "Показать историю"}
          </button>
        </div>
        {error && (
          <div role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 p-2 text-sm text-red-200">
            <p className="break-words leading-snug">{error}</p>
          </div>
        )}
      </section>

      {product && <ProductCard product={product} metadata={metadata} batch={batch} verification={verification} />}
      <HistoryTimeline history={history} />
    </div>
  );
}
