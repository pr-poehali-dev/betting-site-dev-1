import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import PendingBetsWidget from "@/components/PendingBetsWidget";
import { getEvents, SportEvent } from "@/lib/events";

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

function MatchSkeleton() {
  return (
    <div className="glass-card rounded-lg p-4 animate-pulse" style={{ border: "1px solid #1A2430" }}>
      <div className="flex justify-between mb-3">
        <div className="h-3 w-36 bg-sport-border rounded" />
        <div className="h-3 w-16 bg-sport-border rounded" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 w-44 bg-sport-border rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-sport-border rounded-lg" />
          <div className="h-8 w-16 bg-sport-border rounded-lg hidden sm:block" />
          <div className="h-8 w-16 bg-sport-border rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function HomeSection({ onNav }: HomeSectionProps) {
  const [topMatches, setTopMatches] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents()
      .then((data) => {
        // Берём первые 5 матчей — они будут топом
        setTopMatches(data.events.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

      {/* Активные ставки с таймером */}
      <PendingBetsWidget onNav={onNav} />

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
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <MatchSkeleton key={i} />)
          ) : topMatches.length === 0 ? (
            <div className="glass-card rounded-lg p-8 text-center" style={{ border: "1px solid #1A2430" }}>
              <p className="text-gray-500 font-roboto text-sm">Матчи загружаются...</p>
            </div>
          ) : (
            topMatches.map((match, i) => (
              <div key={match.id} className="glass-card rounded-lg p-4 neon-border cursor-pointer" onClick={() => onNav("bets")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{match.sport}</span>
                    <span className="text-gray-500 text-xs font-roboto">{match.league}</span>
                    {i === 0 && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-oswald">
                        🔥 ТОП
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs">{match.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-oswald text-sm md:text-base font-medium text-white">
                    <span>{match.home}</span>
                    <span className="text-gray-600 mx-2">—</span>
                    <span>{match.away}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="odds-btn" onClick={(e) => { e.stopPropagation(); onNav("bets"); }}>П1 {match.odds.w1}</button>
                    {match.odds.x && (
                      <button className="odds-btn hidden sm:block" onClick={(e) => { e.stopPropagation(); onNav("bets"); }}>X {match.odds.x}</button>
                    )}
                    <button className="odds-btn" onClick={(e) => { e.stopPropagation(); onNav("bets"); }}>П2 {match.odds.w2}</button>
                  </div>
                </div>
              </div>
            ))
          )}
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