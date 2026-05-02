const AUTH_URL = "https://functions.poehali.dev/33bfda12-4d59-4452-b78a-b07863155533";
const TOKEN_KEY = "betsport_token";

export interface User {
  id: number;
  email: string;
  username: string;
  balance: number;
  bonus_balance: number;
  status: "silver" | "gold" | "platinum" | "diamond";
  rating_points: number;
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  is_verified: boolean;
  created_at: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function register(email: string, username: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", email, username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
  return data;
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка входа");
  return data;
}

export async function getMe(): Promise<User> {
  const token = getToken();
  if (!token) throw new Error("Нет токена");
  const res = await fetch(AUTH_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка авторизации");
  return data.user;
}
