import { BarChart3, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAnalyticsSummary } from "../lib/api";
import { humanizeError } from "../lib/errors";
import type { AnalyticsSummary } from "../types/product";

export default function RegulatorDashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setAnalytics(await getAnalyticsSummary());
      } catch (exception) {
        setError(humanizeError(exception, "Не удалось загрузить аналитику."));
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Кабинет регулятора</h2>
            <p className="text-sm text-slate-400">Надзор, отзыв партий, аналитика off-chain кэша событий.</p>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="panel border-red-500/40 text-sm text-red-300">
          <p className="break-words leading-snug">{error}</p>
        </div>
      )}

      {analytics && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Продукты (metadata)" value={analytics.metadataRecords} />
          <Stat label="Передачи" value={analytics.transferEvents} />
          <Stat label="Отзывы" value={analytics.recallEvents} />
          <Stat label="Всего событий" value={analytics.cachedEvents} />
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Link className="panel block hover:border-primary" to="/recall">
          <ShieldAlert className="mb-3 text-primary" />
          <h3 className="font-semibold">Отзыв / снятие отзыва</h3>
          <p className="mt-1 text-sm text-slate-400">On-chain recallBatch / unrecallBatch с записью в audit log.</p>
        </Link>
        <Link className="panel block hover:border-primary" to="/analytics">
          <BarChart3 className="mb-3 text-primary" />
          <h3 className="font-semibold">Полная аналитика</h3>
          <p className="mt-1 text-sm text-slate-400">Агрегаты из PostgreSQL (индексатор + ручные события).</p>
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-emerald-300">{value}</p>
    </div>
  );
}
