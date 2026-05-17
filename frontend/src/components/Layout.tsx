import {
  Activity, BarChart3, Factory, FilePlus2, History, LayoutDashboard,
  LogIn, Menu, PackageCheck, Send, ShieldAlert, Store, Truck, X
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useWallet } from "./WalletContext";
import { WalletConnector } from "./WalletConnector";
import type { Role } from "../lib/roles";
import { hasAnyRole } from "../lib/roles";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Empty = visible to everyone (public link); otherwise restrict to roles. */
  roles: Role[];
}

const NAV: NavItem[] = [
  { to: "/",             label: "Главная",       icon: LayoutDashboard, roles: [] },
  { to: "/verify",       label: "Проверка",      icon: PackageCheck,    roles: [] },
  { to: "/login",        label: "Вход",          icon: LogIn,           roles: [] },
  { to: "/manufacturer", label: "Производитель", icon: Factory,         roles: ["MANUFACTURER", "ADMIN"] },
  { to: "/register",     label: "Регистрация",   icon: FilePlus2,       roles: ["MANUFACTURER", "ADMIN"] },
  { to: "/distributor",  label: "Дистрибьютор",  icon: Truck,           roles: ["DISTRIBUTOR", "ADMIN"] },
  { to: "/pharmacy",     label: "Аптека",        icon: Store,           roles: ["PHARMACY", "ADMIN"] },
  { to: "/transfer",     label: "Передача",      icon: Send,            roles: ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "ADMIN"] },
  { to: "/recall",       label: "Отзыв",         icon: ShieldAlert,     roles: ["REGULATOR", "ADMIN"] },
  { to: "/history",      label: "История",       icon: History,         roles: ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"] },
  { to: "/analytics",    label: "Аналитика",     icon: BarChart3,       roles: ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"] }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { roles, address } = useWallet();

  // If no wallet connected → show only public links (Главная, Проверка, Вход).
  // If connected → show public links + role-matched links.
  const visibleNav = NAV.filter((item) => {
    if (item.roles.length === 0) return true;
    if (!address) return false;
    return hasAnyRole(roles, item.roles);
  });

  return (
    <div className="min-h-screen bg-app text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="button-ghost md:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label="toggle-menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="brand-icon shrink-0">
              <Activity size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold md:text-lg">PharmaChain Trace</h1>
              <p className="hidden text-xs text-slate-400 sm:block md:text-sm">
                Blockchain pharmaceutical supply-chain platform
              </p>
            </div>
          </div>
          <WalletConnector />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className={`${mobileOpen ? "block" : "hidden"} panel-dark md:block`}>
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Навигация</p>
          <nav className="space-y-1">
            {visibleNav.map((link) => {
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
          {address && roles.length === 0 && (
            <p className="mt-4 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-200">
              У вашего кошелька нет назначенных on-chain ролей. Обратитесь к администратору.
            </p>
          )}
        </aside>

        <main className="min-w-0 space-y-6">{children}</main>
      </div>
    </div>
  );
}
