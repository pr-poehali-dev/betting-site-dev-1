import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { getBetHistory, PlacedBet } from "@/lib/bets";
import { settleWithPush } from "@/lib/notifications";

const SETTLE_AFTER_MS = 60_000;

function Countdown({ placedAt }: { placedAt: string }) {
  const getRemaining = useCallback(() => {
    const placed = new Date(placedAt).getTime();
    return Math.max(0, Math.ceil((SETTLE_AFTER_MS - (Date.now() - placed)) / 1000));
  }, [placedAt]);

  const [secs, setSecs] = useState(getRemaining);

  useEffect(() => {
    const t = setInterval(() => setSecs(getRemaining()), 500);
    return () => clearInterval(t);
  }, [getRemaining]);

  if (secs <= 0) {
    return <span className="text-yellow-400 text-xs font-roboto animate-pulse">Расчёт...</span>;
  }

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const label = m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}с`;
  const progress = Math.min(100, ((SETTLE_AFTER_MS / 1000 - secs) / (SETTLE_AFTER_MS / 1000)) * 100);
  const color = progress > 80 ? "#00FF87" : progress > 50 ? "#FFD700" : "#00B4FF";

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: color }}
        />
      </div>
      <span className="text-xs font-roboto tabular-nums" style={{ color: progress > 80 ? "#00FF87" : "#9CA3AF" }}>
        {label}
      </span>
    </div>
  );
}

const SPORT_EMOJI: Record<string, string> = {
  multi: "🎯", Футбол: "⚽", Баскетбол: "🏀", Теннис: "🎾", Хоккей: "🏒", ММА: "🥊",
};

interface Props {
  onNav: (section: string) => void;
}

export default function PendingBetsWidget({ onNav }: Props) {
  const { user, refreshUser } = useAuth();
  const [pending, setPending] = useState<PlacedBet[]>([]);
  const [settled, setSettled] = useState<{ wins: number; losses: number; payout: number } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { bets } = await getBetHistory(50, 0).catch(() => ({ bets: [] as PlacedBet[], total: 0 }));
    setPending(bets.filter((b) => b.status === "pending"));
  }, [user]);

  const trySettle = useCallback(async () => {
    if (!user) return;
    const result = await settleWithPush().catch(() => null);
    if (!result || result.settled === 0) return;
    setSettled({ wins: result.wins, losses: result.losses, payout: result.payout });
    await refreshUser();
    await load();
    setTimeout(() => setSettled(null), 7000);
  }, [user, load, refreshUser]);

  useEffect(() => { load(); }, [load]);

  // Авторасчёт каждые 15 секунд пока есть pending
  useEffect(() => {
    if (!pending.length) return;
    const t = setInterval(trySettle, 15_000);
    return () => clearInterval(t);
  }, [pending.length, trySettle]);

  if (!user || (!pending.length && !settled)) return null;

  return (
    <div className="space-y-2">
      {/* Баннер результата расчёта */}
      {settled && (
        <div
          className="rounded-xl p-4 flex items-center gap-3 animate-fade-in"
          style={{
            background: settled.wins > 0 ? "rgba(0,255,135,0.07)" : "rgba(255,59,59,0.07)",
            border: `1px solid ${settled.wins > 0 ? "rgba(0,255,135,0.2)" : "rgba(255,59,59,0.2)"}`,
            animationFillMode: "forwards",
          }}
        >
          <Icon
            name={settled.wins > 0 ? "Trophy" : "TrendingDown"}
            size={22}
            className={settled.wins > 0 ? "text-neon-green flex-shrink-0" : "text-red-400 flex-shrink-0"}
          />
          <div className="flex-1">
            <div className="font-oswald font-bold text-white text-sm">
              {settled.wins > 0
                ? `🏆 Выигрыш +${settled.payout.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`
                : "❌ Ставка не сыграла"}
            </div>
            <div className="text-gray-400 text-xs font-roboto mt-0.5">
              {settled.wins > 0
                ? `${settled.wins} ставк${settled.wins === 1 ? "а" : "и"} выиграно · средства зачислены на баланс`
                : `${settled.losses} ставк${settled.losses === 1 ? "а" : "и"} проиграно`}
            </div>
          </div>
          <button
            onClick={() => onNav("profile")}
            className="text-xs font-oswald font-bold text-neon-green hover:underline flex-shrink-0"
          >
            История
          </button>
        </div>
      )}

      {/* Блок активных ставок */}
      {pending.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden" style={{ border: "1px solid #1A2430" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b border-sport-border">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
                Активные ставки
              </span>
              <span className="text-xs font-roboto text-gray-500 bg-sport-border/60 rounded px-1.5 py-0.5">
                {pending.length}
              </span>
            </div>
            <button
              onClick={() => onNav("profile")}
              className="text-xs text-gray-500 hover:text-neon-green font-roboto flex items-center gap-1 transition-colors"
            >
              Все ставки <Icon name="ChevronRight" size={12} />
            </button>
          </div>

          <div className="divide-y divide-sport-border/50">
            {pending.slice(0, 3).map((bet) => (
              <div key={bet.id} className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: "rgba(0,180,255,0.08)", border: "1px solid rgba(0,180,255,0.15)" }}
                >
                  {SPORT_EMOJI[bet.sport] ?? "🎮"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-oswald text-sm text-white truncate">{bet.event_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-roboto text-gray-500">
                      {bet.amount.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs font-roboto text-neon-green">
                      возможный выигрыш {bet.potential_win.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-roboto text-gray-500 mb-1">до расчёта</div>
                  <Countdown placedAt={bet.placed_at} />
                </div>
              </div>
            ))}

            {pending.length > 3 && (
              <div className="px-4 py-2.5 text-center">
                <button
                  onClick={() => onNav("profile")}
                  className="text-xs text-gray-500 hover:text-neon-green font-roboto transition-colors"
                >
                  Ещё {pending.length - 3} ставк{pending.length - 3 === 1 ? "а" : "и"} →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
