import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Factory,
  FilePlus2,
  History,
  LayoutDashboard,
  LogIn,
  PackageCheck,
  Send,
  ShieldAlert,
  Store,
  Truck
} from "lucide-react";

export type NavRole = "MANUFACTURER" | "DISTRIBUTOR" | "PHARMACY" | "REGULATOR" | "CONSUMER" | "GUEST";

export type NavLinkDef = {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: NavRole[];
};

export const navLinks: NavLinkDef[] = [
  { to: "/", label: "Главная", icon: LayoutDashboard, roles: ["GUEST", "MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "CONSUMER"] },
  { to: "/manufacturer", label: "Производитель", icon: Factory, roles: ["MANUFACTURER", "REGULATOR"] },
  { to: "/distributor", label: "Дистрибьютор", icon: Truck, roles: ["DISTRIBUTOR", "REGULATOR"] },
  { to: "/pharmacy", label: "Аптека", icon: Store, roles: ["PHARMACY", "REGULATOR"] },
  { to: "/regulator", label: "Регулятор", icon: ShieldAlert, roles: ["REGULATOR"] },
  { to: "/register", label: "Регистрация", icon: FilePlus2, roles: ["MANUFACTURER"] },
  { to: "/transfer", label: "Передача", icon: Send, roles: ["DISTRIBUTOR", "PHARMACY", "MANUFACTURER"] },
  { to: "/recall", label: "Отзыв", icon: ShieldAlert, roles: ["REGULATOR"] },
  { to: "/history", label: "История", icon: History, roles: ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR"] },
  { to: "/verify", label: "Проверка", icon: PackageCheck, roles: ["GUEST", "MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "CONSUMER"] },
  { to: "/analytics", label: "Аналитика", icon: BarChart3, roles: ["REGULATOR", "MANUFACTURER"] },
  { to: "/login", label: "Вход", icon: LogIn, roles: ["GUEST", "MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR"] }
];

export function filterNavLinks(role: NavRole | null, walletRoles: string[]) {
  const effective: NavRole[] = [];
  if (role) {
    effective.push(role);
  }
  if (walletRoles.includes("Производитель")) effective.push("MANUFACTURER");
  if (walletRoles.includes("Дистрибьютор")) effective.push("DISTRIBUTOR");
  if (walletRoles.includes("Аптека")) effective.push("PHARMACY");
  if (walletRoles.includes("Регулятор")) effective.push("REGULATOR");
  if (effective.length === 0) {
    effective.push("GUEST");
  }
  return navLinks.filter((link) => link.roles.some((allowed) => effective.includes(allowed)));
}
