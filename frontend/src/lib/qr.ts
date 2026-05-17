/**
 * Извлекает серийный номер из строки, считанной с QR.
 * Принимает:
 *   - полный URL `http://.../verify?serial=SN-DEMO-001`
 *   - строку `SN-DEMO-001`
 *   - urlencoded строку
 *
 * Возвращает серийный номер или null, если строка явно мусорная.
 */
export function extractSerialFromScan(raw: string): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;

  // Полный URL: достаём параметр ?serial=...
  try {
    const url = new URL(text);
    const serial = url.searchParams.get("serial");
    if (serial) return decodeURIComponent(serial).trim();
    // Альтернативный путь — некоторые QR могут содержать /verify/<serial>
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0] === "verify" && segments[1]) {
      return decodeURIComponent(segments[1]).trim();
    }
  } catch {
    /* не URL — продолжаем как обычный текст */
  }

  // Произвольный текст — допускаем только разумные серийные номера
  if (/^[A-Za-z0-9._:-]{3,128}$/.test(text)) {
    return text;
  }
  return null;
}
