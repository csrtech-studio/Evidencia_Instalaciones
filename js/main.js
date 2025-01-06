//main.js
import { firebaseConfig } from './firebaseConfig.js'; 
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-storage.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

// Inicializar fecha en el área de filtros al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    // Obtener la fecha actual en la zona horaria local
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-CA'); // 'en-CA' garantiza el formato 'YYYY-MM-DD'

    // Establecer la fecha actual por defecto en los campos correspondientes
    const dateInput = document.getElementById("date");
    if (dateInput) {
        dateInput.value = currentDate;
    }

    const searchDateInput = document.getElementById("searchDate");
    if (searchDateInput) {
        searchDateInput.value = currentDate; // Filtro por fecha actual
    }

    // Aplicar filtro automáticamente al cargar la página
    filterInstallations();
});

document.getElementById("submitBtn").addEventListener("click", async () => {
    const submitButton = document.getElementById("submitBtn");
    submitButton.disabled = true;

    const uploadContainer = document.getElementById("uploadContainer");
    const uploadPercentage = document.getElementById("uploadPercentage");

    uploadContainer.style.display = "flex"; // Mostrar el contenedor

    try {
        const date = document.getElementById("date").value;
        const technician = document.getElementById("technician").value;
        const company = document.getElementById("company").value;
        const installationType = document.getElementById("installationType").value;
        const installationCategory = document.getElementById("installationCategory").value;

        // Obtener videos
        const installationVideoFile = document.getElementById("installationVideoFile").files[0];
        const installationVideoCamera = document.getElementById("installationVideoCamera").files[0];
        const tdsVideoFile = document.getElementById("tdsVideoFile").files[0];
        const tdsVideoCamera = document.getElementById("tdsVideoCamera").files[0];

        // Prioridad: archivo > cámara
        const installationVideo = installationVideoFile || installationVideoCamera;
        const tdsVideo = tdsVideoFile || tdsVideoCamera;

        if (!date || !technician || !company || !installationType || !installationCategory || !installationVideo || !tdsVideo) {
            alert("Por favor, completa todos los campos y selecciona al menos un video en cada opción.");
            submitButton.disabled = false;
            return;
        }

        // Rutas de almacenamiento
        const installationVideoPath = `videos/installation_${Date.now()}.mp4`;
        const tdsVideoPath = `videos/tds_${Date.now()}.mp4`;

        // Referencias de almacenamiento
        const installationVideoRef = storageRef(storage, installationVideoPath);
        const tdsVideoRef = storageRef(storage, tdsVideoPath);

        // Subidas de archivos
        const uploadTask1 = uploadBytesResumable(installationVideoRef, installationVideo);
        const uploadTask2 = uploadBytesResumable(tdsVideoRef, tdsVideo);

        // Función personalizada para mostrar el progreso
        const showUploadProgress = (percentage) => {
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
        };

        // Actualizar porcentaje usando la función personalizada
        uploadTask1.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            showUploadProgress(progress);
        });

        uploadTask2.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            showUploadProgress(progress);
        });

        // Obtener URLs de descarga
        await Promise.all([uploadTask1, uploadTask2]);
        const [installationVideoURL, tdsVideoURL] = await Promise.all([
            getDownloadURL(installationVideoRef),
            getDownloadURL(tdsVideoRef),
        ]);

        // Crear nueva entrada
        const newEntry = {
            date,
            technician,
            company,
            installationType,
            installationCategory,
            installationVideo: installationVideoURL,
            tdsVideo: tdsVideoURL,
        };

        await push(ref(db, "installations"), newEntry);

    } catch (error) {
        console.error("Error al guardar el registro:", error);
        alert("Ocurrió un error al guardar el registro.");
    }
});



// Función para cargar datos en la tabla
function loadInstallations(queryRef = ref(db, "installations")) {
    const tableBody = document.querySelector("#installationsTable tbody");
    tableBody.innerHTML = ""; 

    onValue(queryRef, (snapshot) => {
        if (snapshot.exists()) {
            let rows = "";
            snapshot.forEach((child) => {
                const data = child.val();
                rows += ` 
                    <tr>
                        <td>${data.date}</td>
                        <td>${data.technician}</td>
                        <td>${data.company}</td>
                        <td>${data.installationType}</td>
                        <td>${data.installationCategory}</td>
                        <td><a href="${data.installationVideo}" target="_blank">Instalacion</a></td>
                        <td><a href="${data.tdsVideo}" target="_blank">Tds</a></td>
                    </tr>
                `;
            });
            tableBody.innerHTML = rows;
        } else {
            tableBody.innerHTML = "<tr><td colspan='7'>No hay registros disponibles.</td></tr>";
        }
    });
}

// Limpiar formulario
function clearForm() {
    const form = document.querySelector("form");  // Asegúrate de que el formulario tenga un selector correcto
    if (form) {
        form.reset();  // Esto limpia todos los campos del formulario
    }

    // Establecer valores predeterminados para campos que no se manejan con `form.reset()`
    const technicianSelect = document.getElementById("technician");
    if (technicianSelect) technicianSelect.value = "Instalador1";

    const dateInput = document.getElementById("date");
    if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];

    const installationTypeInput = document.getElementById("installationType");
    if (installationTypeInput) installationTypeInput.value = "";

    const installationCategorySelect = document.getElementById("installationCategory");
    if (installationCategorySelect) installationCategorySelect.value = "";
}



// FILTROS DE BUSQUEDA //


// Función para normalizar cadenas (eliminar acentos y convertir a minúsculas)
function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Filtro de búsqueda con validación para null
document.getElementById("searchBtn")?.addEventListener("click", filterInstallations);

// Función para aplicar el filtro cuando se haga clic en el botón "Buscar"
function filterInstallations() {
    const companyFilter = document.getElementById("searchCompany")?.value.toLowerCase() || "";
    const dateFilter = document.getElementById("searchDate")?.value || "";
    const technicianFilter = document.getElementById("searchTechnician")?.value.toLowerCase() || "";
    const installationTypeFilter = document.getElementById("searchInstallationType")?.value.toLowerCase() || "";
    const installationCategoryFilter = document.getElementById("searchCategory")?.value || "";

    const queryRef = ref(db, "installations");
    onValue(queryRef, (snapshot) => {
        const tableBody = document.querySelector("#installationsTable tbody");
        tableBody.innerHTML = ""; // Limpiar tabla

        if (snapshot.exists()) {
            let rows = "";
            snapshot.forEach((child) => {
                const data = child.val();

                // Filtrar según los valores introducidos
                const matchesCompany = companyFilter ? data.company.toLowerCase().includes(companyFilter) : true;
                const matchesDate = dateFilter ? data.date === dateFilter : true;
                const matchesTechnician = technicianFilter ? data.technician.toLowerCase().includes(technicianFilter) : true;
                const matchesInstallationType = installationTypeFilter ? data.installationType.toLowerCase().includes(installationTypeFilter) : true;
                const matchesInstallationCategory = installationCategoryFilter ? data.installationCategory === installationCategoryFilter : true;

                if (matchesCompany && matchesDate && matchesTechnician && matchesInstallationType && matchesInstallationCategory) {
                    rows += `
                        <tr>
                            <td>${data.date}</td>
                            <td>${data.technician}</td>
                            <td>${data.company}</td>
                            <td>${data.installationType}</td>
                            <td>${data.installationCategory}</td>
                            <td><a href="${data.installationVideo}" target="_blank">Ver Video Instalación</a></td>
                            <td><a href="${data.tdsVideo}" target="_blank">Ver Video TDS</a></td>
                        </tr>
                    `;
                }
            });
            tableBody.innerHTML = rows || "<tr><td colspan='7'>No se encontraron registros con los filtros aplicados.</td></tr>";
        } else {
            tableBody.innerHTML = "<tr><td colspan='7'>No hay registros disponibles.</td></tr>";
        }
    });
}


// Limpiar filtros
const clearFilterButton = document.getElementById("clearFilter");
if (clearFilterButton) {
    clearFilterButton.addEventListener("click", () => {
        // Limpiar los campos de búsqueda solo si existen
        const searchCompany = document.getElementById("searchCompany");
        if (searchCompany) searchCompany.value = "";

        const searchDate = document.getElementById("searchDate");
        if (searchDate) searchDate.value = "";

        const searchTechnician = document.getElementById("searchTechnician");
        if (searchTechnician) searchTechnician.value = "";

        const searchInstallationType = document.getElementById("searchInstallationType");
        if (searchInstallationType) searchInstallationType.value = "";

        const searchInstallationCategory = document.getElementById("searchInstallationCategory");
        if (searchInstallationCategory) searchInstallationCategory.value = "";

        loadInstallations(); // Recargar todos los registros
    });
}