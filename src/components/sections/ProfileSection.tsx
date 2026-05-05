import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { getBetHistory, PlacedBet } from "@/lib/bets";
import AuthModal from "@/components/AuthModal";

const tabs = ["Профиль", "История", "Финансы", "Настройки"];

const statusLabels: Record<string, string> = {
  silver: "🥈 Silver",
  gold: "⭐ Gold",
  platinum: "💎 Platinum",
  diamond: "🔷 Diamond",
};
const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  silver: { bg: "rgba(192,192,192,0.1)", text: "#C0C0C0", border: "rgba(192,192,192,0.3)" },
  gold: { bg: "rgba(255,215,0,0.1)", text: "#FFD700", border: "rgba(255,215,0,0.3)" },
  platinum: { bg: "rgba(0,180,255,0.1)", text: "#00B4FF", border: "rgba(0,180,255,0.3)" },
  diamond: { bg: "rgba(0,255,135,0.1)", text: "#00FF87", border: "rgba(0,255,135,0.3)" },
};

const betStatusMap = {
  pending: { label: "В игре", color: "text-yellow-400", bg: "bg-yellow-500/15" },
  win: { label: "Выиграно", color: "text-green-400", bg: "bg-green-500/15" },
  loss: { label: "Проиграно", color: "text-red-400", bg: "bg-red-500/15" },
  cancelled: { label: "Отменено", color: "text-gray-400", bg: "bg-gray-500/15" },
};

const PAGE_SIZE = 10;

export default function ProfileSection() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("Профиль");
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [betsTotal, setBetsTotal] = useState(0);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betsPage, setBetsPage] = useState(0);

  useEffect(() => {
    if (activeTab === "История" && user) {
      loadBets(0);
    }
  }, [activeTab, user]);

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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="w-20 h-20 rounded-full bg-sport-surface border border-sport-border flex items-center justify-center">
          <Icon name="User" size={40} className="text-gray-600" />
        </div>
        <div className="text-center">
          <h2 className="font-oswald text-2xl font-bold text-white mb-2">Личный кабинет</h2>
          <p className="text-gray-500 font-roboto">Войди или зарегистрируйся, чтобы получить доступ к кабинету</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setAuthModal("login")}
            className="px-6 py-2.5 border border-sport-border text-white font-oswald font-bold text-sm rounded-lg hover:border-neon-green transition-all"
          >
            Войти
          </button>
          <button
            onClick={() => setAuthModal("register")}
            className="px-6 py-2.5 bg-neon-green text-sport-dark font-oswald font-bold text-sm rounded-lg"
            style={{ boxShadow: "0 0 16px rgba(0,255,135,0.3)" }}
          >
            Зарегистрироваться
          </button>
        </div>
        {authModal && <AuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} />}
      </div>
    );
  }

  const sc = statusColors[user.status] || statusColors.silver;
  const createdDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const winRate = user.total_bets > 0 ? ((user.won_bets / user.total_bets) * 100).toFixed(0) : "—";

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
                style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
              >
                {statusLabels[user.status]}
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
        <div className="space-y-3">
          {[
            { label: "Логин", value: user.username },
            { label: "Email", value: user.email },
            { label: "Статус", value: statusLabels[user.status] },
            { label: "Дата регистрации", value: createdDate },
            { label: "Верификация", value: user.is_verified ? "✅ Подтверждён" : "⏳ Не пройдена" },
          ].map((field) => (
            <div key={field.label} className="glass-card rounded-lg px-4 py-3 flex justify-between items-center" style={{ border: "1px solid #1A2430" }}>
              <span className="text-gray-500 text-sm font-roboto">{field.label}</span>
              <span className="text-white font-oswald text-sm">{field.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* История ставок из БД */}
      {activeTab === "История" && (
        <div className="space-y-3">
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

      {(activeTab === "Финансы" || activeTab === "Настройки") && (
        <div className="glass-card rounded-xl p-8 text-center" style={{ border: "1px solid #1A2430" }}>
          <Icon name="Construction" size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500 font-roboto">Раздел в разработке</p>
        </div>
      )}
    </div>
  );
}
