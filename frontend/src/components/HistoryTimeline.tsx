import { formatAddress, formatBlockchainDate, statusLabels } from "../lib/status";
import type { ProductHistoryItem } from "../types/product";

export function HistoryTimeline({ history }: { history: ProductHistoryItem[] }) {
  if (history.length === 0) {
    return <div className="panel text-sm text-slate-400">История пока пуста.</div>;
  }

  return (
    <div className="panel">
      <h2 className="mb-4 text-lg font-semibold">Цепочка поставки (on-chain)</h2>
      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={historyKey(item, index)} className="grid gap-3 border-l-2 border-emerald-500/50 pl-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <p className="font-medium text-slate-100">{translateAction(item.action)}</p>
              <span className="text-sm text-slate-500">{formatBlockchainDate(item.timestamp)}</span>
            </div>
            <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              <span>Статус: {statusLabels[item.status]}</span>
              <span>Участник: {formatAddress(item.actor)}</span>
              <span>От: {isZeroAddress(item.previousOwner) ? "создание" : formatAddress(item.previousOwner)}</span>
              <span>Кому: {formatAddress(item.newOwner)}</span>
              <span className="md:col-span-2">Operation ID: <span className="font-mono">{item.operationId.slice(0, 14)}...</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function translateAction(action: string) {
  if (action === "Product created") return "Продукт создан";
  if (action === "Product transferred") return "Продукт передан";
  if (action === "Status updated") return "Статус обновлен";
  return action;
}

function isZeroAddress(address: string) {
  return address.toLowerCase() === "0x0000000000000000000000000000000000000000";
}

/**
 * Stable list key.  Falls back to (timestamp, index) only for the synthetic
 * "Product created" record which carries a zero operationId on-chain.
 */
function historyKey(item: ProductHistoryItem, index: number) {
  const zero = "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (item.operationId && item.operationId !== zero) {
    return item.operationId;
  }
  return `${item.timestamp}-${index}`;
}
