import { Blocks, Database, ShieldCheck, Truck } from "lucide-react";

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

export default function DashboardPage() {
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
    </div>
  );
}
