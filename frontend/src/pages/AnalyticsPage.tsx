import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertOctagon, BarChart3, FilePlus2, Package, Send, Settings2
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { getAnalyticsDaily, getAnalyticsSummary } from "../lib/api";
import { humanizeError } from "../lib/errors";
import type { AnalyticsDaily, AnalyticsSummary } from "../types/product";
import {
  Alert, Card, CardHeader, KpiCard, MetricGridSkeleton, PageHeader
} from "../components/ui";

type Period = 7 | 30 | 365;

const COLORS = {
  blue:   "#60a5fa",
  green:  "#34d399",
  amber:  "#fbbf24",
  red:    "#f87171",
  slate:  "#94a3b8"
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>(30);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [daily, setDaily] = useState<AnalyticsDaily | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getAnalyticsSummary(), getAnalyticsDaily(period)])
      .then(([s, d]) => {
        if (!cancelled) { setSummary(s); setDaily(d); setError(""); }
      })
      .catch((exception) => {
        if (!cancelled) setError(humanizeError(exception, "Не удалось загрузить аналитику."));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Аналитика"
        description="Сводка по off-chain кэшу blockchain events. Графики обновляются при выборе другого периода."
        icon={<BarChart3 size={18} aria-hidden="true" />}
        actions={<PeriodSwitch period={period} onChange={setPeriod} />}
      />

      {loading && <MetricGridSkeleton count={6} />}

      {!loading && error && (
        <Alert tone="danger" title="Не удалось загрузить аналитику">
          {error}
        </Alert>
      )}

      {!loading && summary && <KpiStrip summary={summary} />}

      {!loading && daily && (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Транзакции по дням" eyebrow={`За последние ${daily.window} дн.`} />
            <div className="h-72"><DailyLineChart daily={daily} /></div>
          </Card>
          <Card>
            <CardHeader title="События по типам" eyebrow={`За последние ${daily.window} дн.`} />
            <div className="h-72"><ByTypeBarChart daily={daily} /></div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader
              title="Доли событий"
              eyebrow="Жизненный цикл vs регуляторские вмешательства"
            />
            <div className="h-72"><CategoryDonut daily={daily} /></div>
          </Card>
        </section>
      )}
    </div>
  );
}

function PeriodSwitch({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const options: { value: Period; label: string }[] = [
    { value: 7,   label: "7 дн." },
    { value: 30,  label: "30 дн." },
    { value: 365, label: "Всё время" }
  ];
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-slate-950/50 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`rounded-md px-3 py-1 text-sm transition ${
            period === option.value
              ? "bg-emerald-500/20 text-emerald-200"
              : "text-slate-300 hover:text-slate-100"
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function KpiStrip({ summary }: { summary: AnalyticsSummary }) {
  const items = [
    { label: "Метаданные продуктов", value: summary.metadataRecords, icon: <Package size={18} />,      tone: "sky"     as const },
    { label: "Всего событий",        value: summary.cachedEvents,    icon: <Activity size={18} />,     tone: "emerald" as const },
    { label: "Создания",             value: summary.createdEvents,   icon: <FilePlus2 size={18} />,    tone: "emerald" as const },
    { label: "Передачи",             value: summary.transferEvents,  icon: <Send size={18} />,         tone: "sky"     as const },
    { label: "Смена статуса",        value: summary.statusEvents,    icon: <Settings2 size={18} />,    tone: "amber"   as const },
    { label: "Отзывы / блокировки",  value: summary.recallEvents,    icon: <AlertOctagon size={18} />, tone: "rose"    as const }
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <KpiCard
          key={item.label}
          label={item.label}
          value={item.value.toLocaleString("ru-RU")}
          icon={item.icon}
          tone={item.tone}
        />
      ))}
    </section>
  );
}

function DailyLineChart({ daily }: { daily: AnalyticsDaily }) {
  const data = useMemo(
    () => daily.buckets.map((bucket) => ({
      date: bucket.date.slice(5), // MM-DD for compactness
      Всего: bucket.total
    })),
    [daily]
  );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
        <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          labelStyle={{ color: "#cbd5e1" }}
        />
        <Line
          type="monotone"
          dataKey="Всего"
          stroke={COLORS.blue}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ByTypeBarChart({ daily }: { daily: AnalyticsDaily }) {
  // Aggregate over the whole window — one bar per event category.
  const data = useMemo(() => {
    const total = daily.buckets.reduce(
      (acc, bucket) => {
        acc.created     += bucket.created;
        acc.transferred += bucket.transferred;
        acc.status      += bucket.status;
        acc.recalled    += bucket.recalled;
        return acc;
      },
      { created: 0, transferred: 0, status: 0, recalled: 0 }
    );
    return [
      { name: "Создание",   count: total.created,     fill: COLORS.green },
      { name: "Передача",   count: total.transferred, fill: COLORS.blue },
      { name: "Статус",     count: total.status,      fill: COLORS.amber },
      { name: "Recall/Block", count: total.recalled,  fill: COLORS.red }
    ];
  }, [daily]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
        <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          labelStyle={{ color: "#cbd5e1" }}
        />
        <Bar dataKey="count" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function CategoryDonut({ daily }: { daily: AnalyticsDaily }) {
  const data = useMemo(() => {
    const lifecycle = daily.buckets.reduce(
      (acc, bucket) => acc + bucket.created + bucket.transferred + bucket.status,
      0
    );
    const intervention = daily.buckets.reduce(
      (acc, bucket) => acc + bucket.recalled,
      0
    );
    return [
      { name: "Жизненный цикл (создание, передача, статус)", value: lifecycle, fill: COLORS.green },
      { name: "Регуляторские вмешательства (recall / block)", value: intervention, fill: COLORS.red }
    ];
  }, [daily]);

  const allZero = data.every((slice) => slice.value === 0);
  if (allZero) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Событий за выбранный период не было.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((slice, index) => (
            <Cell key={index} fill={slice.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          labelStyle={{ color: "#cbd5e1" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#cbd5e1" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
