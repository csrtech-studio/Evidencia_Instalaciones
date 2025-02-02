import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, ref, onValue, push, get } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { checkAuthState, logout } from "./auth.js";
import { checkAuthStateAndRole } from "./auth.js";


checkAuthStateAndRole("Vendedor");

let userLocation = null;

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);
const salesRef = ref(db, 'sales_installations')

// Verificar el estado de autenticación y mostrar el botón de cerrar sesión
document.addEventListener("DOMContentLoaded", () => {
    checkAuthState(); // Verificar si el usuario está logueado

    // Manejar el clic en el botón de cerrar sesión
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout); // Llama a la función de logout cuando se haga clic
    }
});

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
        inputArea.placeholder = `Ingrese área ${i}`;
        inputArea.required = true;

        const labelAreaFile = document.createElement("label");
        labelAreaFile.textContent = "Tomar Foto (Área)";
        labelAreaFile.classList.add("custom-file-button");
        labelAreaFile.setAttribute("for", `areaFile${i}`);

        const inputAreaFile = document.createElement("input");
        inputAreaFile.type = "file";
        inputAreaFile.accept = "image/*";
        inputAreaFile.capture = "environment";
        inputAreaFile.id = `areaFile${i}`;
        inputAreaFile.name = `areaFile${i}`;
        inputAreaFile.style.display = "none";

        const areaFileName = document.createElement("span");
        areaFileName.id = `areaFileName${i}`;
        areaFileName.classList.add("file-name");
        areaFileName.textContent = "No se ha cargado ninguna foto.";

        inputAreaFile.addEventListener("change", function () {
            const fileName = this.files[0]?.name || "No se ha seleccionado ninguna foto.";
            areaFileName.textContent = `Foto cargada: Area ${i}`;
        });

        // Campo de Tomas de Agua
        const labelWaterLocation = document.createElement("label");
        labelWaterLocation.setAttribute("for", `waterLocationImage${i}`);
        labelWaterLocation.textContent = `Tomas de agua:`;

        const inputWaterLocation = document.createElement("input");
        inputWaterLocation.type = "text";
        inputWaterLocation.id = `waterLocationImage${i}`;
        inputWaterLocation.name = `waterLocationImage${i}`;
        inputWaterLocation.placeholder = `Ingrese ubicación para la toma de agua ${i}`;
        inputWaterLocation.required = true;

        const labelWaterFile = document.createElement("label");
        labelWaterFile.textContent = "Tomar Foto (Tomas de agua)";
        labelWaterFile.classList.add("custom-file-button");
        labelWaterFile.setAttribute("for", `waterFile${i}`);

        const inputWaterFile = document.createElement("input");
        inputWaterFile.type = "file";
        inputWaterFile.accept = "image/*";
        inputWaterFile.capture = "environment";
        inputWaterFile.id = `waterFile${i}`;
        inputWaterFile.name = `waterFile${i}`;
        inputWaterFile.style.display = "none";

        const waterFileName = document.createElement("span");
        waterFileName.id = `waterFileName${i}`;
        waterFileName.classList.add("file-name");
        waterFileName.textContent = "No se ha cargado ninguna foto.";

        inputWaterFile.addEventListener("change", function () {
            const fileName = this.files[0]?.name || "No se ha seleccionado ninguna foto.";
            waterFileName.textContent = `Foto cargada: Tomas de Agua ${i}`;
        });

        // Campo de Drenaje
        const labelDrainage = document.createElement("label");
        labelDrainage.setAttribute("for", `drainImage${i}`);
        labelDrainage.textContent = `Drenaje:`;

        const inputDrainage = document.createElement("input");
        inputDrainage.type = "text";
        inputDrainage.id = `drainImage${i}`;
        inputDrainage.name = `drainImage${i}`;
        inputDrainage.placeholder = `Ingrese drenaje ${i}`;
        inputDrainage.required = true;

        const labelDrainFile = document.createElement("label");
        labelDrainFile.textContent = "Tomar Foto (Drenaje)";
        labelDrainFile.classList.add("custom-file-button");
        labelDrainFile.setAttribute("for", `drainFile${i}`);

        const inputDrainFile = document.createElement("input");
        inputDrainFile.type = "file";
        inputDrainFile.accept = "image/*";
        inputDrainFile.capture = "environment";
        inputDrainFile.id = `drainFile${i}`;
        inputDrainFile.name = `drainFile${i}`;
        inputDrainFile.style.display = "none";

        const drainFileName = document.createElement("span");
        drainFileName.id = `drainFileName${i}`;
        drainFileName.classList.add("file-name");
        drainFileName.textContent = "No se ha cargado ninguna foto.";

        inputDrainFile.addEventListener("change", function () {
            const fileName = this.files[0]?.name || "No se ha seleccionado ninguna foto.";
            drainFileName.textContent = `Foto cargada: Drenaje ${i}`;
        });

        // Agregar elementos al wrapper
        imageWrapper.appendChild(labelArea);
        imageWrapper.appendChild(inputArea);
        imageWrapper.appendChild(labelAreaFile);
        imageWrapper.appendChild(inputAreaFile);
        imageWrapper.appendChild(areaFileName);

        imageWrapper.appendChild(labelWaterLocation);
        imageWrapper.appendChild(inputWaterLocation);
        imageWrapper.appendChild(labelWaterFile);
        imageWrapper.appendChild(inputWaterFile);
        imageWrapper.appendChild(waterFileName);

        imageWrapper.appendChild(labelDrainage);
        imageWrapper.appendChild(inputDrainage);
        imageWrapper.appendChild(labelDrainFile);
        imageWrapper.appendChild(inputDrainFile);
        imageWrapper.appendChild(drainFileName);

        imagesContainer.appendChild(imageWrapper);
    }
});


// Foto del Tds//
let openCameraBtn, tdsFileInput, tdsFileName;

document.addEventListener("DOMContentLoaded", function () {
    openCameraBtn = document.getElementById("openCameraBtn");
    tdsFileInput = document.getElementById("tdsFile");
    tdsFileName = document.getElementById("tdsFileName");

    openCameraBtn.addEventListener("click", async function () {
        tdsFileInput.click(); // Abre la cámara para tomar una foto
    });


    let isTdsUploaded = false; // Variable global para controlar la subida del TDS

    tdsFileInput.addEventListener("change", async function () {
        const file = this.files[0];

        if (file) {
            // Generar nombre de archivo con la fecha actual
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().split('T')[0]; // Formato: YYYY-MM-DD
            const newFileName = `Tds-${formattedDate}.jpg`;

            const tdsPath = `tds/${newFileName}`;
            const tdsRef = storageRef(storage, tdsPath);
            const tdsUploadTask = uploadBytesResumable(tdsRef, file);

            tdsUploadTask.then(async (snapshot) => {
                const tdsImageURL = await getDownloadURL(tdsRef);
                tdsFileName.textContent = `Foto cargada: ${newFileName}`;
                isTdsUploaded = true;
            }).catch(error => {
                console.error("Error al subir la imagen del TDS:", error);
                alert("Hubo un error al subir la imagen del TDS.");
                isTdsUploaded = false;
            });

        } else {
            alert("No se ha seleccionado ninguna foto del TDS.");
            isTdsUploaded = false;
        }
    });

    // Función personalizada para mostrar el progreso
    function showUploadProgress(progress) {
        const uploadPercentage = document.getElementById("uploadPercentage");
        const uploadBar = document.getElementById("uploadBar");

        uploadPercentage.innerHTML = Math.round(progress * 100) + "%";
        uploadBar.style.width = (progress * 100) + "%";
    }

    let progress = 0; // Porcentaje de progreso
    let progressContainer = document.getElementById('progressContainer');
    let uploadBar = document.getElementById('uploadBar');
    let uploadPercentage = document.getElementById('uploadPercentage');

    function updateProgress() {
        uploadBar.style.width = progress + '%';
        uploadPercentage.textContent = progress + '%';

        if (progress === 100) {
            progressContainer.setAttribute('data-complete', 'true');
        }
    }




    // Botón de guardar
    document.getElementById("submitBtn").addEventListener("click", async (event) => {
        event.preventDefault(); // Previene que el formulario se recargue

        const submitButton = document.getElementById("submitBtn");
        const uploadContainer = document.getElementById("progressContainer");
        const uploadPercentage = document.getElementById("uploadPercentage");
        submitButton.disabled = true;
        uploadContainer.style.display = "block";
        uploadPercentage.innerHTML = "0%";

        try {
            const date = document.getElementById("date")?.value;
            const technician = document.getElementById("technician")?.value;
            const company = document.getElementById("company")?.value;
            const tdsValue = document.getElementById("tds")?.value;
            const contact = document.getElementById("contact")?.value;
            const phone = document.getElementById("cellphone")?.value;
            const imageCount = parseInt(document.getElementById("imageCount")?.value) || 0;

            if (!date || !technician || !company || !tdsValue || !contact || !phone || imageCount <= 0) {
                alert("Por favor, completa todos los campos requeridos.");
                submitButton.disabled = false;
                return;
            }

            // Gestiona tdsImageURL adecuadamente
            let tdsImageURL;
            if (tdsFileInput.files[0]) {
                const tdsFile = tdsFileInput.files[0];
                const tdsPath = `tds/${tdsFile.name}`;
                const tdsRef = storageRef(storage, tdsPath);
                const tdsUploadTask = uploadBytesResumable(tdsRef, tdsFile);

                tdsImageURL = await getDownloadURL(tdsRef);
            }

            const totalFiles = imageCount * 3; // 3 archivos por equipo
            let uploadedFiles = 0;

            const uploadPromises = [];
            const imagesData = {};

            for (let i = 1; i <= imageCount; i++) {
                const areaText = document.getElementById(`areaImage${i}`)?.value;
                const waterLocationText = document.getElementById(`waterLocationImage${i}`)?.value;
                const drainText = document.getElementById(`drainImage${i}`)?.value;

                const areaFile = document.getElementById(`areaFile${i}`)?.files?.[0];
                const waterFile = document.getElementById(`waterFile${i}`)?.files?.[0];
                const drainFile = document.getElementById(`drainFile${i}`)?.files?.[0];

                if (!areaText || !waterLocationText || !drainText) {
                    alert(`Por favor, completa los campos de texto para el equipo  ${i}.`);
                    submitButton.disabled = false;
                    return;
                }

                if (!areaFile || !waterFile || !drainFile) {
                    alert(`Por favor, sube las fotos necesarias para el equipo ${i}.`);
                    submitButton.disabled = false;
                    return;
                }

                if (!isTdsUploaded ) {
                    alert("Por favor, Sube la foto del Tds de la Red.");
                    return;
                }

                imagesData[`img${i}`] = {};
                const uniqueID = `${date.replace(/-/g, '')}_${new Date().toISOString().replace(/[-T:\.Z]/g, '')}_${i}`;

                // Área
                if (areaFile) {
                    const areaPath = `images/area/${uniqueID}.jpg`;
                    const areaRef = storageRef(storage, areaPath);
                    const areaUploadTask = uploadBytesResumable(areaRef, areaFile);

                    uploadPromises.push(
                        new Promise((resolve, reject) => {
                            areaUploadTask.on(
                                "state_changed",
                                (snapshot) => {
                                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                    uploadedFiles += progress / totalFiles;
                                    showUploadProgress(uploadedFiles);
                                },
                                (error) => reject(`Error al subir área ${i}: ${error}`),
                                async () => {
                                    const areaUrl = await getDownloadURL(areaRef);
                                    imagesData[`img${i}`][0] = { name: areaText, type: "area", url: areaUrl };
                                    resolve();
                                }
                            );
                        })
                    );
                }

                // Tomas de agua
                if (waterFile) {
                    const waterPath = `images/water/${uniqueID}.jpg`;
                    const waterRef = storageRef(storage, waterPath);
                    const waterUploadTask = uploadBytesResumable(waterRef, waterFile);

                    uploadPromises.push(
                        new Promise((resolve, reject) => {
                            waterUploadTask.on(
                                "state_changed",
                                (snapshot) => {
                                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                    uploadedFiles += progress / totalFiles;
                                    showUploadProgress(uploadedFiles);
                                },
                                (error) => reject(`Error al subir toma de agua ${i}: ${error}`),
                                async () => {
                                    const waterUrl = await getDownloadURL(waterRef);
                                    imagesData[`img${i}`][1] = { name: waterLocationText, type: "water", url: waterUrl };
                                    resolve();
                                }
                            );
                        })
                    );
                }

                // Drenaje
                if (drainFile) {
                    const drainPath = `images/drain/${uniqueID}.jpg`;
                    const drainRef = storageRef(storage, drainPath);
                    const drainUploadTask = uploadBytesResumable(drainRef, drainFile);

                    uploadPromises.push(
                        new Promise((resolve, reject) => {
                            drainUploadTask.on(
                                "state_changed",
                                (snapshot) => {
                                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                    uploadedFiles += progress / totalFiles;
                                    showUploadProgress(uploadedFiles);
                                },
                                (error) => reject(`Error al subir drenaje ${i}: ${error}`),
                                async () => {
                                    const drainUrl = await getDownloadURL(drainRef);
                                    imagesData[`img${i}`][2] = { name: drainText, type: "drain", url: drainUrl };
                                    resolve();
                                }
                            );
                        })
                    );
                }
            }

            await Promise.all(uploadPromises);

            await saveImageData({
                date,
                technician,
                company,
                tdsValue,
                contact,
                phone,
                location: userLocation,
                tds: {
                    name: tdsFileInput.files[0]?.name || "Sin nombre",
                    url: tdsImageURL,
                },
                images: imagesData,
            });

            alert("Formulario enviado exitosamente.");
            clearForm();
            window.location.reload();
        } catch (error) {
            console.error("Error al enviar formulario: ", error);
            alert("Ocurrió un error al enviar el formulario.");
        } finally {
            submitButton.disabled = false;
            uploadContainer.style.display = "none";
           
        }
    });
});

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
        document.getElementById("technician").value = '';
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

document.addEventListener("DOMContentLoaded", () => {
    loadSalesData();
});

function loadSalesData() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html"; // Redirigir al login si no está autenticado
            return;
        }

        try {
            // Obtener datos del usuario autenticado
            const userRef = ref(db, `usuarios/${user.uid}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const userData = snapshot.val();
                const userRole = userData.role;
                const userTechnician = userData.technician;

                const salesRef = ref(db, "sales_installations");
                onValue(salesRef, (snapshot) => {
                    const salesTableBody = document.querySelector("#salesTable tbody");
                    salesTableBody.innerHTML = ""; // Limpiar la tabla

                    if (snapshot.exists()) {
                        snapshot.forEach((child) => {
                            const sale = child.val();
                            const id = child.key;

                            // Mostrar registros según el rol y técnico
                            if (userRole === "Administrador" || sale.technician === userTechnician) {
                                const row = `
                                    <tr>
                                        <td>${sale.date || "N/A"}</td>
                                        <td>${sale.seller || "N/A"}</td>
                                        <td>${sale.company || "N/A"}</td>
                                        <td><button class="view-details" data-uid="${id}">Ver</button></td>
                                    </tr>
                                `;
                                salesTableBody.innerHTML += row;
                            }
                        });

                        // Agregar eventos a los botones "Ver"
                        document.querySelectorAll(".view-details").forEach((button) => {
                            button.addEventListener("click", (e) => {
                                const saleId = e.target.getAttribute("data-uid");
                                window.location.href = `details.html?id=${saleId}`;
                            });
                        });
                    } else {
                        salesTableBody.innerHTML = "<tr><td colspan='4'>No hay registros disponibles.</td></tr>";
                    }
                });
            } else {
                console.error("No se encontró información del usuario en la base de datos.");
                window.location.href = "login.html";
            }
        } catch (error) {
            console.error("Error al cargar los datos:", error);
            window.location.href = "login.html";
        }
    });
}
//Filtro de búsqueda ajustado
function filterSales() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html"; // Redirigir al login si no está autenticado
            return;
        }

        const userRef = ref(db, `usuarios/${user.id}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const userData = snapshot.val();
            const userRole = userData.role;
            const userTechnician = userData.technician;

            const dateFilter = document.getElementById("searchDate")?.value || "";
            const technicianFilter = normalizeString(document.getElementById("searchTechnician")?.value || "");
            const companyFilter = normalizeString(document.getElementById("searchCompany")?.value || "");

            const queryRef = ref(db, "sales_installations");
            onValue(queryRef, (snapshot) => {
                const tableBody = document.querySelector("#salesTable tbody");
                tableBody.innerHTML = ""; // Limpiar tabla

                if (snapshot.exists()) {
                    let rows = "";
                    snapshot.forEach((child) => {
                        const sale = child.val();
                        const id = child.key;

                        // Aplicar filtros y validar técnico/administrador
                        const matchesDate = dateFilter ? sale.date === dateFilter : true;
                        const matchesTechnician = technicianFilter ? normalizeString(sale.technician || "").includes(technicianFilter) : true;
                        const matchesCompany = companyFilter ? normalizeString(sale.company || "").includes(companyFilter) : true;
                        const matchesRole = userRole === "Administrador" || sale.technician === userTechnician;

                        if (matchesDate && matchesTechnician && matchesCompany && matchesRole) {
                            rows += `
                                <tr>
                                    <td>${sale.date || "N/A"}</td>
                                    <td>${sale.technician || "N/A"}</td>
                                    <td>${sale.company || "N/A"}</td>
                                    <td><button data-uid="${id}">Ver</button></td>
                                </tr>
                            `;
                        }
                    });

                    tableBody.innerHTML = rows || "<tr><td colspan='4'>No se encontraron registros con los filtros aplicados.</td></tr>";
                } else {
                    tableBody.innerHTML = "<tr><td colspan='4'>No hay registros disponibles.</td></tr>";
                }
            });
        } else {
            console.error("No se encontró información del usuario.");
            window.location.href = "login.html";
        }
    });
} 


// Normalizar cadenas para hacer comparaciones insensibles a mayúsculas/minúsculas
function normalizeString(str) {
    return str.trim().toLowerCase();
}

// Exportar funciones
export { loadSalesData, filterSales };
