import { createContext, useContext, useState, ReactNode } from "react";

export interface SlipItem {
  eventId: string;
  type: string;
  odds: string;
  name: string;
  league: string;
  sport: string;
}

interface BetSlipContextType {
  betSlip: SlipItem[];
  addBet: (item: SlipItem) => void;
  removeBet: (eventId: string, type: string) => void;
  clearSlip: () => void;
  isSelected: (eventId: string, type: string) => boolean;
}

const BetSlipContext = createContext<BetSlipContextType | null>(null);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [betSlip, setBetSlip] = useState<SlipItem[]>([]);

  const addBet = (item: SlipItem) => {
    setBetSlip((prev) => {
      const exists = prev.find((b) => b.eventId === item.eventId && b.type === item.type);
      if (exists) return prev.filter((b) => !(b.eventId === item.eventId && b.type === item.type));
      const without = prev.filter((b) => b.eventId !== item.eventId);
      return [...without, item];
    });
  };

  const removeBet = (eventId: string, type: string) => {
    setBetSlip((prev) => prev.filter((b) => !(b.eventId === eventId && b.type === type)));
  };

  const clearSlip = () => setBetSlip([]);

  const isSelected = (eventId: string, type: string) =>
    betSlip.some((b) => b.eventId === eventId && b.type === type);

  return (
    <BetSlipContext.Provider value={{ betSlip, addBet, removeBet, clearSlip, isSelected }}>
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const ctx = useContext(BetSlipContext);
  if (!ctx) throw new Error("useBetSlip must be used within BetSlipProvider");
  return ctx;
}
