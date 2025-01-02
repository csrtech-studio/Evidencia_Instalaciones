import { firebaseConfig } from './firebaseConfig.js'; // Ajusta la ruta si es necesario
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Obtener el UID de la URL
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid');
console.log('UID parameter:', uid);

if (uid) {
    const saleRef = ref(db, `sales_installations/${uid}`);

    get(saleRef).then((snapshot) => {
        if (snapshot.exists()) {
            const sale = snapshot.val();
            console.log('Sale data:', sale); // Verifica que los datos están llegando correctamente
            displayDetails(sale);
        } else {
            alert('No se encontraron detalles para este UID.');
        }
    }).catch((error) => {
        console.error('Error al cargar los detalles:', error);
    });
}

function displayDetails(sale) {
    // Contenedor donde se mostrarán los detalles
    const detailsContainer = document.getElementById('detailsContainer');

    // Asegurarse de que videos sea un arreglo válido
    const videos = Array.isArray(sale.videos) ? sale.videos : [];

    // Generar el contenido HTML para los videos
    const videoHTML = videos.length > 0 
        ? videos.map((video, index) => `
            <div class="video-item">
                <p><strong>Área:</strong> ${video.area || "Desconocida"}</p>
                <button class="video-button" onclick="window.open('${video.videoUrl}', '_blank')">
                    Ver Video del Área ${index + 1}
                </button>
            </div>
        `).join('') 
        : '<p>No hay áreas ni videos disponibles.</p>';

    // Generar el contenido completo
    detailsContainer.innerHTML = `
        <h1>Compañía: ${sale.company || "No especificada"}</h1>
        <h2>Sucursal: ${sale.branch || "No especificada"}</h2>
        <p><strong>Fecha:</strong> ${sale.date || "No especificada"}</p>
        <p><strong>Vendedor:</strong> ${sale.seller || "No especificado"}</p>
        <p><strong>TDS:</strong> ${sale.tds || "No especificado"}</p>
        <p><strong>Contacto:</strong> ${sale.contact || "No especificado"}</p>
        <p>
            <strong>Teléfono:</strong>
            <a href="tel:${encodeURIComponent(sale.phone || '')}" style="color: #2980b9; text-decoration: none;">
                ${sale.phone || "No disponible"}
            </a>
        </p>
        <h3>Áreas y Videos:</h3>
        <div id="areaVideos">${videoHTML}</div>
        <button class="map-button" onclick="openMap(${sale.location?.latitude || 0}, ${sale.location?.longitude || 0})">
            Ver ubicación en Google Maps
        </button>
    `;
}

function openMap(latitude, longitude) {
    if (!latitude || !longitude) {
        alert("No hay coordenadas disponibles para esta ubicación.");
        return;
    }
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank");
}

// Expón la función al contexto global
window.openMap = openMap;
