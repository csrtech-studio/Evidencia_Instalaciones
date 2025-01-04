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

function getLabelInSpanish(label) {
    const translations = {
        'company': 'Compañía',
        'contact': 'Contacto',
        'date': 'Fecha',
        'phone': 'Teléfono',
        'seller': 'Vendedor',
        'tdsValue': 'TDS',
        'area': 'Área',
        'waterLocation': 'Tomas de Agua',
        'drain': 'Desagüe',
        // Agrega más traducciones según sea necesario
    };
    return translations[label] || label;
}


function displayDetails(sale) {
    const detailsContainer = document.getElementById('detailsContainer');

    // Generar HTML para las imágenes agrupadas por equipo (Equipo 1, Equipo 2, etc.)
    const imagesHTML = sale.images 
        ? Object.keys(sale.images).map((groupKey, groupIndex) => {
            const groupImages = sale.images[groupKey];

            // Reorganizar las imágenes según el tipo deseado
            const orderedImages = ['area', 'waterLocation', 'drain']
                .map(type => groupImages.find(image => image.type === type))
                .filter(Boolean); // Filtrar imágenes inexistentes

            const groupHTML = orderedImages.map((image, index) => `
                <div class="image-item">
                    <label><strong>${getLabelInSpanish(image.type)}:</strong> ${image.name || "No especificado"}</label>
                    <img src="${image.url}" alt="${image.type}" 
                         style="max-width: 100%; margin-top: 5px; cursor: pointer;" 
                         onclick="openModal('${image.url}', '${image.name || "Sin descripción"}')">
                </div>
            `).join('');

            return `
                <div class="image-group">
                    <h4>Equipo ${groupIndex + 1}</h4>
                    <div class="image-group-container">
                        ${groupHTML}
                    </div>
                </div>
            `;
        }).join('')
        : '<p>No hay imágenes disponibles.</p>';

    // Crear el HTML principal
    detailsContainer.innerHTML = `
        <h1>Compañía: ${sale.company || "No especificada"}</h1>
        <p><strong>Fecha:</strong> ${sale.date || "No especificada"}</p>
        <p><strong>Vendedor:</strong> ${sale.seller || "No especificado"}</p>
        <p><strong>TDS:</strong> ${sale.tdsValue || "No especificado"}</p>
        <p><strong>Contacto:</strong> ${sale.contact || "No especificado"}</p>
        <p>
            <strong>Teléfono:</strong>
            <a href="tel:${encodeURIComponent(sale.phone || '')}" style="color: #2980b9; text-decoration: none;">
                ${sale.phone || "No disponible"}
            </a><br>
              <button class="map-button" onclick="openMap(${sale.location?.latitude || 0}, ${sale.location?.longitude || 0})">
            Ver ubicación en Google Maps
        </button>
        </p>
        <h3>Imágenes de Áreas, Tomas y Desagües:</h3>
        <div id="imageGallery">${imagesHTML}</div>
      
    `;
}


// Función para abrir el modal
function openModal(imageUrl, captionText) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const caption = document.getElementById('caption');

    modal.style.display = "block";
    modalImg.src = imageUrl;
    caption.textContent = captionText;
}

// Función para cerrar el modal
function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = "none";
}

function openMap(latitude, longitude) {
    if (!latitude || !longitude) {
        alert("No hay coordenadas disponibles para esta ubicación.");
        return;
    }
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank");
}


// Expón las funciones al contexto global
window.openMap = openMap;
window.openModal = openModal;
window.closeModal = closeModal;