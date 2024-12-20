import { firebaseConfig } from './firebaseConfig.js'; // Ajusta la ruta si es necesario
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Obtener el parámetro de la URL
const urlParams = new URLSearchParams(window.location.search);
const company = urlParams.get('company');
console.log('Company parameter:', company);

if (company) {
    const salesRef = ref(db, 'sales_installations');

    get(salesRef).then((snapshot) => {
        if (snapshot.exists()) {
            const salesData = snapshot.val();
    
            // Filtrar los datos de la empresa seleccionada
            const filteredSales = Object.values(salesData).find(sale => sale.company === company);
    
            if (filteredSales) {
                displayDetails(filteredSales);  // Llamar a displayDetails y pasar el objeto 'sale' correctamente
            } else {
                alert('No se encontraron detalles para esta empresa.');
            }
        } else {
            console.log('No hay datos disponibles.');
        }
    }).catch((error) => {
        console.error('Error al cargar los detalles:', error);
    });
}


function displayDetails(sale) {
    console.log('Sale data:', sale);  // Verifica que los datos de 'sale' estén llegando correctamente
    // Contenedor donde se mostrarán los detalles
    const detailsContainer = document.getElementById('detailsContainer');

    // Asegurarse de que videos sea un arreglo
    const videos = sale.videos || [];

    console.log('Videos:', videos);  // Verifica que los videos están llegando correctamente

    // Si hay videos disponibles, mostramos cada uno
    if (videos.length > 0) {
        detailsContainer.innerHTML = `
            <h1>Compañía: ${sale.company}</h1>
            <h2>Sucursal: ${sale.branch}</h2>
            <p><strong>Fecha:</strong> ${sale.date}</p>
            <p><strong>Vendedor:</strong> ${sale.seller}</p>
            <p><strong>TDS:</strong> ${sale.tds}</p>
            <p><strong>Contacto:</strong> ${sale.contact}</p>
            <p>
                <strong>Teléfono:</strong>
                <a href="tel:${sale.phone}" style="color: #2980b9; text-decoration: none;">
                    ${sale.phone}
                </a>
            </p>
            <h3>Áreas y Videos:</h3>
            <div id="areaVideos">
                ${videos.map((video, index) => `
                    <div>
                        <p><strong>Área: ${video.area}</strong></p>
                        <button onclick="window.open('${video.videoUrl}', '_blank')">
                            Ver Video del Área ${index + 1}
                        </button>
                    </div>
                `).join('')}
            </div>
            <button onclick="openMap(${sale.location?.latitude || 0}, ${sale.location?.longitude || 0})">
                Ver ubicación en Google Maps
            </button>
        `;
    } else {
        detailsContainer.innerHTML = `
            <p>No hay áreas ni videos disponibles.</p>
        `;
    }
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
