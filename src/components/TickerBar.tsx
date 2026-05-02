const tickers = [
  "⚽ Реал Мадрид — Барселона 2:1 · 65'",
  "🏀 Лейкерс — Селтикс 98:94 · 4Q",
  "🎾 Джокович — Надаль 6:4 · 2 сет",
  "🏒 ЦСКА — Динамо 3:2 · 55'",
  "⚽ Ман Сити — Арсенал 1:0 · 30'",
  "🏈 Буффало — Канзас-Сити OT",
  "⚽ ПСЖ — Бавария 0:0 · 15'",
  "🎾 Медведев — Алькарас 7:5 · 3 сет",
];

export default function TickerBar() {
  const doubled = [...tickers, ...tickers];
  return (
    <div className="bg-sport-card border-b border-sport-border overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-neon-green text-sport-dark font-oswald font-bold text-xs px-3 py-1.5 uppercase tracking-wider z-10">
          Live
        </div>
        <div className="overflow-hidden flex-1">
          <div
            className="flex gap-8 py-1.5 animate-ticker whitespace-nowrap"
            style={{ width: "max-content" }}
          >
            {doubled.map((item, i) => (
              <span key={i} className="text-xs text-gray-400 font-roboto flex-shrink-0">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
