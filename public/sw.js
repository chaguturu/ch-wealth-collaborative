const CACHE_VERSION = "chw-v1";
const STATIC_CACHE  = CACHE_VERSION + "-static";
const API_CACHE     = CACHE_VERSION + "-api";

const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
];

const NEVER_CACHE_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/plaid\/exchange-token/,
  /^\/api\/plaid\/link-token/,
  /^\/api\/settings\/nuke/,
  /^\/api\/settings\/export/,
  /^\/advisor\//,
];

const API_CACHE_PATTERNS = [
  /^\/api\/net-worth\//,
  /^\/api\/equity\//,
  /^\/api\/plaid\/accounts/,
  /^\/api\/scenarios/,
];

const NETWORK_TIMEOUT_MS = 5000;

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(PRECACHE_ASSETS).catch(function(err) {
        console.warn("[SW] Precache partial failure:", err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== STATIC_CACHE && key !== API_CACHE; })
          .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(event) {
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (matchesAny(url.pathname, NEVER_CACHE_PATTERNS)) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }
  if (matchesAny(url.pathname, API_CACHE_PATTERNS)) {
    event.respondWith(networkFirstWithTimeout(event.request, API_CACHE, NETWORK_TIMEOUT_MS));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }
  if (url.pathname.startsWith("/icon-") || url.pathname === "/manifest.json" || url.pathname === "/favicon.ico") {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }
  event.respondWith(networkFirst(event.request, STATIC_CACHE));
});

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response && response.status === 200) cache.put(request, response.clone());
        return response;
      });
    });
  });
}

function networkFirst(request, cacheName) {
  return fetch(request).then(function(response) {
    if (response && response.status === 200) {
      caches.open(cacheName).then(function(cache) { cache.put(request, response.clone()); });
    }
    return response;
  }).catch(function() {
    return caches.match(request).then(function(cached) {
      return cached || new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } });
    });
  });
}

function networkFirstWithTimeout(request, cacheName, timeoutMs) {
  return new Promise(function(resolve) {
    var timeoutId = setTimeout(function() {
      caches.match(request).then(function(cached) { if (cached) resolve(cached); });
    }, timeoutMs);
    fetch(request).then(function(response) {
      clearTimeout(timeoutId);
      if (response && response.status === 200) {
        caches.open(cacheName).then(function(cache) { cache.put(request, response.clone()); });
      }
      resolve(response);
    }).catch(function() {
      clearTimeout(timeoutId);
      caches.match(request).then(function(cached) {
        resolve(cached || new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } }));
      });
    });
  });
}

function matchesAny(pathname, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    if (patterns[i].test(pathname)) return true;
  }
  return false;
}
