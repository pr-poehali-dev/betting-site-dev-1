import { useState } from "react";
import Icon from "@/components/ui/icon";

const recentBets = [
  { id: 1, match: "Реал Мадрид — Барселона", bet: "П1", odds: 2.1, amount: 1000, status: "win", date: "01.05.2026" },
  { id: 2, match: "Лейкерс — Бостон", bet: "П2", odds: 1.95, amount: 500, status: "loss", date: "30.04.2026" },
  { id: 3, match: "Джокович — Надаль", bet: "П1", odds: 1.6, amount: 750, status: "win", date: "29.04.2026" },
  { id: 4, match: "ЦСКА — Динамо", bet: "П1", odds: 1.7, amount: 300, status: "pending", date: "02.05.2026" },
];

const tabs = ["Профиль", "История", "Финансы", "Настройки"];

export default function ProfileSection() {
  const [activeTab, setActiveTab] = useState("Профиль");

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="section-title">Личный кабинет</h2>

      {/* Avatar card */}
      <div className="glass-card rounded-xl p-6" style={{ border: "1px solid #1A2430" }}>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-neon-green/10 border-2 border-neon-green flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: "0 0 20px rgba(0,255,135,0.2)" }}>
            <Icon name="User" size={32} className="text-neon-green" />
          </div>
          <div>
            <div className="font-oswald text-xl font-bold text-white">Игрок #247834</div>
            <div className="text-gray-500 text-sm font-roboto">player@email.com</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-oswald">
                ⭐ Gold
              </span>
              <span className="text-xs text-gray-600">Рейтинг: 4 320</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-gray-500 text-xs font-roboto">Баланс</div>
            <div className="font-oswald text-3xl font-bold text-neon-green">12 450 ₽</div>
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
          { label: "Всего ставок", value: "234", icon: "TicketCheck", color: "#00B4FF" },
          { label: "Выиграно", value: "142", icon: "TrendingUp", color: "#00FF87" },
          { label: "Проиграно", value: "89", icon: "TrendingDown", color: "#FF3B3B" },
          { label: "ROI", value: "+14.2%", icon: "Percent", color: "#FFD700" },
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
            { label: "Имя", value: "Не указано" },
            { label: "Email", value: "player@email.com" },
            { label: "Телефон", value: "+7 *** ***-**-**" },
            { label: "Дата регистрации", value: "15 января 2025" },
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
                  {bet.status === "win" && (
                    <span className="text-neon-green">+{(bet.amount * bet.odds - bet.amount).toFixed(0)} ₽</span>
                  )}
                  {bet.status === "loss" && (
                    <span className="text-red-400">−{bet.amount} ₽</span>
                  )}
                  {bet.status === "pending" && (
                    <span className="text-yellow-400">{bet.amount} ₽</span>
                  )}
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
