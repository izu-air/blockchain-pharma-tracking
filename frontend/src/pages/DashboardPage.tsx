import {
  ArrowRight, BarChart3, Blocks, Boxes, Database, Factory, FilePlus2, History,
  LayoutDashboard, LogIn, ScanLine, Send, ShieldAlert, ShieldCheck,
  Store, Truck, Wallet
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Alert, Badge, Card, CardHeader, KpiCard, MetricGridSkeleton,
  PageHeader, RoleBadge
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { getAnalyticsSummary } from "../lib/api";
import { humanizeError } from "../lib/errors";
import { hasAnyRole, ROLE_LABEL_RU, type Role } from "../lib/roles";
import type { AnalyticsSummary } from "../types/product";

/**
 * Two distinct experiences glued under one route:
 *
 *   • Guest:        marketing-style hero + "scan QR" CTA + value props.
 *                   NO analytics call — protected endpoint would 401.
 *   • Authenticated: role-aware operational overview with quick actions
 *                    and KPI strip.
 */
export default function DashboardPage() {
  const auth = useAuth();
  const wallet = useWallet();

  const effectiveRoles: Role[] = [
    ...(auth.backendRole ? [auth.backendRole] : []),
    ...wallet.roles
  ];

  // Guest = no JWT AND no on-chain role.  Anyone with a privileged wallet
  // sees the authenticated dashboard even before they finish SIWE login,
  // because the contract roles already let them do operational reads.
  if (!auth.isAuthenticated && wallet.roles.length === 0) {
    return <GuestExperience walletConnected={Boolean(wallet.address)} />;
  }
  return <AuthenticatedExperience roles={effectiveRoles} />;
}

// ═══════════════════════════════════════════════════════════════════════
// GUEST
// ═══════════════════════════════════════════════════════════════════════
function GuestExperience({ walletConnected }: { walletConnected: boolean }) {
  return (
    <div className="space-y-10 animate-slide-up">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="panel relative overflow-hidden border-emerald-500/20 p-6 sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <span className="glow-blob glow-blob-emerald right-[-4rem] top-[-4rem] h-80 w-80" />
          <span className="glow-blob glow-blob-sky right-32 top-20 h-56 w-56" />
          <span className="glow-blob glow-blob-violet left-[-3rem] bottom-[-3rem] h-64 w-64" />
        </div>

        <p className="eyebrow tracking-[0.28em]">PharmaChain&nbsp;Trace</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.1] sm:text-5xl">
          <span className="text-gradient">Доверие к&nbsp;лекарствам,</span>
          <br className="hidden sm:block" />
          <span className="text-slate-100">записанное в&nbsp;блокчейн.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Отсканируйте QR-код с&nbsp;упаковки — и&nbsp;получите ответ напрямую
          из&nbsp;публичного реестра производителя. Без регистрации,
          без посредников, без слова «верь&nbsp;нам».
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/verify" className="button">
            <ScanLine size={18} aria-hidden="true" /> Проверить продукт
          </Link>
          <Link to="/login" className="button-secondary">
            <LogIn size={16} aria-hidden="true" /> Войти как участник цепочки
          </Link>
        </div>

        {!walletConnected && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
            <Wallet size={12} aria-hidden="true" className="text-emerald-300" />
            Производителям и регуляторам — подключите MetaMask
            <span className="hidden sm:inline">в&nbsp;правом верхнем углу.</span>
          </p>
        )}
      </section>

      {/* ── Value propositions ─────────────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-2">
        <ValueCard
          icon={<Blocks size={20} />}
          tone="emerald"
          accent="emerald"
          title="Неизменяемый реестр"
          text="Каждый продукт получает on-chain запись с серийным номером, владельцем
                и статусом. Историю невозможно переписать задним числом — даже сам
                производитель."
        />
        <ValueCard
          icon={<ShieldCheck size={20} />}
          tone="sky"
          accent="sky"
          title="Кошелёк вместо логина"
          text="Каждое действие подтверждается криптографической подписью MetaMask.
                Никаких паролей, никакой централизованной базы пользователей."
        />
        <ValueCard
          icon={<Truck size={20} />}
          tone="violet"
          accent="violet"
          title="Прозрачная цепочка"
          text="Производитель → дистрибьютор → аптека: каждый шаг записывается
                в блок. Регулятор отзывает партию одной транзакцией — O(1)."
        />
        <ValueCard
          icon={<Database size={20} />}
          tone="amber"
          accent="amber"
          title="Гибридное хранение"
          text="Критичные данные — on-chain, описания и audit log — в PostgreSQL.
                Trust layer не платит за каждый параграф текста."
        />
      </section>

      <Alert tone="info" title="QR-проверка работает без регистрации">
        Откройте <Link to="/verify" className="button-link">страницу верификации</Link>{" "}
        с мобильного устройства и наведите камеру на QR-код упаковки.  Регистрация
        нужна только производителям, регуляторам и аптекам — для совершения операций
        в блокчейне.
      </Alert>
    </div>
  );
}

function ValueCard({
  icon, tone, accent, title, text
}: {
  icon: ReactNode;
  tone: "emerald" | "sky" | "violet" | "amber";
  accent: "emerald" | "sky" | "violet" | "amber";
  title: string;
  text: string;
}) {
  const haloClass = {
    emerald: "icon-halo",
    sky:     "icon-halo icon-halo-sky",
    violet:  "icon-halo icon-halo-violet",
    amber:   "icon-halo icon-halo-amber"
  }[tone];
  return (
    <Card accent={accent} className="h-full">
      <div className={`${haloClass} mb-4 h-11 w-11`} aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-50">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AUTHENTICATED
// ═══════════════════════════════════════════════════════════════════════
function AuthenticatedExperience({ roles }: { roles: Role[] }) {
  const auth = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canSeeAnalytics = hasAnyRole(roles, ["ADMIN","REGULATOR","MANUFACTURER","DISTRIBUTOR","PHARMACY"]);

  useEffect(() => {
    if (!canSeeAnalytics) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    getAnalyticsSummary()
      .then((data) => { if (!cancelled) { setAnalytics(data); setError(""); } })
      .catch((exception) => {
        if (!cancelled) setError(humanizeError(exception, "Не удалось загрузить аналитику."));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [canSeeAnalytics]);

  return (
    <div className="space-y-8 animate-slide-up">
      <PageHeader
        icon={<LayoutDashboard size={20} aria-hidden="true" />}
        iconTone="emerald"
        eyebrow="Кабинет"
        title={
          <>
            Добро пожаловать
            {auth.walletAddress && (
              <span className="text-gradient">
                , {shortAddr(auth.walletAddress)}
              </span>
            )}
          </>
        }
        description="Сводка операций, доступных вашему кошельку.  Каждая роль видит свой
        набор быстрых действий и метрик."
        meta={
          <div className="flex flex-wrap gap-1.5">
            {roles.length === 0
              ? <Badge tone="amber">Без ролей</Badge>
              : Array.from(new Set(roles)).map((r) => <RoleBadge key={r} role={r} />)}
          </div>
        }
      />

      {canSeeAnalytics && loading && <MetricGridSkeleton count={4} />}
      {canSeeAnalytics && !loading && analytics && (
        <section
          aria-label="Сводные метрики"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KpiCard
            label="Записей метаданных"
            value={analytics.metadataRecords.toLocaleString("ru-RU")}
            tone="emerald"
            icon={<Database size={18} aria-hidden="true" />}
            hint="off-chain в PostgreSQL"
          />
          <KpiCard
            label="Кэш событий"
            value={analytics.cachedEvents.toLocaleString("ru-RU")}
            tone="sky"
            icon={<Boxes size={18} aria-hidden="true" />}
            hint="сырые блокчейн-события"
          />
          <KpiCard
            label="Передач"
            value={analytics.transferEvents.toLocaleString("ru-RU")}
            tone="violet"
            icon={<Send size={18} aria-hidden="true" />}
            hint="ProductTransferred"
          />
          <KpiCard
            label="Отзывов партий"
            value={analytics.recallEvents.toLocaleString("ru-RU")}
            tone="rose"
            icon={<ShieldAlert size={18} aria-hidden="true" />}
            hint="BatchRecalled / unrecall"
          />
        </section>
      )}
      {canSeeAnalytics && !loading && error && (
        <Alert tone="warning" title="Аналитика недоступна">{error}</Alert>
      )}

      <QuickActions roles={roles} />

      <Card dense>
        <CardHeader
          eyebrow="Справка"
          title="Что доступно вам по ролям"
          description="Подсветка — ваши активные роли (backend JWT + on-chain в MetaMask)."
        />
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {ROLE_EXPLAINER.map(([role, text]) => {
            const active = roles.includes(role);
            return (
              <li
                key={role}
                className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                  active
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/5 bg-slate-950/40 opacity-60"
                }`}
              >
                <RoleBadge role={role} />
                <span className="text-slate-300">{text}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

interface ActionDef {
  to: string;
  title: string;
  description: string;
  icon: typeof Send;
  roles: Role[];
  tone: "emerald" | "sky" | "amber" | "rose" | "violet";
}

const ACTIONS: ActionDef[] = [
  { to: "/register",     title: "Зарегистрировать партию",
    description: "Создать новую партию и продукт on-chain, получить QR для упаковки.",
    icon: FilePlus2,   tone: "emerald", roles: ["MANUFACTURER","ADMIN"] },
  { to: "/transfer",     title: "Передать продукт",
    description: "Передача владения между участниками + смена статуса жизненного цикла.",
    icon: Send,        tone: "sky",     roles: ["MANUFACTURER","DISTRIBUTOR","PHARMACY","ADMIN"] },
  { to: "/recall",       title: "Отзыв партии",
    description: "O(1) recall: отозвать партию и заблокировать продажу её единиц.",
    icon: ShieldAlert, tone: "rose",    roles: ["REGULATOR","ADMIN"] },
  { to: "/history",      title: "История продукта",
    description: "Полный timeline из неизменяемого on-chain реестра.",
    icon: History,     tone: "violet",  roles: ["MANUFACTURER","DISTRIBUTOR","PHARMACY","REGULATOR","ADMIN"] },
  { to: "/analytics",    title: "Аналитика",
    description: "Метрики по событиям блокчейна и off-chain метаданным.",
    icon: BarChart3,   tone: "sky",     roles: ["MANUFACTURER","DISTRIBUTOR","PHARMACY","REGULATOR","ADMIN"] },
  { to: "/manufacturer", title: "Кабинет производителя",
    description: "Список ваших партий и продуктов с операционными метриками.",
    icon: Factory,     tone: "emerald", roles: ["MANUFACTURER","ADMIN"] },
  { to: "/distributor",  title: "Кабинет дистрибьютора",
    description: "Поступления, приём, передача далее по цепочке.",
    icon: Truck,       tone: "amber",   roles: ["DISTRIBUTOR","ADMIN"] },
  { to: "/pharmacy",     title: "Кабинет аптеки",
    description: "Приём от дистрибьютора, отметка статуса «Продан».",
    icon: Store,       tone: "violet",  roles: ["PHARMACY","ADMIN"] }
];

const TONE_HALO: Record<ActionDef["tone"], string> = {
  emerald: "icon-halo",
  sky:     "icon-halo icon-halo-sky",
  amber:   "icon-halo icon-halo-amber",
  rose:    "icon-halo icon-halo-rose",
  violet:  "icon-halo icon-halo-violet"
};

const TONE_ACCENT: Record<ActionDef["tone"], string> = {
  emerald: "panel-accent-emerald",
  sky:     "panel-accent-sky",
  amber:   "panel-accent-amber",
  rose:    "panel-accent-rose",
  violet:  "panel-accent-violet"
};

function QuickActions({ roles }: { roles: Role[] }) {
  const allowed = ACTIONS.filter(a => hasAnyRole(roles, a.roles));
  if (allowed.length === 0) {
    return (
      <Card>
        <Alert tone="warning" title="У вашего кошелька нет операционных ролей">
          Попросите администратора назначить роль — либо используйте{" "}
          <Link to="/verify" className="button-link">страницу верификации</Link> как
          потребитель.
        </Alert>
      </Card>
    );
  }
  return (
    <section aria-labelledby="quick-actions-heading">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Быстрые действия</p>
          <h2 id="quick-actions-heading" className="mt-1 text-lg font-semibold text-slate-100">
            Что вы можете сделать прямо сейчас
          </h2>
        </div>
        <Link to="/history" className="button-link">
          Открыть историю <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {allowed.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.to}
              to={a.to}
              className={`panel panel-interactive ${TONE_ACCENT[a.tone]} group block p-4 sm:p-5 outline-none`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`${TONE_HALO[a.tone]} h-10 w-10`} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-emerald-300"
                />
              </div>
              <p className="mt-3 font-semibold text-slate-50">{a.title}</p>
              <p className="mt-1.5 text-sm leading-snug text-slate-400">
                {a.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const ROLE_EXPLAINER: Array<[Role, string]> = [
  ["MANUFACTURER", "Создание партий и продуктов, выпуск QR-кодов."],
  ["DISTRIBUTOR",  "Приём партий, передача аптекам, обновление статуса."],
  ["PHARMACY",     "Приём от дистрибьютора, отметка «Продан»."],
  ["REGULATOR",    "Отзыв партий, восстановление, доступ к audit log."],
  ["ADMIN",        "Управление пользователями, ролями и индексатором."],
  ["CONSUMER",     "Чтение реестра и QR-проверка без авторизации."]
];

function shortAddr(a: string) {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

// silence unused export tree-shake — re-export role labels for future imports
export const _u = ROLE_LABEL_RU;
