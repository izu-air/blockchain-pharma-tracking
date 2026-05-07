import { useState } from "react";
import { saveBatchMetadata, saveMetadata, saveProductEvent } from "../lib/api";
import { createBatch, createProduct, metadataHash, temperatureHash } from "../lib/contract";
import { toUnixDate } from "../lib/status";
import { ResultMessage } from "../components/ResultMessage";

export default function RegisterProductPage() {
  const [name, setName] = useState("Парацетамол 500 мг");
  const [batchId, setBatchId] = useState("");
  const [batchNumber, setBatchNumber] = useState("BATCH-2026-001");
  const [productionDate, setProductionDate] = useState("2026-05-07");
  const [expirationDate, setExpirationDate] = useState("2027-12-31");
  const [temperatureLog, setTemperatureLog] = useState("2-8C, отклонений не обнаружено");
  const [description, setDescription] = useState("Демонстрационная партия лекарственного препарата.");
  const [productId, setProductId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateBatch() {
    setLoading(true);
    setError("");
    setTxHash("");

    try {
      const result = await createBatch(
        toUnixDate(productionDate),
        toUnixDate(expirationDate),
        temperatureLog,
        `${batchNumber}; ${description}`
      );
      setBatchId(result.batchId);
      setTxHash(result.txHash);
      if (result.batchId) {
        await saveBatchMetadata({
          blockchainBatchId: Number(result.batchId),
          batchNumber,
          manufacturerName: "MetaMask manufacturer",
          productionDate,
          expirationDate,
          metadataHash: metadataHash(`${batchNumber}; ${description}`),
          temperatureHash: temperatureHash(temperatureLog)
        });
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Ошибка создания партии");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setTxHash("");
    setProductId("");

    try {
      const result = await createProduct(batchId, name);
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
      <div className="mt-5 space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="font-semibold">1. Создание партии</h3>
        <Field label="Номер партии" value={batchNumber} onChange={setBatchNumber} />
        <Field label="Дата производства" value={productionDate} onChange={setProductionDate} type="date" />
        <Field label="Срок годности" value={expirationDate} onChange={setExpirationDate} type="date" />
        <Field label="Температурный журнал" value={temperatureLog} onChange={setTemperatureLog} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Описание</span>
          <textarea className="input min-h-24" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <button type="button" className="button-secondary" disabled={loading} onClick={handleCreateBatch}>
          Создать партию
        </button>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <h3 className="font-semibold">2. Создание продукта в партии</h3>
        <Field label="ID партии" value={batchId} onChange={setBatchId} />
        <Field label="Название препарата" value={name} onChange={setName} />
        <button className="button" disabled={loading || !batchId}>{loading ? "Отправка..." : "Создать продукт"}</button>
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
