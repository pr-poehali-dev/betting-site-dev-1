import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const promos = [
  {
    id: 1,
    badge: "🎁 Новый игрок",
    title: "Бонус 100% на первый депозит",
    desc: "Пополни счёт от 1 000 ₽ и получи бонус до 15 000 ₽ на спортивные ставки",
    deadline: "Бессрочно",
    highlight: true,
    color: "#00FF87",
    details: ["Мин. депозит: 1 000 ₽", "Макс. бонус: 15 000 ₽", "Вейджер: x5", "Срок отыгрыша: 30 дней"],
  },
  {
    id: 2,
    badge: "⚡ Экспресс-буст",
    title: "Буст коэффициентов ×1.2",
    desc: "Собери экспресс из 3+ событий с коэф. от 1.5 и получи буст итогового коэффициента",
    deadline: "До 31 мая 2026",
    highlight: false,
    color: "#00B4FF",
    details: ["Мин. 3 события", "Мин. коэф. каждого: 1.5", "Буст: ×1.2", "Мин. ставка: 500 ₽"],
  },
  {
    id: 3,
    badge: "⚽ Лига чемпионов",
    title: "Страховка на финал ЛЧ",
    desc: "Поставь на финал Лиги чемпионов — верни ставку до 3 000 ₽ если победит другая команда",
    deadline: "31 мая 2026",
    highlight: false,
    color: "#FF6B35",
    details: ["Только матч финала ЛЧ", "Макс. страховка: 3 000 ₽", "Мин. ставка: 500 ₽", "Фрибет зачисляется в течение 24 ч"],
  },
];

// Уровни программы лояльности
const LOYALTY_LEVELS = [
  {
    id: "bronze",
    name: "Бронза",
    icon: "🥉",
    color: "#CD7F32",
    bg: "#CD7F3215",
    border: "#CD7F3240",
    minBets: 0,
    minAmount: 0,
    cashback: 5,
    perks: ["Кэшбэк 5% в неделю", "Бонус в день рождения", "Доступ к акциям"],
  },
  {
    id: "silver",
    name: "Серебро",
    icon: "🥈",
    color: "#C0C0C0",
    bg: "#C0C0C015",
    border: "#C0C0C040",
    minBets: 10,
    minAmount: 5000,
    cashback: 10,
    perks: ["Кэшбэк 10% в неделю", "Повышенные лимиты", "Приоритетная поддержка", "Фрибет ×1.5 каждый месяц"],
  },
  {
    id: "gold",
    name: "Золото",
    icon: "🥇",
    color: "#FFD700",
    bg: "#FFD70015",
    border: "#FFD70040",
    minBets: 30,
    minAmount: 25000,
    cashback: 15,
    perks: ["Кэшбэк 15% в неделю", "Личный менеджер", "Эксклюзивные коэф.", "Ускоренный вывод", "Бонус ×2 на депозит"],
  },
  {
    id: "platinum",
    name: "Платина",
    icon: "💎",
    color: "#E5E4E2",
    bg: "#E5E4E215",
    border: "#E5E4E240",
    minBets: 100,
    minAmount: 100000,
    cashback: 20,
    perks: ["Кэшбэк 20% в неделю", "VIP-менеджер 24/7", "Закрытые турниры", "Спец. лимиты на ставки", "Подарки и мерч"],
  },
  {
    id: "diamond",
    name: "Бриллиант",
    icon: "👑",
    color: "#00FFFF",
    bg: "#00FFFF15",
    border: "#00FFFF40",
    minBets: 300,
    minAmount: 500000,
    cashback: 30,
    perks: ["Кэшбэк 30% в неделю", "Индивидуальные условия", "VIP-события и поездки", "Персональный кэшбэк план", "Приоритет всех выплат"],
  },
];

const ratings = [
  { place: 1, name: "Орёл***123", amount: "142 500 ₽", bets: 87 },
  { place: 2, name: "Sport***777", amount: "98 200 ₽", bets: 64 },
  { place: 3, name: "Игрок***999", amount: "75 600 ₽", bets: 51 },
  { place: 4, name: "Удача***456", amount: "61 100 ₽", bets: 43 },
  { place: 5, name: "Чемп***321", amount: "48 900 ₽", bets: 38 },
];

function getUserLevel(totalBets: number, totalAmount: number) {
  let current = LOYALTY_LEVELS[0];
  for (const level of LOYALTY_LEVELS) {
    if (totalBets >= level.minBets && totalAmount >= level.minAmount) {
      current = level;
    }
  }
  return current;
}

function getNextLevel(currentId: string) {
  const idx = LOYALTY_LEVELS.findIndex(l => l.id === currentId);
  return idx < LOYALTY_LEVELS.length - 1 ? LOYALTY_LEVELS[idx + 1] : null;
}

function getProgress(totalBets: number, totalAmount: number, currentId: string) {
  const next = getNextLevel(currentId);
  if (!next) return 100;
  const prevLevel = LOYALTY_LEVELS.find(l => l.id === currentId)!;
  const betsProg = Math.min((totalBets - prevLevel.minBets) / Math.max(next.minBets - prevLevel.minBets, 1) * 100, 100);
  const amtProg  = Math.min((totalAmount - prevLevel.minAmount) / Math.max(next.minAmount - prevLevel.minAmount, 1) * 100, 100);
  return Math.round((betsProg + amtProg) / 2);
}

export default function PromoSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"promos" | "loyalty">("promos");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const totalBets   = user?.total_bets   ?? 0;
  const totalAmount = user ? (user.total_bets * 500) : 0; // примерная оценка
  const userLevel   = getUserLevel(totalBets, totalAmount);
  const nextLevel   = getNextLevel(userLevel.id);
  const progress    = getProgress(totalBets, totalAmount, userLevel.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Акции и бонусы</h2>
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #1A2430" }}>
          {(["promos", "loyalty"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-oswald text-sm font-bold transition-all ${
                activeTab === tab ? "bg-neon-green text-sport-dark" : "text-gray-500 hover:text-white"
              }`}
            >
              {tab === "promos" ? "Акции" : "Программа лояльности"}
            </button>
          ))}
        </div>
      </div>

      {/* ── АКЦИИ ── */}
      {activeTab === "promos" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promos.map((promo) => (
              <div
                key={promo.id}
                className="glass-card rounded-xl p-6 relative overflow-hidden transition-all hover:scale-[1.01]"
                style={{
                  border: promo.highlight ? `1px solid ${promo.color}` : "1px solid #1A2430",
                  boxShadow: promo.highlight ? `0 0 24px ${promo.color}20` : "none",
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5"
                  style={{ background: promo.color, transform: "translate(30%, -30%)" }} />
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-oswald font-bold px-2 py-1 rounded-full"
                    style={{ background: `${promo.color}15`, color: promo.color, border: `1px solid ${promo.color}30` }}>
                    {promo.badge}
                  </span>
                  <span className="text-xs text-gray-600 font-roboto">{promo.deadline}</span>
                </div>
                <h3 className="font-oswald text-lg font-bold text-white mb-2">{promo.title}</h3>
                <p className="text-gray-400 text-sm font-roboto mb-4 leading-relaxed">{promo.desc}</p>
                <div className="space-y-1.5 mb-5">
                  {promo.details.map((d) => (
                    <div key={d} className="flex items-center gap-2 text-xs text-gray-500 font-roboto">
                      <span style={{ color: promo.color }}>✓</span>{d}
                    </div>
                  ))}
                </div>
                <button
                  className="w-full py-2.5 font-oswald font-bold text-sm rounded uppercase tracking-wide transition-all"
                  style={{
                    background: promo.highlight ? promo.color : "transparent",
                    color: promo.highlight ? "#080C10" : promo.color,
                    border: `1px solid ${promo.color}`,
                  }}
                >
                  Получить бонус
                </button>
              </div>
            ))}
          </div>

          {/* Рейтинг */}
          <div>
            <h3 className="section-title mb-4">Рейтинг игроков месяца</h3>
            <div className="glass-card rounded-xl overflow-hidden" style={{ border: "1px solid #1A2430" }}>
              <div className="gradient-line" />
              {ratings.map((r) => (
                <div key={r.place}
                  className="flex items-center gap-4 px-5 py-3 border-b border-sport-border last:border-0 hover:bg-sport-surface transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-oswald font-bold text-sm flex-shrink-0"
                    style={{
                      background: r.place === 1 ? "#FFD70020" : r.place === 2 ? "#C0C0C020" : r.place === 3 ? "#CD7F3220" : "#1A2430",
                      color: r.place === 1 ? "#FFD700" : r.place === 2 ? "#C0C0C0" : r.place === 3 ? "#CD7F32" : "#666",
                      border: `1px solid ${r.place === 1 ? "#FFD70040" : r.place === 2 ? "#C0C0C040" : r.place === 3 ? "#CD7F3240" : "#1A2430"}`,
                    }}>
                    {r.place}
                  </div>
                  <div className="flex-1 font-roboto text-sm text-white">{r.name}</div>
                  <div className="text-right">
                    <div className="font-oswald font-bold text-neon-green text-sm">{r.amount}</div>
                    <div className="text-gray-600 text-xs">{r.bets} ставок</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ПРОГРАММА ЛОЯЛЬНОСТИ ── */}
      {activeTab === "loyalty" && (
        <div className="space-y-6">

          {/* Карточка текущего статуса игрока */}
          {user ? (
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden"
              style={{ border: `1px solid ${userLevel.border}`, boxShadow: `0 0 30px ${userLevel.bg}` }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5"
                style={{ background: userLevel.color, transform: "translate(30%, -30%)" }} />
              <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div>
                  <div className="text-xs text-gray-500 font-roboto mb-1">Ваш статус</div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{userLevel.icon}</span>
                    <span className="font-oswald text-2xl font-bold" style={{ color: userLevel.color }}>
                      {userLevel.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-roboto mb-1">Кэшбэк</div>
                  <div className="font-oswald text-3xl font-bold" style={{ color: userLevel.color }}>
                    {userLevel.cashback}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid #1A2430" }}>
                  <div className="text-xs text-gray-500 font-roboto">Всего ставок</div>
                  <div className="font-oswald font-bold text-white text-lg">{totalBets}</div>
                </div>
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid #1A2430" }}>
                  <div className="text-xs text-gray-500 font-roboto">Баллы</div>
                  <div className="font-oswald font-bold text-white text-lg">{user.rating_points ?? 0}</div>
                </div>
              </div>

              {nextLevel ? (
                <div>
                  <div className="flex justify-between text-xs font-roboto mb-1.5">
                    <span className="text-gray-500">До уровня <span style={{ color: nextLevel.color }}>{nextLevel.name}</span></span>
                    <span className="text-gray-400">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-sport-border overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${userLevel.color}, ${nextLevel.color})` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-600 font-roboto mt-1">
                    <span>Нужно {nextLevel.minBets} ставок и {nextLevel.minAmount.toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <span className="text-xs font-roboto" style={{ color: userLevel.color }}>
                    👑 Максимальный уровень достигнут!
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-6 text-center" style={{ border: "1px solid #1A2430" }}>
              <span className="text-4xl mb-3 block">🏆</span>
              <p className="text-gray-400 font-roboto text-sm mb-3">Войди в аккаунт чтобы видеть свой статус</p>
            </div>
          )}

          {/* Таблица уровней */}
          <div>
            <h3 className="font-oswald text-lg font-bold text-white mb-4">Все уровни программы</h3>
            <div className="space-y-3">
              {LOYALTY_LEVELS.map(level => {
                const isActive = user && userLevel.id === level.id;
                const isOpen = selectedLevel === level.id;
                return (
                  <div key={level.id}
                    className="glass-card rounded-xl overflow-hidden transition-all"
                    style={{
                      border: isActive ? `1px solid ${level.color}` : "1px solid #1A2430",
                      boxShadow: isActive ? `0 0 16px ${level.bg}` : "none",
                    }}>
                    <button
                      className="w-full flex items-center gap-4 px-5 py-4 text-left"
                      onClick={() => setSelectedLevel(isOpen ? null : level.id)}
                    >
                      <span className="text-2xl flex-shrink-0">{level.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-oswald font-bold text-white">{level.name}</span>
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-oswald font-bold"
                              style={{ background: `${level.color}20`, color: level.color, border: `1px solid ${level.border}` }}>
                              Ваш уровень
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-roboto mt-0.5">
                          от {level.minBets} ставок · от {level.minAmount.toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-oswald font-bold text-xl" style={{ color: level.color }}>
                          {level.cashback}%
                        </div>
                        <div className="text-xs text-gray-600 font-roboto">кэшбэк</div>
                      </div>
                      <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-gray-600 flex-shrink-0" />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1" style={{ borderTop: "1px solid #1A2430" }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {level.perks.map(perk => (
                            <div key={perk} className="flex items-center gap-2 text-sm text-gray-400 font-roboto">
                              <span style={{ color: level.color }} className="flex-shrink-0">✓</span>
                              {perk}
                            </div>
                          ))}
                        </div>
                        {level.id !== "bronze" && (
                          <div className="mt-3 text-xs text-gray-600 font-roboto pt-3" style={{ borderTop: "1px solid #1A2430" }}>
                            Условие: минимум {level.minBets} ставок и {level.minAmount.toLocaleString("ru-RU")} ₽ общей суммы
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Как работает кэшбэк */}
          <div className="glass-card rounded-xl p-6" style={{ border: "1px solid #1A2430" }}>
            <h3 className="font-oswald text-lg font-bold text-white mb-4">Как работает кэшбэк</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { n: "1", title: "Делай ставки",    desc: "Каждую неделю считается сумма проигранных ставок", icon: "TrendingUp" },
                { n: "2", title: "Получай кэшбэк",  desc: "В понедельник % от проигрыша возвращается на бонусный счёт", icon: "RefreshCw" },
                { n: "3", title: "Повышай уровень", desc: "Чем больше ставок — тем выше статус и % кэшбэка (до 30%)", icon: "Award" },
              ].map(step => (
                <div key={step.n} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center flex-shrink-0 font-oswald font-bold text-neon-green text-sm">
                    {step.n}
                  </div>
                  <div>
                    <div className="font-oswald font-bold text-white text-sm mb-1">{step.title}</div>
                    <div className="text-xs text-gray-500 font-roboto leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
