import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, X } from "lucide-react";

interface Props {
  /**
   * Вызывается с распознанной строкой ровно один раз.  Может быть
   * полным URL (`http://.../verify?serial=SN-001`) или просто серийным
   * номером — родительский компонент достаёт то, что ему нужно.
   */
  onResult: (text: string) => void;
  /** Закрыть модалку без результата. */
  onClose: () => void;
}

const SCANNER_ELEMENT_ID = "qr-scanner-region";

/**
 * Модальное окно с live-сканером QR через камеру.  При первом монтировании
 * запрашивает доступ к камере, при размонтировании — корректно останавливает
 * трансляцию.  Если камеры нет или доступ запрещён — показывает сообщение
 * и предлагает закрыть окно.
 */
export function QrScanner({ onResult, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const stoppingRef = useRef(false);
  const [error, setError] = useState<string>("");
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          async (decodedText) => {
            if (cancelled || stoppingRef.current) return;
            stoppingRef.current = true;
            try {
              await scanner.stop();
            } catch {
              /* already stopped */
            }
            onResult(decodedText);
          },
          () => {
            /* per-frame "not found" — игнорируем */
          }
        );
        if (cancelled) {
          try {
            await scanner.stop();
          } catch {
            /* swallow */
          }
        } else {
          setStarting(false);
        }
      } catch (exception) {
        if (cancelled) return;
        const message = exception instanceof Error ? exception.message : String(exception);
        if (/permission/i.test(message) || /denied/i.test(message)) {
          setError("Доступ к камере запрещён. Разрешите доступ в настройках браузера.");
        } else if (/no camera/i.test(message) || /not found/i.test(message)) {
          setError("Камера не найдена. Используйте ручной ввод серийного номера.");
        } else {
          setError("Не удалось запустить камеру. Используйте ручной ввод серийного номера.");
        }
        setStarting(false);
      }
    }
    void start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => undefined);
      }
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть сканер"
          className="absolute right-3 top-3 rounded-full p-1 text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-2 text-emerald-300">
          <Camera size={18} />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Сканирование QR</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Наведите камеру на QR-код. Распознавание сработает автоматически.
        </p>

        <div
          id={SCANNER_ELEMENT_ID}
          className="mt-4 overflow-hidden rounded-xl bg-black aspect-square"
        />

        {starting && !error && (
          <p className="mt-3 text-center text-xs text-slate-400">Запуск камеры…</p>
        )}
        {error && (
          <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200 break-words">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button type="button" className="button-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
