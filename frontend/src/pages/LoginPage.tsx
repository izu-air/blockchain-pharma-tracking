import { useState } from "react";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { registerUser } from "../lib/api";
import { connectWallet, isValidAddress } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { ROLE_LABEL_RU } from "../lib/roles";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { Alert, Button, Card, CardHeader, PageHeader } from "../components/ui";

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
    if (!isValidAddress(walletAddress)) {
      setRegError("Введите валидный Ethereum-адрес (0x + 40 hex).");
      return;
    }
    setRegLoading(true);
    try {
      const created = await registerUser({
        name: regName.trim(),
        walletAddress: walletAddress.toLowerCase(),
        role: regRole
      });
      setRegMessage(`Создан пользователь #${created.id} (${ROLE_LABEL_RU[regRole]}).`);
      setRegName("");
      setRegWallet("");
    } catch (exception) {
      setRegError(humanizeError(exception, "Не удалось создать пользователя."));
    } finally {
      setRegLoading(false);
    }
  }

  const stepLabel: Record<typeof auth.loginStep, string> = {
    "idle":                "",
    "requesting-nonce":    "Получаем одноразовый nonce…",
    "awaiting-signature":  "Подпишите сообщение в MetaMask…",
    "verifying":           "Проверяем подпись на сервере…",
    "done":                ""
  };
  const busy = auth.isLoggingIn;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        icon={<LogIn size={20} aria-hidden="true" />}
        iconTone="emerald"
        eyebrow="Аутентификация"
        title="Вход и регистрация"
        description="Web3-вход подписью кошелька (SIWE) — без паролей, без хранилища
        учётных данных. Публичная регистрация доступна только для роли потребителя."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── SIWE login ─────────────────────────────────────────────── */}
        <Card accent="emerald">
          <CardHeader
            eyebrow="Шаг 1"
            title={
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="text-emerald-300" size={18} aria-hidden="true" />
                Вход через MetaMask
              </span>
            }
            description="Сервер выдаёт одноразовый challenge, вы подписываете его кошельком
            MetaMask, сервер проверяет подпись и выдаёт JWT.  Пароль не используется и не хранится."
          />

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => void handleSiweLogin()}
              disabled={busy}
              loading={busy}
              leadingIcon={!busy ? <LogIn size={18} aria-hidden="true" /> : undefined}
            >
              {busy ? "В процессе…" : wallet.address ? "Войти подписью кошелька" : "Подключить и войти"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => auth.logout()}>
              Сбросить JWT
            </Button>
          </div>

          {busy && (
            <Alert tone="info" className="mt-4">
              {stepLabel[auth.loginStep]}
            </Alert>
          )}
          {auth.isAuthenticated && auth.backendRole && (
            <Alert tone="success" className="mt-4">
              Готово. JWT сохранён. Роль backend:{" "}
              <span className="font-semibold">{ROLE_LABEL_RU[auth.backendRole]}</span>.
            </Alert>
          )}
          {auth.error && (
            <Alert tone="danger" className="mt-4">{auth.error}</Alert>
          )}

          {wallet.address && (
            <p className="mt-4 break-all text-xs text-slate-500">
              Текущий wallet: <span className="font-mono text-slate-400">{wallet.address}</span>
            </p>
          )}
        </Card>

        {/* ── Self-registration (consumer only) ─────────────────────── */}
        <Card accent="sky">
          <CardHeader
            eyebrow="Шаг 2 (опционально)"
            title={
              <span className="inline-flex items-center gap-2">
                <UserPlus className="text-sky-300" size={18} aria-hidden="true" />
                Регистрация участника
              </span>
            }
            description="Анонимная регистрация создаёт только базового потребителя.
            Для ролей MANUFACTURER / DISTRIBUTOR / PHARMACY / REGULATOR обратитесь к
            администратору — он создаст вашу учётную запись через защищённый эндпоинт."
          />

          <form className="space-y-4" onSubmit={handleRegister}>
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
            <p className="text-xs leading-snug text-slate-500">
              Публичная регистрация создаёт пользователя с ролью{" "}
              <span className="font-semibold text-slate-300">CONSUMER</span> (только просмотр и
              QR-верификация).  Privileged-роли назначает администратор через back-office.
            </p>
            <Button
              type="submit"
              variant="secondary"
              disabled={regLoading}
              loading={regLoading}
              leadingIcon={!regLoading ? <UserPlus size={16} aria-hidden="true" /> : undefined}
            >
              {regLoading ? "Регистрация…" : "Зарегистрировать"}
            </Button>
          </form>
          {regMessage && (
            <Alert tone="success" className="mt-4">{regMessage}</Alert>
          )}
          {regError && (
            <Alert tone="danger" className="mt-4">{regError}</Alert>
          )}
        </Card>
      </div>
    </div>
  );
}
