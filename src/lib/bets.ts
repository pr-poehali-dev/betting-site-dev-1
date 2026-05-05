import { getToken } from "@/lib/auth";

const BETS_URL = "https://functions.poehali.dev/b17d3edf-9500-4bcf-9d49-6e9af8f3bb9c";

export interface BetItem {
  event_id: number;
  event_name: string;
  league: string;
  sport: string;
  outcome_type: string;
  outcome_label: string;
  odds: number;
}

export interface PlacedBet {
  id: number;
  event_id: number;
  event_name: string;
  league: string;
  sport: string;
  outcome_type: string;
  outcome_label: string;
  odds: number;
  amount: number;
  potential_win: number;
  status: "pending" | "win" | "loss" | "cancelled";
  placed_at: string;
}

export async function placeBet(bets: BetItem[], amount: number): Promise<{ success: boolean; new_balance: number; potential_win: number; total_odds: number }> {
  const token = getToken();
  const res = await fetch(BETS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "place", bets, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка при размещении ставки");
  return data;
}

export async function getBetHistory(limit = 20, offset = 0): Promise<{ bets: PlacedBet[]; total: number }> {
  const token = getToken();
  const res = await fetch(`${BETS_URL}?action=history&limit=${limit}&offset=${offset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка загрузки истории");
  return data;
}
