import { useEffect, useState } from "react";
import { getAnalyticsSummary } from "../lib/api";
import { humanizeError } from "../lib/errors";
import type { AnalyticsSummary } from "../types/product";
import { MetricGridSkeleton } from "../components/Skeleton";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAnalyticsSummary()
      .then((data) => { if (!cancelled) { setAnalytics(data); setError(""); } })
      .catch((exception) => {
        if (!cancelled) {
          setError(humanizeError(exception, "Не удалось загрузить аналитику."));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <section className="panel">
        <h2 className="text-xl font-semibold">Аналитика</h2>
        <p className="mt-1 text-sm text-slate-400">Backend показывает кэшированные blockchain events и метаданные.</p>
      </section>
      {loading && <MetricGridSkeleton count={6} />}
      {!loading && error && (
        <div role="alert" className="panel border-red-500/40 text-sm text-red-300">
          <p className="break-words leading-snug">{error}</p>
        </div>
      )}
      {!loading && analytics && (
        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Метаданные продуктов" value={analytics.metadataRecords} />
          <Metric label="Кэш событий" value={analytics.cachedEvents} />
          <Metric label="Создания" value={analytics.createdEvents} />
          <Metric label="Передачи" value={analytics.transferEvents} />
          <Metric label="Статусы" value={analytics.statusEvents} />
          <Metric label="Отзывы" value={analytics.recallEvents} />
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}
