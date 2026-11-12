// Service worker template. scripts/build-sw.mjs fills in the cache name and file list.
const CACHE = "__CACHE_NAME__";
const CORE = "__CORE__";

// The file list stays small unless data saver is on, when only the fallback page is stored.
const dataSaver = () => self.navigator.connection?.saveData === true;

self.addEventListener("install", (event) => {
  const urls = dataSaver() ? ["/offline.html"] : CORE;
  event.waitUntil(
    caches
      .open(CACHE)
      // One missing file must not stop the app from installing.
      .then((cache) => Promise.allSettled(urls.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("musaffo-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// The page reports what it loaded before this worker took control, so that visit works offline too.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-visited") return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(
        event.data.urls.map(async (url) => {
          if (await cache.match(url)) return;
          const response = await fetch(url);
          if (response.ok && !response.redirected) await cache.put(url, response);
        }),
      ),
    ),
  );
});

/** Pages: show the saved copy at once and refresh it behind the scenes, so weak signal never means a blank wait. */
async function page(event) {
  const url = new URL(event.request.url);
  const key = url.origin + url.pathname; // ?l=... and catalog filters are read by the page itself.
  const cache = await caches.open(CACHE);
  const saved = await cache.match(key);

  const fresh = fetch(event.request).then((response) => {
    if (response.ok && !response.redirected) cache.put(key, response.clone());
    return response;
  });

  if (saved) {
    event.waitUntil(fresh.catch(() => {}));
    return saved;
  }
  try {
    return await fresh;
  } catch {
    return (await cache.match("/offline.html")) ?? Response.error();
  }
}

/** Code, fonts and images have versioned or stable names, so a saved copy is always good. */
async function asset(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request.url);
  if (saved) return saved;
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected) cache.put(request.url, response.clone());
    return response;
  } catch (error) {
    // The saved catalog holds the 480px packs, not the 900px product-page ones, to keep the download small.
    // Offline, a missing large pack falls back to its saved smaller version.
    if (request.url.endsWith(".stage.webp")) {
      const smaller = await cache.match(request.url.replace(/\.stage\.webp$/, ".thumb.webp"));
      if (smaller) return smaller;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Next's in-app navigation data. Offline it fails, and Next falls back to loading the saved page.
  if (url.searchParams.has("_rsc") || request.headers.has("RSC")) return;

  if (request.mode === "navigate") {
    event.respondWith(page(event));
  } else if (/^\/(_next\/static|products|brand|icons)\//.test(url.pathname)) {
    event.respondWith(asset(request));
  }
});
