import { Blocks, Database, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { getAnalyticsSummary } from "../lib/api";
import type { AnalyticsSummary } from "../types/product";

const cards = [
  {
    title: "Blockchain",
    text: "Контракт хранит владельца, статус и историю продукта.",
    icon: Blocks
  },
  {
    title: "MetaMask",
    text: "Пользователь подписывает операции своим кошельком.",
    icon: ShieldCheck
  },
  {
    title: "Supply chain",
    text: "Производитель, дистрибьютор и аптека передают продукт друг другу.",
    icon: Truck
  },
  {
    title: "Backend",
    text: "PostgreSQL хранит только дополнительные метаданные.",
    icon: Database
  }
];

const roleFlows = [
  ["Производитель", "Создает партии и регистрирует продукты в конкретной партии."],
  ["Дистрибьютор", "Получает продукт, передает его дальше и фиксирует доставку."],
  ["Аптека", "Получает препарат и только она может отметить его как проданный."],
  ["Регулятор", "Отзывает партии при нарушениях и блокирует дальнейшую продажу."],
  ["Потребитель", "Проверяет подлинность, владельца, срок годности и recall-статус."]
];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    getAnalyticsSummary().then(setAnalytics).catch(() => setAnalytics(null));
  }, []);

  return (
    <div className="space-y-6">
      <section className="panel">
        <h2 className="text-2xl font-semibold">Панель управления</h2>
        <p className="mt-2 max-w-3xl text-stone-600">
          MVP демонстрирует, как блокчейн может использоваться для прозрачного отслеживания лекарств.
          Основные действия выполняются через smart contract, а backend дополняет систему справочными данными.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="panel">
              <Icon className="mb-3 text-primary" size={24} />
              <h3 className="font-semibold">{card.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{card.text}</p>
            </div>
          );
        })}
      </section>

      {analytics && (
        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Метаданные" value={analytics.metadataRecords} />
          <Metric label="Кэш событий" value={analytics.cachedEvents} />
          <Metric label="Отзывов" value={analytics.recallEvents} />
        </section>
      )}

      <section className="panel">
        <h2 className="text-xl font-semibold">Ролевые сценарии</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {roleFlows.map(([role, text]) => (
            <div key={role} className="rounded-md border border-stone-200 p-3">
              <h3 className="font-medium">{role}</h3>
              <p className="mt-1 text-sm text-stone-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
