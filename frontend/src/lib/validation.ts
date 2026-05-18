/**
 * Shared validation utilities used across all pages that send data to the
 * smart contract or backend.  The goal is to fail fast in Russian with a
 * specific field name before ethers can throw a cryptic BigNumberish error
 * or the backend can return a generic 400.
 */

import type { ExtendedProductStatus } from "../types/product";

// ─── Numeric IDs (uint256) ─────────────────────────────────────────────────

/**
 * Strict — rejects leading/trailing whitespace deliberately so a paste of
 * " 1 " into a numeric field is caught before it reaches ethers.  Use
 * trim() on the value at the form layer if the field allows it.
 */
export function isPositiveIntegerString(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^\d+$/.test(value) && Number(value) > 0;
}

export function parsePositiveBlockchainId(value: string, fieldName: string): bigint {
  const trimmed = String(value ?? "").trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `Поле «${fieldName}» должно быть положительным числом (on-chain ID). ` +
      `Получено: «${trimmed.slice(0, 32)}». ` +
      `Это не бизнес-номер партии вроде BATCH-2026-001 — это числовой ` +
      `идентификатор, возвращённый смарт-контрактом.`
    );
  }
  const parsed = BigInt(trimmed);
  if (parsed <= 0n) {
    throw new Error(`Поле «${fieldName}» должно быть положительным числом, получено ${parsed}.`);
  }
  return parsed;
}

// ─── Ethereum addresses ───────────────────────────────────────────────────

const ADDRESS_PATTERN = /^0[xX][a-fA-F0-9]{40}$/;

export function validateEthereumAddress(value: unknown): boolean {
  return typeof value === "string" && ADDRESS_PATTERN.test(value.trim());
}

// ─── Serial number ────────────────────────────────────────────────────────

const SERIAL_PATTERN = /^[A-Za-z0-9._:\-]{3,64}$/;

/**
 * Trim + uppercase normalisation kept in sync between createProduct and
 * verifyProductBySerial so QR scans match storage.
 */
export function normalizeSerial(value: string): string {
  return String(value ?? "").trim();
}

export function isValidSerial(value: unknown): boolean {
  return typeof value === "string" && SERIAL_PATTERN.test(value.trim());
}

// ─── Product status transition ────────────────────────────────────────────

export const STATUS_LABELS_RU: Record<ExtendedProductStatus, string> = {
  0: "Произведён",
  1: "В пути",
  2: "Доставлен",
  3: "Продан",
  4: "Отозван"
};

/**
 * Allowed transitions match the smart-contract _isValidTransition()
 * Manufactured (0) → InTransit (1) → Delivered (2) → Sold (3)
 * Recalled (4) is set only by recallBatch and cannot leave via updateStatus.
 * Blocked products cannot move at all.
 */
export function validateStatusTransition(
  current: ExtendedProductStatus,
  next: ExtendedProductStatus
): { ok: true } | { ok: false; reason: string } {
  if (current === next) {
    return {
      ok: false,
      reason: `Статус «${STATUS_LABELS_RU[current]}» уже установлен — изменения не требуются.`
    };
  }
  if (current === 3) {
    return { ok: false, reason: "Статус «Продан» окончательный, изменить нельзя." };
  }
  if (current === 4) {
    return {
      ok: false,
      reason: "Продукт отозван (Recalled). Смена статуса через обычный flow невозможна, восстановите партию."
    };
  }
  const allowed = ALLOWED_NEXT[current] ?? new Set();
  if (!allowed.has(next)) {
    return {
      ok: false,
      reason: `Недопустимый переход: «${STATUS_LABELS_RU[current]}» → «${STATUS_LABELS_RU[next]}». ` +
              `Соблюдайте последовательность: Произведён → В пути → Доставлен → Продан.`
    };
  }
  return { ok: true };
}

const ALLOWED_NEXT: Partial<Record<ExtendedProductStatus, Set<ExtendedProductStatus>>> = {
  0: new Set([1]),
  1: new Set([2]),
  2: new Set([3])
};

/** Public helper for forms: which status options to leave enabled. */
export function nextValidStatuses(current: ExtendedProductStatus): ExtendedProductStatus[] {
  return Array.from(ALLOWED_NEXT[current] ?? []);
}
