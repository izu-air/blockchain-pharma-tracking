import type { AnalyticsDaily, AnalyticsSummary, ProductMetadata } from "../types/product";
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

export interface NonceResponse {
  walletAddress: string;
  message: string;
  expiresAt: string;
}

/**
 * Step 1 of wallet-signature login: ask the backend to issue a one-time
 * challenge that the wallet must sign with personal_sign.
 */
export async function requestLoginNonce(walletAddress: string): Promise<NonceResponse> {
  const response = await apiFetch("/auth/nonce", {
    method: "POST",
    body: JSON.stringify({ walletAddress })
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Не удалось получить challenge."));
  }
  return response.json() as Promise<NonceResponse>;
}

/**
 * Step 2: submit walletAddress + the original challenge + the wallet's
 * signature.  The backend verifies the signature, consumes the nonce, and
 * returns a JWT.
 */
export async function loginWithSignature(
    walletAddress: string,
    message: string,
    signature: string
) {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ walletAddress, message, signature })
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Кошелёк не зарегистрирован. Сначала создайте пользователя.");
    }
    if (response.status === 403) {
      throw new Error("Подпись не подтверждена. Попробуйте подписать сообщение ещё раз.");
    }
    if (response.status === 401) {
      throw new Error("Требуется авторизация.");
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

export interface AdminUser {
  id: number;
  name: string;
  role: string;
  walletAddress: string;
  createdAt: string;
}

export async function listUsers(): Promise<AdminUser[]> {
  const response = await apiFetch("/users");
  if (!response.ok) {
    throw new Error(await readApiError(response, "Не удалось получить список пользователей."));
  }
  return response.json() as Promise<AdminUser[]>;
}

export async function updateUserRole(id: number, role: string, reason: string): Promise<AdminUser> {
  const response = await apiFetch(`/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role, reason })
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Не удалось изменить роль."));
  }
  return response.json() as Promise<AdminUser>;
}

export async function deleteUser(id: number): Promise<void> {
  const response = await apiFetch(`/users/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Не удалось удалить пользователя."));
  }
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

export async function getAnalyticsDaily(days = 30) {
  const response = await apiFetch(`/analytics/daily?days=${encodeURIComponent(days)}`);
  if (!response.ok) {
    throw new Error(await readApiError(response, "Не удалось загрузить дневную аналитику."));
  }
  return response.json() as Promise<AnalyticsDaily>;
}

export interface AuditLogEntry {
  id: number;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface AuditLogPage {
  content: AuditLogEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AuditFilters {
  page?: number;
  size?: number;
  action?: string;
  wallet?: string;
  from?: string;
  to?: string;
}

export async function getAuditLogs(filters: AuditFilters = {}): Promise<AuditLogPage> {
  const params = new URLSearchParams();
  if (filters.page  != null) params.set("page",  String(filters.page));
  if (filters.size  != null) params.set("size",  String(filters.size));
  if (filters.action?.trim()) params.set("action", filters.action.trim());
  if (filters.wallet?.trim()) params.set("wallet", filters.wallet.trim());
  if (filters.from?.trim())   params.set("from",   filters.from.trim());
  if (filters.to?.trim())     params.set("to",     filters.to.trim());

  const response = await apiFetch(`/audit-logs?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await readApiError(response, "Не удалось загрузить журнал аудита."));
  }
  return response.json() as Promise<AuditLogPage>;
}
