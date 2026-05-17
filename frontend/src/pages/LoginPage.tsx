import { useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { loginWithSignature, registerUser, requestLoginNonce } from "../lib/api";
import { clearStoredToken, setStoredToken } from "../lib/auth";
import { connectWallet, isValidAddress, signLoginMessage } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { useWallet } from "../components/WalletContext";

const roles = ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "CONSUMER"] as const;

type LoginStep = "idle" | "connecting" | "requesting" | "signing" | "verifying" | "done";

export default function LoginPage() {
  const wallet = useWallet();

  // SIWE login state
  const [step, setStep] = useState<LoginStep>("idle");
  const [stepMessage, setStepMessage] = useState("");
  const [error, setError] = useState("");
  const [successRole, setSuccessRole] = useState("");

  // Registration state
  const [regName, setRegName] = useState("");
  const [regWallet, setRegWallet] = useState("");
  const [regRole, setRegRole] = useState<(typeof roles)[number]>("CONSUMER");
  const [regMessage, setRegMessage] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  /**
   * Full wallet-signature login flow:
   *   1) connect (if not already)
   *   2) POST /api/auth/nonce -> message
   *   3) personal_sign(message)
   *   4) POST /api/auth/login -> JWT
   *   5) save JWT, show backend role
   */
  async function handleSiweLogin() {
    setError("");
    setSuccessRole("");
    try {
      let address = wallet.address;
      if (!address) {
        setStep("connecting");
        setStepMessage("Подключение MetaMask…");
        await wallet.connect();
        address = (await connectWallet()).toLowerCase();
      }
      if (!address) {
        throw new Error("Кошелёк не подключён.");
      }

      setStep("requesting");
      setStepMessage("Запрашиваем одноразовый challenge…");
      const nonce = await requestLoginNonce(address);

      setStep("signing");
      setStepMessage("Подпишите сообщение в MetaMask.");
      const signature = await signLoginMessage(nonce.message);

      setStep("verifying");
      setStepMessage("Проверяем подпись на сервере…");
      const data = await loginWithSignature(address, nonce.message, signature);
      setStoredToken(data.token);

      setStep("done");
      setStepMessage("");
      setSuccessRole(data.role);
    } catch (exception) {
      setStep("idle");
      setStepMessage("");
      setError(humanizeError(exception, "Не удалось войти через MetaMask."));
    }
  }

  function handleLogout() {
    clearStoredToken();
    setStep("idle");
    setStepMessage("");
    setSuccessRole("");
    setError("");
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setRegError("");
    setRegMessage("");
    const wallet = regWallet.trim();
    const name = regName.trim();
    if (!name) {
      setRegError("Имя не может быть пустым.");
      return;
    }
    if (!isValidAddress(wallet)) {
      setRegError("Адрес кошелька должен начинаться с 0x и содержать 40 hex-символов.");
      return;
    }
    setRegLoading(true);
    try {
      await registerUser({ name, role: regRole, walletAddress: wallet });
      setRegMessage("Пользователь зарегистрирован. Теперь войдите через MetaMask тем же кошельком.");
    } catch (exception) {
      setRegError(humanizeError(exception, "Не удалось зарегистрировать пользователя."));
    } finally {
      setRegLoading(false);
    }
  }

  const busy = step !== "idle" && step !== "done";

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
          <button type="button" className="button-secondary" onClick={handleLogout}>
            Сбросить JWT
          </button>
        </div>

        {busy && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-200">
            <p className="break-words leading-snug">{stepMessage}</p>
          </div>
        )}
        {successRole && (
          <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-100">
            <p className="break-words">
              Готово. JWT сохранён. Роль backend:{" "}
              <span className="font-semibold">{successRole}</span>.
            </p>
          </div>
        )}
        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
            <p className="break-words leading-snug">{error}</p>
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
          Сейчас публичная регистрация доступна с самостоятельным выбором роли.
          В следующей итерации это ограничение будет ужесточено: privileged роли
          смогут назначать только администраторы / регуляторы.
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
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Роль (off-chain)</span>
            <select
              className="input"
              value={regRole}
              onChange={(event) => setRegRole(event.target.value as (typeof roles)[number])}
            >
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </label>
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
