import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { placeBet, BetItem } from "@/lib/bets";
import { settleWithPush } from "@/lib/notifications";
import { getEvents, SportEvent } from "@/lib/events";
import { useBetSlip } from "@/context/BetSlipContext";
import { getMarketsForEvent } from "@/lib/markets";
import AuthModal from "@/components/AuthModal";

const categories = ["Все", "Футбол", "Баскетбол", "Теннис", "Хоккей", "ММА"];

type BetStatus = "idle" | "loading" | "success" | "error";

interface EventCardProps {
  event: SportEvent;
  addBet: (item: { eventId: string; type: string; odds: string; name: string; league: string; sport: string }) => void;
  isSelected: (eventId: string, type: string) => boolean;
}

function EventCard({ event, addBet, isSelected }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeMarket, setActiveMarket] = useState("h2h");

  const allMarkets = getMarketsForEvent(event);
  const currentMarket = allMarkets.find(m => m.key === activeMarket) ?? allMarkets[0];

  // Первые 3 исхода основного рынка для компактного вида
  const mainMarket = allMarkets[0];

  return (
    <div className="glass-card rounded-lg neon-border overflow-hidden">
      {/* Компактная шапка — всегда видна */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{event.sport}</span>
            <span className="text-gray-500 text-xs font-roboto">{event.league}</span>
          </div>
          <span className="text-gray-500 text-xs">{event.date}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="font-oswald font-medium text-white text-sm flex-1 min-w-0">
            <span>{event.home}</span>
            <span className="text-gray-600 mx-1.5">—</span>
            <span>{event.away}</span>
          </div>

          {/* Основные коэффициенты (компактно) */}
          <div className="flex gap-1 flex-shrink-0">
            {mainMarket?.outcomes.slice(0, 3).map((outcome) => (
              <button
                key={outcome.type}
                onClick={() => addBet({
                  eventId: `${event.id}_h2h`,
                  type: outcome.type,
                  odds: String(outcome.odds),
                  name: `${event.home} — ${event.away}`,
                  league: event.league,
                  sport: event.sport,
                })}
                className={`odds-btn min-w-[46px] ${isSelected(`${event.id}_h2h`, outcome.type) ? "active" : ""}`}
              >
                <span className="text-[10px] text-gray-400 block leading-none">{outcome.label}</span>
                <span className="font-bold text-sm">{outcome.odds}</span>
              </button>
            ))}
          </div>

          {/* Кнопка раскрытия */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-neon-green transition-colors flex-shrink-0 font-roboto px-2 py-1 rounded"
            style={{ border: "1px solid #1A2430", background: "rgba(255,255,255,0.03)" }}
          >
            <span className="hidden sm:inline">{expanded ? "Свернуть" : "Все ставки"}</span>
            <span className="text-neon-green font-oswald font-bold text-xs">+{allMarkets.length}</span>
            <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={12} />
          </button>
        </div>
      </div>

      {/* Развёрнутый блок со всеми рынками */}
      {expanded && (
        <div style={{ borderTop: "1px solid #1A2430", background: "rgba(0,0,0,0.2)" }}>
          {/* Табы рынков */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none px-4 pt-3 pb-2">
            {allMarkets.map((m) => (
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

          {/* Коэффициенты выбранного рынка */}
          <div className="px-4 pb-4">
            <div className="flex gap-1.5 flex-wrap">
              {currentMarket?.outcomes.map((outcome) => (
                <button
                  key={outcome.type}
                  onClick={() => addBet({
                    eventId: `${event.id}_${activeMarket}`,
                    type: outcome.type,
                    odds: String(outcome.odds),
                    name: `${event.home} — ${event.away} · ${currentMarket.label}`,
                    league: event.league,
                    sport: event.sport,
                  })}
                  className={`odds-btn flex-1 min-w-[64px] ${isSelected(`${event.id}_${activeMarket}`, outcome.type) ? "active" : ""}`}
                >
                  <span className="text-xs text-gray-400 block leading-none mb-0.5">{outcome.label}</span>
                  <span className="font-bold">{outcome.odds}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="glass-card rounded-lg p-4 animate-pulse" style={{ border: "1px solid #1A2430" }}>
      <div className="flex justify-between mb-3">
        <div className="h-3 w-32 bg-sport-border rounded" />
        <div className="h-3 w-16 bg-sport-border rounded" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 w-40 bg-sport-border rounded" />
        <div className="flex gap-1.5">
          <div className="h-10 w-14 bg-sport-border rounded-lg" />
          <div className="h-10 w-14 bg-sport-border rounded-lg" />
          <div className="h-10 w-14 bg-sport-border rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function BetsSection() {
  const { user, refreshUser } = useAuth();
  const { betSlip, addBet, removeBet, clearSlip, isSelected } = useBetSlip();

  const [activeCategory, setActiveCategory] = useState("Все");
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReal, setIsReal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [betAmount, setBetAmount] = useState("500");
  const [status, setStatus] = useState<BetStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [authModal, setAuthModal] = useState(false);

  const loadEvents = useCallback(async (force = false) => {
    try {
      const data = await getEvents(undefined, undefined, force);
      setEvents(data.events);
      setIsReal(data.is_real);
      setLastUpdated(new Date());
    } catch {
      // оставляем старые данные
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // force=true при первом открытии — сбрасываем старый кэш без поля markets
    loadEvents(true);
    const interval = setInterval(() => loadEvents(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  useEffect(() => {
    if (user) {
      settleWithPush().then((r) => { if (r.settled > 0) refreshUser(); }).catch(() => {});
    }
  }, [user]);

  const filtered = activeCategory === "Все" ? events : events.filter((e) => e.category === activeCategory);

  const totalOdds = betSlip.reduce((acc, b) => acc * parseFloat(b.odds), 1);
  const amount = parseFloat(betAmount || "0");
  const potentialWin = (amount * totalOdds).toFixed(0);

  const handlePlaceBet = async () => {
    if (!user) { setAuthModal(true); return; }
    if (betSlip.length === 0) return;
    if (amount < 10) { setStatus("error"); setStatusMsg("Минимальная ставка 10 ₽"); return; }

    setStatus("loading");
    try {
      const betsPayload: BetItem[] = betSlip.map((b) => ({
        event_id: 0,
        event_name: b.name,
        league: b.league,
        sport: b.sport,
        outcome_type: b.type,
        outcome_label: b.type === "w1" ? "П1" : b.type === "x" ? "Ничья" : "П2",
        odds: parseFloat(b.odds),
      }));

      const result = await placeBet(betsPayload, amount);
      await refreshUser();
      clearSlip();
      setStatus("success");
      setStatusMsg(`Ставка принята! Возможный выигрыш: ${result.potential_win.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`);
    } catch (e: unknown) {
      setStatus("error");
      setStatusMsg(e instanceof Error ? e.message : "Ошибка при размещении ставки");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Ставки на спорт</h2>
        <div className="flex items-center gap-2">
          {isReal && (
            <span className="flex items-center gap-1 text-xs text-neon-green font-roboto">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              Реальные матчи
            </span>
          )}
          {lastUpdated && (
            <button onClick={() => loadEvents(true)} className="text-gray-600 hover:text-gray-400 transition-colors" title="Обновить">
              <Icon name="RefreshCw" size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full font-oswald text-sm font-medium transition-all ${
                  activeCategory === cat ? "bg-neon-green text-sport-dark" : "glass-card text-gray-400 hover:text-white border border-sport-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <EventSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <div className="glass-card rounded-lg p-8 text-center" style={{ border: "1px solid #1A2430" }}>
                <span className="text-4xl mb-3 block">🏆</span>
                <p className="text-gray-500 font-roboto text-sm">Нет событий в данной категории</p>
              </div>
            ) : (
              filtered.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  addBet={addBet}
                  isSelected={isSelected}
                />
              ))
            )}
          </div>
        </div>

        {/* Bet Slip */}
        <div className="glass-card rounded-xl p-5 h-fit sticky top-20" style={{ border: "1px solid #1A2430" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-oswald text-lg font-bold text-white">Купон ставок</h3>
            {betSlip.length > 0 && (
              <button onClick={() => { clearSlip(); setStatus("idle"); }} className="text-gray-500 hover:text-red-400 transition-colors">
                <Icon name="Trash2" size={15} />
              </button>
            )}
          </div>

          {user && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)" }}>
              <span className="text-gray-500 text-xs font-roboto">Баланс</span>
              <span className="text-neon-green font-oswald font-bold text-sm">{user.balance.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</span>
            </div>
          )}

          {betSlip.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Icon name="TicketCheck" size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-roboto">Выберите исходы для ставки</p>
            </div>
          ) : (
            <div className="space-y-4">
              {betSlip.map((b, i) => (
                <div key={i} className="border border-sport-border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <div className="text-xs text-gray-500 font-roboto leading-tight">{b.name}</div>
                      <div className="font-oswald text-sm font-medium text-white mt-0.5">
                        {b.type === "w1" ? "П1" : b.type === "x" ? "Ничья" : "П2"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-neon-green font-oswald font-bold">{b.odds}</span>
                      <button onClick={() => removeBet(b.eventId, b.type)} className="text-gray-600 hover:text-red-400">
                        <Icon name="X" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {betSlip.length > 1 && (
                <div className="text-xs text-center text-gray-500 font-roboto px-2 py-1.5 rounded" style={{ background: "rgba(0,180,255,0.07)", border: "1px solid rgba(0,180,255,0.15)" }}>
                  <span className="text-blue-400">Экспресс</span> · {betSlip.length} события
                </div>
              )}

              <div className="border-t border-sport-border pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-roboto">Коэффициент</span>
                  <span className="text-white font-oswald font-bold">{totalOdds.toFixed(2)}</span>
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Сумма ставки (₽)</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => { setBetAmount(e.target.value); setStatus("idle"); }}
                    className="w-full bg-sport-dark border border-sport-border rounded-lg px-3 py-2.5 text-white font-oswald text-sm focus:outline-none focus:border-neon-green transition-colors"
                    min={10}
                    step={100}
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[100, 500, 1000, 5000].map((v) => (
                      <button
                        key={v}
                        onClick={() => { setBetAmount(String(v)); setStatus("idle"); }}
                        className="flex-1 text-xs py-1 rounded text-gray-400 hover:text-white transition-colors"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1A2430" }}
                      >
                        {v >= 1000 ? `${v / 1000}K` : v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-roboto">Выигрыш</span>
                  <span className="text-neon-green font-oswald font-bold text-lg">{Number(potentialWin).toLocaleString("ru-RU")} ₽</span>
                </div>

                {status === "success" && (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-roboto bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    <Icon name="CheckCircle" size={14} />
                    {statusMsg}
                  </div>
                )}
                {status === "error" && (
                  <div className="flex items-center gap-2 text-red-400 text-sm font-roboto bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <Icon name="AlertCircle" size={14} />
                    {statusMsg}
                  </div>
                )}

                <button
                  onClick={handlePlaceBet}
                  disabled={status === "loading"}
                  className="w-full py-3.5 bg-neon-green text-sport-dark font-oswald font-bold text-base rounded-lg uppercase tracking-wide transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ boxShadow: "0 0 20px rgba(0,255,135,0.25)" }}
                >
                  {status === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="Loader" size={16} className="animate-spin" />
                      Обработка...
                    </span>
                  ) : !user ? "Войти и сделать ставку" : "Сделать ставку"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {authModal && <AuthModal onClose={() => setAuthModal(false)} defaultTab="login" />}
    </div>
  );
}