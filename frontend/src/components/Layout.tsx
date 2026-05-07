import { Activity, FilePlus2, History, LayoutDashboard, PackageCheck, Send } from "lucide-react";
import { NavLink } from "react-router-dom";
import { WalletConnector } from "./WalletConnector";

const links = [
  { to: "/", label: "Панель", icon: LayoutDashboard },
  { to: "/register", label: "Регистрация", icon: FilePlus2 },
  { to: "/transfer", label: "Передача", icon: Send },
  { to: "/history", label: "История", icon: History },
  { to: "/verify", label: "Проверка", icon: PackageCheck }
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
              <Activity size={22} />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Фармацевтическая цепочка поставок</h1>
              <p className="text-sm text-stone-600">Демонстрационный blockchain MVP</p>
            </div>
          </div>
          <WalletConnector />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <nav className="panel h-fit p-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                    isActive ? "bg-green-50 font-medium text-primary" : "text-stone-700 hover:bg-stone-50"
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
