import type { ExtendedProductStatus } from "../types/product";

export const statusLabels: Record<ExtendedProductStatus, string> = {
  0: "Произведен",
  1: "В пути",
  2: "Доставлен",
  3: "Продан",
  4: "Отозван"
};

export const statusClasses: Record<ExtendedProductStatus, string> = {
  0: "bg-slate-700/80 text-slate-100",
  1: "bg-sky-500/20 text-sky-200",
  2: "bg-emerald-500/20 text-emerald-200",
  3: "bg-violet-500/20 text-violet-200",
  4: "bg-red-500/20 text-red-200"
};

export function formatAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBlockchainDate(value: bigint) {
  return new Date(Number(value) * 1000).toLocaleString("ru-RU");
}

export function toUnixDate(date: string) {
  return Math.floor(new Date(date).getTime() / 1000);
}
