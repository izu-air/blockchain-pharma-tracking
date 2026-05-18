import { AlertTriangle, LogIn, ShieldOff, Wifi, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { hasAnyRole, ROLE_LABEL_RU, type Role } from "../lib/roles";

interface Props {
  /** Roles allowed via the backend JWT (off-chain auth). */
  allowedBackendRoles?: Role[];
  /** Roles allowed via the on-chain hasRole lookup (smart-contract auth). */
  allowedWalletRoles?: Role[];
  /** When true, the page is unreachable without a connected MetaMask wallet. */
  requireWallet?: boolean;
  /** When true, blocks the page if MetaMask is on the wrong chain. */
  requireCorrectChain?: boolean;
  children: React.ReactNode;
}

/**
 * Frontend route guard with explicit precedence rules.
 *
 * <strong>Precedence (passes if ANY of these matches):</strong>
 * <ol>
 *   <li>backend JWT role ∈ {@link allowedBackendRoles}, OR</li>
 *   <li>on-chain wallet role ∈ {@link allowedWalletRoles}</li>
 * </ol>
 *
 * If neither list is provided the page is considered public.  Wallet /
 * chain prerequisites are checked first regardless.
 *
 * <strong>This is a UX optimisation only.</strong>  Real authority lives in:
 * <ul>
 *   <li>smart-contract {@code onlyRole(...)} modifiers (blockchain writes)</li>
 *   <li>backend {@code @PreAuthorize} annotations (REST API)</li>
 * </ul>
 */
export function ProtectedRoute({
  allowedBackendRoles = [],
  allowedWalletRoles = [],
  requireWallet = false,
  requireCorrectChain = false,
  children
}: Props) {
  const wallet = useWallet();
  const auth = useAuth();

  // ── 1. Connection prerequisite ─────────────────────────────────────────
  if (requireWallet && !wallet.address) {
    return (
      <BlockedPanel
        icon={<Wallet className="text-amber-400" size={20} />}
        title="Кошелёк не подключён"
        message="Этот раздел доступен только владельцам подключённого MetaMask кошелька."
        actions={
          <>
            <button type="button" className="button" onClick={() => void wallet.connect()}>
              Подключить кошелёк
            </button>
            <HomeLink />
          </>
        }
      />
    );
  }

  // ── 2. Chain prerequisite ──────────────────────────────────────────────
  if (requireCorrectChain && wallet.wrongChain) {
    return (
      <BlockedPanel
        icon={<Wifi className="text-amber-400" size={20} />}
        title="Сеть MetaMask не совпадает"
        message={
          `Контракт развёрнут в сети ${wallet.expectedChainId}, сейчас активна сеть ${wallet.chainId}. ` +
          "Переключитесь на нужную сеть, чтобы продолжить."
        }
        actions={
          <>
            <button type="button" className="button" onClick={() => void wallet.switchChain()}>
              Переключить сеть
            </button>
            <HomeLink />
          </>
        }
      />
    );
  }

  // ── 3. Role check ─────────────────────────────────────────────────────
  const noRolesRequired = allowedBackendRoles.length === 0 && allowedWalletRoles.length === 0;
  if (!noRolesRequired) {
    const backendOk = auth.backendRole != null
      && hasAnyRole([auth.backendRole], allowedBackendRoles);
    const walletOk = wallet.address && hasAnyRole(wallet.roles, allowedWalletRoles);

    if (!backendOk && !walletOk) {
      const allRequired = Array.from(new Set([...allowedBackendRoles, ...allowedWalletRoles]));
      const hasAnything = wallet.address || auth.isAuthenticated;
      return (
        <BlockedPanel
          icon={<ShieldOff className="text-amber-400" size={20} />}
          title={hasAnything ? "Недостаточно прав" : "Требуется вход"}
          message={
            hasAnything
              ? `Для доступа к этому разделу нужна роль ${allRequired.map(r => ROLE_LABEL_RU[r]).join(" или ")}.`
              : "Войдите через MetaMask или подключите кошелёк с одной из требуемых ролей."
          }
          extra={
            <ul className="mt-2 space-y-0.5 text-xs text-slate-400">
              <li>
                Backend-роль (JWT):{" "}
                {auth.backendRole ? <strong>{ROLE_LABEL_RU[auth.backendRole]}</strong> : "не задана"}
              </li>
              <li>
                On-chain роли кошелька:{" "}
                {wallet.roles.length === 0
                  ? "нет"
                  : <strong>{wallet.roles.map(r => ROLE_LABEL_RU[r]).join(", ")}</strong>}
              </li>
            </ul>
          }
          actions={
            <>
              {!auth.isAuthenticated && (
                <Link to="/login" className="button">
                  <LogIn size={16} /> Войти подписью
                </Link>
              )}
              {!wallet.address && (
                <button type="button" className="button-secondary" onClick={() => void wallet.connect()}>
                  Подключить кошелёк
                </button>
              )}
              <HomeLink />
            </>
          }
        />
      );
    }
  }

  return <>{children}</>;
}

function HomeLink() {
  return (
    <Link to="/" className="button-secondary">
      На главную
    </Link>
  );
}

function BlockedPanel({
  icon, title, message, extra, actions
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  extra?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="panel space-y-3 border-amber-500/30" role="alert">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="break-words text-sm text-slate-300 leading-snug">{message}</p>
      {extra}
      <div className="flex flex-wrap gap-2 pt-1">{actions}</div>
    </div>
  );
}

/**
 * Tiny helper for an "info" inline warning (used by pages that want a
 * banner without blocking the whole route).
 */
export function InlineAccessWarning({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-2 text-xs text-amber-200" role="alert">
      <AlertTriangle className="-mt-0.5 mr-1 inline" size={12} />
      <span className="break-words">{message}</span>
    </div>
  );
}
