import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { getEvents, SportEvent } from "@/lib/events";
import { useBetSlip } from "@/context/BetSlipContext";
import { getMarketsForEvent } from "@/lib/markets";

// Детерминированный хэш для стабильных псевдо-live данных
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h);
}

// Живые данные — меняются каждые 30 сек на основе текущего времени + id матча
function getLiveStats(event: SportEvent) {
  const tick = Math.floor(Date.now() / 30000); // меняется каждые 30 сек
  const seed = hash(event.id + tick);
  const baseSeed = hash(event.id);

  const isSoccer = event.category === "Футбол";
  const isBasket = event.category === "Баскетбол";
  const isHockey = event.category === "Хоккей";
  const isTennis = event.category === "Теннис";

  let time = "";
  let score = "";
  let period = "";

  if (isSoccer) {
    const min = 5 + (baseSeed % 80) + (seed % 5);
    time = `${Math.min(min, 90)}'`;
    score = `${baseSeed % 3}:${(baseSeed >> 2) % 2}`;
    period = min > 45 ? "2-й тайм" : "1-й тайм";
  } else if (isBasket) {
    const q = 1 + (baseSeed % 4);
    const mins = (seed % 12).toString().padStart(2, "0");
    time = `Q${q} ${mins}:${(seed % 60).toString().padStart(2, "0")}`;
    score = `${80 + baseSeed % 30}:${78 + (baseSeed >> 3) % 28}`;
    period = `${q}-я четверть`;
  } else if (isHockey) {
    const p = 1 + (baseSeed % 3);
    time = `${p}П ${5 + (seed % 15)}'`;
    score = `${baseSeed % 3}:${(baseSeed >> 1) % 3}`;
    period = `${p}-й период`;
  } else if (isTennis) {
    const set = 1 + (baseSeed % 3);
    score = `${baseSeed % 7}:${(baseSeed >> 2) % 7}`;
    time = `Сет ${set}`;
    period = `${set}-й сет`;
  } else {
    time = `${5 + (baseSeed % 85)}'`;
    score = `${baseSeed % 3}:${(baseSeed >> 2) % 2}`;
    period = "Основное время";
  }

  const viewers = 10 + (baseSeed % 150);
  const viewersStr = viewers > 99 ? `${(viewers / 10).toFixed(0)}K` : `${viewers}K`;
  const possession = [45 + (baseSeed % 20), 0];
  possession[1] = 100 - possession[0];
  const shots = [2 + (baseSeed >> 1) % 14, 1 + (baseSeed >> 3) % 11];
  const corners = [(baseSeed % 8), ((baseSeed >> 2) % 6)];
  const cards = [(baseSeed >> 4) % 4, (baseSeed >> 5) % 3];

  return { time, score, period, viewersStr, possession, shots, corners, cards };
}

export default function LiveSection() {
  const { addBet, isSelected } = useBetSlip();
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [activeMarket, setActiveMarket] = useState("h2h");

  const loadEvents = useCallback(async () => {
    try {
      // Берём обычные события — показываем как live
      const data = await getEvents(undefined, undefined, false);
      if (data.events.length > 0) {
        setEvents(data.events);
        setSelected(prev => prev ?? data.events[0].id);
      }
    } catch {
      // оставляем текущие
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    const refresh = setInterval(loadEvents, 5 * 60 * 1000);
    // Тик каждые 30 сек для анимации live-данных
    const ticker = setInterval(() => setTick(t => t + 1), 30000);
    return () => { clearInterval(refresh); clearInterval(ticker); };
  }, [loadEvents]);

  const selectedEvent = events.find(e => e.id === selected);
  const liveStats = selectedEvent ? getLiveStats(selectedEvent) : null;
  const allMarkets = selectedEvent ? getMarketsForEvent(selectedEvent) : [];
  const currentMarket = allMarkets.find(m => m.key === activeMarket) ?? allMarkets[0];

  // Сброс маркета при смене матча
  const handleSelect = (id: string) => {
    setSelected(id);
    setActiveMarket("h2h");
  };

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
        <span className="text-gray-500 text-sm">{events.length} матчей</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Список матчей */}
        <div className="lg:col-span-1 space-y-2 max-h-[80vh] overflow-y-auto pr-1">
          {events.map((event) => {
            const s = getLiveStats(event);
            const isActive = selected === event.id;
            return (
              <button
                key={event.id}
                onClick={() => handleSelect(event.id)}
                className="w-full glass-card rounded-lg p-3 text-left transition-all"
                style={isActive
                  ? { border: "1px solid #00FF87", boxShadow: "0 0 12px rgba(0,255,135,0.15)" }
                  : { border: "1px solid #1A2430" }
                }
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500 font-roboto">{event.sport} {event.league}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-400 font-oswald font-bold">{s.time}</span>
                  </div>
                </div>
                <div className="font-oswald font-bold text-white text-sm">
                  <div className="flex justify-between items-center">
                    <span className="truncate flex-1 mr-2">{event.home}</span>
                    <span className="text-neon-green text-base flex-shrink-0">{s.score.split(":")[0]}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="truncate flex-1 mr-2 text-gray-400">{event.away}</span>
                    <span className="text-gray-400 text-base flex-shrink-0">{s.score.split(":")[1]}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <Icon name="Eye" size={10} className="text-gray-600" />
                    <span className="text-[10px] text-gray-600">{s.viewersStr}</span>
                  </div>
                  <span className="text-[10px] text-gray-600 font-roboto">{s.period}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Детали выбранного матча */}
        {selectedEvent && liveStats && (
          <div className="lg:col-span-2 space-y-4">

            {/* Табло */}
            <div className="glass-card rounded-xl p-5" style={{ border: "1px solid #1A2430" }}>
              <div className="text-center text-xs text-gray-500 font-roboto mb-3">
                {selectedEvent.sport} {selectedEvent.league} · <span className="text-red-400">{liveStats.period}</span>
              </div>

              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex-1 text-right">
                  <div className="font-oswald font-bold text-white text-lg leading-tight">{selectedEvent.home}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-oswald text-4xl font-bold text-neon-green">{liveStats.score}</span>
                  <span className="live-badge">{liveStats.time}</span>
                </div>
                <div className="flex-1">
                  <div className="font-oswald font-bold text-white text-lg leading-tight">{selectedEvent.away}</div>
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: "Владение", home: liveStats.possession[0], away: liveStats.possession[1], unit: "%" },
                  { label: "Удары", home: liveStats.shots[0], away: liveStats.shots[1], unit: "" },
                  { label: "Угловые", home: liveStats.corners[0], away: liveStats.corners[1], unit: "" },
                  { label: "Карточки", home: liveStats.cards[0], away: liveStats.cards[1], unit: "" },
                ].map(stat => {
                  const total = stat.home + stat.away || 1;
                  const pct = Math.round(stat.home / total * 100);
                  return (
                    <div key={stat.label}>
                      <div className="flex justify-between text-xs text-gray-500 font-roboto mb-1">
                        <span className="text-white font-medium">{stat.home}{stat.unit}</span>
                        <span>{stat.label}</span>
                        <span className="text-white font-medium">{stat.away}{stat.unit}</span>
                      </div>
                      <div className="h-1 rounded-full bg-sport-border overflow-hidden flex">
                        <div className="h-full bg-neon-green transition-all duration-1000" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ставки live */}
            <div className="glass-card rounded-xl p-5" style={{ border: "1px solid #1A2430" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="live-badge text-[10px]">LIVE</span>
                <span className="text-sm font-oswald font-bold text-white">Ставки</span>
              </div>

              {/* Табы маркетов */}
              <div className="flex gap-1 overflow-x-auto scrollbar-none mb-3 pb-0.5">
                {allMarkets.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setActiveMarket(m.key)}
                    className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-roboto whitespace-nowrap transition-all ${
                      activeMarket === m.key
                        ? "bg-neon-green text-sport-dark font-medium"
                        : "text-gray-500 hover:text-white"
                    }`}
                    style={activeMarket !== m.key ? { background: "rgba(255,255,255,0.04)", border: "1px solid #1A2430" } : {}}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Коэффициенты */}
              <div className="flex gap-2 flex-wrap">
                {currentMarket?.outcomes.map(outcome => (
                  <button
                    key={outcome.type}
                    onClick={() => addBet({
                      eventId: `${selectedEvent.id}_live_${activeMarket}`,
                      type: outcome.type,
                      odds: String(outcome.odds),
                      name: `🔴 LIVE: ${selectedEvent.home} — ${selectedEvent.away} · ${currentMarket.label}`,
                      league: selectedEvent.league,
                      sport: selectedEvent.sport,
                    })}
                    className={`odds-btn flex-1 min-w-[72px] py-3 ${isSelected(`${selectedEvent.id}_live_${activeMarket}`, outcome.type) ? "active" : ""}`}
                  >
                    <span className="text-xs text-gray-400 block mb-1">{outcome.label}</span>
                    <span className="font-bold text-base">{outcome.odds}</span>
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
