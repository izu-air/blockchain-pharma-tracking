import { Send, Truck } from "lucide-react";
import { Link } from "react-router-dom";

export default function DistributorDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="flex items-center gap-3">
          <Truck className="text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Кабинет дистрибьютора</h2>
            <p className="text-sm text-slate-400">Передача продуктов и фиксация статусов доставки в блокчейне.</p>
          </div>
        </div>
      </section>
      <Link className="panel block hover:border-primary" to="/transfer">
        <Send className="mb-3 text-primary" />
        <h3 className="font-semibold">Передать продукт</h3>
        <p className="mt-1 text-sm text-slate-400">Только текущий владелец с разрешенной ролью может выполнить передачу.</p>
      </Link>
    </div>
  );
}
