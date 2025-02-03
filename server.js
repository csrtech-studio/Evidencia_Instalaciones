const express = require("express");
const path = require("path");
const cors = require("cors"); // Importamos CORS

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para todas las solicitudes
app.use(cors());

// Servir archivos estáticos desde la raíz
app.use(express.static(__dirname));

// Ruta para servir el index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Servir el manifest.json correctamente
app.get("/Evidencia_Instalaciones/manifest.json", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendFile(path.join(__dirname, "Evidencia_Instalaciones", "manifest.json"));
});

app.get("/service-worker.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(path.join(__dirname, "service-worker.js"));
  });
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


  