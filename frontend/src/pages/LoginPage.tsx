import { useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { registerUser } from "../lib/api";
import { connectWallet, isValidAddress } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { ROLE_LABEL_RU } from "../lib/roles";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";

// Anonymous self-registration only allows CONSUMER; privileged roles must
// be created by an authenticated ADMIN via the back-office workflow.
const SELF_REGISTRABLE_ROLES = ["CONSUMER"] as const;

export default function LoginPage() {
  const wallet = useWallet();
  const auth = useAuth();

  // Registration state — public self-registration is CONSUMER-only;
  // privileged accounts must be created by an authenticated ADMIN via
  // back-office workflow (out of scope for this page).
  const [regName, setRegName] = useState("");
  const [regWallet, setRegWallet] = useState("");
  const [regRole] = useState<(typeof SELF_REGISTRABLE_ROLES)[number]>("CONSUMER");
  const [regMessage, setRegMessage] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  /**
   * Triggers the auth-context SIWE flow.  The context owns the JWT and
   * step machine; this page only renders status.
   */
  async function handleSiweLogin() {
    try {
      let address = wallet.address;
      if (!address) {
        await wallet.connect();
        address = (await connectWallet()).toLowerCase();
      }
      if (!address) throw new Error("Кошелёк не подключён.");
      await auth.loginWithWallet(address);
    } catch {
      // Error is already on auth.error / wallet.error; nothing to do here.
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setRegError("");
    setRegMessage("");
    const walletAddress = regWallet.trim();
    const name = regName.trim();
    if (!name) {
      setRegError("Имя не может быть пустым.");
      return;
    }
    if (!isValidAddress(walletAddress)) {
      setRegError("Адрес кошелька должен начинаться с 0x и содержать 40 hex-символов.");
      return;
    }
    setRegLoading(true);
    try {
      await registerUser({ name, role: regRole, walletAddress });
      setRegMessage("Пользователь зарегистрирован. Теперь войдите через MetaMask тем же кошельком.");
    } catch (exception) {
      setRegError(humanizeError(exception, "Не удалось зарегистрировать пользователя."));
    } finally {
      setRegLoading(false);
    }
  }

  const stepLabel: Record<typeof auth.loginStep, string> = {
    "idle":                "",
    "requesting-nonce":    "Запрашиваем одноразовый challenge…",
    "awaiting-signature":  "Подпишите сообщение в MetaMask.",
    "verifying":           "Проверяем подпись на сервере…",
    "done":                ""
  };
  const busy = auth.isLoggingIn;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="text-emerald-300" size={20} />
          <h2 className="text-xl font-semibold">Вход через MetaMask</h2>
        </div>
        <p className="text-sm text-slate-400">
          Сервер выдаёт одноразовый challenge, вы подписываете его кошельком MetaMask,
          сервер проверяет подпись и выдаёт JWT.  Пароль не используется и не хранится.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="button"
            onClick={() => void handleSiweLogin()}
            disabled={busy}
          >
            <LogIn size={18} />
            {busy ? "В процессе…" : wallet.address ? "Войти подписью кошелька" : "Подключить и войти"}
          </button>
          <button type="button" className="button-secondary" onClick={() => auth.logout()}>
            Сбросить JWT
          </button>
        </div>

        {busy && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-200">
            <p className="break-words leading-snug">{stepLabel[auth.loginStep]}</p>
          </div>
        )}
        {auth.isAuthenticated && auth.backendRole && (
          <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-100">
            <p className="break-words">
              Готово. JWT сохранён. Роль backend:{" "}
              <span className="font-semibold">{ROLE_LABEL_RU[auth.backendRole]}</span>.
            </p>
          </div>
        )}
        {auth.error && (
          <div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
            <p className="break-words leading-snug">{auth.error}</p>
          </div>
        )}

        {wallet.address && (
          <p className="mt-4 break-all text-xs text-slate-500">
            Текущий wallet: <span className="font-mono">{wallet.address}</span>
          </p>
        )}
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">Регистрация участника</h2>
        <p className="mt-2 text-sm text-slate-400">
          Анонимная регистрация создаёт только базового потребителя.
          Для роли MANUFACTURER / DISTRIBUTOR / PHARMACY / REGULATOR обратитесь к
          администратору — он создаст вашу учётную запись через защищённый эндпоинт.
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleRegister}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Имя</span>
            <input
              className="input"
              value={regName}
              onChange={(event) => setRegName(event.target.value)}
              maxLength={200}
              autoComplete="off"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Кошелёк</span>
            <input
              className="input font-mono"
              value={regWallet}
              onChange={(event) => setRegWallet(event.target.value)}
              placeholder="0x…"
              pattern="0x[0-9a-fA-F]{40}"
              maxLength={42}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </label>
          <p className="text-xs text-slate-500">
            Публичная регистрация создаёт пользователя с ролью{" "}
            <span className="font-semibold text-slate-300">CONSUMER</span> (только просмотр и
            QR-верификация).  Privileged роли назначает администратор через back-office.
          </p>
          <button className="button-secondary" type="submit" disabled={regLoading}>
            {regLoading ? "Регистрация…" : "Зарегистрировать"}
          </button>
        </form>
        {regMessage && <p className="mt-4 break-words text-sm text-emerald-300">{regMessage}</p>}
        {regError && (
          <div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
            <p className="break-words leading-snug">{regError}</p>
          </div>
        )}
      </section>
    </div>
  );
}
