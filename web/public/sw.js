/* Para abrir el cancionero sin cobertura (en el bus): guarda la app y lo último que se vio. */
var V = "cdp-v2";
var SHELL = ["/", "/index.html", "/app.css", "/app.js", "/visor.html", "/core.css", "/core.js", "/score.js", "/viewer.js", "/icon.svg", "/manifest.webmanifest"];
self.addEventListener("install", function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  // primero la red; si no hay, lo guardado
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok && (!url.pathname.startsWith("/api/") || url.pathname === "/api/photo")) {
      var copy = res.clone(); caches.open(V).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreVary: true }).then(function (r) { return r || caches.match("/index.html"); });
  }));
});
