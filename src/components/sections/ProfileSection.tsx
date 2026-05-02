import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

const recentBets = [
  { id: 1, match: "Реал Мадрид — Барселона", bet: "П1", odds: 2.1, amount: 1000, status: "win", date: "01.05.2026" },
  { id: 2, match: "Лейкерс — Бостон", bet: "П2", odds: 1.95, amount: 500, status: "loss", date: "30.04.2026" },
  { id: 3, match: "Джокович — Надаль", bet: "П1", odds: 1.6, amount: 750, status: "win", date: "29.04.2026" },
  { id: 4, match: "ЦСКА — Динамо", bet: "П1", odds: 1.7, amount: 300, status: "pending", date: "02.05.2026" },
];

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

export default function ProfileSection() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("Профиль");
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);

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
  const roi = user.total_bets > 0
    ? ((user.won_bets / user.total_bets) * 100 - 50).toFixed(1)
    : "0.0";

  const createdDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : "—";

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
            style={{ background: sc.bg, border: `2px solid ${sc.text}`, color: sc.text, boxShadow: `0 0 20px ${sc.bg}` }}
          >
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <div className="font-oswald text-xl font-bold text-white">{user.username}</div>
            <div className="text-gray-500 text-sm font-roboto">{user.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-oswald font-bold"
                style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
              >
                {statusLabels[user.status]}
              </span>
              <span className="text-xs text-gray-600">Рейтинг: {user.rating_points.toLocaleString()}</span>
            </div>
          </div>
          <div className="ml-auto text-right">
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
          { label: "Win Rate", value: user.total_bets > 0 ? `${((user.won_bets / user.total_bets) * 100).toFixed(0)}%` : "—", icon: "Percent", color: "#FFD700" },
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
      <div className="flex gap-1 border-b border-sport-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 font-oswald text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? "text-neon-green border-neon-green"
                : "text-gray-500 border-transparent hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

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

      {activeTab === "История" && (
        <div className="space-y-2">
          {recentBets.map((bet) => (
            <div key={bet.id} className="glass-card rounded-lg p-4 flex items-center justify-between" style={{ border: "1px solid #1A2430" }}>
              <div>
                <div className="font-oswald text-sm font-medium text-white">{bet.match}</div>
                <div className="text-gray-500 text-xs font-roboto mt-0.5">
                  {bet.bet} · Коэф. {bet.odds} · {bet.date}
                </div>
              </div>
              <div className="text-right">
                <div className="font-oswald font-bold text-base">
                  {bet.status === "win" && <span className="text-neon-green">+{(bet.amount * bet.odds - bet.amount).toFixed(0)} ₽</span>}
                  {bet.status === "loss" && <span className="text-red-400">−{bet.amount} ₽</span>}
                  {bet.status === "pending" && <span className="text-yellow-400">{bet.amount} ₽</span>}
                </div>
                <span className={`text-xs font-oswald px-2 py-0.5 rounded-full ${
                  bet.status === "win" ? "bg-green-500/15 text-green-400" :
                  bet.status === "loss" ? "bg-red-500/15 text-red-400" :
                  "bg-yellow-500/15 text-yellow-400"
                }`}>
                  {bet.status === "win" ? "Выиграно" : bet.status === "loss" ? "Проиграно" : "В игре"}
                </span>
              </div>
            </div>
          ))}
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
