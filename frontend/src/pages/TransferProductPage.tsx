import { useState } from "react";
import { saveProductEvent } from "../lib/api";
import { transferProduct, updateStatus } from "../lib/contract";
import { ResultMessage } from "../components/ResultMessage";
import type { ExtendedProductStatus } from "../types/product";

export default function TransferProductPage() {
  const [productId, setProductId] = useState("1");
  const [newOwner, setNewOwner] = useState("");
  const [status, setStatus] = useState<ExtendedProductStatus>(2);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(action: "transfer" | "status") {
    setLoading(true);
    setError("");
    setTxHash("");

    try {
      const hash = action === "transfer"
        ? await transferProduct(productId, newOwner)
        : await updateStatus(productId, status);

      setTxHash(hash);
      await saveProductEvent({
        blockchainProductId: Number(productId),
        eventType: action === "transfer" ? "PRODUCT_TRANSFERRED" : "STATUS_UPDATED",
        transactionHash: hash
      });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Ошибка выполнения операции");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel">
        <h2 className="text-xl font-semibold">Передача продукта</h2>
        <div className="mt-5 space-y-4">
          <Field label="ID продукта" value={productId} onChange={setProductId} />
          <Field label="Адрес нового владельца" value={newOwner} onChange={setNewOwner} placeholder="0x..." />
          <button className="button" disabled={loading || !newOwner} onClick={() => run("transfer")}>
            Передать владельцу
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">Обновление статуса</h2>
        <div className="mt-5 space-y-4">
          <Field label="ID продукта" value={productId} onChange={setProductId} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Новый статус</span>
            <select className="input" value={status} onChange={(event) => setStatus(Number(event.target.value) as ExtendedProductStatus)}>
              <option value={1}>В пути</option>
              <option value={2}>Доставлен</option>
              <option value={3}>Продан</option>
            </select>
          </label>
          <button className="button" disabled={loading} onClick={() => run("status")}>
            Обновить статус
          </button>
        </div>
      </section>

      <div className="lg:col-span-2">
        <ResultMessage error={error} txHash={txHash} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input className="input" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}
