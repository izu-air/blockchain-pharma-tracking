import { BarChart3, FilePlus2, History, LayoutDashboard, LogIn, PackageCheck, Send, ShieldAlert } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { hasAnyRole, type Role } from "../lib/roles";

interface Item {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];   // empty = public
  guestOnly?: boolean;
}

/**
 * Mobile-first bottom navigation.  Picks 4–5 most relevant destinations
 * for the current user (guest → home + verify + login; participant →
 * role-matched primary actions).  Hidden on md+ where the sidebar lives.
 */
const ITEMS: Item[] = [
  { to: "/",          label: "Главная",  icon: LayoutDashboard, roles: [] },
  { to: "/verify",    label: "Проверка", icon: PackageCheck,    roles: [] },
  { to: "/register",  label: "Создать",  icon: FilePlus2,       roles: ["MANUFACTURER","ADMIN"] },
  { to: "/transfer",  label: "Передать", icon: Send,            roles: ["MANUFACTURER","DISTRIBUTOR","PHARMACY","ADMIN"] },
  { to: "/recall",    label: "Отзыв",    icon: ShieldAlert,     roles: ["REGULATOR","ADMIN"] },
  { to: "/analytics", label: "Метрики",  icon: BarChart3,       roles: ["MANUFACTURER","DISTRIBUTOR","PHARMACY","REGULATOR","ADMIN"] },
  { to: "/history",   label: "История",  icon: History,         roles: ["MANUFACTURER","DISTRIBUTOR","PHARMACY","REGULATOR","ADMIN"] },
  { to: "/login",     label: "Войти",    icon: LogIn,           roles: [], guestOnly: true }
];

export function BottomNav() {
  const auth = useAuth();
  const wallet = useWallet();

  const userRoles: Role[] = [
    ...(auth.backendRole ? [auth.backendRole] : []),
    ...wallet.roles
  ];

  const visible = ITEMS.filter((item) => {
    if (item.guestOnly) return !auth.isAuthenticated;
    if (item.roles.length === 0) return true;
    return hasAnyRole(userRoles, item.roles);
  })
    .slice(0, 5); // keep room for thumbs

  if (visible.length === 0) return null;

  return (
    <nav
      role="navigation"
      aria-label="Мобильная навигация"
      className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-950/95 backdrop-blur md:hidden"
    >
      <ul className="grid grid-flow-col">
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="contents">
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition
                   ${isActive
                     ? "text-emerald-300"
                     : "text-slate-400 hover:text-white"}`
                }
              >
                <Icon size={18} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
