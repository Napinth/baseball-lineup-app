const CACHE_NAME = "baseball-lineup-v2";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./app-icon.svg",
  "./print.css"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async response => {
          const html = await response.text();
          const linkedHtml = html.includes("print.css")
            ? html
            : html.replace("</head>", '<link rel="stylesheet" href="./print.css"></head>');

          const updatedResponse = new Response(linkedHtml, {
            status: response.status,
            statusText: response.statusText,
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });

          const cacheCopy = updatedResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", cacheCopy));
          return updatedResponse;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
