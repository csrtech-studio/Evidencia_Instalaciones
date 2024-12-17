const CACHE_NAME = "v1-cache-pwa";
const urlsToCache = [
    "/Evidencia_Instalaciones/",
    "/Evidencia_Instalaciones/index.html",
    "/Evidencia_Instalaciones/service-worker.js",
    "/Evidencia_Instalaciones/manifest.json",
    "/Evidencia_Instalaciones/css/style.css",
    "/Evidencia_Instalaciones/js/firebaseConfig.js",
    "/Evidencia_Instalaciones/js/main.js",
    "/Evidencia_Instalaciones/js/sw-register.js",
    "/Evidencia_Instalaciones/js/installPrompt.js",
    "/Evidencia_Instalaciones/js/video.js", 
    "/Evidencia_Instalaciones/icons/icon-192x192.png",
    "/Evidencia_Instalaciones/icons/icon-512x512.png",
    "/Evidencia_Instalaciones/icons/icon.ico"
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
