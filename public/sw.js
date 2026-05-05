// БетСпорт Service Worker — обработка push-уведомлений

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "БетСпорт", body: event.data.text() };
  }

  const title = data.title || "БетСпорт";
  const options = {
    body: data.body || "",
    icon: data.icon || "/favicon.svg",
    badge: "/favicon.svg",
    tag: data.tag || "betsport",
    renotify: true,
    vibrate: data.win ? [200, 100, 200] : [100],
    data: { url: data.url || "/" },
    actions: data.win
      ? [{ action: "open", title: "Посмотреть выигрыш" }]
      : [{ action: "open", title: "Открыть историю" }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.postMessage({ type: "NAVIGATE", url });
      } else {
        self.clients.openWindow(self.location.origin + url);
      }
    })
  );
});
