import { useState } from "react";
import { loginWithWallet, registerUser } from "../lib/api";
import { clearStoredToken, setStoredToken } from "../lib/auth";
import { isValidAddress } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { WalletConnector } from "../components/WalletConnector";

const roles = ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "CONSUMER"] as const;

export default function LoginPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regWallet, setRegWallet] = useState("");
  const [regRole, setRegRole] = useState<(typeof roles)[number]>("MANUFACTURER");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    const value = walletAddress.trim();
    if (!isValidAddress(value)) {
      setError("Адрес кошелька должен начинаться с 0x и содержать 40 hex-символов.");
      setMessage("");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await loginWithWallet(value);
      setStoredToken(data.token);
      setMessage(`Выполнен вход. Роль backend: ${data.role}. JWT сохранён для API-запросов.`);
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось войти. Убедитесь, что кошелёк зарегистрирован."));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    const wallet = regWallet.trim();
    const name = regName.trim();
    if (!name) {
      setError("Имя не может быть пустым.");
      setMessage("");
      return;
    }
    if (!isValidAddress(wallet)) {
      setError("Адрес кошелька должен начинаться с 0x и содержать 40 hex-символов.");
      setMessage("");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await registerUser({ name, role: regRole, walletAddress: wallet });
      setMessage("Пользователь зарегистрирован. Теперь выполните вход с этим адресом.");
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось зарегистрировать пользователя."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel">
        <h2 className="text-xl font-semibold">Вход (JWT)</h2>
        <p className="mt-2 text-sm text-slate-400">
          Backend защищает операции записи (метаданные, события). Войдите кошельком, который есть в таблице
          пользователей (см. <span className="font-mono text-xs">data.sql</span> для Hardhat-аккаунтов).
        </p>
        <div className="mt-4">
          <WalletConnector />
        </div>
        <form className="mt-5 space-y-4" onSubmit={handleLogin}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Адрес кошелька (0x…)</span>
            <input
              className="input"
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              placeholder="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
              pattern="0x[0-9a-fA-F]{40}"
              maxLength={42}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Запрос..." : "Получить JWT"}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                clearStoredToken();
                setMessage("JWT удалён из браузера.");
                setError("");
              }}
            >
              Сбросить JWT
            </button>
          </div>
        </form>
        {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">Регистрация участника</h2>
        <p className="mt-2 text-sm text-slate-400">
          Публичный POST <span className="font-mono text-xs">/api/users</span> — добавьте свой адрес MetaMask, если его ещё нет в базе.
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleRegister}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Имя</span>
            <input className="input" value={regName} onChange={(event) => setRegName(event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Кошелёк</span>
            <input
              className="input"
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
            <select className="input" value={regRole} onChange={(event) => setRegRole(event.target.value as (typeof roles)[number])}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <button className="button-secondary" type="submit" disabled={loading}>
            Зарегистрировать
          </button>
        </form>
      </section>
    </div>
  );
}
