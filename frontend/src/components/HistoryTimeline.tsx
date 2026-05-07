import { formatAddress, formatBlockchainDate, statusLabels } from "../lib/status";
import type { ProductHistoryItem } from "../types/product";

export function HistoryTimeline({ history }: { history: ProductHistoryItem[] }) {
  if (history.length === 0) {
    return <div className="panel text-sm text-stone-600">История пока пуста.</div>;
  }

  return (
    <div className="panel">
      <h2 className="mb-4 text-lg font-semibold">История продукта</h2>
      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={`${item.timestamp}-${index}`} className="grid gap-3 border-l-2 border-green-200 pl-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <p className="font-medium">{translateAction(item.action)}</p>
              <span className="text-sm text-stone-500">{formatBlockchainDate(item.timestamp)}</span>
            </div>
            <div className="grid gap-2 text-sm text-stone-700 md:grid-cols-2">
              <span>Статус: {statusLabels[item.status]}</span>
              <span>Участник: {formatAddress(item.actor)}</span>
              <span>От: {isZeroAddress(item.from) ? "создание" : formatAddress(item.from)}</span>
              <span>Кому: {formatAddress(item.to)}</span>
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
