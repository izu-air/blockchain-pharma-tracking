import { useState } from "react";
import { saveMetadata, saveProductEvent } from "../lib/api";
import { createProduct } from "../lib/contract";
import { ResultMessage } from "../components/ResultMessage";

export default function RegisterProductPage() {
  const [name, setName] = useState("Парацетамол 500 мг");
  const [batchNumber, setBatchNumber] = useState("BATCH-2026-001");
  const [expirationDate, setExpirationDate] = useState("2027-12-31");
  const [description, setDescription] = useState("Демонстрационная партия лекарственного препарата.");
  const [productId, setProductId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setTxHash("");
    setProductId("");

    try {
      const result = await createProduct(name);
      setTxHash(result.txHash);
      setProductId(result.productId);

      if (result.productId) {
        await saveMetadata({
          blockchainProductId: Number(result.productId),
          batchNumber,
          expirationDate,
          description
        });
        await saveProductEvent({
          blockchainProductId: Number(result.productId),
          eventType: "PRODUCT_CREATED",
          transactionHash: result.txHash
        });
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Ошибка регистрации продукта");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel max-w-3xl">
      <h2 className="text-xl font-semibold">Регистрация продукта</h2>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <Field label="Название препарата" value={name} onChange={setName} />
        <Field label="Номер партии" value={batchNumber} onChange={setBatchNumber} />
        <Field label="Срок годности" value={expirationDate} onChange={setExpirationDate} type="date" />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Описание</span>
          <textarea className="input min-h-24" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <button className="button" disabled={loading}>{loading ? "Отправка..." : "Создать продукт"}</button>
      </form>
      {productId && <p className="mt-4 text-sm text-stone-700">Создан ID продукта: <b>{productId}</b></p>}
      <div className="mt-4">
        <ResultMessage error={error} txHash={txHash} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}
