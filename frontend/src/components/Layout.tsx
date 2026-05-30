import {
  Activity, BarChart3, Factory, FilePlus2, History, LayoutDashboard,
  LogIn, Menu, PackageCheck, ScrollText, Send, ShieldAlert, ShieldCheck,
  Store, Truck, X
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { hasAnyRole, type Role } from "../lib/roles";
import { BottomNav } from "./BottomNav";
import { WalletConnector } from "./WalletConnector";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  /**
   * Empty = visible to everyone (public).  Otherwise the link is shown
   * when EITHER the connected wallet's on-chain roles OR the JWT's
   * backend role intersect this allow-list (defense-in-depth UX).
   */
  roles: Role[];
}

export const NAV: NavItem[] = [
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
  { to: "/analytics",    label: "Аналитика",     icon: BarChart3,       roles: ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"] },
  { to: "/admin",        label: "Админ",         icon: ShieldCheck,     roles: ["ADMIN"] },
  { to: "/audit",        label: "Журнал аудита", icon: ScrollText,      roles: ["REGULATOR", "ADMIN"] }
];

/**
 * Pure function — exported for unit testing.  Returns the subset of
 * navigation entries visible to a user with the given backend (JWT) role
 * and on-chain wallet roles.
 */
export function filterNavLinks(
  items: NavItem[],
  backendRole: Role | null,
  walletRoles: Role[],
  hasWallet: boolean
): NavItem[] {
  return items.filter((item) => {
    if (item.roles.length === 0) return true;
    const backendMatch = backendRole != null && item.roles.includes(backendRole);
    const walletMatch = hasWallet && hasAnyRole(walletRoles, item.roles);
    return backendMatch || walletMatch;
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const wallet = useWallet();
  const auth = useAuth();
  const location = useLocation();

  const visibleNav = filterNavLinks(
    NAV, auth.backendRole, wallet.roles, Boolean(wallet.address)
  );

  // Auto-close the mobile drawer whenever the route changes so navigation
  // never leaves the menu stuck open over fresh content.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-app text-slate-100">
      {/* Keyboard accessibility — skip link is invisible until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-emerald-500 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
      >
        Перейти к содержимому
      </a>
      <header className="safe-top sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2.5 md:gap-3 md:px-4 md:py-4">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <button
              type="button"
              className="button-ghost md:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-drawer"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="brand-icon shrink-0">
              <Activity size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold sm:text-base md:text-lg">
                PharmaChain Trace
              </h1>
              <p className="hidden text-xs text-slate-400 sm:block md:text-sm">
                Blockchain pharmaceutical supply-chain platform
              </p>
            </div>
          </div>
          <WalletConnector />
        </div>
        {wallet.address && wallet.wrongChain && (
          <div className="border-t border-amber-500/40 bg-amber-950/40 px-4 py-2 text-xs text-amber-200">
            <span className="font-semibold">Внимание:</span> MetaMask в сети{" "}
            <span className="font-mono">{wallet.chainId}</span>; контракт
            развёрнут в сети <span className="font-mono">{wallet.expectedChainId}</span>.{" "}
            <button type="button" className="underline" onClick={() => void wallet.switchChain()}>
              Переключить
            </button>
          </div>
        )}
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 md:gap-6 md:grid-cols-[260px_minmax(0,1fr)] md:px-4 md:py-6">
        {/* Desktop sidebar — always visible on md+; on mobile this is the */}
        {/* hamburger-driven drawer (overflow menu for the long tail of   */}
        {/* nav items that don't fit into the 5-slot BottomNav).          */}
        <aside
          id="mobile-drawer"
          className={`${mobileOpen ? "block" : "hidden"} panel-dark md:block`}
        >
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Навигация</p>
          <nav className="space-y-1" aria-label="Полная навигация">
            {visibleNav.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "nav-link-active" : "nav-link-idle"}`
                  }
                >
                  <Icon size={16} aria-hidden="true" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
          {wallet.address && wallet.roles.length === 0 && !auth.backendRole && (
            <p className="mt-4 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-200">
              У вашего кошелька нет назначенных on-chain ролей и нет JWT.  Подключитесь
              как зарегистрированный участник, чтобы увидеть рабочие разделы.
            </p>
          )}
        </aside>

        {/* pb-20 keeps the last bit of content above the fixed BottomNav on */}
        {/* mobile; on md+ where BottomNav is hidden we drop the padding.    */}
        <main
          id="main-content"
          className="min-w-0 space-y-6 pb-20 md:pb-0"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
