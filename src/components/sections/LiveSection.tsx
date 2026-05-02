import { useState } from "react";
import Icon from "@/components/ui/icon";

const liveEvents = [
  {
    id: 1,
    sport: "⚽",
    league: "Ла Лига",
    home: "Реал Мадрид",
    away: "Барселона",
    score: "2:1",
    time: "65'",
    viewers: "124K",
    odds: { w1: "1.45", x: "4.20", w2: "6.50" },
    stats: { possession: [58, 42], shots: [8, 5] },
  },
  {
    id: 2,
    sport: "🏀",
    league: "НБА",
    home: "Лейкерс",
    away: "Селтикс",
    score: "98:94",
    time: "4Q 2:30",
    viewers: "89K",
    odds: { w1: "1.82", x: "—", w2: "2.05" },
    stats: { possession: [51, 49], shots: [38, 36] },
  },
  {
    id: 3,
    sport: "🎾",
    league: "ATP Мадрид",
    home: "Джокович",
    away: "Надаль",
    score: "6:4",
    time: "2 сет",
    viewers: "67K",
    odds: { w1: "1.60", x: "—", w2: "2.35" },
    stats: { possession: [65, 35], shots: [12, 8] },
  },
  {
    id: 4,
    sport: "🏒",
    league: "КХЛ",
    home: "ЦСКА",
    away: "Динамо Москва",
    score: "3:2",
    time: "55'",
    viewers: "31K",
    odds: { w1: "1.70", x: "—", w2: "2.20" },
    stats: { possession: [55, 45], shots: [18, 14] },
  },
];

export default function LiveSection() {
  const [selected, setSelected] = useState<number | null>(1);

  const selectedEvent = liveEvents.find((e) => e.id === selected);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="section-title">Live события</h2>
        <span className="live-badge">LIVE</span>
        <span className="text-gray-500 text-sm">{liveEvents.length} матча</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Events list */}
        <div className="lg:col-span-1 space-y-2">
          {liveEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelected(event.id)}
              className={`w-full glass-card rounded-lg p-4 text-left transition-all ${
                selected === event.id
                  ? "border-neon-green"
                  : "border-sport-border hover:border-sport-border/80"
              }`}
              style={
                selected === event.id
                  ? { border: "1px solid #00FF87", boxShadow: "0 0 12px rgba(0,255,135,0.15)" }
                  : { border: "1px solid #1A2430" }
              }
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-roboto">
                  {event.sport} {event.league}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-400 font-oswald">{event.time}</span>
                </div>
              </div>
              <div className="font-oswald font-bold text-white">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{event.home}</span>
                  <span className="text-neon-green text-lg">{event.score.split(":")[0]}</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-sm text-gray-400">{event.away}</span>
                  <span className="text-gray-400 text-lg">{event.score.split(":")[1]}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Icon name="Eye" size={11} className="text-gray-600" />
                <span className="text-xs text-gray-600">{event.viewers}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected event detail */}
        {selectedEvent && (
          <div className="lg:col-span-2 glass-card rounded-xl p-6" style={{ border: "1px solid #1A2430" }}>
            {/* Stream placeholder */}
            <div
              className="rounded-lg mb-6 flex items-center justify-center"
              style={{
                height: 200,
                background: "linear-gradient(135deg, #0F1519 0%, #141C24 100%)",
                border: "1px solid #1A2430",
              }}
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mx-auto">
                  <Icon name="Play" size={28} className="text-neon-green ml-1" />
                </div>
                <div>
                  <div className="font-oswald text-white font-bold">Прямая трансляция</div>
                  <div className="text-gray-500 text-xs mt-1 flex items-center justify-center gap-1">
                    <Icon name="Eye" size={11} />
                    {selectedEvent.viewers} зрителей
                  </div>
                </div>
              </div>
            </div>

            {/* Score board */}
            <div className="text-center mb-6">
              <div className="text-gray-400 text-sm font-roboto mb-2">
                {selectedEvent.sport} {selectedEvent.league}
              </div>
              <div className="flex items-center justify-center gap-6">
                <span className="font-oswald text-xl font-bold text-white">{selectedEvent.home}</span>
                <div className="flex items-center gap-3">
                  <span className="font-oswald text-4xl font-bold text-neon-green">{selectedEvent.score}</span>
                  <span className="live-badge">{selectedEvent.time}</span>
                </div>
                <span className="font-oswald text-xl font-bold text-white">{selectedEvent.away}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 font-roboto mb-1">
                  <span>Владение мячом</span>
                  <span>{selectedEvent.stats.possession[0]}% — {selectedEvent.stats.possession[1]}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-sport-border overflow-hidden flex">
                  <div
                    className="h-full bg-neon-green rounded-full transition-all"
                    style={{ width: `${selectedEvent.stats.possession[0]}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Odds */}
            <div>
              <div className="text-xs text-gray-500 font-roboto mb-3 uppercase tracking-wider">Ставки</div>
              <div className="grid grid-cols-3 gap-2">
                <button className="odds-btn text-center py-3">
                  <div className="text-xs text-gray-400 mb-1">П1</div>
                  <div className="text-base font-bold">{selectedEvent.odds.w1}</div>
                </button>
                <button className="odds-btn text-center py-3">
                  <div className="text-xs text-gray-400 mb-1">X</div>
                  <div className="text-base font-bold">{selectedEvent.odds.x}</div>
                </button>
                <button className="odds-btn text-center py-3">
                  <div className="text-xs text-gray-400 mb-1">П2</div>
                  <div className="text-base font-bold">{selectedEvent.odds.w2}</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
