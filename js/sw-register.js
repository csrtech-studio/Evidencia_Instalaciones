if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/Evidencia_Instalaciones/service-worker.js")
      .then((reg) => console.log("Service Worker registrado con éxito:", reg))
      .catch((err) => console.log("Error al registrar el Service Worker:", err));
  });
}

