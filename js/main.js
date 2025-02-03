import { firebaseConfig } from './firebaseConfig.js'; 
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { checkAuthState, logout } from "./auth.js";
import { checkAuthStateAndRole } from "./auth.js";

checkAuthStateAndRole("Instalador");

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Verificar el estado de autenticación y mostrar el botón de cerrar sesión
document.addEventListener("DOMContentLoaded", () => {
    checkAuthState(); // Verificar si el usuario está logueado

    // Manejar el clic en el botón de cerrar sesión
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout); // Llama a la función de logout cuando se haga clic
    }
});
// Cargar técnicos desde Firebase y agregar al combobox
document.addEventListener("DOMContentLoaded", () => {
    const technicianSelect = document.getElementById("technician"); // Obtener el combobox

    if (technicianSelect) {
        // Verificar si hay un usuario autenticado
        onAuthStateChanged(auth, (user) => {
            if (user) {
                const currentUserId = user.uid; // Obtener ID del usuario autenticado
                const currentTechnicianName = user.displayName; // Obtener el nombre del técnico desde Firebase Authentication

                const usersRef = ref(db, "usuarios"); // Ruta a los usuarios en Firebase

                // Obtener los datos de usuarios desde Firebase
                onValue(usersRef, (snapshot) => {
                    console.log(snapshot.val()); // Verifica los datos obtenidos

                    technicianSelect.innerHTML = ""; // Limpiar el combobox antes de llenarlo

                    if (snapshot.exists()) {
                        let technicianFound = false; // Bandera para verificar si encontramos el técnico

                        snapshot.forEach((childSnapshot) => {
                            const user = childSnapshot.val(); // Obtener los datos de cada usuario

                            // Verificar si el ID del usuario coincide con el usuario autenticado
                            if (user.uid === currentUserId) {
                                const technicianName = user.technician; // Extraer el nombre del técnico

                                if (technicianName) {
                                    // Crear una opción para el técnico logueado
                                    const option = document.createElement("option");
                                    option.value = technicianName; // Usar el nombre del técnico como valor
                                    option.textContent = technicianName; // Mostrar el nombre del técnico
                                    technicianSelect.appendChild(option); // Añadir la opción al combobox
                                    technicianSelect.value = technicianName; // Establecer como seleccionado el técnico logueado
                                    technicianFound = true; // Marcar que encontramos al técnico
                                }
                            }
                        });

                        // Si no se encuentra el técnico, agregar una opción por defecto
                        if (!technicianFound) {
                            const option = document.createElement("option");
                            option.textContent = "No se encontró el técnico";
                            technicianSelect.appendChild(option);
                        }
                    } else {
                        const option = document.createElement("option");
                        option.textContent = "No hay técnicos disponibles";
                        technicianSelect.appendChild(option);
                    }
                });
            } else {
                // Si no hay un usuario autenticado, agregar una opción por defecto
                const option = document.createElement("option");
                option.textContent = "No has iniciado sesión";
                technicianSelect.appendChild(option);
            }
        });
    }
});

// Inicializar fecha en el área de filtros al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-CA'); // 'en-CA' garantiza el formato 'YYYY-MM-DD'

    const dateInput = document.getElementById("date");
    if (dateInput) {
        dateInput.value = currentDate;
    }

    const searchDateInput = document.getElementById("searchDate");
    if (searchDateInput) {
        searchDateInput.value = currentDate;
    }

    filterInstallations();
});

// Botones para Video de Instalación
const uploadInstallationVideoBtn = document.getElementById('uploadInstallationVideo');
const recordInstallationVideoBtn = document.getElementById('recordInstallationVideo');
const installationVideoLabel = document.getElementById('installationVideoLabel');

// Botones para Video TDS
const uploadTdsVideoBtn = document.getElementById('uploadTdsVideo');
const recordTdsVideoBtn = document.getElementById('recordTdsVideo');
const tdsVideoLabel = document.getElementById('tdsVideoLabel');

// Inicializar etiquetas
installationVideoLabel.textContent = 'No se ha cargado ningún video';
tdsVideoLabel.textContent = 'No se ha cargado ningún video';

let installationVideo = null;
let tdsVideo = null;

// Crear inputs dinámicamente
function createFileInput(accept, capture, callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (capture) input.capture = capture;
    input.addEventListener('change', callback);
    input.click();
}

// Manejar la selección/grabación de video para instalación
uploadInstallationVideoBtn.addEventListener('click', (event) => {
    event.preventDefault();
    createFileInput('video/*', false, (event) => {
        const file = event.target.files[0];
        if (file) {
            installationVideo = file; // Asignar el archivo a la variable global
            installationVideoLabel.textContent = `Video cargado: ${file.name}`;
        }
    });
});

recordInstallationVideoBtn.addEventListener('click', (event) => {
    event.preventDefault();
    createFileInput('video/*', 'camera', (event) => {
        const file = event.target.files[0];
        if (file) {
            installationVideo = file;
            installationVideoLabel.textContent = `Video cargado: ${file.name}`;
        }
    });
});

// Manejar la selección/grabación de video para TDS
uploadTdsVideoBtn.addEventListener('click', (event) => {
    event.preventDefault();
    createFileInput('video/*', false, (event) => {
        const file = event.target.files[0];
        if (file) {
            tdsVideo = file; // Asignar el archivo a la variable global
            tdsVideoLabel.textContent = `Video cargado: ${file.name}`;
        }
    });
});

recordTdsVideoBtn.addEventListener('click', (event) => {
    event.preventDefault();
    createFileInput('video/*', 'camera', (event) => {
        const file = event.target.files[0];
        if (file) {
            tdsVideo = file;
            tdsVideoLabel.textContent = `Video cargado: ${file.name}`;
        }
    });
});

document.getElementById("submitBtn").addEventListener("click", async () => {
    const submitButton = document.getElementById("submitBtn");
    submitButton.disabled = true;

    const uploadContainer = document.getElementById("uploadContainer");
    const uploadPercentage = document.getElementById("uploadPercentage");

    uploadContainer.style.display = "flex"; // Mostrar el contenedor

    let progress1 = 0;
    let progress2 = 0;

    try {
        const date = document.getElementById("date").value;
        const technician = document.getElementById("technician").value;
        const company = document.getElementById("company").value;
        const installationType = document.getElementById("installationType").value;
        const installationCategory = document.getElementById("installationCategory").value;

        // Validación
        if (!date || !technician || !company || !installationType || !installationCategory) {
            alert("Por favor, completa todos los campos.");
            submitButton.disabled = false;
            uploadContainer.style.display = 'none';
            return;
        }

        if (!installationVideo) {
            alert("Por favor, selecciona un video para 'Video Instalación'.");
            submitButton.disabled = false;
            uploadContainer.style.display = 'none';
            return;
        }

        if (!tdsVideo) {
            alert("Por favor, selecciona un video para 'Video TDS'.");
            submitButton.disabled = false;
            uploadContainer.style.display = 'none';
            return;
        }

        // Rutas de almacenamiento
        const installationVideoPath = `videos/installation_${Date.now()}.mp4`;
        const tdsVideoPath = `videos/tds_${Date.now()}.mp4`;

        // Subir videos
        const installationVideoRef = storageRef(storage, installationVideoPath);
        const tdsVideoRef = storageRef(storage, tdsVideoPath);

        const uploadTask1 = uploadBytesResumable(installationVideoRef, installationVideo);
        const uploadTask2 = uploadBytesResumable(tdsVideoRef, tdsVideo);

        // Monitorear progreso
        const showUploadProgress = () => {
            const overallProgress = Math.min(progress1, progress2);
            uploadPercentage.innerHTML = `${overallProgress.toFixed(2)}%`;
            if (overallProgress >= 100) {
                setTimeout(() => {
                    uploadPercentage.innerHTML = "Registro guardado correctamente.";
                    setTimeout(() => {
                        submitButton.disabled = false;
                        uploadContainer.style.display = 'none';
                        clearForm(); // Limpiar formulario
                    }, 2000);
                }, 2000);
            }
        };

        uploadTask1.on('state_changed', (snapshot) => {
            progress1 = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            showUploadProgress();
        });

        uploadTask2.on('state_changed', (snapshot) => {
            progress2 = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            showUploadProgress();
        });

        await Promise.all([uploadTask1, uploadTask2]);

        // Obtener URLs de descarga
        let installationVideoURL, tdsVideoURL;
        try {
            installationVideoURL = await getDownloadURL(installationVideoRef);
            tdsVideoURL = await getDownloadURL(tdsVideoRef);
        } catch (error) {
            console.error("Error al obtener URLs de videos:", error);
            alert("Ocurrió un error al procesar los videos.");
            return;
        }

        // Crear nueva entrada en la base de datos
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
    } finally {
        submitButton.disabled = false;
        uploadContainer.style.display = 'none';
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