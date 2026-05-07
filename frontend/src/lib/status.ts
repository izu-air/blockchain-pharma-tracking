import type { ProductStatus } from "../types/product";

export const statusLabels: Record<ProductStatus, string> = {
  0: "Произведен",
  1: "В пути",
  2: "Доставлен",
  3: "Продан"
};

export function formatAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBlockchainDate(value: bigint) {
  return new Date(Number(value) * 1000).toLocaleString("ru-RU");
}
