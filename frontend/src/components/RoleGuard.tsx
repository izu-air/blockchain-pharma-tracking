import { ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";
import { hasAnyRole, ROLE_LABEL_RU, type Role } from "../lib/roles";
import { useWallet } from "./WalletContext";

interface Props {
  required: Role[];
  children: React.ReactNode;
}

/**
 * Frontend route guard.  Renders the wrapped page only if the connected
 * wallet has at least one of the {@link required} on-chain roles; otherwise
 * shows a clear "no access" panel with a link back to the dashboard.
 *
 * This is a UX optimisation only — the real authority is the smart contract
 * (onlyRole modifiers) and the backend's @PreAuthorize annotations.  A user
 * who disables JS or hits the API directly cannot bypass those.
 */
export function RoleGuard({ required, children }: Props) {
  const { address, roles, loading } = useWallet();

  if (loading) {
    return (
      <div className="panel" aria-busy="true">
        <p className="text-sm text-slate-400">Проверка прав доступа…</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="panel space-y-3">
        <div className="flex items-center gap-2">
          <ShieldOff className="text-amber-400" size={20} />
          <h2 className="text-lg font-semibold">Кошелёк не подключён</h2>
        </div>
        <p className="text-sm text-slate-400">
          Этот раздел доступен только участникам цепочки поставок. Подключите MetaMask
          в правом верхнем углу.
        </p>
        <p className="text-xs text-slate-500">
          Требуемая роль: {required.map((r) => ROLE_LABEL_RU[r]).join(" / ")}
        </p>
      </div>
    );
  }

  if (!hasAnyRole(roles, required)) {
    return (
      <div className="panel space-y-3 border-amber-500/30">
        <div className="flex items-center gap-2">
          <ShieldOff className="text-amber-400" size={20} />
          <h2 className="text-lg font-semibold">Недостаточно прав</h2>
        </div>
        <p className="text-sm text-slate-300">
          Для доступа к этому разделу нужна роль{" "}
          <span className="font-semibold text-emerald-300">
            {required.map((r) => ROLE_LABEL_RU[r]).join(" или ")}
          </span>.
        </p>
        <p className="text-sm text-slate-400">
          У вашего кошелька роли:{" "}
          {roles.length === 0
              ? <em>нет назначенных ролей</em>
              : roles.map((r) => ROLE_LABEL_RU[r]).join(", ")}.
        </p>
        <p className="text-xs text-slate-500">
          Обратитесь к администратору, чтобы получить нужную роль.
        </p>
        <Link to="/" className="button-secondary w-fit">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
