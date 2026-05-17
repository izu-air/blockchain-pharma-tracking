import type { AnalyticsSummary, ProductMetadata } from "../types/product";
import { authHeaders } from "./auth";
import { httpErrorMessage } from "./errors";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

interface ApiErrorResponse {
  error?: string;
  message?: string;
  errors?: Record<string, string>;
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined)
  };
  if (!headers["Content-Type"] && init.body && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  Object.assign(headers, authHeaders());
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  } catch (networkError) {
    throw new Error(
        "Не удалось связаться с сервером. Проверьте подключение и что backend запущен."
    );
  }
  return response;
}

/**
 * Reads an error response body, picks a user-friendly message:
 * 1. JSON {message} or {error} returned by GlobalExceptionHandler
 * 2. Fall back to canonical HTTP-status message
 * Never exposes raw stack traces or technical strings to the caller.
 */
async function readApiError(response: Response, fallback: string): Promise<string> {
  let payload: ApiErrorResponse | null = null;
  let rawText: string | null = null;
  try {
    rawText = await response.text();
    if (rawText) {
      try { payload = JSON.parse(rawText) as ApiErrorResponse; } catch { /* not JSON */ }
    }
  } catch { /* body unreadable */ }

  // Prefer a localized message from the backend if it looks safe
  const serverMessage = payload?.message?.trim() || payload?.error?.trim();
  if (serverMessage && serverMessage.length <= 200 && !serverMessage.includes("Exception")) {
    return serverMessage;
  }

  // Specific contextual fallback by HTTP status
  return httpErrorMessage(response.status, fallback);
}

export async function loginWithWallet(walletAddress: string) {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ walletAddress })
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 404) {
      throw new Error("Кошелёк не зарегистрирован. Создайте пользователя через форму регистрации.");
    }
    throw new Error(await readApiError(response, "Не удалось войти."));
  }
  return response.json() as Promise<{ token: string; walletAddress: string; role: string }>;
}

export async function registerUser(payload: { name: string; role: string; walletAddress: string }) {
  const response = await apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Пользователь с этим адресом уже зарегистрирован.");
    }
    throw new Error(await readApiError(response, "Не удалось зарегистрировать пользователя."));
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
      throw new Error("Нужен JWT-токен. Выполните вход на странице «Вход» тем же кошельком.");
    }
    throw new Error(await readApiError(response, "Не удалось сохранить метаданные продукта."));
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
      throw new Error("Нужен JWT-токен. Выполните вход на странице «Вход» тем же кошельком.");
    }
    throw new Error(await readApiError(response, "Не удалось сохранить метаданные партии."));
  }

  return response.json();
}

export async function getMetadata(productId: string) {
  const response = await apiFetch(`/product-metadata/${productId}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(await readApiError(response, "Не удалось загрузить метаданные."));
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
    // Дополнительные события — не критичны для UX, тихо логируем.
    // eslint-disable-next-line no-console
    console.warn("product-events: JWT отсутствует, событие не сохранено в backend.");
    return;
  }
  throw new Error(await readApiError(response, "Не удалось сохранить событие продукта."));
}

export async function getAnalyticsSummary() {
  const response = await apiFetch("/analytics/summary");
  if (!response.ok) {
    throw new Error(await readApiError(response, "Не удалось загрузить аналитику."));
  }
  return response.json() as Promise<AnalyticsSummary>;
}
