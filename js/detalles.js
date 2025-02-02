import { firebaseConfig } from './firebaseConfig.js'; // Ajusta la ruta si es necesario
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Obtener el UID de la URL
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('id');
console.log('ID parameter:', uid);

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
        'technician': 'Vendedor',
        'tdsValue': 'TDS',
        'area': 'Área',
        'water': 'Tomas de Agua',
        'drain': 'Desagüe',
        // Agrega más traducciones según sea necesario
    };
    return translations[label] || label;
}


function displayDetails(sale) {
    const detailsContainer = document.getElementById('detailsContainer');
    
    // Verifica los datos de sale
    console.log("Sale data:", sale);
    console.log("TDS Value:", sale.tdsValue);

    // Evaluar TDS y asignar calidad del agua
    let calidadAgua = '';
    let calidadColor = '';  // Variable para asignar el color en lugar de la clase CSS

    let tdsValue = parseFloat(sale.tdsValue);  // Convertir a número

    if (tdsValue) {
        if (tdsValue <= 500) {
            calidadAgua = 'Buena para instalar';
            calidadColor = 'green';  // Color verde
        } else if (tdsValue <= 800) {
            calidadAgua = 'Mala para instalar';
            calidadColor = 'yellow';  // Color amarillo
        } else {
            calidadAgua = 'No recomendable para instalar';
            calidadColor = 'red';  // Color rojo
        }
    } else {
        calidadAgua = 'No especificado';
        calidadColor = 'gray';  // Color gris si no hay valor de TDS
    }


    // Generar HTML para las imágenes agrupadas por equipo (Equipo 1, Equipo 2, etc.)
    const imagesHTML = sale.images 
        ? Object.keys(sale.images).map((groupKey, groupIndex) => {
            const groupImages = sale.images[groupKey];

            // Reorganizar las imágenes según el tipo deseado
            const orderedImages = ['area', 'water', 'drain']
                .map(type => groupImages.find(image => image.type === type))
                .filter(Boolean); // Filtrar imágenes inexistentes

            const groupHTML = orderedImages.map((image, index) => `
                <div class="image-item">
                    <div class="label-container">
                        <label><strong>${getLabelInSpanish(image.type)}:</strong></label>
                    </div>
                    <div class="name-container">
                        ${image.name || "No especificado"}
                    </div>
                    <div class="image-container">
                        <img src="${image.url}" alt="${image.type}" 
                             style="max-width: 100%; margin-top: 5px; cursor: pointer;" 
                             onclick="openModal('${image.url}', '${image.name || "Sin descripción"}')">
                    </div>
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

    // Botón para abrir imagen específica de TDS
    const tdsImageButton = `
        <button class="tds-button" onclick="openModal('${sale.tds?.url}', '${sale.tds?.name || "TDS"}')">
            Ver TDS
        </button>
    `;

    // Crear el HTML principal
    detailsContainer.innerHTML = `
        <h1>Compañía: ${sale.company || "No especificada"}</h1>
        <p><strong>Fecha:</strong> ${sale.date || "No especificada"}</p>
        <p><strong>Vendedor:</strong> ${sale.technician || "No especificado"}</p>
        <p><strong>TDS:</strong> ${sale.tdsValue || "No especificado"} PPM - 
            <span style="font-weight: bold; color: ${calidadColor};">${calidadAgua} ${tdsImageButton}</span>
        </p>
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

// Asegura que las funciones están disponibles globalmente
window.openMap = openMap;
window.openModal = openModal;
window.closeModal = closeModal;


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