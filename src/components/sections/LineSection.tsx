import { useState } from "react";

const sports = [
  { id: "football", emoji: "⚽", name: "Футбол", count: 2340 },
  { id: "basketball", emoji: "🏀", name: "Баскетбол", count: 890 },
  { id: "tennis", emoji: "🎾", name: "Теннис", count: 1200 },
  { id: "hockey", emoji: "🏒", name: "Хоккей", count: 450 },
  { id: "mma", emoji: "🥊", name: "ММА", count: 180 },
  { id: "volleyball", emoji: "🏐", name: "Волейбол", count: 280 },
];

const lineData: Record<string, { league: string; matches: { home: string; away: string; date: string; odds: string[] }[] }[]> = {
  football: [
    {
      league: "Лига чемпионов УЕФА",
      matches: [
        { home: "Реал Мадрид", away: "Ман Сити", date: "Сег. 21:00", odds: ["2.10", "3.50", "3.40"] },
        { home: "ПСЖ", away: "Бавария", date: "Сег. 21:00", odds: ["3.20", "3.30", "2.20"] },
        { home: "Интер", away: "Атлетико", date: "Завт. 19:00", odds: ["2.60", "3.20", "2.80"] },
      ],
    },
    {
      league: "АПЛ — Англия",
      matches: [
        { home: "Ливерпуль", away: "Манчестер Юнайтед", date: "Вс. 17:30", odds: ["1.85", "3.70", "4.50"] },
        { home: "Арсенал", away: "Тоттенхэм", date: "Суб. 13:30", odds: ["2.00", "3.40", "3.80"] },
      ],
    },
  ],
  basketball: [
    {
      league: "НБА",
      matches: [
        { home: "Лейкерс", away: "Клипперс", date: "Сег. 04:00", odds: ["1.90", "—", "1.95"] },
        { home: "Бостон", away: "Нью-Йорк", date: "Завт. 01:00", odds: ["1.65", "—", "2.30"] },
      ],
    },
  ],
  tennis: [
    {
      league: "ATP 1000 Мадрид",
      matches: [
        { home: "Синнер", away: "Алькарас", date: "Завт. 14:00", odds: ["1.90", "—", "1.95"] },
        { home: "Медведев", away: "Циципас", date: "Сег. 16:00", odds: ["1.75", "—", "2.15"] },
      ],
    },
  ],
  hockey: [
    {
      league: "КХЛ Плей-офф",
      matches: [
        { home: "ЦСКА", away: "СКА", date: "Завт. 19:30", odds: ["1.85", "—", "2.00"] },
      ],
    },
  ],
  mma: [
    {
      league: "UFC 305",
      matches: [
        { home: "Адесанья", away: "Дю Плесси", date: "Суб. 04:00", odds: ["2.10", "—", "1.75"] },
      ],
    },
  ],
  volleyball: [
    {
      league: "Суперлига России",
      matches: [
        { home: "Зенит СПб", away: "Локомотив", date: "Завт. 18:00", odds: ["1.60", "—", "2.40"] },
      ],
    },
  ],
};

export default function LineSection() {
  const [activeSport, setActiveSport] = useState("football");
  const data = lineData[activeSport] || [];

  return (
    <div className="space-y-6">
      <h2 className="section-title">Линия ставок</h2>

      <div className="flex gap-2 flex-wrap">
        {sports.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSport(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-oswald text-sm font-medium transition-all ${
              activeSport === s.id
                ? "bg-neon-green text-sport-dark"
                : "glass-card text-gray-400 hover:text-white border border-sport-border"
            }`}
          >
            <span>{s.emoji}</span>
            <span>{s.name}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeSport === s.id ? "bg-sport-dark/30 text-sport-dark" : "bg-sport-border text-gray-500"
              }`}
            >
              {s.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {data.map((group) => (
          <div key={group.league}>
            <div className="flex items-center gap-3 mb-2">
              <div className="gradient-line flex-1" />
              <span className="text-xs font-oswald font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {group.league}
              </span>
              <div className="gradient-line flex-1" style={{ background: "linear-gradient(270deg, #00FF87, #00B4FF, transparent)" }} />
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 text-xs text-gray-600 font-oswald uppercase px-4 py-2">
              <div className="col-span-6">Матч</div>
              <div className="col-span-2 text-center">Дата</div>
              <div className="col-span-1 text-center">П1</div>
              <div className="col-span-1 text-center">X</div>
              <div className="col-span-1 text-center">П2</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-1">
              {group.matches.map((match, i) => (
                <div key={i} className="glass-card rounded-lg p-3 neon-border grid grid-cols-12 items-center">
                  <div className="col-span-6 font-oswald text-sm font-medium text-white">
                    {match.home} — {match.away}
                  </div>
                  <div className="col-span-2 text-center text-xs text-gray-500 font-roboto">
                    {match.date}
                  </div>
                  {match.odds.map((odd, oi) => (
                    <div key={oi} className="col-span-1 flex justify-center">
                      {odd !== "—" ? (
                        <button className="odds-btn w-full text-center py-1">{odd}</button>
                      ) : (
                        <span className="text-gray-700 text-sm font-roboto">—</span>
                      )}
                    </div>
                  ))}
                  <div className="col-span-1 flex justify-end">
                    <button className="text-gray-600 hover:text-neon-green transition-colors">
                      <span className="text-xs font-roboto">+18</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
