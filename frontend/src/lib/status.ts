import type { ExtendedProductStatus } from "../types/product";

export const statusLabels: Record<ExtendedProductStatus, string> = {
  0: "Произведен",
  1: "В пути",
  2: "Доставлен",
  3: "Продан",
  4: "Отозван"
};

export const statusClasses: Record<ExtendedProductStatus, string> = {
  0: "bg-stone-100 text-stone-700",
  1: "bg-blue-50 text-blue-700",
  2: "bg-green-50 text-green-700",
  3: "bg-zinc-100 text-zinc-700",
  4: "bg-red-50 text-red-700"
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
