import { getToken } from "@/lib/auth";

const PUSH_URL = "https://functions.poehali.dev/3debbdce-d8c3-49ac-b6ca-d8c3ec70ac8e";

// Регистрируем Service Worker
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch {
    return null;
  }
}

// Текущее состояние разрешения
export function getPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// Запросить разрешение и подписаться
export async function subscribe(vapidPublicKey: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await registerSW();
  if (!reg) return false;

  // Ждём активацию SW
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  if (existing) await existing.unsubscribe();

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

  const token = getToken();
  const res = await fetch(PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      action: "subscribe",
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
    }),
  });

  return res.ok;
}

// Отписаться
export async function unsubscribe(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  await sub.unsubscribe();

  const token = getToken();
  await fetch(PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "unsubscribe", endpoint }),
  }).catch(() => {});
}

// Расчёт ставок + отправка push (вместо старого settleBets из bets.ts)
export async function settleWithPush(): Promise<{
  settled: number; wins: number; losses: number; payout: number; new_balance: number;
}> {
  const token = getToken();
  const res = await fetch(PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "send_settle" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка расчёта");
  return data;
}

// Получить VAPID публичный ключ (кешируем в localStorage)
export async function getVapidPublicKey(): Promise<string> {
  const cached = localStorage.getItem("vapid_pub");
  if (cached) return cached;
  // VAPID_PUBLIC_KEY зашит в env — берём из бэкенда
  const token = getToken();
  if (!token) return "";
  const res = await fetch(PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "vapid_key" }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  const key = data.public_key || "";
  if (key) localStorage.setItem("vapid_pub", key);
  return key;
}

// Конвертация base64 → Uint8Array (для VAPID)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
