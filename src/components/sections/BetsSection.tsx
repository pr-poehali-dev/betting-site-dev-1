import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { placeBet, BetItem } from "@/lib/bets";
import AuthModal from "@/components/AuthModal";

const categories = ["Все", "Футбол", "Баскетбол", "Теннис", "Хоккей", "ММА"];

const events = [
  { id: 1, sport: "⚽", category: "Футбол", league: "Лига чемпионов", home: "Манчестер Сити", away: "Реал Мадрид", date: "Сег. 21:00", odds: { w1: "2.30", x: "3.40", w2: "3.10" } },
  { id: 2, sport: "⚽", category: "Футбол", league: "АПЛ", home: "Ливерпуль", away: "Челси", date: "Завт. 19:30", odds: { w1: "1.95", x: "3.60", w2: "4.00" } },
  { id: 3, sport: "🏀", category: "Баскетбол", league: "НБА", home: "Голден Стейт", away: "Майами", date: "Сег. 02:30", odds: { w1: "1.75", x: "—", w2: "2.10" } },
  { id: 4, sport: "🎾", category: "Теннис", league: "Уимблдон", home: "Синнер", away: "Алькарас", date: "Завт. 14:00", odds: { w1: "1.90", x: "—", w2: "1.95" } },
  { id: 5, sport: "🏒", category: "Хоккей", league: "НХЛ Плей-офф", home: "Авалэнш", away: "Ойлерз", date: "Завт. 03:00", odds: { w1: "1.80", x: "—", w2: "2.05" } },
  { id: 6, sport: "🥊", category: "ММА", league: "UFC 305", home: "Адесанья", away: "Дю Плесси", date: "Суб. 04:00", odds: { w1: "2.10", x: "—", w2: "1.75" } },
];

interface SlipItem { eventId: number; type: string; odds: string; name: string; league: string; sport: string }

type BetStatus = "idle" | "loading" | "success" | "error";

export default function BetsSection() {
  const { user, refreshUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Все");
  const [betSlip, setBetSlip] = useState<SlipItem[]>([]);
  const [betAmount, setBetAmount] = useState("500");
  const [status, setStatus] = useState<BetStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [authModal, setAuthModal] = useState(false);

  const filtered = activeCategory === "Все" ? events : events.filter((e) => e.category === activeCategory);

  const addBet = (eventId: number, type: string, odds: string, name: string, league: string, sport: string) => {
    setBetSlip((prev) => {
      const exists = prev.find((b) => b.eventId === eventId && b.type === type);
      if (exists) return prev.filter((b) => !(b.eventId === eventId && b.type === type));
      // Убираем другой исход того же события (нельзя П1 и П2 одновременно)
      const filtered = prev.filter((b) => b.eventId !== eventId);
      return [...filtered, { eventId, type, odds, name, league, sport }];
    });
    setStatus("idle");
  };

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
        event_id: b.eventId,
        event_name: b.name,
        league: b.league,
        sport: b.sport,
        outcome_type: b.type,
        outcome_label: b.type === "w1" ? "П1" : b.type === "x" ? "Ничья" : "П2",
        odds: parseFloat(b.odds),
      }));

      const result = await placeBet(betsPayload, amount);
      await refreshUser();
      setBetSlip([]);
      setStatus("success");
      setStatusMsg(`Ставка принята! Возможный выигрыш: ${result.potential_win.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`);
    } catch (e: unknown) {
      setStatus("error");
      setStatusMsg(e instanceof Error ? e.message : "Ошибка при размещении ставки");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="section-title">Ставки на спорт</h2>

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
            {filtered.map((event) => (
              <div key={event.id} className="glass-card rounded-lg p-4 neon-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{event.sport}</span>
                    <span className="text-gray-500 text-xs font-roboto">{event.league}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{event.date}</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-oswald font-medium text-white">
                    <span>{event.home}</span>
                    <span className="text-gray-600 mx-2">—</span>
                    <span>{event.away}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      { type: "w1", label: "П1", value: event.odds.w1 },
                      { type: "x", label: "X", value: event.odds.x },
                      { type: "w2", label: "П2", value: event.odds.w2 },
                    ].filter((o) => o.value !== "—").map((odd) => (
                      <button
                        key={odd.type}
                        onClick={() => addBet(event.id, odd.type, odd.value, `${event.home} — ${event.away}`, event.league, event.sport)}
                        className={`odds-btn ${betSlip.some((b) => b.eventId === event.id && b.type === odd.type) ? "active" : ""}`}
                      >
                        <span className="text-xs text-gray-400 block">{odd.label}</span>
                        <span className="font-bold">{odd.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bet Slip */}
        <div className="glass-card rounded-xl p-5 h-fit sticky top-20" style={{ border: "1px solid #1A2430" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-oswald text-lg font-bold text-white">Купон ставок</h3>
            {betSlip.length > 0 && (
              <button onClick={() => { setBetSlip([]); setStatus("idle"); }} className="text-gray-500 hover:text-red-400 transition-colors">
                <Icon name="Trash2" size={15} />
              </button>
            )}
          </div>

          {/* Баланс пользователя */}
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
                      <button onClick={() => setBetSlip((prev) => prev.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400">
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
                  <span className="text-gray-400 font-roboto">Итоговый коэф.</span>
                  <span className="font-oswald font-bold text-neon-green">{totalOdds.toFixed(2)}</span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Сумма ставки (₽)</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => { setBetAmount(e.target.value); setStatus("idle"); }}
                    className="w-full bg-sport-dark border border-sport-border rounded px-3 py-2 text-white font-oswald text-base focus:outline-none focus:border-neon-green transition-colors"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {["200", "500", "1000", "5000"].map((v) => (
                      <button
                        key={v}
                        onClick={() => { setBetAmount(v); setStatus("idle"); }}
                        className="text-xs text-gray-500 hover:text-neon-green border border-sport-border hover:border-neon-green rounded px-2 py-0.5 transition-all font-roboto"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Статус */}
                {status === "success" && (
                  <div className="flex items-start gap-2 text-sm font-roboto bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-green-400">
                    <Icon name="CheckCircle" size={15} className="flex-shrink-0 mt-0.5" />
                    {statusMsg}
                  </div>
                )}
                {status === "error" && (
                  <div className="flex items-start gap-2 text-sm font-roboto bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400">
                    <Icon name="AlertCircle" size={15} className="flex-shrink-0 mt-0.5" />
                    {statusMsg}
                  </div>
                )}

                <button
                  onClick={handlePlaceBet}
                  disabled={status === "loading"}
                  className="w-full bg-neon-green text-sport-dark font-oswald font-bold py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-neon-green/50 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="Loader" size={15} className="animate-spin" />
                      Принимаем ставку...
                    </span>
                  ) : !user ? (
                    "Войди чтобы поставить"
                  ) : (
                    `Поставить ${(+potentialWin).toLocaleString("ru-RU")} ₽`
                  )}
                </button>

                {!user && (
                  <p className="text-xs text-center text-gray-600 font-roboto">
                    <button onClick={() => setAuthModal(true)} className="text-neon-green hover:underline">Войди</button> или <button onClick={() => setAuthModal(true)} className="text-neon-green hover:underline">зарегистрируйся</button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {authModal && <AuthModal defaultTab="login" onClose={() => setAuthModal(false)} />}
    </div>
  );
}
