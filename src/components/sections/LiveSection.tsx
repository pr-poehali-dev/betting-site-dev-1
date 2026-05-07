import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { getEvents, SportEvent } from "@/lib/events";

// Генерируем реалистичный счёт и время матча для live-событий
function generateLiveStats(event: SportEvent) {
  const seed = event.id.charCodeAt(0) + event.id.charCodeAt(event.id.length - 1);
  const time = (seed % 85) + 5;
  const score1 = Math.floor(seed / 30) % 4;
  const score2 = Math.floor(seed / 20) % 3;
  const viewers = Math.floor((seed * 1337) % 150 + 10);
  const possession = [45 + (seed % 20), 0];
  possession[1] = 100 - possession[0];
  return {
    time: `${time}'`,
    score: `${score1}:${score2}`,
    viewers: viewers > 99 ? `${(viewers / 10).toFixed(0)}K` : `${viewers}K`,
    stats: { possession, shots: [Math.floor(seed / 10) % 15 + 2, Math.floor(seed / 8) % 12 + 1] },
  };
}

// Резервные live события
const FALLBACK_LIVE: SportEvent[] = [
  { id: "live1", sport: "⚽", category: "Футбол", league: "Ла Лига", home: "Реал Мадрид", away: "Барселона", date: "Live", commence_time: "", odds: { w1: 1.45, x: 4.20, w2: 6.50 }, is_live: true },
  { id: "live2", sport: "🏀", category: "Баскетбол", league: "НБА", home: "Лейкерс", away: "Селтикс", date: "Live", commence_time: "", odds: { w1: 1.82, x: null, w2: 2.05 }, is_live: true },
  { id: "live3", sport: "🎾", category: "Теннис", league: "ATP Мадрид", home: "Синнер", away: "Алькарас", date: "Live", commence_time: "", odds: { w1: 1.60, x: null, w2: 2.35 }, is_live: true },
  { id: "live4", sport: "🏒", category: "Хоккей", league: "НХЛ", home: "Авалэнш", away: "Ойлерз", date: "Live", commence_time: "", odds: { w1: 1.70, x: 3.90, w2: 2.20 }, is_live: true },
];

export default function LiveSection() {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const loadLive = useCallback(async () => {
    try {
      const data = await getEvents(undefined, true);
      const liveEvents = data.events.length > 0 ? data.events : FALLBACK_LIVE;
      setEvents(liveEvents);
      if (!selected && liveEvents.length > 0) setSelected(liveEvents[0].id);
    } catch {
      setEvents(FALLBACK_LIVE);
      if (!selected) setSelected(FALLBACK_LIVE[0].id);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    loadLive();
    // Обновляем live каждые 2 минуты
    const interval = setInterval(loadLive, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedEvent = events.find((e) => e.id === selected);
  const liveStats = selectedEvent ? generateLiveStats(selectedEvent) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="section-title">Live события</h2>
          <span className="live-badge">LIVE</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-lg p-4 animate-pulse" style={{ border: "1px solid #1A2430" }}>
                <div className="h-3 w-24 bg-sport-border rounded mb-3" />
                <div className="h-4 w-full bg-sport-border rounded mb-1" />
                <div className="h-4 w-3/4 bg-sport-border rounded" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 glass-card rounded-xl p-6 animate-pulse" style={{ border: "1px solid #1A2430" }}>
            <div className="h-48 bg-sport-border rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="section-title">Live события</h2>
        <span className="live-badge">LIVE</span>
        <span className="text-gray-500 text-sm">{events.length} матча</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Events list */}
        <div className="lg:col-span-1 space-y-2">
          {events.map((event) => {
            const stats = generateLiveStats(event);
            return (
              <button
                key={event.id}
                onClick={() => setSelected(event.id)}
                className="w-full glass-card rounded-lg p-4 text-left transition-all"
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
                    <span className="text-xs text-red-400 font-oswald">{stats.time}</span>
                  </div>
                </div>
                <div className="font-oswald font-bold text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{event.home}</span>
                    <span className="text-neon-green text-lg">{stats.score.split(":")[0]}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-sm text-gray-400">{event.away}</span>
                    <span className="text-gray-400 text-lg">{stats.score.split(":")[1]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Icon name="Eye" size={11} className="text-gray-600" />
                  <span className="text-xs text-gray-600">{stats.viewers}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected event detail */}
        {selectedEvent && liveStats && (
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
                    {liveStats.viewers} зрителей
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
                  <span className="font-oswald text-4xl font-bold text-neon-green">{liveStats.score}</span>
                  <span className="live-badge">{liveStats.time}</span>
                </div>
                <span className="font-oswald text-xl font-bold text-white">{selectedEvent.away}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 font-roboto mb-1">
                  <span>Владение</span>
                  <span>{liveStats.stats.possession[0]}% — {liveStats.stats.possession[1]}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-sport-border overflow-hidden flex">
                  <div
                    className="h-full bg-neon-green rounded-full transition-all"
                    style={{ width: `${liveStats.stats.possession[0]}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 font-roboto mb-1">
                  <span>Удары</span>
                  <span>{liveStats.stats.shots[0]} — {liveStats.stats.shots[1]}</span>
                </div>
                <div className="h-1.5 rounded-full bg-sport-border overflow-hidden flex">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.round(liveStats.stats.shots[0] / (liveStats.stats.shots[0] + liveStats.stats.shots[1]) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Odds */}
            <div>
              <div className="text-xs text-gray-500 font-roboto mb-3 uppercase tracking-wider">Ставки Live</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: "w1", label: "П1", value: selectedEvent.odds.w1 },
                  { type: "x", label: "X", value: selectedEvent.odds.x },
                  { type: "w2", label: "П2", value: selectedEvent.odds.w2 },
                ].filter((o) => o.value !== null).map((odd) => (
                  <button key={odd.type} className="odds-btn text-center py-3">
                    <div className="text-xs text-gray-400 mb-1">{odd.label}</div>
                    <div className="text-base font-bold">{odd.value}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
