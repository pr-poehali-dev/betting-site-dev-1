import Icon from "@/components/ui/icon";

interface HomeSectionProps {
  onNav: (section: string) => void;
}

const stats = [
  { value: "50 000+", label: "Событий в месяц", icon: "Calendar" },
  { value: "1.98", label: "Средний коэф.", icon: "TrendingUp" },
  { value: "15 мин", label: "Вывод средств", icon: "Zap" },
  { value: "24/7", label: "Поддержка", icon: "Headphones" },
];

const sports = [
  { emoji: "⚽", name: "Футбол", count: "2 340" },
  { emoji: "🏀", name: "Баскетбол", count: "890" },
  { emoji: "🎾", name: "Теннис", count: "1 200" },
  { emoji: "🏒", name: "Хоккей", count: "450" },
  { emoji: "🏈", name: "Американский футбол", count: "320" },
  { emoji: "🥊", name: "Бокс / ММА", count: "180" },
  { emoji: "🏐", name: "Волейбол", count: "280" },
  { emoji: "🏎️", name: "Автоспорт", count: "95" },
];

const topMatches = [
  {
    league: "Примера · Испания",
    home: "Реал Мадрид",
    away: "Барселона",
    time: "Сег. 21:45",
    odds: { w1: "2.10", x: "3.40", w2: "3.60" },
    hot: true,
  },
  {
    league: "АПЛ · Англия",
    home: "Манчестер Сити",
    away: "Арсенал",
    time: "Сег. 19:30",
    odds: { w1: "1.75", x: "3.80", w2: "4.20" },
    hot: false,
  },
  {
    league: "Серия А · Италия",
    home: "Интер",
    away: "Ювентус",
    time: "Завтра 21:00",
    odds: { w1: "2.45", x: "3.20", w2: "2.90" },
    hot: false,
  },
];

export default function HomeSection({ onNav }: HomeSectionProps) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative min-h-[420px] flex items-center overflow-hidden rounded-xl hero-grid">
        <div className="absolute inset-0 bg-gradient-to-r from-sport-dark via-sport-dark/90 to-transparent z-10" />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center, #00FF8740 0%, transparent 70%)",
          }}
        />
        <div className="relative z-20 px-8 py-12 space-y-6 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="live-badge">LIVE</span>
            <span className="text-gray-400 text-sm font-roboto">
              247 событий прямо сейчас
            </span>
          </div>
          <h1 className="font-oswald text-5xl md:text-6xl font-bold text-white leading-tight uppercase">
            Ставки на{" "}
            <span className="text-neon-green block">спорт онлайн</span>
          </h1>
          <p className="text-gray-400 font-roboto text-lg">
            Высокие коэффициенты, прямые трансляции и мгновенные выплаты.
            Присоединись к 2 миллионам игроков.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => onNav("bets")}
              className="px-6 py-3 bg-neon-green text-sport-dark font-oswald font-bold text-base rounded uppercase tracking-wide transition-all hover:scale-105"
              style={{ boxShadow: "0 0 24px rgba(0,255,135,0.4)" }}
            >
              Сделать ставку
            </button>
            <button
              onClick={() => onNav("live")}
              className="px-6 py-3 border border-neon-green text-neon-green font-oswald font-bold text-base rounded uppercase tracking-wide transition-all hover:bg-neon-green hover:text-sport-dark"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                Смотреть Live
              </span>
            </button>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 z-20 hidden md:grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-lg px-4 py-3 text-center min-w-[110px]">
              <div className="font-oswald text-xl font-bold text-neon-green">
                {s.value}
              </div>
              <div className="text-gray-500 text-xs font-roboto mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sports grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Виды спорта</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sports.map((sport) => (
            <button
              key={sport.name}
              onClick={() => onNav("bets")}
              className="glass-card rounded-lg p-4 flex items-center gap-3 neon-border text-left group transition-all"
            >
              <span className="text-2xl">{sport.emoji}</span>
              <div>
                <div className="font-oswald text-sm font-medium text-white group-hover:text-neon-green transition-colors">
                  {sport.name}
                </div>
                <div className="text-gray-500 text-xs">{sport.count} событий</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Top matches */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Топ матчи</h2>
          <button
            onClick={() => onNav("line")}
            className="text-neon-green text-sm font-roboto hover:underline flex items-center gap-1"
          >
            Вся линия <Icon name="ChevronRight" size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {topMatches.map((match, i) => (
            <div key={i} className="glass-card rounded-lg p-4 neon-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs font-roboto">
                    {match.league}
                  </span>
                  {match.hot && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-oswald">
                      🔥 ТОП
                    </span>
                  )}
                </div>
                <span className="text-gray-500 text-xs">{match.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-oswald text-sm md:text-base font-medium text-white">
                  <span>{match.home}</span>
                  <span className="text-gray-600 mx-2">—</span>
                  <span>{match.away}</span>
                </div>
                <div className="flex gap-2">
                  <button className="odds-btn">П1 {match.odds.w1}</button>
                  <button className="odds-btn hidden sm:block">X {match.odds.x}</button>
                  <button className="odds-btn">П2 {match.odds.w2}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: "Tv",
            title: "Прямые трансляции",
            desc: "Смотри матчи и делай ставки в режиме реального времени",
            color: "#00FF87",
          },
          {
            icon: "Smartphone",
            title: "Мобильное приложение",
            desc: "iOS и Android — ставки в один клик из любого места",
            color: "#00B4FF",
          },
          {
            icon: "Shield",
            title: "Безопасность",
            desc: "Лицензированная платформа с шифрованием данных и верификацией",
            color: "#FFD700",
          },
        ].map((f) => (
          <div key={f.title} className="glass-card rounded-xl p-6 neon-border">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}
            >
              <Icon name={f.icon} size={24} fallback="Circle" style={{ color: f.color }} />
            </div>
            <h3 className="font-oswald text-lg font-bold text-white mb-2">
              {f.title}
            </h3>
            <p className="text-gray-400 text-sm font-roboto leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
