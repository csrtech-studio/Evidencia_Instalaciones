import { firebaseConfig } from './firebaseConfig.js'; 
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-storage.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

// Auto-set fecha actual
document.addEventListener("DOMContentLoaded", () => {
    const currentDate = new Date().toISOString().split("T")[0];
    document.getElementById("date").value = currentDate; // Establecer la fecha actual por defecto
    document.getElementById("searchDate").value = currentDate; // Filtro por fecha actual
    loadInstallations(); // Cargar registros al inicio
});

// Manejo de envío del formulario
document.getElementById("submitBtn").addEventListener("click", async () => {
    const submitButton = document.getElementById("submitBtn");
    submitButton.disabled = true; // Deshabilitar el botón de guardar

    try {
        const date = document.getElementById("date").value;
        const technician = document.getElementById("technician").value;
        const company = document.getElementById("company").value;
        const installationType = document.getElementById("installationType").value;
        const installationCategory = document.getElementById("installationCategory").value;
        const installationVideo = document.getElementById("installationVideo").files[0];
        const tdsVideo = document.getElementById("tdsVideo").files[0];

        // Validar campos
        if (!date || !technician || !company || !installationType || !installationCategory || !installationVideo || !tdsVideo) {
            alert("Por favor, completa todos los campos.");
            submitButton.disabled = false; // Volver a habilitar el botón si hay un error
            return;
        }

        // Subir videos a Firebase Storage
        const installationVideoPath = `videos/installation_${Date.now()}.mp4`;
        const tdsVideoPath = `videos/tds_${Date.now()}.mp4`;

        const installationVideoRef = storageRef(storage, installationVideoPath);
        const tdsVideoRef = storageRef(storage, tdsVideoPath);

        await Promise.all([uploadBytes(installationVideoRef, installationVideo), uploadBytes(tdsVideoRef, tdsVideo)]);

        const [installationVideoURL, tdsVideoURL] = await Promise.all([getDownloadURL(installationVideoRef), getDownloadURL(tdsVideoRef)]);

        // Guardar datos en Firebase Database
        const newEntry = {
            date,
            technician,
            company,
            installationVideo: installationVideoURL,
            tdsVideo: tdsVideoURL,
            installationType,
            installationCategory,
        };

        await push(ref(db, "installations"), newEntry);

        // Mostrar mensaje de éxito
        alert("Registro guardado exitosamente.");
        
        // Actualizar tabla y limpiar formulario
        loadInstallations(); 
        clearForm();

    } catch (error) {
        console.error("Error al guardar el registro:", error);
        alert("Ocurrió un error al guardar el registro.");
    } finally {
        submitButton.disabled = false; // Volver a habilitar el botón después de que el usuario acepte el mensaje
    }
});

// Función para cargar datos en la tabla
function loadInstallations(queryRef = ref(db, "installations")) {
    const tableBody = document.querySelector("#installationsTable tbody");
    tableBody.innerHTML = ""; // Limpiar tabla

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
                        <td><a href="${data.installationVideo}" target="_blank">Ver Video Instalación</a></td>
                        <td><a href="${data.tdsVideo}" target="_blank">Ver Video TDS</a></td>
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
    document.getElementById("company").value = "";
    document.getElementById("installationVideo").value = "";
    document.getElementById("tdsVideo").value = "";
    document.getElementById("technician").value = "Instalador1";
    document.getElementById("date").value = new Date().toISOString().split("T")[0];
    document.getElementById("installationType").value = "";
    document.getElementById("installationCategory").value = "";
}

// Filtro de búsqueda con validación para null
document.getElementById("searchCompany")?.addEventListener("input", filterInstallations);
document.getElementById("searchDate")?.addEventListener("input", filterInstallations);
document.getElementById("searchTechnician")?.addEventListener("input", filterInstallations);
document.getElementById("searchInstallationType")?.addEventListener("input", filterInstallations);
document.getElementById("searchInstallationCategory")?.addEventListener("change", filterInstallations);

// Función para aplicar el filtro
function filterInstallations() {
    const companyFilter = document.getElementById("searchCompany")?.value?.toLowerCase() || "";
    const dateFilter = document.getElementById("searchDate")?.value || "";
    const technicianFilter = document.getElementById("searchTechnician")?.value?.toLowerCase() || "";
    const installationTypeFilter = document.getElementById("searchInstallationType")?.value?.toLowerCase() || "";
    const installationCategoryFilter = document.getElementById("searchInstallationCategory")?.value || "";

    const queryRef = ref(db, "installations");
    onValue(queryRef, (snapshot) => {
        const tableBody = document.querySelector("#installationsTable tbody");
        tableBody.innerHTML = ""; // Limpiar tabla

        if (snapshot.exists()) {
            let rows = "";
            snapshot.forEach((child) => {
                const data = child.val();

                // Filtrar según los valores introducidos
                const matchesCompany = data.company ? data.company.toLowerCase().includes(companyFilter) : false;
                const matchesDate = dateFilter ? data.date === dateFilter : true;
                const matchesTechnician = data.technician ? data.technician.toLowerCase().includes(technicianFilter) : false;
                const matchesInstallationType = data.installationType ? data.installationType.toLowerCase().includes(installationTypeFilter) : false;
                const matchesInstallationCategory = data.installationCategory ? data.installationCategory === installationCategoryFilter : true;

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
            tableBody.innerHTML = rows;
        } else {
            tableBody.innerHTML = "<tr><td colspan='7'>No hay registros disponibles.</td></tr>";
        }
    });
}


// Limpiar filtros
const clearFilterButton = document.getElementById("clearFilter");
if (clearFilterButton) {
    clearFilterButton.addEventListener("click", () => {
        const searchCompany = document.getElementById("searchCompany");
        const searchDate = document.getElementById("searchDate");
        const searchTechnician = document.getElementById("searchTechnician");
        const searchInstallationType = document.getElementById("searchInstallationType");
        const searchInstallationCategory = document.getElementById("searchInstallationCategory");

        // Limpiar los campos de búsqueda solo si existen
        if (searchCompany) searchCompany.value = "";
        if (searchDate) searchDate.value = "";
        if (searchTechnician) searchTechnician.value = "";
        if (searchInstallationType) searchInstallationType.value = "";
        if (searchInstallationCategory) searchInstallationCategory.value = "";

        loadInstallations(); // Volver a cargar los registros sin filtro
    });
}

