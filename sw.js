const CACHE = "discipline-v101";
const ASSETS = ["./", "./index.html", "./manifest.json",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/avatar.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // GitHub Pages serves everything with Cache-Control: max-age=600. A plain
  // fetch() here respects that and can get silently satisfied from the
  // browser's own HTTP cache instead of hitting the network — meaning this
  // "network-first" handler can serve a stale deploy for up to 10+ minutes
  // (longer in practice for installed iOS PWAs) even right after a fresh
  // push. cache:"no-store" forces every request to actually go to the
  // network so updates show up immediately.
  e.respondWith(
    fetch(e.request, { cache: "no-store" }).then(res => {
      caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match(e.request))
  );
});

self.addEventListener("push", e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  const title = data.title || "Discipline";
  const body = data.body || "Coche tes tâches du jour.";
  e.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: "discipline-daily",
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow("./");
    })
  );
});
