import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { getBetHistory, PlacedBet } from "@/lib/bets";
import { settleWithPush, getPermission, subscribe, unsubscribe, getVapidPublicKey, registerSW } from "@/lib/notifications";
import AuthModal from "@/components/AuthModal";
import VerificationForm from "@/components/VerificationForm";

const tabs = ["Профиль", "История", "Финансы", "Настройки"];

const statusLabels: Record<string, string> = {
  bronze: "🥉 Бронза",
  silver: "🥈 Серебро",
  gold: "🥇 Золото",
  platinum: "💎 Платина",
  diamond: "👑 Бриллиант",
};
const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  bronze:   { bg: "rgba(205,127,50,0.1)",  text: "#CD7F32", border: "rgba(205,127,50,0.3)" },
  silver:   { bg: "rgba(192,192,192,0.1)", text: "#C0C0C0", border: "rgba(192,192,192,0.3)" },
  gold:     { bg: "rgba(255,215,0,0.1)",   text: "#FFD700", border: "rgba(255,215,0,0.3)" },
  platinum: { bg: "rgba(229,228,226,0.1)", text: "#E5E4E2", border: "rgba(229,228,226,0.3)" },
  diamond:  { bg: "rgba(0,255,255,0.1)",   text: "#00FFFF", border: "rgba(0,255,255,0.3)" },
};

const LOYALTY_LEVELS = [
  { id: "bronze",   icon: "🥉", name: "Бронза",    cashback: 5,  minBets: 0,   minAmount: 0,      color: "#CD7F32", nextColor: "#C0C0C0" },
  { id: "silver",   icon: "🥈", name: "Серебро",   cashback: 10, minBets: 10,  minAmount: 5000,   color: "#C0C0C0", nextColor: "#FFD700" },
  { id: "gold",     icon: "🥇", name: "Золото",    cashback: 15, minBets: 30,  minAmount: 25000,  color: "#FFD700", nextColor: "#E5E4E2" },
  { id: "platinum", icon: "💎", name: "Платина",   cashback: 20, minBets: 100, minAmount: 100000, color: "#E5E4E2", nextColor: "#00FFFF" },
  { id: "diamond",  icon: "👑", name: "Бриллиант", cashback: 30, minBets: 300, minAmount: 500000, color: "#00FFFF", nextColor: "#00FFFF" },
];

function getLevelByBets(totalBets: number) {
  let current = LOYALTY_LEVELS[0];
  for (const l of LOYALTY_LEVELS) {
    if (totalBets >= l.minBets) current = l;
  }
  return current;
}

function getNextLevel(id: string) {
  const idx = LOYALTY_LEVELS.findIndex(l => l.id === id);
  return idx < LOYALTY_LEVELS.length - 1 ? LOYALTY_LEVELS[idx + 1] : null;
}

function getLevelProgress(totalBets: number, currentId: string) {
  const next = getNextLevel(currentId);
  if (!next) return 100;
  const cur = LOYALTY_LEVELS.find(l => l.id === currentId)!;
  return Math.min(Math.round((totalBets - cur.minBets) / Math.max(next.minBets - cur.minBets, 1) * 100), 100);
}

const betStatusMap = {
  pending: { label: "В игре", color: "text-yellow-400", bg: "bg-yellow-500/15" },
  win: { label: "Выиграно", color: "text-green-400", bg: "bg-green-500/15" },
  loss: { label: "Проиграно", color: "text-red-400", bg: "bg-red-500/15" },
  cancelled: { label: "Отменено", color: "text-gray-400", bg: "bg-gray-500/15" },
};

const PAGE_SIZE = 10;

export default function ProfileSection() {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Профиль");
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [betsTotal, setBetsTotal] = useState(0);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betsPage, setBetsPage] = useState(0);
  const [settleNotice, setSettleNotice] = useState<{ wins: number; losses: number; payout: number } | null>(null);
  const [pushPermission, setPushPermission] = useState<string>("default");
  const [pushLoading, setPushLoading] = useState(false);

  // Инициализация: регистрируем SW и читаем статус разрешения
  useEffect(() => {
    registerSW();
    setPushPermission(getPermission());
  }, []);

  useEffect(() => {
    if (activeTab === "История" && user) {
      runSettleAndLoad();
      const interval = setInterval(runSettleAndLoad, 30_000);
      return () => clearInterval(interval);
    }
  }, [activeTab, user]);

  const runSettleAndLoad = async () => {
    setBetsLoading(true);
    try {
      const result = await settleWithPush();
      if (result.settled > 0) {
        setSettleNotice({ wins: result.wins, losses: result.losses, payout: result.payout });
        await refreshUser();
        setTimeout(() => setSettleNotice(null), 6000);
      }
    } catch {
      // ignore
    }
    await loadBets(0);
  };

  const handlePushToggle = async () => {
    setPushLoading(true);
    try {
      if (pushPermission === "granted") {
        await unsubscribe();
        setPushPermission("default");
      } else {
        const vapidKey = await getVapidPublicKey();
        if (!vapidKey) return;
        const ok = await subscribe(vapidKey);
        setPushPermission(ok ? "granted" : getPermission());
      }
    } catch {
      // ignore
    } finally {
      setPushLoading(false);
    }
  };

  const loadBets = async (page: number) => {
    setBetsLoading(true);
    try {
      const data = await getBetHistory(PAGE_SIZE, page * PAGE_SIZE);
      setBets(data.bets);
      setBetsTotal(data.total);
      setBetsPage(page);
    } catch {
      // ignore
    } finally {
      setBetsLoading(false);
    }
  };

  // Гость
  if (!user) {
    return (
      <>
        <div className="glass-card rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2430" }}>
          {/* Верхняя полоса */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #00FF87, #00B4FF)" }} />

          <div className="flex flex-col items-center justify-center py-16 px-6 space-y-8">
            {/* Иконка */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,255,135,0.07)", border: "2px solid rgba(0,255,135,0.2)" }}>
                <Icon name="User" size={44} className="text-gray-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neon-green flex items-center justify-center">
                <Icon name="Lock" size={13} className="text-sport-dark" />
              </div>
            </div>

            {/* Текст */}
            <div className="text-center space-y-2">
              <h2 className="font-oswald text-3xl font-bold text-white uppercase tracking-wide">Личный кабинет</h2>
              <p className="text-gray-500 font-roboto text-sm max-w-xs">
                Войди или зарегистрируйся, чтобы делать ставки, следить за историей и получать бонусы
              </p>
            </div>

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                onClick={() => setAuthModal("register")}
                className="flex-1 py-3.5 bg-neon-green text-sport-dark font-oswald font-bold text-base rounded-xl uppercase tracking-wide transition-all hover:scale-[1.02]"
                style={{ boxShadow: "0 0 24px rgba(0,255,135,0.35)" }}
              >
                Регистрация
              </button>
              <button
                onClick={() => setAuthModal("login")}
                className="flex-1 py-3.5 border border-sport-border text-white font-oswald font-bold text-base rounded-xl uppercase tracking-wide hover:border-neon-green hover:text-neon-green transition-all"
              >
                Войти
              </button>
            </div>

            {/* Преимущества */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm pt-2">
              {[
                { icon: "Gift", label: "Бонус новичка", value: "500 ₽" },
                { icon: "Zap", label: "Вывод средств", value: "15 мин" },
                { icon: "Shield", label: "Безопасность", value: "SSL" },
              ].map((f) => (
                <div key={f.label} className="text-center">
                  <div className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
                    style={{ background: "rgba(0,255,135,0.07)", border: "1px solid rgba(0,255,135,0.15)" }}>
                    <Icon name={f.icon} size={18} className="text-neon-green" />
                  </div>
                  <div className="font-oswald font-bold text-white text-sm">{f.value}</div>
                  <div className="text-gray-600 text-xs font-roboto">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {authModal && <AuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} />}
      </>
    );
  }

  const sc = statusColors[user.status] || statusColors.silver;
  const createdDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const winRate = user.total_bets > 0 ? ((user.won_bets / user.total_bets) * 100).toFixed(0) : "—";
  const userLevel = getLevelByBets(user.total_bets);
  const nextLevel = getNextLevel(userLevel.id);
  const levelProgress = getLevelProgress(user.total_bets, userLevel.id);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Личный кабинет</h2>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-gray-500 hover:text-red-400 transition-colors text-sm font-roboto"
        >
          <Icon name="LogOut" size={14} />
          Выйти
        </button>
      </div>

      {/* Avatar card */}
      <div className="glass-card rounded-xl p-6" style={{ border: "1px solid #1A2430" }}>
        <div className="flex items-center gap-5 flex-wrap">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 font-oswald text-2xl font-bold"
            style={{ background: sc.bg, border: `2px solid ${sc.text}`, color: sc.text, boxShadow: `0 0 24px ${sc.bg}` }}
          >
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-oswald text-xl font-bold text-white">{user.username}</div>
            <div className="text-gray-500 text-sm font-roboto">{user.email}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-oswald font-bold"
                style={{ background: `${userLevel.color}15`, color: userLevel.color, border: `1px solid ${userLevel.color}40` }}
              >
                {userLevel.icon} {userLevel.name} · {userLevel.cashback}% кэшбэк
              </span>
              <span className="text-xs text-gray-600">Рейтинг: {user.rating_points.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs font-roboto">Баланс</div>
            <div className="font-oswald text-3xl font-bold text-neon-green">
              {user.balance.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
            </div>
            {user.bonus_balance > 0 && (
              <div className="text-yellow-400 text-xs font-roboto mt-0.5">
                + {user.bonus_balance.toLocaleString()} ₽ бонус
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button className="px-4 py-1.5 bg-neon-green text-sport-dark font-oswald font-bold text-sm rounded">
                Пополнить
              </button>
              <button className="px-4 py-1.5 border border-sport-border text-gray-300 font-oswald text-sm rounded hover:border-neon-green transition-colors">
                Вывести
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Всего ставок", value: String(user.total_bets), icon: "TicketCheck", color: "#00B4FF" },
          { label: "Выиграно", value: String(user.won_bets), icon: "TrendingUp", color: "#00FF87" },
          { label: "Проиграно", value: String(user.lost_bets), icon: "TrendingDown", color: "#FF3B3B" },
          { label: "Win Rate", value: user.total_bets > 0 ? `${winRate}%` : "—", icon: "Percent", color: "#FFD700" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-lg p-4 text-center" style={{ border: "1px solid #1A2430" }}>
            <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
              <Icon name={stat.icon} size={16} fallback="Circle" style={{ color: stat.color }} />
            </div>
            <div className="font-oswald text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-gray-500 text-xs font-roboto mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Программа лояльности */}
      <div className="glass-card rounded-xl overflow-hidden" style={{ border: `1px solid ${userLevel.color}40` }}>
        {/* Шапка текущего уровня */}
        <div className="p-5" style={{ background: `${userLevel.color}08` }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{userLevel.icon}</span>
              <div>
                <div className="text-xs text-gray-500 font-roboto">Программа лояльности</div>
                <div className="font-oswald text-xl font-bold" style={{ color: userLevel.color }}>{userLevel.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-roboto">Кэшбэк каждую неделю</div>
              <div className="font-oswald text-3xl font-bold" style={{ color: userLevel.color }}>{userLevel.cashback}%</div>
            </div>
          </div>

          {/* Прогресс до следующего уровня */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-roboto mb-1.5">
              <span className="text-gray-500">
                {nextLevel
                  ? <>До уровня <span style={{ color: nextLevel.color }}>{nextLevel.icon} {nextLevel.name}</span></>
                  : <span style={{ color: userLevel.color }}>👑 Максимальный уровень</span>}
              </span>
              <span className="text-gray-400">{user.total_bets} / {nextLevel?.minBets ?? user.total_bets} ставок</span>
            </div>
            <div className="h-2 rounded-full bg-sport-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${levelProgress}%`,
                  background: nextLevel
                    ? `linear-gradient(90deg, ${userLevel.color}, ${nextLevel.color})`
                    : userLevel.color,
                }}
              />
            </div>
          </div>
        </div>

        {/* Все уровни */}
        <div className="grid grid-cols-5 divide-x divide-sport-border" style={{ borderTop: "1px solid #1A2430" }}>
          {LOYALTY_LEVELS.map((level) => {
            const isActive  = level.id === userLevel.id;
            const isPassed  = LOYALTY_LEVELS.indexOf(level) < LOYALTY_LEVELS.indexOf(userLevel);
            return (
              <div
                key={level.id}
                className="flex flex-col items-center py-3 px-1 gap-1 transition-all"
                style={{
                  background: isActive ? `${level.color}10` : "transparent",
                  opacity: !isActive && !isPassed ? 0.45 : 1,
                }}
              >
                <span className="text-xl">{level.icon}</span>
                <div className="font-oswald text-[10px] font-bold text-center leading-tight" style={{ color: level.color }}>
                  {level.name}
                </div>
                <div className="font-oswald font-bold text-xs" style={{ color: isActive ? level.color : "#666" }}>
                  {level.cashback}%
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: level.color }} />
                )}
                {isPassed && (
                  <Icon name="CheckCircle" size={12} style={{ color: level.color }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sport-border overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 font-oswald text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab ? "text-neon-green border-neon-green" : "text-gray-500 border-transparent hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Профиль */}
      {activeTab === "Профиль" && (
        <div className="space-y-4">
          {[
            { label: "Логин",            value: user.username },
            { label: "Email",            value: user.email },
            { label: "Дата регистрации", value: createdDate },
          ].map((field) => (
            <div key={field.label} className="glass-card rounded-lg px-4 py-3 flex justify-between items-center" style={{ border: "1px solid #1A2430" }}>
              <span className="text-gray-500 text-sm font-roboto">{field.label}</span>
              <span className="text-white font-oswald text-sm">{field.value}</span>
            </div>
          ))}

          {/* Блок верификации */}
          <VerificationForm onStatusChange={refreshUser} />
        </div>
      )}

      {/* История ставок из БД */}
      {activeTab === "История" && (
        <div className="space-y-3">

          {/* Уведомление о расчёте ставок */}
          {settleNotice && settleNotice.wins + settleNotice.losses > 0 && (
            <div
              className="rounded-xl p-4 flex items-start gap-3 animate-fade-in"
              style={{
                background: settleNotice.wins > 0
                  ? "rgba(0,255,135,0.08)"
                  : "rgba(255,59,59,0.08)",
                border: `1px solid ${settleNotice.wins > 0 ? "rgba(0,255,135,0.25)" : "rgba(255,59,59,0.25)"}`,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                {settleNotice.wins > 0
                  ? <Icon name="Trophy" size={20} className="text-neon-green" />
                  : <Icon name="TrendingDown" size={20} className="text-red-400" />
                }
              </div>
              <div>
                <div className="font-oswald font-bold text-white text-sm mb-0.5">
                  Расчёт ставок завершён
                </div>
                <div className="font-roboto text-xs text-gray-400 space-y-0.5">
                  {settleNotice.wins > 0 && (
                    <div className="text-neon-green">
                      🏆 Выиграно: {settleNotice.wins} {settleNotice.wins === 1 ? "ставка" : "ставки"} · +{settleNotice.payout.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽ зачислено на баланс
                    </div>
                  )}
                  {settleNotice.losses > 0 && (
                    <div className="text-red-400">
                      ❌ Проиграно: {settleNotice.losses} {settleNotice.losses === 1 ? "ставка" : "ставки"}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSettleNotice(null)}
                className="ml-auto text-gray-600 hover:text-white flex-shrink-0"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          )}

          {betsLoading ? (
            <div className="text-center py-12 text-gray-600">
              <Icon name="Loader" size={32} className="mx-auto animate-spin mb-3" />
              <p className="font-roboto text-sm">Загружаем историю...</p>
            </div>
          ) : bets.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center" style={{ border: "1px solid #1A2430" }}>
              <Icon name="TicketCheck" size={40} className="mx-auto text-gray-600 mb-3 opacity-30" />
              <p className="text-gray-500 font-roboto">Ставок пока нет</p>
              <p className="text-gray-600 font-roboto text-sm mt-1">Перейди в раздел «Ставки» и сделай первую</p>
            </div>
          ) : (
            <>
              {bets.map((bet) => {
                const bs = betStatusMap[bet.status] || betStatusMap.pending;
                const date = new Date(bet.placed_at).toLocaleDateString("ru-RU", {
                  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div key={bet.id} className="glass-card rounded-lg p-4 flex items-center justify-between gap-4" style={{ border: "1px solid #1A2430" }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-oswald text-sm font-medium text-white truncate">{bet.event_name}</div>
                      <div className="text-gray-500 text-xs font-roboto mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{bet.outcome_label}</span>
                        <span className="text-gray-700">·</span>
                        <span>Коэф. <span className="text-neon-green">{bet.odds}</span></span>
                        <span className="text-gray-700">·</span>
                        <span>{date}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-oswald font-bold text-base">
                        {bet.status === "win" && <span className="text-neon-green">+{(bet.potential_win - bet.amount).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</span>}
                        {bet.status === "loss" && <span className="text-red-400">−{bet.amount.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</span>}
                        {bet.status === "pending" && <span className="text-yellow-400">{bet.amount.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</span>}
                        {bet.status === "cancelled" && <span className="text-gray-400">{bet.amount.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</span>}
                      </div>
                      <span className={`text-xs font-oswald px-2 py-0.5 rounded-full ${bs.bg} ${bs.color}`}>
                        {bs.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {betsTotal > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => loadBets(betsPage - 1)}
                    disabled={betsPage === 0}
                    className="odds-btn flex items-center gap-1 disabled:opacity-30"
                  >
                    <Icon name="ChevronLeft" size={14} />
                    Назад
                  </button>
                  <span className="text-gray-500 text-xs font-roboto">
                    {betsPage * PAGE_SIZE + 1}–{Math.min((betsPage + 1) * PAGE_SIZE, betsTotal)} из {betsTotal}
                  </span>
                  <button
                    onClick={() => loadBets(betsPage + 1)}
                    disabled={(betsPage + 1) * PAGE_SIZE >= betsTotal}
                    className="odds-btn flex items-center gap-1 disabled:opacity-30"
                  >
                    Вперёд
                    <Icon name="ChevronRight" size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "Финансы" && (
        <div className="glass-card rounded-xl p-8 text-center" style={{ border: "1px solid #1A2430" }}>
          <Icon name="Construction" size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500 font-roboto">Раздел в разработке</p>
        </div>
      )}

      {activeTab === "Настройки" && (
        <div className="space-y-3">
          {/* Push-уведомления */}
          <div className="glass-card rounded-xl p-5" style={{ border: "1px solid #1A2430" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: pushPermission === "granted" ? "rgba(0,255,135,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${pushPermission === "granted" ? "rgba(0,255,135,0.3)" : "#1A2430"}` }}>
                  <Icon name={pushPermission === "granted" ? "BellRing" : "Bell"} size={20}
                    className={pushPermission === "granted" ? "text-neon-green" : "text-gray-500"} />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-sm">Уведомления о ставках</div>
                  <div className="text-gray-500 text-xs font-roboto mt-0.5">
                    {pushPermission === "granted"
                      ? "Включены — ты получишь уведомление о результате даже если закроешь сайт"
                      : pushPermission === "denied"
                      ? "Заблокированы в настройках браузера — разреши в адресной строке"
                      : "Выключены — включи чтобы узнавать о результатах ставок мгновенно"}
                  </div>
                </div>
              </div>

              {pushPermission !== "denied" && pushPermission !== "unsupported" && (
                <button
                  onClick={handlePushToggle}
                  disabled={pushLoading}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg font-oswald font-bold text-sm transition-all disabled:opacity-60 ${
                    pushPermission === "granted"
                      ? "border border-sport-border text-gray-400 hover:border-red-500/50 hover:text-red-400"
                      : "bg-neon-green text-sport-dark"
                  }`}
                  style={pushPermission !== "granted" ? { boxShadow: "0 0 16px rgba(0,255,135,0.3)" } : {}}
                >
                  {pushLoading
                    ? <Icon name="Loader" size={14} className="animate-spin" />
                    : pushPermission === "granted"
                    ? <><Icon name="BellOff" size={14} /> Выключить</>
                    : <><Icon name="Bell" size={14} /> Включить</>
                  }
                </button>
              )}

              {pushPermission === "unsupported" && (
                <span className="text-xs text-gray-600 font-roboto">Не поддерживается браузером</span>
              )}
            </div>

            {pushPermission === "granted" && (
              <div className="mt-3 pt-3 border-t border-sport-border flex items-center gap-2 text-xs text-gray-600 font-roboto">
                <Icon name="Info" size={13} className="text-neon-green flex-shrink-0" />
                Ставки рассчитываются через ~1 минуту после размещения
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-5 opacity-50" style={{ border: "1px solid #1A2430" }}>
            <div className="flex items-center gap-3">
              <Icon name="Shield" size={20} className="text-gray-600" />
              <div>
                <div className="font-oswald font-bold text-white text-sm">Безопасность и пароль</div>
                <div className="text-gray-600 text-xs font-roboto mt-0.5">В разработке</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}