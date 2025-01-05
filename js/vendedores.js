import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, ref, onValue, push, get } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-storage.js";

let userLocation = null;


// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const salesRef = ref(db, 'sales_installations');


// Inicializar fecha en el formulario
document.addEventListener("DOMContentLoaded", function () {
    console.log("Formulario cargado");
    const dateInput = document.getElementById("date");
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-CA');

    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
    }
    const searchDateInput = document.getElementById("searchDate");
    if (searchDateInput) {
        searchDateInput.value = currentDate; // Filtro por fecha actual
    }

    // Aplicar filtro automáticamente al cargar la página
    filterSales();

});


// Botón para obtener ubicación
document.addEventListener("DOMContentLoaded", function () {
    const salesForm = document.getElementById("salesForm");
    const submitBtn = document.getElementById("submitBtn");
    const locationButton = document.getElementById("locationButton");

    if (salesForm && submitBtn && locationButton) {
        // Asegúrate de que el botón de ubicación se inserte antes del botón de envío
        salesForm.insertBefore(locationButton, submitBtn);

        // Establecer el evento del botón "Guardar Ubicación"
        locationButton.addEventListener("click", () => {
            if (!navigator.geolocation) {
                alert("Tu navegador no soporta la geolocalización.");
                return;
            }

            locationButton.disabled = true;
            locationButton.textContent = "Obteniendo ubicación...";

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Guardar la ubicación
                    userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };

                    // Mostrar la ubicación guardada
                    alert(`Ubicación guardada: (${userLocation.latitude}, ${userLocation.longitude})`);

                    // Actualizar el texto del botón
                    locationButton.textContent = "Ubicación Guardada";
                },
                (error) => {
                    // Manejar el error de geolocalización
                    let errorMessage = "Error al obtener ubicación.";
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "El permiso de geolocalización fue denegado.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "La ubicación no está disponible.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "El tiempo para obtener la ubicación ha expirado.";
                            break;
                        default:
                            errorMessage = "Ocurrió un error desconocido.";
                    }

                    // Mostrar el mensaje de error
                    alert(errorMessage);

                    // Habilitar nuevamente el botón y restaurar su texto
                    locationButton.disabled = false;
                    locationButton.textContent = "Guardar Ubicación";
                }
            );
        });

        // Manejo del botón de enviar
        submitBtn.addEventListener("click", async () => {
            if (!userLocation) {
                alert("Por favor, guarda la ubicación antes de enviar el formulario.");
                return;
            }

            // El resto del código para enviar el formulario sigue aquí...
        });

    } else {
        console.error("No se encontraron los elementos salesForm, submitBtn o locationButton.");
    }

    loadSalesData();  // Cargar los datos después de que el DOM esté listo
});

// Detectar cambios en la cantidad de imágenes y generar campos dinámicos
document.getElementById("imageCount").addEventListener("input", function () {
    const imageCount = parseInt(this.value) || 0;
    const imagesContainer = document.getElementById("imagesContainer");

    // Limpiar contenedor de imágenes
    imagesContainer.innerHTML = "";

    // Generar campos de imágenes dinámicamente
    for (let i = 1; i <= imageCount; i++) {
        const imageWrapper = document.createElement("div");
        imageWrapper.classList.add("image-wrapper");

        // Campo de Área
        const labelArea = document.createElement("label");
        labelArea.setAttribute("for", `areaImage${i}`);
        labelArea.textContent = `Área ${i}:`;

        const inputArea = document.createElement("input");
        inputArea.type = "text";
        inputArea.id = `areaImage${i}`;
        inputArea.name = `areaImage${i}`;
        inputArea.placeholder = `Ingrese área para la imagen ${i}`;
        inputArea.required = true;

        // Campo de Selección de archivo para Área
        const labelAreaFile = document.createElement("label");
        labelAreaFile.setAttribute("for", `areaFile${i}`);
        labelAreaFile.textContent = `Área: Seleccione archivo`;

        const inputAreaFile = document.createElement("input");
        imputAreaFile.capture = "camera";
        inputAreaFile.type = "file";
        inputAreaFile.accept = "image/*";
        inputAreaFile.id = `areaFile${i}`;
        inputAreaFile.name = `areaFile${i}`;
        inputAreaFile.required = true;

        // Campo de Ubicación para Tomas de agua
        const labelWaterLocation = document.createElement("label");
        labelWaterLocation.setAttribute("for", `waterLocationImage${i}`);
        labelWaterLocation.textContent = `Tomas de agua:`;

        const inputWaterLocation = document.createElement("input");
        inputWaterLocation.type = "text";
        inputWaterLocation.id = `waterLocationImage${i}`;
        inputWaterLocation.name = `waterLocationImage${i}`;
        inputWaterLocation.placeholder = `Ingrese ubicación para la toma de agua ${i}`;
        inputWaterLocation.required = true;

        // Campo de Selección de archivo para Tomas de agua
        const labelWaterFile = document.createElement("label");
        labelWaterFile.setAttribute("for", `waterFile${i}`);
        labelWaterFile.textContent = `Tomas de agua: Seleccione archivo`;

        const inputWaterFile = document.createElement("input");
        inputWaterFile.type = "file";
        inputWaterFile.accept = "image/*";
        inputWaterFile.id = `waterFile${i}`;
        inputWaterFile.name = `waterFile${i}`;
        inputWaterFile.required = true;

        // Campo de Drenaje
        const labelDrainage = document.createElement("label");
        labelDrainage.setAttribute("for", `drainImage${i}`);
        labelDrainage.textContent = `Drenaje:`;

        const inputDrainage = document.createElement("input");
        inputDrainage.type = "text";
        inputDrainage.id = `drainImage${i}`;
        inputDrainage.name = `drainImage${i}`;
        inputDrainage.placeholder = `Ingrese drenaje para la imagen ${i}`;
        inputDrainage.required = true;

        // Campo de Selección de archivo para Drenaje
        const labelDrainFile = document.createElement("label");
        labelDrainFile.setAttribute("for", `drainFile${i}`);
        labelDrainFile.textContent = `Drenaje: Seleccione archivo`;

        const inputDrainFile = document.createElement("input");
        inputDrainFile.type = "file";
        inputDrainFile.accept = "image/*";
        inputDrainFile.id = `drainFile${i}`;
        inputDrainFile.name = `drainFile${i}`;
        inputDrainFile.required = true;

        imageWrapper.appendChild(labelArea);
        imageWrapper.appendChild(inputArea);
        imageWrapper.appendChild(labelAreaFile);
        imageWrapper.appendChild(inputAreaFile);
        imageWrapper.appendChild(labelWaterLocation);
        imageWrapper.appendChild(inputWaterLocation);
        imageWrapper.appendChild(labelWaterFile);
        imageWrapper.appendChild(inputWaterFile);
        imageWrapper.appendChild(labelDrainage);
        imageWrapper.appendChild(inputDrainage);
        imageWrapper.appendChild(labelDrainFile);
        imageWrapper.appendChild(inputDrainFile);

        imagesContainer.appendChild(imageWrapper);
    }
});

//// Boton Guardar//
document.getElementById("submitBtn").addEventListener("click", async (event) => {
    event.preventDefault(); // Previene que el formulario se recargue

    const submitButton = document.getElementById("submitBtn");
    submitButton.disabled = true;

    try {
        // Obtener datos del formulario
        const date = document.getElementById("date")?.value;
        const seller = document.getElementById("seller")?.value;
        const company = document.getElementById("company")?.value;
        const tdsValue = document.getElementById("tds")?.value;
        const contact = document.getElementById("contact")?.value;
        const phone = document.getElementById("cellphone")?.value;
        const imageCount = parseInt(document.getElementById("imageCount")?.value) || 0;

        if (!date || !seller || !company || !tdsValue || !contact || !phone || imageCount <= 0) {
            let missingFields = [];

            if (!date) missingFields.push("Fecha");
            if (!seller) missingFields.push("Vendedor");
            if (!company) missingFields.push("Compañía");
            if (!tdsValue) missingFields.push("TDS");
            if (!contact) missingFields.push("Contacto");
            if (!phone) missingFields.push("Teléfono");
            if (imageCount <= 0) missingFields.push("Cantidad de imágenes");

            alert("Por favor, completa los siguientes campos: " + missingFields.join(", "));
            submitButton.disabled = false;
            return;
        }

        if (!userLocation) {
            alert("Por favor, guarda la ubicación antes de enviar el formulario.");
            submitButton.disabled = false;
            return;
        }

        const imageData = [];
        const uploadPercentage = document.getElementById("uploadPercentage");

        document.getElementById("progressContainer").style.display = "block";

        for (let i = 1; i <= imageCount; i++) {
            const areaInput = document.getElementById(`areaImage${i}`);
            const areaFileInput = document.getElementById(`areaFile${i}`);
            const waterLocationInput = document.getElementById(`waterLocationImage${i}`);
            const waterFileInput = document.getElementById(`waterFile${i}`);
            const drainInput = document.getElementById(`drainImage${i}`);
            const drainFileInput = document.getElementById(`drainFile${i}`);

            let area = areaInput?.value.trim();
            let waterLocation = waterLocationInput?.value.trim();
            let drain = drainInput?.value.trim();
            let areaFile = areaFileInput?.files[0];
            let waterFile = waterFileInput?.files[0];
            let drainFile = drainFileInput?.files[0];

            if (!area || !waterLocation || !drain) {
                alert(`Por favor, completa todos los campos para la imagen ${i}.`);
                submitButton.disabled = false;
                return;
            }

            const equipmentPath = `images/img${i}`;
            const areaPath = `${equipmentPath}/0_area.png`;
            const waterPath = `${equipmentPath}/1_water.png`;
            const drainPath = `${equipmentPath}/2_drain.png`;

            const uploadPromises = [];

            if (areaFile) {
                const areaRef = storageRef(storage, areaPath);
                const areaUploadTask = uploadBytesResumable(areaRef, areaFile);

                uploadPromises.push(areaUploadTask.then(async (snapshot) => {
                    const areaURL = await getDownloadURL(areaRef);
                    imageData.push({ type: "area", name: area, url: areaURL });
                    showUploadProgress(snapshot, 'area');
                }));
            }

            if (waterFile) {
                const waterRef = storageRef(storage, waterPath);
                const waterUploadTask = uploadBytesResumable(waterRef, waterFile);

                uploadPromises.push(waterUploadTask.then(async (snapshot) => {
                    const waterURL = await getDownloadURL(waterRef);
                    imageData.push({ type: "waterLocation", name: waterLocation, url: waterURL });
                    showUploadProgress(snapshot, 'water');
                }));
            }

            if (drainFile) {
                const drainRef = storageRef(storage, drainPath);
                const drainUploadTask = uploadBytesResumable(drainRef, drainFile);

                uploadPromises.push(drainUploadTask.then(async (snapshot) => {
                    const drainURL = await getDownloadURL(drainRef);
                    imageData.push({ type: "drain", name: drain, url: drainURL });
                    showUploadProgress(snapshot, 'drain');
                }));
            }

            await Promise.all(uploadPromises);
        }

        // Agrupar imágenes por equipos (img1, img2, etc.)
        const groupedImages = imageData.reduce((acc, image, index) => {
            const equipmentIndex = Math.floor(index / 3) + 1; // Agrupa cada 3 imágenes
            if (!acc[`img${equipmentIndex}`]) {
                acc[`img${equipmentIndex}`] = [];
            }
            acc[`img${equipmentIndex}`].push(image);
            return acc;
        }, {});

        // Guardar en Realtime Database
        await saveImageData({
            date,
            seller,
            company,
            tdsValue,
            contact,
            phone,
            location: userLocation,
            images: groupedImages,
        });

        alert("Formulario enviado exitosamente.");
    } catch (error) {
        console.error("Error al enviar formulario: ", error);
        alert("Ocurrió un error al enviar el formulario.");
    } finally {
        submitButton.disabled = false;
        document.getElementById("progressContainer").style.display = "none";
        clearForm(); // Borra todos los campos del formulario y la ubicación

        // Redireccionar a la misma página para limpiar campos y mantener la fecha
        window.location.reload();
    }
});



const showUploadProgress = (percentage) => {
    const uploadPercentage = document.getElementById("uploadPercentage");
    if (uploadPercentage) {
        uploadPercentage.innerHTML = `${percentage.toFixed(2)}%`;
        if (percentage >= 100) {
            setTimeout(() => {
                uploadPercentage.innerHTML = "Registro guardado correctamente.";
                setTimeout(() => {
                    submitButton.disabled = false;
                    uploadContainer.style.display = 'none';
                    clearForm(); // Refresca la página después de ocultar el contenedor
                }, 2000); // Mostrar el mensaje durante 2 segundos
            }, 2000); // Esperar 2 segundos antes de mostrar el mensaje
        }
    }
};



// Función para guardar datos en Realtime Database
async function saveImageData(formData) {
    try {
        await push(ref(db, 'sales_installations'), formData);
        console.log("Datos guardados exitosamente.");
    } catch (error) {
        console.error("Error al guardar datos:", error);
    }
}



// Limpiar formulario
function clearForm() {
    const form = document.querySelector("form");
    if (form) {
        form.reset(); // Resetea todos los campos del formulario

        // Limpieza de campos específicos
        document.getElementById("seller").value = '';
        document.getElementById("company").value = '';
        document.getElementById("tds").value = '';
        document.getElementById("contact").value = '';
        document.getElementById("cellphone").value = '';
        document.getElementById("imageCount").value = '';
    }

    const imagesContainer = document.getElementById("imagesContainer");
    if (imagesContainer) imagesContainer.innerHTML = "";

    userLocation = null; // Borra la ubicación
    locationButton.disabled = false;
    locationButton.textContent = "Guardar Ubicación";
}


function loadSalesData() {
    const salesTableBody = document.querySelector('#salesTable tbody');
    if (!salesTableBody) {
        console.error('No se encontró el contenedor de la tabla.');
        return; // Detener la ejecución si no se encuentra el contenedor
    }

    const salesRef = ref(db, 'sales_installations');
    get(salesRef).then((snapshot) => {
        if (snapshot.exists()) {
            const salesData = snapshot.val();

            // Limpiar la tabla antes de agregar los nuevos registros
            salesTableBody.innerHTML = '';

            // Iterar sobre los datos y agregar filas a la tabla
            Object.entries(salesData).forEach(([id, sale]) => {
                const row = document.createElement('tr');

                row.innerHTML = `
                    <td>${sale.date}</td>
                    <td>${sale.seller}</td>
                    <td>${sale.company}</td>
                    <td><button data-uid="${id}">Ver</button></td>
                `;

                salesTableBody.appendChild(row);
            });
        } else {
            console.log("No hay datos disponibles.");
        }
    }).catch((error) => {
        console.error("Error al cargar los datos:", error);
    });
}

document.querySelector("#salesTable tbody").addEventListener("click", function (e) {
    const row = e.target.closest('tr');

    // Si hacemos clic en el botón "Ver"
    if (e.target && e.target.tagName === 'BUTTON' && e.target.textContent === 'Ver') {
        const uid = e.target.dataset.uid; // Obtener el UID del dataset
        if (uid) {
            // Redirigir a la página de detalles con el UID en la URL
            window.location.href = `detalles.html?uid=${encodeURIComponent(uid)}`;
        }
    }
});


// Función para normalizar cadenas (eliminar acentos y convertir a minúsculas)
function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Filtro de búsqueda
document.getElementById("searchBtn")?.addEventListener("click", filterSales);

// Función para aplicar los filtros cuando se haga clic en "Buscar"
function filterSales() {
    const dateFilter = document.getElementById("searchDate")?.value || "";
    const sellerFilter = normalizeString(document.getElementById("searchseller")?.value || "");
    const companyFilter = normalizeString(document.getElementById("searchCompany")?.value || "");


    const queryRef = ref(db, "sales_installations"); // Cambia "sales" por el nodo de tu base de datos
    onValue(queryRef, (snapshot) => {
        const tableBody = document.querySelector("#salesTable tbody"); // Asegúrate de que exista esta tabla en tu HTML
        tableBody.innerHTML = ""; // Limpiar tabla

        if (snapshot.exists()) {
            let rows = "";
            snapshot.forEach((child) => {
                const sale = child.val();

                // Aplicar filtros
                const matchesDate = dateFilter ? data.date === dateFilter : true;
                const matchesSeller = sellerFilter ? normalizeString(sale.seller || "").includes(sellerFilter) : true;
                const matchesCompany = companyFilter ? normalizeString(sale.company || "").includes(companyFilter) : true;


                if (matchesDate && matchesSeller && matchesCompany) {
                    rows += `
                        <tr>
                            <td>${sale.date || "N/A"}</td>
                            <td>${sale.seller || "N/A"}</td>
                            <td>${sale.company || "N/A"}</td>
                        </tr>
                    `;
                }
            });

            tableBody.innerHTML = rows || "<tr><td colspan='4'>No se encontraron registros con los filtros aplicados.</td></tr>";
        } else {
            tableBody.innerHTML = "<tr><td colspan='4'>No hay registros disponibles.</td></tr>";
        }
    });
}

// Limpiar filtros
document.getElementById("clearFilter")?.addEventListener("click", () => {
    document.getElementById("searchDate").value = "";
    document.getElementById("searchseller").value = "";
    document.getElementById("searchCompany").value = "";

    loadSalesData(); // Recargar todos los registros
});


