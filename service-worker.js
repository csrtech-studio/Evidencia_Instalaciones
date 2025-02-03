const CACHE_NAME = "v1-cache-pwa";
const urlsToCache = [
    "/Evidencia_Instalaciones/",
    "/Evidencia_Instalaciones/index.html",
    "/Evidencia_Instalaciones/login.html",
    "/Evidencia_Instalaciones/vendedores.html",
    "/Evidencia_Instalaciones/tecnicos.html",
    "/Evidencia_Instalaciones/service-worker.js",
    "/Evidencia_Instalaciones/manifest.json",
    "/Evidencia_Instalaciones/css/style.css",
    "/Evidencia_Instalaciones/js/firebaseConfig.js",
    "/Evidencia_Instalaciones/js/main.js",
    "/Evidencia_Instalaciones/js/agregarUsuario.js",
    "/Evidencia_Instalaciones/js/detalles.js",
    "/Evidencia_Instalaciones/js/login.js",
    "/Evidencia_Instalaciones/js/sw-register.js",
    "/Evidencia_Instalaciones/js/installPrompt.js",
    "/Evidencia_Instalaciones/js/video.js", 
    "/Evidencia_Instalaciones/icons/icon-192x192.png",
    "/Evidencia_Instalaciones/icons/icon-512x512.png",
    "/Evidencia_Instalaciones/icons/icon.ico"
  ];

// Instalar el Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  console.log("Interceptando:", event.request.url);
});
