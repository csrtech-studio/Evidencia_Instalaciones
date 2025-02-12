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

document.addEventListener("DOMContentLoaded", function () {
    // Variable global para llevar la cuenta de equipos
    let equipmentCount = 0;
  
    const imagesContainer = document.getElementById("imagesContainer");
    const addEquipmentButton = document.getElementById("addEquipment");
  
    // Función para agregar equipo
    function addEquipment() {
      equipmentCount++;
  
      const imageWrapper = document.createElement("div");
      imageWrapper.classList.add("image-wrapper");
      imageWrapper.setAttribute("id", `equipment-${equipmentCount}`);
  
      // --- Campo de Área ---
      const labelArea = document.createElement("label");
      labelArea.setAttribute("for", `areaImage${equipmentCount}`);
      labelArea.textContent = `Área ${equipmentCount}:`;
  
      const inputArea = document.createElement("input");
      inputArea.type = "text";
      inputArea.id = `areaImage${equipmentCount}`;
      inputArea.name = `areaImage${equipmentCount}`;
      inputArea.placeholder = `Ingrese área ${equipmentCount}`;
      inputArea.required = true;
  
      const labelAreaFile = document.createElement("label");
      labelAreaFile.textContent = "Tomar Foto (Área)";
      labelAreaFile.classList.add("custom-file-button");
      labelAreaFile.setAttribute("for", `areaFile${equipmentCount}`);
  
      const inputAreaFile = document.createElement("input");
      inputAreaFile.type = "file";
      inputAreaFile.accept = "image/*";
      inputAreaFile.capture = "environment";
      inputAreaFile.id = `areaFile${equipmentCount}`;
      inputAreaFile.name = `areaFile${equipmentCount}`;
      inputAreaFile.style.display = "none";
  
      const areaFileName = document.createElement("span");
      areaFileName.id = `areaFileName${equipmentCount}`;
      areaFileName.classList.add("file-name");
      areaFileName.textContent = "No se ha cargado ninguna foto.";
  
      inputAreaFile.addEventListener("change", function () {
        areaFileName.textContent = `Foto cargada: Área ${equipmentCount}`;
      });
  
      // --- Campo de Tomas de Agua ---
      const labelWaterLocation = document.createElement("label");
      labelWaterLocation.setAttribute("for", `waterLocationImage${equipmentCount}`);
      labelWaterLocation.textContent = "Tomas de agua:";
  
      const inputWaterLocation = document.createElement("input");
      inputWaterLocation.type = "text";
      inputWaterLocation.id = `waterLocationImage${equipmentCount}`;
      inputWaterLocation.name = `waterLocationImage${equipmentCount}`;
      inputWaterLocation.placeholder = `Ingrese ubicación para la toma de agua ${equipmentCount}`;
      inputWaterLocation.required = true;
  
      const labelWaterFile = document.createElement("label");
      labelWaterFile.textContent = "Tomar Foto (Tomas de agua)";
      labelWaterFile.classList.add("custom-file-button");
      labelWaterFile.setAttribute("for", `waterFile${equipmentCount}`);
  
      const inputWaterFile = document.createElement("input");
      inputWaterFile.type = "file";
      inputWaterFile.accept = "image/*";
      inputWaterFile.capture = "environment";
      inputWaterFile.id = `waterFile${equipmentCount}`;
      inputWaterFile.name = `waterFile${equipmentCount}`;
      inputWaterFile.style.display = "none";
  
      const waterFileName = document.createElement("span");
      waterFileName.id = `waterFileName${equipmentCount}`;
      waterFileName.classList.add("file-name");
      waterFileName.textContent = "No se ha cargado ninguna foto.";
  
      inputWaterFile.addEventListener("change", function () {
        waterFileName.textContent = `Foto cargada: Tomas de Agua ${equipmentCount}`;
      });
  
      // --- Campo de Drenaje ---
      const labelDrainage = document.createElement("label");
      labelDrainage.setAttribute("for", `drainImage${equipmentCount}`);
      labelDrainage.textContent = "Drenaje:";
  
      const inputDrainage = document.createElement("input");
      inputDrainage.type = "text";
      inputDrainage.id = `drainImage${equipmentCount}`;
      inputDrainage.name = `drainImage${equipmentCount}`;
      inputDrainage.placeholder = `Ingrese drenaje ${equipmentCount}`;
      inputDrainage.required = true;
  
      const labelDrainFile = document.createElement("label");
      labelDrainFile.textContent = "Tomar Foto (Drenaje)";
      labelDrainFile.classList.add("custom-file-button");
      labelDrainFile.setAttribute("for", `drainFile${equipmentCount}`);
  
      const inputDrainFile = document.createElement("input");
      inputDrainFile.type = "file";
      inputDrainFile.accept = "image/*";
      inputDrainFile.capture = "environment";
      inputDrainFile.id = `drainFile${equipmentCount}`;
      inputDrainFile.name = `drainFile${equipmentCount}`;
      inputDrainFile.style.display = "none";
  
      const drainFileName = document.createElement("span");
      drainFileName.id = `drainFileName${equipmentCount}`;
      drainFileName.classList.add("file-name");
      drainFileName.textContent = "No se ha cargado ninguna foto.";
  
      inputDrainFile.addEventListener("change", function () {
        drainFileName.textContent = `Foto cargada: Drenaje ${equipmentCount}`;
      });
  
      // --- Agregar elementos al wrapper ---
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
  
      // Botón de eliminar (si hay más de un equipo)
      if (equipmentCount > 1) {
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "❌ Eliminar";
        deleteButton.classList.add("delete-equipment");
        deleteButton.style.backgroundColor = "red";
        deleteButton.style.color = "white";
        deleteButton.style.border = "none";
        deleteButton.style.padding = "8px";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.marginTop = "10px";
        deleteButton.style.display = "block";
        deleteButton.style.width = "100%";
  
        deleteButton.addEventListener("click", function () {
          if (confirm("¿Seguro que quieres eliminar este equipo?")) {
            imagesContainer.removeChild(imageWrapper);
            // Nota: al eliminar, el equipmentCount se decrementa, pero la numeración de los IDs
            // puede quedar desfasada; se recomienda tener en cuenta este detalle según tu lógica.
            equipmentCount--;
          }
        });
  
        imageWrapper.appendChild(deleteButton);
      }
  
      // Agregar el bloque al contenedor
      imagesContainer.appendChild(imageWrapper);
    }
  
    // Agregar el primer equipo por defecto
    addEquipment();
  
    // Agregar nuevo equipo al hacer clic en el botón
    addEquipmentButton.addEventListener("click", addEquipment);
  
    // --- FOTO DEL TDS ---
    const openCameraBtn = document.getElementById("openCameraBtn");
    const tdsFileInput = document.getElementById("tdsFile");
    const tdsFileName = document.getElementById("tdsFileName");
    let tdsFile = null;
  
    openCameraBtn.addEventListener("click", function () {
      tdsFileInput.click();
    });
  
    tdsFileInput.addEventListener("change", function () {
      if (tdsFileInput.files.length > 0) {
        tdsFile = tdsFileInput.files[0];
        tdsFileName.textContent = `Foto seleccionada: ${tdsFile.name}`;
      } else {
        tdsFile = null;
        tdsFileName.textContent = "No se ha seleccionado ninguna foto";
      }
    });
  
    // --- ENVÍO DEL FORMULARIO ---
    document.getElementById("submitBtn").addEventListener("click", async (event) => {
      event.preventDefault();
      const submitButton = document.getElementById("submitBtn");
      const uploadContainer = document.getElementById("progressContainer");
      const uploadPercentage = document.getElementById("uploadPercentage");
      submitButton.disabled = true;
      uploadContainer.style.display = "block";
      uploadPercentage.innerHTML = "0%";
  
      try {
        const missingFields = [];
        const date = document.getElementById("date")?.value;
        const technician = document.getElementById("technician")?.value;
        const company = document.getElementById("company")?.value;
        const tdsValue = document.getElementById("tds")?.value;
        const contact = document.getElementById("contact")?.value;
        const phone = document.getElementById("cellphone")?.value;
  
        // Validación de campos obligatorios
        if (!date) missingFields.push("Fecha");
        if (!technician) missingFields.push("Técnico");
        if (!company) missingFields.push("Empresa");
        if (!tdsValue) missingFields.push("Valor TDS");
        if (!contact) missingFields.push("Contacto");
        if (!phone) missingFields.push("Teléfono");
        if (!tdsFile) missingFields.push("Foto del TDS de la Red");
  
        if (missingFields.length > 0) {
          alert(`Faltan los siguientes campos:\n- ${missingFields.join("\n- ")}`);
          submitButton.disabled = false;
          return;
        }
  
        // Subir imagen TDS
        let tdsImageURL = "";
        if (tdsFile) {
          const currentDate = new Date().toISOString().split("T")[0];
          const tdsPath = `tds/Tds-${currentDate}.jpg`;
          const tdsRef = storageRef(storage, tdsPath);
          await uploadBytesResumable(tdsRef, tdsFile);
          tdsImageURL = await getDownloadURL(tdsRef);
        }
  
        // Construir la estructura de imágenes deseada:
        // Dentro de "images" se crearán img1, img2, etc.
        // Cada imgX tendrá:
        //   0: { name: (nombre del área), type: "area", url: ... }
        //   1: { name: (nombre de la toma de agua), type: "water", url: ... }
        //   2: { name: (nombre del drenaje), type: "drain", url: ... }
        const imagesFirebase = {};
  
        for (let i = 1; i <= equipmentCount; i++) {
          // Recoger los textos de cada input
          const areaName = document.getElementById(`areaImage${i}`)?.value || "";
          const waterName = document.getElementById(`waterLocationImage${i}`)?.value || "";
          const drainName = document.getElementById(`drainImage${i}`)?.value || "";
  
          // Recoger los archivos (si se seleccionaron)
          const areaFile = document.getElementById(`areaFile${i}`)?.files[0];
          const waterFile = document.getElementById(`waterFile${i}`)?.files[0];
          const drainFile = document.getElementById(`drainFile${i}`)?.files[0];
  
          const imageObj = {};
          const uploadPromises = [];
  
          if (areaFile) {
            uploadPromises.push(
              uploadFile(areaFile, `area-${i}`).then((url) => {
                imageObj["0"] = {
                  name: areaName,
                  type: "area",
                  url: url,
                };
              })
            );
          }
          if (waterFile) {
            uploadPromises.push(
              uploadFile(waterFile, `water-${i}`).then((url) => {
                imageObj["1"] = {
                  name: waterName,
                  type: "water",
                  url: url,
                };
              })
            );
          }
          if (drainFile) {
            uploadPromises.push(
              uploadFile(drainFile, `drain-${i}`).then((url) => {
                imageObj["2"] = {
                  name: drainName,
                  type: "drain",
                  url: url,
                };
              })
            );
          }
  
          await Promise.all(uploadPromises);
          imagesFirebase[`img${i}`] = imageObj;
        }
  
        // Guardar los datos en Firebase (se asume que saveImageData es tu función de guardado)
        await saveImageData({
          date,
          technician,
          company,
          tdsValue,
          contact,
          phone,
          tds: { name: tdsFile.name, url: tdsImageURL },
          images: imagesFirebase,
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
  
  // Función para subir archivo (se asume que storage, uploadBytesResumable, getDownloadURL y storageRef están definidos)
  async function uploadFile(file, path) {
    const fileRef = storageRef(storage, `images/${path}.jpg`);
    await uploadBytesResumable(fileRef, file);
    return getDownloadURL(fileRef);
  }
  

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
                                        <td>${sale.technician || "N/A"}</td>
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
            }
        } catch (error) {
            console.error("Error al cargar los datos:", error);
        }
    });
}
//Filtro de búsqueda ajustado
function filterSales() {
    onAuthStateChanged(auth, async (user) => {
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
        }
    });
}


// Normalizar cadenas para hacer comparaciones insensibles a mayúsculas/minúsculas
function normalizeString(str) {
    return str.trim().toLowerCase();
}

// Exportar funciones
export { loadSalesData, filterSales };
