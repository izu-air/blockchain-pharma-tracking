import { Factory, PackagePlus } from "lucide-react";
import { Link } from "react-router-dom";

export default function ManufacturerDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="flex items-center gap-3">
          <Factory className="text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Кабинет производителя</h2>
            <p className="text-sm text-slate-400">Создание партий, регистрация серийных номеров и выпуск QR-кодов.</p>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Action title="Создать партию и продукт" text="Записать batch hash, срок годности и serial number в smart contract." to="/register" />
        <Action title="Проверить продукт" text="Открыть consumer view и убедиться, что история видна публично." to="/verify" />
      </section>
    </div>
  );
}

function Action({ title, text, to }: { title: string; text: string; to: string }) {
  return (
    <Link className="panel block hover:border-primary" to={to}>
      <PackagePlus className="mb-3 text-primary" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{text}</p>
    </Link>
  );
}
