import Icon from "@/components/ui/icon";

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
    title: "Буст коэффициентов х1.2",
    desc: "Собери экспресс из 3+ событий с коэф. от 1.5 и получи буст итогового коэффициента",
    deadline: "До 31 мая 2026",
    highlight: false,
    color: "#00B4FF",
    details: ["Мин. 3 события", "Мин. коэф. каждого: 1.5", "Буст: x1.2", "Мин. ставка: 500 ₽"],
  },
  {
    id: 3,
    badge: "🏆 VIP программа",
    title: "Система лояльности BetSport",
    desc: "Копи баллы за ставки, повышай статус и получай эксклюзивные привилегии",
    deadline: "Постоянная акция",
    highlight: false,
    color: "#FFD700",
    details: ["4 уровня: Silver, Gold, Platinum, Diamond", "Кешбэк до 10%", "Персональный менеджер", "Бонусы на день рождения"],
  },
  {
    id: 4,
    badge: "⚽ Лига чемпионов",
    title: "Страховка на финал ЛЧ",
    desc: "Поставь на финал Лиги чемпионов — верни ставку до 3 000 ₽ если победит другая команда",
    deadline: "31 мая 2026",
    highlight: false,
    color: "#FF6B35",
    details: ["Только матч финала ЛЧ", "Макс. страховка: 3 000 ₽", "Мин. ставка: 500 ₽", "Фрибет зачисляется в течение 24 ч"],
  },
];

const ratings = [
  { place: 1, name: "Орёл***123", amount: "142 500 ₽", bets: 87 },
  { place: 2, name: "Sport***777", amount: "98 200 ₽", bets: 64 },
  { place: 3, name: "Игрок***999", amount: "75 600 ₽", bets: 51 },
  { place: 4, name: "Удача***456", amount: "61 100 ₽", bets: 43 },
  { place: 5, name: "Чемп***321", amount: "48 900 ₽", bets: 38 },
];

export default function PromoSection() {
  return (
    <div className="space-y-8">
      <h2 className="section-title">Акции и бонусы</h2>

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
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5"
              style={{ background: promo.color, transform: "translate(30%, -30%)" }}
            />
            <div className="flex items-start justify-between mb-3">
              <span
                className="text-xs font-oswald font-bold px-2 py-1 rounded-full"
                style={{ background: `${promo.color}15`, color: promo.color, border: `1px solid ${promo.color}30` }}
              >
                {promo.badge}
              </span>
              <span className="text-xs text-gray-600 font-roboto">{promo.deadline}</span>
            </div>
            <h3 className="font-oswald text-lg font-bold text-white mb-2">{promo.title}</h3>
            <p className="text-gray-400 text-sm font-roboto mb-4 leading-relaxed">{promo.desc}</p>
            <div className="space-y-1.5 mb-5">
              {promo.details.map((d) => (
                <div key={d} className="flex items-center gap-2 text-xs text-gray-500 font-roboto">
                  <span style={{ color: promo.color }}>✓</span>
                  {d}
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

      {/* Rating */}
      <div>
        <h3 className="section-title mb-4">Рейтинг игроков месяца</h3>
        <div className="glass-card rounded-xl overflow-hidden" style={{ border: "1px solid #1A2430" }}>
          <div className="gradient-line" />
          {ratings.map((r) => (
            <div
              key={r.place}
              className="flex items-center gap-4 px-5 py-3 border-b border-sport-border last:border-0 hover:bg-sport-surface transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-oswald font-bold text-sm flex-shrink-0"
                style={{
                  background: r.place === 1 ? "#FFD70020" : r.place === 2 ? "#C0C0C020" : r.place === 3 ? "#CD7F3220" : "#1A2430",
                  color: r.place === 1 ? "#FFD700" : r.place === 2 ? "#C0C0C0" : r.place === 3 ? "#CD7F32" : "#666",
                  border: `1px solid ${r.place === 1 ? "#FFD70040" : r.place === 2 ? "#C0C0C040" : r.place === 3 ? "#CD7F3240" : "#1A2430"}`,
                }}
              >
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
  );
}
