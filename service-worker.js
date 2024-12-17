const CACHE_NAME = "v1-cache-pwa";
const urlsToCache = [
    "/",
    "/index.html",
    "/service-worker.js",
    "/manifest.json",
    "/css/style.css",
    "/js/firebaseConfig.js",
    "/js/main.js",
    "/js/sw-register.js",
    "/js/installPrompt.js",
    "/js/video.js", 
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/icons/icon.ico"
  ];

// Instalar el Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Archivos en caché correctamente");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activar el Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");
});

// Interceptar las solicitudes
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
