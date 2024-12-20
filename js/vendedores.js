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


// Detectar cambios en la cantidad de videos y generar campos dinámicos
document.getElementById("videoCount").addEventListener("input", function () {
    const videoCount = parseInt(this.value) || 0;
    const videosContainer = document.getElementById("videosContainer");

    // Limpiar contenedor de videos
    videosContainer.innerHTML = "";

    // Generar campos de video dinámicamente
    for (let i = 1; i <= videoCount; i++) {
        const videoWrapper = document.createElement("div");
        videoWrapper.classList.add("video-wrapper");

        const labelArea = document.createElement("label");
        labelArea.setAttribute("for", `videoArea${i}`);
        labelArea.textContent = `Área del video ${i}:`;

        const inputArea = document.createElement("input");
        inputArea.type = "text";
        inputArea.id = `videoArea${i}`;
        inputArea.name = `videoArea${i}`;
        inputArea.placeholder = `Área del video ${i}`;
        inputArea.required = true;

        const labelVideo = document.createElement("label");
        labelVideo.setAttribute("for", `videoFile${i}`);
        labelVideo.textContent = `Video del área ${i}:`;

        const inputVideo = document.createElement("input");
        inputVideo.type = "file";
        inputVideo.accept = "video/*";
        inputVideo.id = `videoFile${i}`;
        inputVideo.name = `videoFile${i}`;
        inputVideo.required = true;

        videoWrapper.appendChild(labelArea);
        videoWrapper.appendChild(inputArea);
        videoWrapper.appendChild(labelVideo);
        videoWrapper.appendChild(inputVideo);
        videosContainer.appendChild(videoWrapper);
    }
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


document.getElementById("submitBtn").addEventListener("click", async (event) => {
    event.preventDefault();  // Previene que el formulario se recargue

    const submitButton = document.getElementById("submitBtn");
    submitButton.disabled = true;

    try {
        // Obtener datos del formulario
        const dateInput = document.getElementById("date");
        const sellerInput = document.getElementById("seller");
        const companyInput = document.getElementById("company");
        const branchInput = document.getElementById("branch");
        const tdsInput = document.getElementById("tds");
        const contactInput = document.getElementById("contact");
        const phoneInput = document.getElementById("cellphone");
        const videoCountInput = document.getElementById("videoCount");

        // Verificar que los campos existen y obtener sus valores
        const date = dateInput ? dateInput.value : null;
        const seller = sellerInput ? sellerInput.value : null;
        const company = companyInput ? companyInput.value : null;
        const branch = branchInput ? branchInput.value : null;
        const tdsValue = tdsInput ? tdsInput.value : null;
        const contact = contactInput ? contactInput.value : null;
        const phone = phoneInput ? phoneInput.value : null;
        let videoCount = videoCountInput ? parseInt(videoCountInput.value) || 0 : 0;

        // Validar que todos los campos estén completos
        if (!date || !seller || !company || !branch || !tdsValue || !contact || !phone || videoCount <= 0) {
            let missingFields = [];

            if (!date) missingFields.push("Fecha");
            if (!seller) missingFields.push("Vendedor");
            if (!company) missingFields.push("Compañía");
            if (!branch) missingFields.push("Sucursal");
            if (!tdsValue) missingFields.push("TDS");
            if (!contact) missingFields.push("Contacto");
            if (!phone) missingFields.push("Teléfono");
            if (videoCount <= 0) missingFields.push("Cantidad de videos");

            alert("Por favor, completa los siguientes campos: " + missingFields.join(", "));
            submitButton.disabled = false;
            return;
        }

        // Verificar que videoCount esté dentro del rango de 1 a 50
        if (videoCount < 1 || videoCount > 50) {
            alert("La cantidad de videos debe estar entre 1 y 50.");
            submitButton.disabled = false;
            return;
        }

        // Verificar que la ubicación esté guardada
        if (!userLocation) {
            alert("Por favor, guarda la ubicación antes de enviar el formulario.");
            submitButton.disabled = false;  // Deshabilitar el botón para evitar más envíos
            return;  // Evita que el formulario se envíe y detiene la ejecución
        }

        // Obtener los valores de las áreas y los videos
        const videoUploads = [];
        const videoData = [];  // Para almacenar tanto el área como el video

        // Mostrar la barra de progreso al inicio de las cargas
        document.getElementById("progressContainer").style.display = "block";

        for (let i = 1; i <= videoCount; i++) {
            const areaInput = document.getElementById(`videoArea${i}`);
            const videoInput = document.getElementById(`videoFile${i}`);
            
            let area = areaInput?.value.trim();
            if (!area) {
                alert(`El área para el video ${i} no está especificada. Por favor, ingresa un valor.`);
                submitButton.disabled = false;
                return;
            }

            const videoFile = videoInput?.files[0];
            
            const videoPath = `sales_installations/video_${Date.now()}_${i}.mp4`;
            const videoRef = storageRef(storage, videoPath);
            const uploadTask = uploadBytesResumable(videoRef, videoFile);

            const uploadPromise = new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        // Calcular el porcentaje de progreso
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        // Actualizar la barra de progreso
                        document.getElementById("progressBar").value = progress;
                        document.getElementById("progressPercentage").textContent = `${Math.round(progress)}%`;
                    },
                    (error) => reject(error),
                    async () => {
                        const downloadURL = await getDownloadURL(videoRef);
                        videoData.push({ area: area, videoUrl: downloadURL });
                        resolve();
                    }
                );
            });
            
            videoUploads.push(uploadPromise);
        }

        // Esperar a que todos los videos se suban
        await Promise.all(videoUploads);

        // Ocultar la barra de progreso cuando todos los videos hayan sido subidos
        document.getElementById("progressContainer").style.display = "none";

        // Crear el objeto con los datos a guardar en Firebase
        const newEntry = {
            date,
            seller,
            company,
            branch,
            tds: tdsValue,
            contact,
            phone,
            videos: videoData,  // Ahora guardamos un arreglo de objetos { area, videoUrl }
            location: userLocation,  // Guardar la ubicación del usuario
        };

        // Guardar los datos en Firebase
        await push(ref(db, "sales_installations"), newEntry);

        alert("Registro guardado exitosamente.");
        clearForm();  // Limpiar el formulario

    } catch (error) {
        console.error("Error al guardar el registro:", error);
        alert("Ocurrió un error al guardar el registro. Verifica la consola para más detalles.");
    } finally {
        submitButton.disabled = false;
    }

    loadSalesData();  // Cargar los registros después de que el formulario se haya enviado
});






// Limpiar formulario
function clearForm() {
    const form = document.querySelector("form");
    if (form) form.reset();

    const videosContainer = document.getElementById("videosContainer");
    if (videosContainer) videosContainer.innerHTML = "";

    userLocation = null;
    locationButton.disabled = false;
    locationButton.textContent = "Guardar Ubicación";
}

// Función para cargar los registros en la tabla
function loadSalesData() {
    const salesTableBody = document.querySelector('#salesTable tbody');
    if (!salesTableBody) {
        console.error('No se encontró el contenedor de la tabla.');
        return;  // Detener la ejecución si no se encuentra el contenedor
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
                    <td>${sale.branch}</td>
                   
                `;
                salesTableBody.appendChild(row);
            });

            // Agregar evento para eliminar registros
            const deleteBtns = document.querySelectorAll('.deleteBtn');
            deleteBtns.forEach((btn) => {
                btn.addEventListener('click', (event) => {
                    const recordId = event.target.getAttribute('data-id');
                    deleteRecord(recordId);
                });
            });

        } else {
            console.log("No hay datos disponibles.");
        }
    }).catch((error) => {
        console.error("Error al cargar los datos:", error);
    });
}

// Agregar un evento para hacer clic en una fila de la tabla
document.querySelector("#salesTable tbody").addEventListener("click", function (e) {
    const row = e.target.closest('tr');
    const companyCell = row?.querySelector('td:nth-child(3)'); // Tercera celda (Compañía)

    if (companyCell) {
        const company = companyCell.textContent;  // Obtener el nombre de la compañía
        // Redirigir a la página de detalles con el nombre de la compañía en la URL
        window.location.href = `detalles.html?company=${encodeURIComponent(company)}`;
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
    const branchFilter = normalizeString(document.getElementById("searchBranch")?.value || "");

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
                const matchesBranch = branchFilter ? normalizeString(sale.branch || "").includes(branchFilter) : true;

                if (matchesDate && matchesSeller && matchesCompany && matchesBranch) {
                    rows += `
                        <tr>
                            <td>${sale.date || "N/A"}</td>
                            <td>${sale.seller || "N/A"}</td>
                            <td>${sale.company || "N/A"}</td>
                            <td>${sale.branch || "N/A"}</td>
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
    document.getElementById("searchBranch").value = "";

    loadSalesData(); // Recargar todos los registros
});


