import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { getEvents, SportEvent } from "@/lib/events";

const SPORT_TABS = [
  { id: "Все",        emoji: "🏆", name: "Все" },
  { id: "Футбол",     emoji: "⚽", name: "Футбол" },
  { id: "Баскетбол",  emoji: "🏀", name: "Баскетбол" },
  { id: "Теннис",     emoji: "🎾", name: "Теннис" },
  { id: "Хоккей",     emoji: "🏒", name: "Хоккей" },
  { id: "ММА",        emoji: "🥊", name: "ММА" },
];

function groupByLeague(events: SportEvent[]): { league: string; emoji: string; matches: SportEvent[] }[] {
  const map = new Map<string, { emoji: string; matches: SportEvent[] }>();
  for (const e of events) {
    if (!map.has(e.league)) map.set(e.league, { emoji: e.sport, matches: [] });
    map.get(e.league)!.matches.push(e);
  }
  return Array.from(map.entries()).map(([league, v]) => ({ league, ...v }));
}

function MatchRowSkeleton() {
  return (
    <div className="glass-card rounded-lg p-3 grid grid-cols-12 items-center animate-pulse gap-1" style={{ border: "1px solid #1A2430" }}>
      <div className="col-span-5 h-4 bg-sport-border rounded" />
      <div className="col-span-2 h-3 bg-sport-border rounded mx-auto w-16" />
      <div className="col-span-1 h-8 bg-sport-border rounded" />
      <div className="col-span-1 h-8 bg-sport-border rounded" />
      <div className="col-span-1 h-8 bg-sport-border rounded" />
      <div className="col-span-2" />
    </div>
  );
}

export default function LineSection() {
  const [activeSport, setActiveSport] = useState("Все");
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReal, setIsReal] = useState(false);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const data = await getEvents(undefined, undefined, force);
      setEvents(data.events);
      setIsReal(data.is_real);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(), 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = activeSport === "Все" ? events : events.filter(e => e.category === activeSport);
  const groups = groupByLeague(filtered);

  // Считаем количество матчей по видам
  const countBySport = (cat: string) =>
    cat === "Все" ? events.length : events.filter(e => e.category === cat).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Линия ставок</h2>
        <div className="flex items-center gap-2">
          {isReal && (
            <span className="flex items-center gap-1 text-xs text-neon-green font-roboto">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              Реальные матчи
            </span>
          )}
          <button onClick={() => load(true)} className="text-gray-600 hover:text-gray-400 transition-colors" title="Обновить">
            <Icon name="RefreshCw" size={14} />
          </button>
        </div>
      </div>

      {/* Табы видов спорта */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SPORT_TABS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSport(s.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-oswald text-sm font-medium transition-all ${
              activeSport === s.id
                ? "bg-neon-green text-sport-dark"
                : "glass-card text-gray-400 hover:text-white border border-sport-border"
            }`}
          >
            <span>{s.emoji}</span>
            <span>{s.name}</span>
            {!loading && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeSport === s.id ? "bg-sport-dark/30 text-sport-dark" : "bg-sport-border text-gray-500"
              }`}>
                {countBySport(s.id)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Заголовок таблицы */}
      <div className="hidden md:grid grid-cols-12 text-xs text-gray-600 font-oswald uppercase px-4 py-1">
        <div className="col-span-5">Матч</div>
        <div className="col-span-2 text-center">Дата</div>
        <div className="col-span-1 text-center">П1</div>
        <div className="col-span-1 text-center">X</div>
        <div className="col-span-1 text-center">П2</div>
        <div className="col-span-2" />
      </div>

      <div className="space-y-6">
        {loading ? (
          // Скелетон
          [1, 2, 3].map(g => (
            <div key={g}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-sport-border" />
                <div className="h-3 w-32 bg-sport-border rounded animate-pulse" />
                <div className="h-px flex-1 bg-sport-border" />
              </div>
              <div className="space-y-1">
                {[1, 2, 3].map(i => <MatchRowSkeleton key={i} />)}
              </div>
            </div>
          ))
        ) : groups.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center" style={{ border: "1px solid #1A2430" }}>
            <span className="text-5xl mb-4 block">🏆</span>
            <p className="text-gray-500 font-roboto">Нет матчей в данной категории</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.league}>
              {/* Заголовок лиги */}
              <div className="flex items-center gap-3 mb-2">
                <div className="gradient-line flex-1" />
                <span className="text-xs font-oswald font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                  <span>{group.emoji}</span>
                  <span>{group.league}</span>
                </span>
                <div className="gradient-line flex-1" style={{ background: "linear-gradient(270deg, #00FF87, #00B4FF, transparent)" }} />
              </div>

              <div className="space-y-1">
                {group.matches.map((match) => (
                  <div key={match.id} className="glass-card rounded-lg p-3 neon-border">
                    {/* Mobile layout */}
                    <div className="flex md:hidden items-center justify-between gap-2">
                      <div>
                        <div className="font-oswald text-sm font-medium text-white">{match.home}</div>
                        <div className="text-gray-600 text-xs my-0.5">—</div>
                        <div className="font-oswald text-sm font-medium text-gray-300">{match.away}</div>
                        <div className="text-xs text-gray-600 font-roboto mt-1">{match.date}</div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button className="odds-btn py-1 px-2">
                          <span className="text-xs text-gray-500 block">П1</span>
                          <span className="font-bold text-sm">{match.odds.w1}</span>
                        </button>
                        {match.odds.x ? (
                          <button className="odds-btn py-1 px-2">
                            <span className="text-xs text-gray-500 block">X</span>
                            <span className="font-bold text-sm">{match.odds.x}</span>
                          </button>
                        ) : (
                          <div className="odds-btn py-1 px-2 opacity-30 cursor-default">
                            <span className="text-xs text-gray-500 block">X</span>
                            <span className="font-bold text-sm text-gray-600">—</span>
                          </div>
                        )}
                        <button className="odds-btn py-1 px-2">
                          <span className="text-xs text-gray-500 block">П2</span>
                          <span className="font-bold text-sm">{match.odds.w2}</span>
                        </button>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden md:grid grid-cols-12 items-center gap-1">
                      <div className="col-span-5 font-oswald text-sm font-medium text-white">
                        {match.home} — {match.away}
                      </div>
                      <div className="col-span-2 text-center text-xs text-gray-500 font-roboto">
                        {match.date}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button className="odds-btn w-full text-center py-1 text-sm font-bold">{match.odds.w1}</button>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {match.odds.x ? (
                          <button className="odds-btn w-full text-center py-1 text-sm font-bold">{match.odds.x}</button>
                        ) : (
                          <span className="text-gray-700 text-sm font-roboto w-full text-center block">—</span>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button className="odds-btn w-full text-center py-1 text-sm font-bold">{match.odds.w2}</button>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <span className="text-xs text-gray-600 font-roboto px-2 py-0.5 rounded border border-sport-border">
                          +{Math.floor(Math.random() * 30 + 5)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
