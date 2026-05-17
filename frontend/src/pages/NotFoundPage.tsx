import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="panel text-center">
      <h1 className="mb-2 text-3xl font-semibold text-slate-100">404</h1>
      <p className="mb-6 text-slate-400">Страница не найдена.</p>
      <Link to="/" className="text-emerald-400 hover:underline">
        Вернуться на главную
      </Link>
    </div>
  );
}
