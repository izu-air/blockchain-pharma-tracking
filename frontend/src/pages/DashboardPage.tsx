import { ArrowRight, Blocks, Database, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAnalyticsSummary } from "../lib/api";
import type { AnalyticsSummary } from "../types/product";
import { MetricGridSkeleton } from "../components/Skeleton";

const cards = [
  { title: "Smart contract", text: "Хранит lifecycle, владельца, статус отзыва и неизменяемую историю.", icon: Blocks },
  { title: "Wallet signature", text: "Каждое критичное действие подтверждается подписью через MetaMask.", icon: ShieldCheck },
  { title: "Traceability", text: "Маршрут препарата прозрачен для производителей, дистрибьюторов, аптек и регулятора.", icon: Truck },
  { title: "Off-chain metadata", text: "Backend хранит расширенные атрибуты и ускоряет аналитику без потери trust layer.", icon: Database }
];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAnalyticsSummary()
      .then((data) => { if (!cancelled) { setAnalytics(data); setFailed(false); } })
      .catch(() => { if (!cancelled) { setAnalytics(null); setFailed(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Diploma-ready platform</p>
        <h2 className="mt-2 text-3xl font-semibold">Профессиональная система отслеживания фармцепочки</h2>
        <p className="mt-3 max-w-3xl text-slate-300">
          Платформа демонстрирует реальную blockchain-ценность: anti-counterfeit верификацию, события поставок,
          контроль отзывов партий и публичную проверку подлинности по QR-коду.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="button" to="/verify">Проверить продукт</Link>
          <Link className="button-secondary" to="/register">Зарегистрировать партию <ArrowRight size={16} /></Link>
        </div>
      </section>

      {loading && <MetricGridSkeleton count={4} />}
      {!loading && analytics && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Metadata records" value={analytics.metadataRecords} />
          <Metric label="Cached events" value={analytics.cachedEvents} />
          <Metric label="Recall events" value={analytics.recallEvents} />
          <Metric label="System health" value="Operational" />
        </section>
      )}
      {!loading && failed && (
        <div className="panel text-sm text-slate-400">
          Аналитика недоступна (backend не отвечает или эндпоинт защищён).
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="panel">
              <div className="mb-4 inline-flex rounded-lg bg-emerald-500/20 p-2 text-emerald-300"><Icon size={20} /></div>
              <h3 className="font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{card.text}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="panel">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-emerald-300">{value}</p>
    </div>
  );
}
