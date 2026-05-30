import {
  AlertTriangle, BadgeCheck, CalendarX2, CheckCircle2, FileWarning,
  ScanLine, ShieldAlert, ShieldCheck, ShieldQuestion, XCircle
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "./ui/Badge";
import { formatBlockchainDate } from "../lib/status";
import { ROLE_LABEL_RU } from "../lib/roles";
import type { VerificationResult, ExtendedProductStatus } from "../types/product";
import { STATUS_LABELS_RU } from "../lib/validation";

/**
 * Three independent trust signals the consumer must understand
 * separately — bundling them as a single "Подлинно / Не подлинно"
 * badge is misleading, especially for pharma.
 */
export type SignatureTrust = "signed-verified" | "signed-invalid" | "unsigned-legacy" | "unknown";

interface Props {
  /** On-chain verification result returned by SupplyChain.verifyProduct. */
  result: VerificationResult | null;
  /** Whether the on-chain product record exists at all (e.g. lookup error). */
  productFound: boolean;
  /** Trust level of the QR signature itself (not the on-chain record). */
  qrTrust: SignatureTrust;
  /** Status from on-chain product struct. */
  status?: ExtendedProductStatus;
  serialNumber?: string;
  /** Whether the QR was loaded from a URL with nonce+ts metadata. */
  qrTimestamp?: number;
  /** Children rendered at the bottom (timeline, expand action, etc.). */
  children?: ReactNode;
}

/**
 * Three-stage trust card for /verify.  Each stage is independent and
 * explicitly labelled — we never claim the physical package is
 * authentic, only that an on-chain record exists for this serial.
 */
export function VerificationCard({
  result, productFound, qrTrust, status, serialNumber, qrTimestamp, children
}: Props) {
  // ── Aggregate verdict ─────────────────────────────────────────────────
  const verdict = computeVerdict({ result, productFound, qrTrust });

  return (
    <div className={`panel border-l-4 ${verdict.borderClass}`} role="region" aria-label="Результат верификации">
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`shrink-0 rounded-xl p-2 ${verdict.iconBgClass}`} aria-hidden="true">
            {verdict.icon}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight text-slate-50 sm:text-lg">
              {verdict.headline}
            </h2>
            <p className="mt-1 text-sm leading-snug text-slate-300">{verdict.summary}</p>
            {serialNumber && (
              <p className="mt-2 break-all font-mono text-xs text-slate-500">
                Серийный номер: {serialNumber}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <Badge tone={verdict.badgeTone}>{verdict.badgeLabel}</Badge>
        </div>
      </header>

      {/* ── Three-row trust grid ────────────────────────────────────── */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <TrustRow
          icon={<ShieldCheck size={16} />}
          label="Запись в блокчейне"
          state={productFound ? "ok" : "fail"}
          okText="Найдена"
          failText="Не найдена"
          hint="Серийный номер существует в неизменяемом on-chain реестре производителя."
        />
        <TrustRow
          icon={<ScanLine size={16} />}
          label="Подпись QR-кода"
          state={qrTrustToState(qrTrust)}
          okText={qrTrust === "signed-verified" ? "Подписан производителем" : "Действителен"}
          failText={qrTrust === "signed-invalid" ? "Подпись неверна" : "Без подписи (legacy)"}
          warningText={qrTrust === "unsigned-legacy" ? "Без подписи (legacy)" : undefined}
          hint={qrTrustHint(qrTrust)}
        />
        <TrustRow
          icon={<BadgeCheck size={16} />}
          label="Физическая упаковка"
          state="warning"
          okText="—"
          warningText="Невозможно проверить онлайн"
          hint="Реестр и QR не подтверждают, что физическая упаковка не является копией. Проверьте hologram / NFC / тампер-сильную пломбу."
        />
      </div>

      {/* ── Lifecycle flags ────────────────────────────────────────── */}
      {result && (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {result.recalled && (
            <FlagRow tone="danger" icon={<ShieldAlert size={14} />}
              label="Партия отозвана"
              text="Регулятор объявил отзыв. Не используйте препарат." />
          )}
          {result.expired && (
            <FlagRow tone="danger" icon={<CalendarX2 size={14} />}
              label="Срок годности истёк"
              text={`Партия годна до ${formatBlockchainDate(result.expirationDate)}.`} />
          )}
          {result.blocked && !result.recalled && (
            <FlagRow tone="warning" icon={<FileWarning size={14} />}
              label="Заблокирован"
              text="Отдельная единица заблокирована регулятором." />
          )}
          {status !== undefined && (
            <FlagRow tone="neutral" icon={<CheckCircle2 size={14} />}
              label="Текущий статус"
              text={STATUS_LABELS_RU[status]} />
          )}
          <FlagRow tone="neutral" icon={<BadgeCheck size={14} />}
            label="Текущий владелец"
            text={result.currentOwner
              ? <span className="font-mono">{shortAddr(result.currentOwner)}</span>
              : "—"} />
          {qrTimestamp && (
            <FlagRow tone="neutral" icon={<ScanLine size={14} />}
              label="QR выпущен"
              text={new Date(qrTimestamp * 1000).toLocaleString("ru-RU")} />
          )}
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}

      {/* ── Plain-language disclaimer ─────────────────────────────── */}
      <p className="mt-5 rounded-lg bg-slate-950/50 p-3 text-[12px] leading-snug text-slate-400">
        <strong className="text-slate-300">Что эта проверка делает.</strong>{" "}
        Подтверждает, что серийный номер с упаковки совпадает с записью
        в публичном блокчейн-реестре производителя, и показывает текущий статус
        партии. <strong className="text-slate-300">Что НЕ делает.</strong>{" "}
        Не гарантирует, что физическая упаковка — оригинальная, а не точная
        копия. При любых сомнениях обратитесь в аптеку.
      </p>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────
type Verdict = {
  headline: string;
  summary: string;
  borderClass: string;
  iconBgClass: string;
  icon: React.ReactNode;
  badgeTone: "emerald" | "amber" | "red";
  badgeLabel: string;
};

function computeVerdict({
  result, productFound, qrTrust
}: {
  result: VerificationResult | null;
  productFound: boolean;
  qrTrust: SignatureTrust;
}): Verdict {
  if (!productFound) {
    return {
      headline: "Подделка или ошибка ввода",
      summary: "Серийный номер не найден в блокчейн-реестре. Не используйте препарат — обратитесь в аптеку.",
      borderClass: "border-red-500",
      iconBgClass: "bg-red-500/15 text-red-300",
      icon: <XCircle size={20} />,
      badgeTone: "red",
      badgeLabel: "Не найдено"
    };
  }
  if (result?.recalled || result?.expired || result?.blocked) {
    return {
      headline: "Запись найдена, но использовать нельзя",
      summary: result.recalled
        ? "Партия отозвана регулятором."
        : result.expired
          ? "Срок годности истёк."
          : "Препарат заблокирован регулятором.",
      borderClass: "border-red-500",
      iconBgClass: "bg-red-500/15 text-red-300",
      icon: <ShieldAlert size={20} />,
      badgeTone: "red",
      badgeLabel: "Не использовать"
    };
  }
  if (qrTrust === "signed-invalid") {
    return {
      headline: "Запись есть, но подпись QR неверна",
      summary: "Серийный номер существует в реестре, но цифровая подпись на QR-коде не сходится. Возможна подмена QR. Проверьте физические защитные элементы.",
      borderClass: "border-amber-500",
      iconBgClass: "bg-amber-500/15 text-amber-300",
      icon: <ShieldQuestion size={20} />,
      badgeTone: "amber",
      badgeLabel: "Внимание"
    };
  }
  if (qrTrust === "unsigned-legacy") {
    return {
      headline: "Запись подтверждена (legacy QR)",
      summary: "Серийный номер существует в неизменяемом on-chain реестре, партия не отозвана, срок не истёк. QR-код выпущен в legacy-формате без подписи производителя.",
      borderClass: "border-emerald-500",
      iconBgClass: "bg-emerald-500/15 text-emerald-300",
      icon: <CheckCircle2 size={20} />,
      badgeTone: "emerald",
      badgeLabel: "В реестре"
    };
  }
  // signed-verified
  return {
    headline: "Запись подтверждена, QR подписан",
    summary: "Серийный номер существует в реестре и QR-код подписан производителем. Партия не отозвана, срок не истёк.",
    borderClass: "border-emerald-500",
    iconBgClass: "bg-emerald-500/15 text-emerald-300",
    icon: <CheckCircle2 size={20} />,
    badgeTone: "emerald",
    badgeLabel: "Подтверждено"
  };
}

function qrTrustToState(t: SignatureTrust): "ok" | "fail" | "warning" {
  if (t === "signed-verified") return "ok";
  if (t === "signed-invalid")  return "fail";
  if (t === "unsigned-legacy") return "warning";
  return "warning";
}

function qrTrustHint(t: SignatureTrust): string {
  switch (t) {
    case "signed-verified":
      return "QR-код подписан кошельком производителя; подделать его без приватного ключа невозможно.";
    case "signed-invalid":
      return "QR содержит подпись, но она не соответствует адресу производителя на чейне. Возможна подмена QR-кода.";
    case "unsigned-legacy":
      return "QR не содержит подпись (legacy-формат). Доверяйте только on-chain записи и физическим защитным элементам упаковки.";
    default:
      return "Не удалось определить тип QR-кода.";
  }
}

function shortAddr(a: string) {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

function TrustRow({
  icon, label, state, okText, failText, warningText, hint
}: {
  icon: React.ReactNode;
  label: string;
  state: "ok" | "fail" | "warning";
  okText: string;
  failText?: string;
  warningText?: string;
  hint?: string;
}) {
  const palette =
    state === "ok"      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" :
    state === "warning" ? "border-amber-500/30  bg-amber-500/10  text-amber-200" :
                          "border-red-500/40    bg-red-500/10    text-red-200";
  const StatusIcon =
    state === "ok" ? CheckCircle2 :
    state === "warning" ? AlertTriangle :
    XCircle;
  const valueText =
    state === "ok"      ? okText :
    state === "warning" ? (warningText ?? okText) :
                          (failText ?? "Ошибка");
  return (
    <div className={`rounded-lg border p-3 text-sm ${palette}`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 font-semibold">
        <StatusIcon size={14} aria-hidden="true" />
        {valueText}
      </div>
      {hint && <p className="mt-1.5 text-[11px] leading-snug opacity-75">{hint}</p>}
    </div>
  );
}

function FlagRow({
  tone, icon, label, text
}: {
  tone: "neutral" | "warning" | "danger";
  icon: React.ReactNode;
  label: string;
  text: React.ReactNode;
}) {
  const palette =
    tone === "danger"  ? "border-red-500/40 bg-red-500/10 text-red-200" :
    tone === "warning" ? "border-amber-500/30 bg-amber-500/10 text-amber-200" :
                         "border-white/10 bg-slate-950/30 text-slate-200";
  return (
    <div className={`rounded-lg border p-2.5 ${palette}`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 break-words font-medium">{text}</div>
    </div>
  );
}

// silence unused for tree-shaking re-exports
export const _internal = { Badge, ROLE_LABEL_RU };
