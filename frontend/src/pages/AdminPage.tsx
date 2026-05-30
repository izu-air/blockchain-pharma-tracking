import { useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Loader2, Pencil, Plus, ShieldCheck, Trash2, X
} from "lucide-react";
import {
  listUsers, registerUser, updateUserRole, deleteUser, type AdminUser
} from "../lib/api";
import { grantRoleByName, isValidAddress, revokeRoleByName } from "../lib/contract";
import { useWallet } from "../context/WalletContext";
import { hasAnyRole } from "../lib/roles";
import { humanizeError } from "../lib/errors";

const ROLE_OPTIONS = [
  "ADMIN", "MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "CONSUMER"
] as const;
type RoleOption = typeof ROLE_OPTIONS[number];

export default function AdminPage() {
  const wallet = useWallet();
  const canSignOnChain = wallet.address && hasAnyRole(wallet.roles, ["ADMIN"]);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [flash, setFlash] = useState<{ kind: "success" | "info" | "error"; text: string } | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const list = await listUsers();
      setUsers(list);
      setError("");
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось загрузить пользователей."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Управление пользователями</h2>
              <p className="text-sm text-slate-400">
                Создание, изменение роли и удаление пользователей.  Изменение
                роли параллельно синхронизирует on-chain {`grantRole / revokeRole`},
                если подключённый кошелёк — администратор контракта.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="button"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={14} className="mr-1 inline" /> Создать пользователя
          </button>
        </div>
        {!canSignOnChain && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-950/30 p-2 text-xs text-amber-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div>
              Подключённый кошелёк не является контрактным администратором — все
              изменения будут сохранены в backend, но on-chain
              <span className="font-mono"> grantRole / revokeRole</span> вызваны
              не будут.  Чтобы синхронизировать роли, переключитесь на адрес с
              ADMIN_ROLE в смарт-контракте.
            </div>
          </div>
        )}
      </section>

      {flash && (
        <div
          role="status"
          className={`panel border text-sm ${
            flash.kind === "success" ? "border-emerald-500/40 text-emerald-200"
            : flash.kind === "error" ? "border-red-500/40 text-red-300"
            : "border-sky-500/40 text-sky-200"
          }`}
        >
          {flash.text}
        </div>
      )}

      {error && (
        <div role="alert" className="panel border-red-500/40 text-sm text-red-300">
          <p className="break-words leading-snug">{error}</p>
        </div>
      )}

      <section className="panel overflow-x-auto p-0">
        <UsersTable
          users={users}
          loading={loading}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      </section>

      {createOpen && (
        <CreateUserDialog
          onClose={() => setCreateOpen(false)}
          canSignOnChain={Boolean(canSignOnChain)}
          onCreated={async (info) => {
            setFlash({ kind: "success", text: info });
            await refresh();
            setCreateOpen(false);
          }}
        />
      )}

      {editing && (
        <EditRoleDialog
          user={editing}
          canSignOnChain={Boolean(canSignOnChain)}
          onClose={() => setEditing(null)}
          onSaved={async (info) => {
            setFlash({ kind: "success", text: info });
            await refresh();
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <DeleteConfirm
          user={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={async () => {
            setFlash({ kind: "info", text: `Пользователь ${deleting.name} удалён.` });
            await refresh();
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

function UsersTable({
  users, loading, onEdit, onDelete
}: {
  users: AdminUser[];
  loading: boolean;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-slate-400">
        <Loader2 className="animate-spin" size={14} /> Загрузка пользователей…
      </div>
    );
  }
  if (users.length === 0) {
    return <div className="p-6 text-sm text-slate-500">Пользователей пока нет.</div>;
  }
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-400">
        <tr>
          <th className="px-3 py-2">ID</th>
          <th className="px-3 py-2">Имя</th>
          <th className="px-3 py-2">Роль</th>
          <th className="px-3 py-2">Кошелёк</th>
          <th className="px-3 py-2">Создан</th>
          <th className="px-3 py-2 text-right">Действия</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-white/5">
            <td className="px-3 py-2 align-top font-mono text-xs">{user.id}</td>
            <td className="px-3 py-2 align-top text-slate-200">{user.name}</td>
            <td className="px-3 py-2 align-top">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                {user.role}
              </span>
            </td>
            <td className="px-3 py-2 align-top break-all font-mono text-[11px] text-slate-400">
              {user.walletAddress}
            </td>
            <td className="px-3 py-2 align-top text-xs text-slate-400">
              {new Date(user.createdAt).toLocaleString("ru-RU")}
            </td>
            <td className="px-3 py-2 align-top text-right">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => onEdit(user)}
                  title="Изменить роль"
                >
                  <Pencil size={12} className="mr-1 inline" /> Роль
                </button>
                <button
                  type="button"
                  className="button-secondary text-red-300 hover:text-red-200"
                  onClick={() => onDelete(user)}
                  title="Удалить пользователя"
                >
                  <Trash2 size={12} className="mr-1 inline" /> Удалить
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Dialog({
  title, onClose, children
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="mt-12 w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button type="button" className="text-slate-400 hover:text-white" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateUserDialog({
  onClose, onCreated, canSignOnChain
}: {
  onClose: () => void;
  onCreated: (flash: string) => Promise<void>;
  canSignOnChain: boolean;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<RoleOption>("MANUFACTURER");
  const [walletAddress, setWalletAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const walletValid = isValidAddress(walletAddress);
  const ok = name.trim().length >= 2 && walletValid;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ok) return;
    setBusy(true); setError("");
    try {
      await registerUser({ name: name.trim(), role, walletAddress: walletAddress.trim() });
      let chainNote = "";
      if (canSignOnChain && role !== "CONSUMER") {
        try {
          const txHash = await grantRoleByName(role, walletAddress.trim());
          chainNote = ` On-chain grantRole: ${txHash.slice(0, 10)}…`;
        } catch (chainException) {
          chainNote = ` (on-chain пропущен: ${humanizeError(chainException, "ошибка")})`;
        }
      }
      await onCreated(`Создан пользователь ${name.trim()} (${role}).${chainNote}`);
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось создать пользователя."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="Создание пользователя" onClose={onClose}>
      <form className="space-y-3" onSubmit={submit}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Имя / название</span>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
            maxLength={200}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Роль</span>
          <select
            className="input"
            value={role}
            onChange={(event) => setRole(event.target.value as RoleOption)}
          >
            {ROLE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Адрес кошелька</span>
          <input
            className="input font-mono"
            value={walletAddress}
            onChange={(event) => setWalletAddress(event.target.value)}
            placeholder="0x..."
            pattern="0x[0-9a-fA-F]{40}"
            maxLength={42}
            required
          />
          {walletAddress && !walletValid && (
            <span className="mt-1 block text-xs text-red-400">Должен быть Ethereum-адрес (0x + 40 hex).</span>
          )}
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button type="submit" className="button" disabled={!ok || busy}>
            {busy ? <Loader2 className="mr-1 inline animate-spin" size={14} /> : <CheckCircle2 size={14} className="mr-1 inline" />}
            Создать
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function EditRoleDialog({
  user, onClose, onSaved, canSignOnChain
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: (flash: string) => Promise<void>;
  canSignOnChain: boolean;
}) {
  const [role, setRole] = useState<RoleOption>(user.role as RoleOption);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (role === user.role) {
      setError("Роль не изменилась.");
      return;
    }
    setBusy(true); setError("");
    try {
      await updateUserRole(user.id, role, reason);
      let chainNote = "";
      if (canSignOnChain) {
        try {
          // Revoke the previous role and grant the new one — keeps on-chain
          // permissions in sync with the off-chain record.
          if (user.role !== "CONSUMER") {
            await revokeRoleByName(user.role, user.walletAddress);
          }
          if (role !== "CONSUMER") {
            const grantTx = await grantRoleByName(role, user.walletAddress);
            chainNote = ` On-chain: revoke(${user.role}) + grant(${role}) — ${grantTx.slice(0, 10)}…`;
          } else {
            chainNote = ` On-chain: revoke(${user.role})`;
          }
        } catch (chainException) {
          chainNote = ` (on-chain пропущен: ${humanizeError(chainException, "ошибка")})`;
        }
      }
      await onSaved(`Роль ${user.name}: ${user.role} → ${role}.${chainNote}`);
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось изменить роль."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title={`Изменение роли — ${user.name}`} onClose={onClose}>
      <form className="space-y-3" onSubmit={submit}>
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2 text-xs text-slate-400">
          Кошелёк: <span className="break-all font-mono">{user.walletAddress}</span><br />
          Текущая роль: <span className="font-semibold text-emerald-300">{user.role}</span>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Новая роль</span>
          <select
            className="input"
            value={role}
            onChange={(event) => setRole(event.target.value as RoleOption)}
          >
            {ROLE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Причина (попадёт в audit log)</span>
          <textarea
            className="input min-h-20 break-words"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button type="submit" className="button" disabled={busy}>
            {busy ? <Loader2 className="mr-1 inline animate-spin" size={14} /> : <CheckCircle2 size={14} className="mr-1 inline" />}
            Сохранить
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function DeleteConfirm({
  user, onClose, onDeleted
}: {
  user: AdminUser;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true); setError("");
    try {
      await deleteUser(user.id);
      await onDeleted();
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось удалить пользователя."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="Удаление пользователя" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <p>
          Удалить пользователя <span className="font-semibold">{user.name}</span> (роль{" "}
          <span className="font-mono">{user.role}</span>)?  Действие не отменимое.
          On-chain роли НЕ снимаются автоматически — сделайте это отдельно
          из формы редактирования, если требуется.
        </p>
        {error && <p className="text-red-300">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button
            type="button"
            className="button bg-red-600 hover:bg-red-500"
            onClick={submit}
            disabled={busy}
          >
            {busy ? <Loader2 className="mr-1 inline animate-spin" size={14} /> : <Trash2 size={14} className="mr-1 inline" />}
            Удалить
          </button>
        </div>
      </div>
    </Dialog>
  );
}
