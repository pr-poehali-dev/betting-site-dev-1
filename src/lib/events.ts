const EVENTS_URL = "https://functions.poehali.dev/2371e65f-94f3-4f73-ae3e-5d0e5c4081c4";

export interface SportEvent {
  id: string;
  sport: string;
  category: string;
  league: string;
  home: string;
  away: string;
  date: string;
  commence_time: string;
  odds: { w1: number; x: number | null; w2: number };
  is_live: boolean;
}

export interface EventsResponse {
  events: SportEvent[];
  total: number;
  is_real: boolean;
  updated_at: number;
}

export async function getEvents(sport?: string, live?: boolean, forceRefresh?: boolean): Promise<EventsResponse> {
  const params = new URLSearchParams();
  if (sport) params.set("sport", sport);
  if (live) params.set("live", "1");
  if (forceRefresh) params.set("refresh", "1");
  const query = params.toString();
  const res = await fetch(`${EVENTS_URL}${query ? "?" + query : ""}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка загрузки событий");
  return data;
}