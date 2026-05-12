import type { AnalyticsSummary, ProductMetadata } from "../types/product";
import { authHeaders } from "./auth";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined)
  };
  if (!headers["Content-Type"] && init.body && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  Object.assign(headers, authHeaders());
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  return response;
}

export async function loginWithWallet(walletAddress: string) {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ walletAddress })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Ошибка входа. Убедитесь, что кошелёк зарегистрирован в backend (см. data.sql / POST /api/users).");
  }
  return response.json() as Promise<{ token: string; walletAddress: string; role: string }>;
}

export async function registerUser(payload: { name: string; role: string; walletAddress: string }) {
  const response = await apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Не удалось зарегистрировать пользователя.");
  }
  return response.json();
}

export async function saveMetadata(payload: {
  blockchainProductId: number;
  batchNumber: string;
  expirationDate: string;
  description: string;
}) {
  const response = await apiFetch("/product-metadata", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Нужен JWT: войдите на странице «Вход» тем же кошельком, что зарегистрирован в backend.");
    }
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
  const response = await apiFetch("/batch-metadata", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Нужен JWT: выполните вход на странице «Вход».");
    }
    throw new Error("Не удалось сохранить метаданные партии.");
  }

  return response.json();
}

export async function getMetadata(productId: string) {
  const response = await apiFetch(`/product-metadata/${productId}`);
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
  const response = await apiFetch("/product-events", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (response.ok) {
    return;
  }
  if (response.status === 401) {
    console.warn("product-events: JWT отсутствует, событие не сохранено в backend.");
    return;
  }
  throw new Error("Не удалось сохранить событие продукта в backend.");
}

export async function getAnalyticsSummary() {
  const response = await apiFetch("/analytics/summary");
  if (!response.ok) {
    throw new Error("Не удалось загрузить аналитику.");
  }
  return response.json() as Promise<AnalyticsSummary>;
}
