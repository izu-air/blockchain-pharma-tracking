import { Wallet } from "lucide-react";
import { formatAddress } from "../lib/status";
import { ROLE_LABEL_RU } from "../lib/roles";
import { useWallet } from "../context/WalletContext";

/**
 * Кнопка подключения MetaMask + индикатор активного адреса/ролей.
 * Состояние кошелька берётся из общего WalletContext, поэтому navigation,
 * RoleGuard и эта кнопка всегда показывают одно и то же.
 */
export function WalletConnector() {
  const { address, roles, error, connect, loading } = useWallet();

  const label = loading
    ? "Подключение к MetaMask…"
    : address
      ? `MetaMask подключён, адрес ${formatAddress(address)}`
      : "Подключить кошелёк MetaMask";

  return (
    <div className="flex min-w-0 max-w-[260px] flex-col items-end gap-1">
      <button
        type="button"
        className="button-secondary"
        onClick={() => void connect()}
        disabled={loading}
        aria-label={label}
        aria-busy={loading || undefined}
      >
        <Wallet size={18} aria-hidden="true" />
        <span className="font-mono text-xs sm:text-sm">
          {loading ? "…" : address ? formatAddress(address) : "Подключить"}
        </span>
      </button>
      {error && (
        <span
          role="alert"
          className="block max-w-full break-words text-right text-xs text-red-400"
        >
          {error}
        </span>
      )}
      {address && roles.length > 0 && (
        <span className="block max-w-full truncate text-right text-xs text-slate-400">
          {roles.map((r) => ROLE_LABEL_RU[r]).join(", ")}
        </span>
      )}
      {address && roles.length === 0 && !loading && (
        <span className="block max-w-full text-right text-xs text-amber-400">
          без on-chain ролей
        </span>
      )}
    </div>
  );
}
