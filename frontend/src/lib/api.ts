import type { AnalyticsSummary, ProductMetadata } from "../types/product";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export async function saveMetadata(payload: {
  blockchainProductId: number;
  batchNumber: string;
  expirationDate: string;
  description: string;
}) {
  const response = await fetch(`${apiBaseUrl}/product-metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Не удалось сохранить метаданные продукта.");
  }

  return response.json() as Promise<ProductMetadata>;
}

export async function saveBatchMetadata(payload: {
  blockchainBatchId: number;
  batchNumber: string;
  manufacturerName: string;
  productionDate: string;
  expirationDate: string;
  metadataHash: string;
  temperatureHash: string;
}) {
  const response = await fetch(`${apiBaseUrl}/batch-metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Не удалось сохранить метаданные партии.");
  }

  return response.json();
}

export async function getMetadata(productId: string) {
  const response = await fetch(`${apiBaseUrl}/product-metadata/${productId}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Не удалось загрузить метаданные.");
  }
  return response.json() as Promise<ProductMetadata>;
}

export async function saveProductEvent(payload: {
  blockchainProductId: number;
  eventType: string;
  transactionHash: string;
}) {
  await fetch(`${apiBaseUrl}/product-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function getAnalyticsSummary() {
  const response = await fetch(`${apiBaseUrl}/analytics/summary`);
  if (!response.ok) {
    throw new Error("Не удалось загрузить аналитику.");
  }
  return response.json() as Promise<AnalyticsSummary>;
}
