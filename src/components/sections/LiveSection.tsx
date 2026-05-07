import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { getEvents, SportEvent } from "@/lib/events";
import { useBetSlip } from "@/context/BetSlipContext";
import { getMarketsForEvent } from "@/lib/markets";

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h);
}

function generateFakeStats(event: SportEvent) {
  const tick = Math.floor(Date.now() / 30000);
  const s = hash(event.id + tick);
  const b = hash(event.id);

  const isSoccer = event.category === "Футбол";
  const isBasket = event.category === "Баскетбол";
  const isHockey = event.category === "Хоккей";
  const isTennis = event.category === "Теннис";

  let time = "", period = "", homeScore = "0", awayScore = "0";

  if (isSoccer) {
    const min = 5 + (b % 80) + (s % 5);
    time = `${Math.min(min, 90)}'`;
    period = min > 45 ? "2-й тайм" : "1-й тайм";
    homeScore = String(b % 3);
    awayScore = String((b >> 2) % 2);
  } else if (isBasket) {
    const q = 1 + (b % 4);
    time = `Q${q} ${(s % 12).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
    period = `${q}-я четверть`;
    homeScore = String(80 + b % 30);
    awayScore = String(78 + (b >> 3) % 28);
  } else if (isHockey) {
    const p = 1 + (b % 3);
    time = `${p}П ${5 + (s % 15)}'`;
    period = `${p}-й период`;
    homeScore = String(b % 3);
    awayScore = String((b >> 1) % 3);
  } else if (isTennis) {
    const set = 1 + (b % 3);
    time = `Сет ${set}`;
    period = `${set}-й сет`;
    homeScore = String(b % 7);
    awayScore = String((b >> 2) % 7);
  } else {
    time = `${5 + (b % 85)}'`;
    period = "Основное время";
    homeScore = String(b % 3);
    awayScore = String((b >> 2) % 2);
  }

  const viewers = 10 + (b % 150);
  const viewersStr = viewers > 99 ? `${Math.floor(viewers / 10)}K` : `${viewers}K`;
  const possession = [45 + (b % 20), 0]; possession[1] = 100 - possession[0];
  const shots = [2 + (b >> 1) % 14, 1 + (b >> 3) % 11];
  const corners = [(b % 8), ((b >> 2) % 6)];
  const cards = [(b >> 4) % 4, (b >> 5) % 3];

  return { time, period, homeScore, awayScore, viewersStr, possession, shots, corners, cards };
}

function MatchCard({ event, selected, onSelect, isRealLive }: {
  event: SportEvent; selected: string | null;
  onSelect: (id: string) => void; isRealLive: boolean;
}) {
  const isActive = selected === event.id;
  const hasRealData = isRealLive && !!event.live_data;

  let homeScore = "—", awayScore = "—", time = "", period = "";
  if (hasRealData && event.live_data) {
    homeScore = event.live_data.home_score;
    awayScore = event.live_data.away_score;
    period = event.live_data.period;
    time = "LIVE";
  } else if (isRealLive) {
    const f = generateFakeStats(event);
    homeScore = f.homeScore; awayScore = f.awayScore; time = f.time; period = f.period;
  } else {
    time = event.date;
  }

  return (
    <button
      onClick={() => onSelect(event.id)}
      className="w-full glass-card rounded-lg p-3 text-left transition-all"
      style={isActive
        ? { border: "1px solid #00FF87", boxShadow: "0 0 10px rgba(0,255,135,0.15)" }
        : { border: "1px solid #1A2430" }
      }
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-gray-500 font-roboto">{event.sport} {event.league}</span>
        <div className="flex items-center gap-1">
          {isRealLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          <span className={`text-[10px] font-oswald font-bold ${isRealLive ? "text-red-400" : "text-gray-500"}`}>{time}</span>
        </div>
      </div>
      <div className="font-oswald font-bold text-white text-sm">
        <div className="flex justify-between items-center">
          <span className="truncate flex-1 mr-2">{event.home}</span>
          <span className={`text-base flex-shrink-0 ${isRealLive ? "text-neon-green" : "text-gray-400"}`}>{homeScore}</span>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="truncate flex-1 mr-2 text-gray-400">{event.away}</span>
          <span className="text-gray-400 text-base flex-shrink-0">{awayScore}</span>
        </div>
      </div>
      {period && <div className="text-[10px] text-gray-600 font-roboto mt-1">{period}</div>}
    </button>
  );
}

export default function LiveSection() {
  const { addBet, isSelected } = useBetSlip();
  const [liveEvents, setLiveEvents] = useState<SportEvent[]>([]);
  const [lineEvents, setLineEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeMarket, setActiveMarket] = useState("h2h");
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const [liveData, lineData] = await Promise.all([
        getEvents(undefined, true, true),
        getEvents(undefined, false, false),
      ]);
      setLiveEvents(liveData.events);
      setLineEvents(lineData.events);
      setSelected(prev => {
        if (prev) return prev;
        const all = liveData.events.length > 0 ? liveData.events : lineData.events;
        return all[0]?.id ?? null;
      });
    } catch {
      // keep current
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = setInterval(load, 2 * 60 * 1000);
    const ticker = setInterval(() => setTick(t => t + 1), 30000);
    return () => { clearInterval(refresh); clearInterval(ticker); };
  }, [load]);

  const lineOnly = lineEvents.filter(e => !liveEvents.find(l => l.id === e.id));
  const displayEvents = [...liveEvents, ...lineOnly];
  const selectedEvent = displayEvents.find(e => e.id === selected);
  const isRealLive = !!selectedEvent?.is_live && !!selectedEvent?.live_data;

  let homeScore = "—", awayScore = "—", time = "", period = "", viewersStr = "—";
  let possession = [50, 50], shots = [0, 0], corners = [0, 0], cards = [0, 0];

  if (selectedEvent) {
    if (isRealLive && selectedEvent.live_data) {
      homeScore = selectedEvent.live_data.home_score;
      awayScore = selectedEvent.live_data.away_score;
      period = selectedEvent.live_data.period;
      time = "LIVE";
      viewersStr = `${Math.floor(Math.random() * 80 + 20)}K`;
    } else {
      const f = generateFakeStats(selectedEvent);
      homeScore = f.homeScore; awayScore = f.awayScore;
      time = f.time; period = f.period; viewersStr = f.viewersStr;
      possession = f.possession; shots = f.shots; corners = f.corners; cards = f.cards;
    }
  }

  const allMarkets = selectedEvent ? getMarketsForEvent(selectedEvent) : [];
  const currentMarket = allMarkets.find(m => m.key === activeMarket) ?? allMarkets[0];

  const handleSelect = (id: string) => { setSelected(id); setActiveMarket("h2h"); };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="section-title">Live события</h2>
          <span className="live-badge">LIVE</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card rounded-lg p-4 animate-pulse" style={{ border: "1px solid #1A2430" }}>
                <div className="h-3 w-24 bg-sport-border rounded mb-3" />
                <div className="h-4 w-full bg-sport-border rounded mb-1" />
                <div className="h-4 w-3/4 bg-sport-border rounded" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 glass-card rounded-xl p-6 animate-pulse" style={{ border: "1px solid #1A2430" }}>
            <div className="h-32 bg-sport-border rounded-lg mb-4" />
            <div className="h-24 bg-sport-border rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="section-title">Live события</h2>
        <span className="live-badge">LIVE</span>
        {liveEvents.length > 0 ? (
          <span className="flex items-center gap-1 text-xs text-neon-green font-roboto">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            {liveEvents.length} реальных матчей
          </span>
        ) : (
          <span className="text-xs text-gray-600 font-roboto">Реальных live сейчас нет · показаны ближайшие</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Список */}
        <div className="lg:col-span-1 space-y-1.5 max-h-[80vh] overflow-y-auto pr-1">
          {liveEvents.length > 0 && (
            <div className="text-[10px] text-red-400 font-oswald uppercase tracking-wider px-1 mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Прямо сейчас
            </div>
          )}
          {liveEvents.map(e => <MatchCard key={e.id} event={e} selected={selected} onSelect={handleSelect} isRealLive />)}

          {lineOnly.length > 0 && (
            <div className="text-[10px] text-gray-600 font-oswald uppercase tracking-wider px-1 mt-2 mb-1">
              {liveEvents.length > 0 ? "Скоро начнутся" : "Предстоящие матчи"}
            </div>
          )}
          {lineOnly.map(e => <MatchCard key={e.id} event={e} selected={selected} onSelect={handleSelect} isRealLive={false} />)}
        </div>

        {/* Детали */}
        {selectedEvent && (
          <div className="lg:col-span-2 space-y-4">

            {/* Табло */}
            <div className="glass-card rounded-xl p-5" style={{ border: "1px solid #1A2430" }}>
              <div className="flex items-center justify-center gap-2 mb-3 text-xs text-gray-500 font-roboto">
                <span>{selectedEvent.sport}</span>
                <span>{selectedEvent.league}</span>
                {isRealLive
                  ? <span className="live-badge text-[10px]">LIVE</span>
                  : <span className="text-gray-600">{selectedEvent.date}</span>
                }
              </div>

              <div className="flex items-center justify-center gap-4 mb-5">
                <div className="flex-1 text-right">
                  <div className="font-oswald font-bold text-white text-base md:text-xl">{selectedEvent.home}</div>
                </div>
                <div className="flex-shrink-0 text-center">
                  <div className="font-oswald text-4xl font-bold text-neon-green">
                    {homeScore}<span className="text-gray-600 mx-1">:</span>{awayScore}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-400 font-oswald">{time}</span>
                    {period && <span className="text-xs text-gray-500 font-roboto">{period}</span>}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-oswald font-bold text-white text-base md:text-xl">{selectedEvent.away}</div>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: "Владение", h: possession[0], a: possession[1], u: "%" },
                  { label: "Удары",    h: shots[0],      a: shots[1],      u: "" },
                  { label: "Угловые", h: corners[0],    a: corners[1],    u: "" },
                  { label: "Карточки",h: cards[0],      a: cards[1],      u: "" },
                ].map(st => {
                  const total = (st.h + st.a) || 1;
                  return (
                    <div key={st.label}>
                      <div className="flex justify-between text-xs font-roboto mb-1">
                        <span className="text-white font-medium">{st.h}{st.u}</span>
                        <span className="text-gray-500">{st.label}</span>
                        <span className="text-white font-medium">{st.a}{st.u}</span>
                      </div>
                      <div className="h-1 rounded-full bg-sport-border overflow-hidden">
                        <div className="h-full bg-neon-green transition-all duration-700"
                          style={{ width: `${Math.round(st.h / total * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 justify-center mt-3 text-gray-600">
                <Icon name="Eye" size={11} />
                <span className="text-xs font-roboto">{viewersStr} зрителей</span>
              </div>
            </div>

            {/* Ставки */}
            <div className="glass-card rounded-xl p-5" style={{ border: "1px solid #1A2430" }}>
              <div className="flex items-center gap-2 mb-3">
                {isRealLive && <span className="live-badge text-[10px]">LIVE</span>}
                <span className="text-sm font-oswald font-bold text-white">Ставки</span>
                <span className="text-xs text-gray-600 font-roboto ml-auto">{allMarkets.length} рынков</span>
              </div>

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

              <div className="flex gap-2 flex-wrap">
                {currentMarket?.outcomes.map(outcome => (
                  <button
                    key={outcome.type}
                    onClick={() => addBet({
                      eventId: `${selectedEvent.id}_live_${activeMarket}`,
                      type: outcome.type,
                      odds: String(outcome.odds),
                      name: `${isRealLive ? "🔴 LIVE: " : ""}${selectedEvent.home} — ${selectedEvent.away} · ${currentMarket.label}`,
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
