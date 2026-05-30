import { useEffect, useState } from "react";
import { Download, Filter, ScrollText, Search, X } from "lucide-react";
import { getAuditLogs, type AuditLogEntry, type AuditLogPage as Page } from "../lib/api";
import { humanizeError } from "../lib/errors";

type Filters = {
  action: string;
  wallet: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = { action: "", wallet: "", from: "", to: "" };

const PAGE_SIZE = 50;

const KNOWN_ACTIONS = [
  "",                              // "all"
  "USER_CREATED_BY_ADMIN",
  "USER_SELF_REGISTERED",
  "USER_CREATE_REJECTED",
  "AUTH_LOGIN_SUCCESS",
  "AUTH_LOGIN_FAILURE",
  "AUTH_NONCE_ISSUED",
  "PRODUCT_METADATA_CREATED",
  "PRODUCT_CREATED",
  "PRODUCT_TRANSFERRED",
  "STATUS_UPDATED",
  "BATCH_RECALLED",
  "BATCH_UNRECALLED",
  "PRODUCT_BLOCKED",
  "PRODUCT_UNBLOCKED",
  "INDEXER_RESET",
  "INDEXER_BACKFILL",
  "INDEXER_FAILURE",
  "INDEXER_RPC_ERROR",
  "INDEXER_LOG_SKIP"
];

export default function AuditLogPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter changes reset to page 0 — otherwise a user on page 7 sees
  // "no results" when the new filter has only 2 pages.
  useEffect(() => { setPage(0); }, [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAuditLogs({
      page, size: PAGE_SIZE,
      action: filters.action,
      wallet: filters.wallet,
      from: filters.from ? new Date(filters.from).toISOString() : "",
      to:   filters.to   ? new Date(filters.to).toISOString()   : ""
    })
      .then((response) => { if (!cancelled) { setData(response); setError(""); } })
      .catch((exception) => { if (!cancelled) setError(humanizeError(exception, "Не удалось загрузить журнал.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters, page]);

  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="flex items-center gap-3">
          <ScrollText className="text-primary" />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">Журнал аудита</h2>
            <p className="text-sm text-slate-400">
              Все события безопасности и бизнес-операции.  Кошельки хранятся
              в псевдонимизированном виде (HMAC-SHA256 с серверным pepper).
            </p>
          </div>
        </div>
      </section>

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
        currentPage={data}
      />

      {error && (
        <div role="alert" className="panel border-red-500/40 text-sm text-red-300">
          <p className="break-words leading-snug">{error}</p>
        </div>
      )}

      <section className="panel overflow-x-auto p-0">
        <LogTable rows={data?.content ?? []} loading={loading} />
      </section>

      {data && data.totalElements > 0 && (
        <Pager data={data} onPage={setPage} loading={loading} />
      )}
    </div>
  );
}

function FiltersPanel({
  filters, onChange, onReset, currentPage
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
  currentPage: Page | null;
}) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  function exportCsv() {
    if (!currentPage) return;
    const rows = currentPage.content.map((row) => [
      row.id, row.createdAt, row.actor, row.action,
      row.targetType, row.targetId, row.details
    ]);
    const csv = [
      ["id", "createdAt", "actor (HMAC)", "action", "targetType", "targetId", "details"],
      ...rows
    ]
      .map((columns) => columns.map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-page${currentPage.number + 1}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter size={14} className="text-slate-400" />
          Фильтры
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="button-secondary" onClick={onReset}>
            <X size={14} className="mr-1 inline" /> Сбросить
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={exportCsv}
            disabled={!currentPage || currentPage.content.length === 0}
            title="Экспортирует только текущую страницу"
          >
            <Download size={14} className="mr-1 inline" /> CSV
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Действие</span>
          <select
            className="input"
            value={filters.action}
            onChange={(event) => update({ action: event.target.value })}
          >
            {KNOWN_ACTIONS.map((action) => (
              <option key={action || "all"} value={action}>{action || "— любое —"}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Кошелёк (0x…)</span>
          <div className="relative">
            <input
              className="input pl-7"
              value={filters.wallet}
              onChange={(event) => update({ wallet: event.target.value })}
              placeholder="0x… (хешируется на сервере)"
              autoComplete="off"
              spellCheck={false}
            />
            <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">С даты</span>
          <input
            className="input"
            type="datetime-local"
            value={filters.from}
            onChange={(event) => update({ from: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">По дату</span>
          <input
            className="input"
            type="datetime-local"
            value={filters.to}
            onChange={(event) => update({ to: event.target.value })}
          />
        </label>
      </div>
    </section>
  );
}

function LogTable({ rows, loading }: { rows: AuditLogEntry[]; loading: boolean }) {
  if (loading && rows.length === 0) {
    return <div className="p-6 text-sm text-slate-400">Загрузка…</div>;
  }
  if (rows.length === 0) {
    return <div className="p-6 text-sm text-slate-500">По выбранным фильтрам записей нет.</div>;
  }
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-400">
        <tr>
          <th className="px-3 py-2">Время</th>
          <th className="px-3 py-2">Действие</th>
          <th className="px-3 py-2">Объект</th>
          <th className="px-3 py-2">ID</th>
          <th className="px-3 py-2">Актор (HMAC)</th>
          <th className="px-3 py-2">Подробности</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-white/5">
            <td className="px-3 py-2 align-top font-mono text-xs text-slate-300">
              {new Date(row.createdAt).toLocaleString("ru-RU")}
            </td>
            <td className="px-3 py-2 align-top">
              <span className={`rounded px-1.5 py-0.5 text-xs ${actionColour(row.action)}`}>
                {row.action}
              </span>
            </td>
            <td className="px-3 py-2 align-top text-slate-300">{row.targetType}</td>
            <td className="px-3 py-2 align-top break-all font-mono text-xs">{row.targetId}</td>
            <td className="px-3 py-2 align-top break-all font-mono text-[11px] text-slate-400" title="HMAC-SHA256, не оригинальный wallet">
              {row.actor}
            </td>
            <td className="px-3 py-2 align-top text-xs text-slate-300">
              <span className="break-words">{row.details}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Pager({
  data, onPage, loading
}: {
  data: Page;
  onPage: (p: number) => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-400">
      <div>
        Стр. <span className="font-semibold text-slate-200">{data.number + 1}</span>{" "}
        / {Math.max(1, data.totalPages)} — всего записей: {data.totalElements}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="button-secondary"
          disabled={loading || data.number <= 0}
          onClick={() => onPage(Math.max(0, data.number - 1))}
        >
          ← Назад
        </button>
        <button
          type="button"
          className="button-secondary"
          disabled={loading || data.number + 1 >= data.totalPages}
          onClick={() => onPage(data.number + 1)}
        >
          Дальше →
        </button>
      </div>
    </div>
  );
}

function actionColour(action: string): string {
  if (action.endsWith("_FAILURE") || action.endsWith("_REJECTED") || action.endsWith("_ERROR")) {
    return "bg-red-500/20 text-red-200";
  }
  if (action.startsWith("BATCH_RECALLED") || action.startsWith("PRODUCT_BLOCKED")) {
    return "bg-amber-500/20 text-amber-200";
  }
  if (action.startsWith("AUTH_") || action.startsWith("USER_")) {
    return "bg-sky-500/20 text-sky-200";
  }
  return "bg-slate-500/20 text-slate-200";
}

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// keep tree-shake quiet for icons referenced only in TSX
const _icons = [Download, Filter, ScrollText, Search, X];
void _icons;
