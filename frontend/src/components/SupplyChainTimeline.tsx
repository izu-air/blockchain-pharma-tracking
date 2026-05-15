import { ArrowDown, CheckCircle2, Circle } from "lucide-react";
import { formatAddress, formatBlockchainDate, statusLabels } from "../lib/status";
import type { ProductHistoryItem } from "../types/product";

export function SupplyChainTimeline({ history }: { history: ProductHistoryItem[] }) {
  if (history.length === 0) {
    return <div className="panel text-sm text-slate-400">Пока нет on-chain событий.</div>;
  }

  const sorted = [...history].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  return (
    <div className="panel">
      <h2 className="mb-6 text-lg font-semibold">Цепочка поставки</h2>
      <div>
        {sorted.map((item, index) => {
          const isLast = index === sorted.length - 1;
          return (
            <div key={`${item.timestamp}-${index}`} className="relative pb-8 pl-10">
              <div className="absolute left-3 top-1">
                {isLast ? <CheckCircle2 className="text-emerald-400" size={18} /> : <Circle className="text-emerald-500/60" size={14} />}
              </div>
              {!isLast && <div className="absolute left-[0.85rem] top-6 h-[calc(100%-12px)] w-px bg-emerald-500/30" />}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-100">{translateStage(item.action)}</p>
                  <p className="text-sm text-slate-400">{statusLabels[item.status]}</p>
                </div>
                <time className="text-xs text-slate-500">{formatBlockchainDate(item.timestamp)}</time>
              </div>
              <div className="mt-3 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                <span>Участник: {formatAddress(item.actor)}</span>
                <span>
                  {isZero(item.previousOwner) ? "Выпуск" : `${formatAddress(item.previousOwner)} → ${formatAddress(item.newOwner)}`}
                </span>
              </div>
              {!isLast && (
                <div className="mt-3 flex justify-center text-emerald-500/50">
                  <ArrowDown size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function translateStage(action: string) {
  if (action === "Product created") return "Производитель";
  if (action === "Product transferred") return "Дистрибьютор / передача";
  if (action === "Status updated") return "Статус в цепочке";
  return action;
}

function isZero(address: string) {
  return address.toLowerCase() === "0x0000000000000000000000000000000000000000";
}
