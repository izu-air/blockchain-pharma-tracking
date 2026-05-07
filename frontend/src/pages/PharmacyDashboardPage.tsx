import { BadgeCheck, Store } from "lucide-react";
import { Link } from "react-router-dom";

export default function PharmacyDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="flex items-center gap-3">
          <Store className="text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Кабинет аптеки</h2>
            <p className="text-sm text-stone-600">Аптека подтверждает доставку и только она может отметить продукт как проданный.</p>
          </div>
        </div>
      </section>
      <Link className="panel block hover:border-primary" to="/transfer">
        <BadgeCheck className="mb-3 text-primary" />
        <h3 className="font-semibold">Обновить статус</h3>
        <p className="mt-1 text-sm text-stone-600">Перед продажей контракт проверит, что партия не отозвана.</p>
      </Link>
    </div>
  );
}
