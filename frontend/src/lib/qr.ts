/**
 * Структура, которую кодирует QR.  Сейчас QR — это URL вида
 *
 *   https://app/verify?serial=SN-001&nonce=<uuid>&ts=<unix_seconds>&v=1
 *
 * `nonce` и `ts` НЕ обеспечивают криптографическую защиту от подделки
 * (атакующий может сгенерировать произвольный QR для существующего serial).
 * Источник доверия — блокчейн: после распознавания QR мы делаем
 * verifyProductBySerial и сравниваем результат.  Nonce/timestamp служат
 * для:
 *   1) аудита и анти-копирования отчётности (один и тот же QR можно
 *      сосчитать сколько угодно раз, но логи показывают повторы);
 *   2) подготовки к будущей подписи манифеста производителя
 *      (EIP-191/EIP-712), которую мы можем добавить, не меняя формат QR.
 */
export interface ScanPayload {
  serial: string;
  /** Optional — present in new-format QRs. */
  nonce?: string;
  /** Optional Unix timestamp (seconds) embedded by the issuer. */
  timestamp?: number;
  /** QR schema version, для будущих миграций. */
  version?: number;
}

/**
 * Полная распарсенная информация со сканера: serial + опциональные nonce/ts.
 * Возвращает null, если строка очевидно не QR верификации.
 */
export function parseScan(raw: string): ScanPayload | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    const serial = url.searchParams.get("serial");
    if (serial) {
      const payload: ScanPayload = { serial: decodeURIComponent(serial).trim() };
      const nonce = url.searchParams.get("nonce");
      if (nonce) payload.nonce = nonce;
      const ts = url.searchParams.get("ts");
      if (ts && /^\d+$/.test(ts)) payload.timestamp = Number(ts);
      const v = url.searchParams.get("v");
      if (v && /^\d+$/.test(v)) payload.version = Number(v);
      return payload;
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0] === "verify" && segments[1]) {
      return { serial: decodeURIComponent(segments[1]).trim() };
    }
  } catch {
    /* не URL — обрабатываем как plain serial */
  }

  if (/^[A-Za-z0-9._:-]{3,128}$/.test(text)) {
    return { serial: text };
  }
  return null;
}

/**
 * Backwards-compatible helper: возвращает только серийный номер.
 */
export function extractSerialFromScan(raw: string): string | null {
  return parseScan(raw)?.serial ?? null;
}

/**
 * Build the canonical QR URL for a product. Adds nonce + timestamp + schema
 * version so future readers can distinguish issuer-signed and legacy QRs.
 */
export function buildVerifyUrl(origin: string, serial: string): string {
  const params = new URLSearchParams({
    serial,
    nonce: typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    ts: String(Math.floor(Date.now() / 1000)),
    v: "1"
  });
  return `${origin}/verify?${params.toString()}`;
}

/**
 * Returns true if the embedded timestamp is older than `maxAgeDays`.
 * Allows /verify to show an "outdated QR" warning while still trusting the
 * on-chain result.
 */
export function isQrTimestampStale(payload: ScanPayload, maxAgeDays = 365): boolean {
  if (!payload.timestamp) return false;
  const now = Math.floor(Date.now() / 1000);
  return now - payload.timestamp > maxAgeDays * 86400;
}
