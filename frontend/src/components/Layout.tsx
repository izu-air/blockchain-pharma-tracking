import { Activity, BarChart3, Factory, FilePlus2, History, LayoutDashboard, LogIn, Menu, PackageCheck, Send, ShieldAlert, Store, Truck, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { WalletConnector } from "./WalletConnector";

const links = [
  { to: "/", label: "Главная", icon: LayoutDashboard },
  { to: "/manufacturer", label: "Производитель", icon: Factory },
  { to: "/distributor", label: "Дистрибьютор", icon: Truck },
  { to: "/pharmacy", label: "Аптека", icon: Store },
  { to: "/register", label: "Регистрация", icon: FilePlus2 },
  { to: "/transfer", label: "Передача", icon: Send },
  { to: "/recall", label: "Отзыв", icon: ShieldAlert },
  { to: "/history", label: "История", icon: History },
  { to: "/verify", label: "Проверка", icon: PackageCheck },
  { to: "/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/login", label: "Вход", icon: LogIn }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              className="button-ghost md:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label="toggle-menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="brand-icon">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-base font-semibold md:text-lg">PharmaChain Trace</h1>
              <p className="text-xs text-slate-400 md:text-sm">Blockchain pharmaceutical supply-chain platform</p>
            </div>
          </div>
          <WalletConnector />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[260px_1fr]">
        <aside className={`${mobileOpen ? "block" : "hidden"} panel-dark md:block`}>
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Навигация</p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "nav-link-active" : "nav-link-idle"}`
                  }
                >
                  <Icon size={16} />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
