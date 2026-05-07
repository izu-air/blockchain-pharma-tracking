import { useEffect, useState } from "react";
import { getAnalyticsSummary } from "../lib/api";
import type { AnalyticsSummary } from "../types/product";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalyticsSummary().then(setAnalytics).catch((exception) => {
      setError(exception instanceof Error ? exception.message : "Не удалось загрузить аналитику");
    });
  }, []);

  return (
    <div className="space-y-6">
      <section className="panel">
        <h2 className="text-xl font-semibold">Аналитика</h2>
        <p className="mt-1 text-sm text-stone-600">Backend показывает кэшированные blockchain events и метаданные.</p>
      </section>
      {error && <div className="panel text-sm text-red-600">{error}</div>}
      {analytics && (
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
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}
