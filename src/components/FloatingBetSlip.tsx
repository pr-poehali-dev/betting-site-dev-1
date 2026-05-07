import { useBetSlip } from "@/context/BetSlipContext";
import Icon from "@/components/ui/icon";

interface Props {
  onOpen: () => void;
}

export default function FloatingBetSlip({ onOpen }: Props) {
  const { betSlip, clearSlip } = useBetSlip();

  if (betSlip.length === 0) return null;

  const totalOdds = betSlip.reduce((acc, b) => acc * parseFloat(b.odds), 1);

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 z-[150] flex items-center gap-1 animate-fade-in"
      style={{ opacity: 0, animationFillMode: "forwards" }}
    >
      <button
        onClick={onOpen}
        className="flex items-center gap-3 px-4 py-3 rounded-xl font-oswald font-bold text-sport-dark shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{ background: "#00FF87", boxShadow: "0 0 30px rgba(0,255,135,0.5)" }}
      >
        <div className="relative">
          <Icon name="TicketCheck" size={22} />
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-sport-dark text-neon-green text-[10px] flex items-center justify-center font-bold">
            {betSlip.length}
          </span>
        </div>
        <div className="text-left">
          <div className="text-xs leading-none opacity-70">Купон ставок</div>
          <div className="text-sm leading-tight">Коэф. {totalOdds.toFixed(2)}</div>
        </div>
      </button>
      <button
        onClick={clearSlip}
        className="w-8 h-8 flex items-center justify-center rounded-lg opacity-70 hover:opacity-100 transition-opacity"
        style={{ background: "rgba(0,0,0,0.4)" }}
      >
        <Icon name="X" size={14} className="text-white" />
      </button>
    </div>
  );
}