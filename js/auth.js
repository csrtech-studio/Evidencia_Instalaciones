import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

// Mostrar u ocultar el botón de cerrar sesión según el estado de autenticación
export function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        const logoutButton = document.getElementById("logoutButton");

        if (user) {
            logoutButton.style.display = "block"; // Mostrar el botón de cerrar sesión
            logoutButton.addEventListener("click", logout);
        } else {
            window.location.href = "login.html"; // Redirigir al login si no está autenticado
        }
    });
}

// Función para manejar el cierre de sesión
export function logout() {
    signOut(auth)
        .then(() => {
            window.location.href = "login.html"; // Redirigir al login después de cerrar sesión
        })
        .catch((error) => {
            console.error("Error al cerrar sesión:", error);
        });
}

// Verificar autenticación y acceso según el rol del usuario
export function checkAuthStateAndRole(requiredRole) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.log("Usuario no autenticado. Redirigiendo al login.");
            window.location.href = "login.html"; // Redirigir al login si no está autenticado
            return;
        }

        console.log("Usuario autenticado:", user);

        try {
            const userRef = ref(db, `usuarios/${user.uid}`);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                alert("Tu cuenta no tiene datos registrados. Contacta al administrador.");
                window.location.href = "login.html";
                return;
            }

            const userData = snapshot.val();
            const userRole = userData.role;

            console.log("Datos del usuario en Firebase:", userData);
            console.log("Rol del usuario:", userRole);
            console.log("Rol requerido para esta página:", requiredRole);

            if (userRole !== requiredRole && userRole !== "Administrador") {
                showAccessDenied(userRole); // Mostrar mensaje de acceso denegado
                return;
            }
        } catch (error) {
            console.error("Error al obtener los datos del usuario:", error);
            window.location.href = "login.html";
        }
    });
}


// Mostrar mensaje de acceso denegado y botón para regresar
function showAccessDenied(role) {
    const rolePages = {
        "Instalador": "index.html",
        "Tecnico": "tecnicos.html",
        "Vendedor": "vendedores.html"
    };

    document.body.innerHTML = `
        <div style="text-align: center; margin-top: 20%;">
            <h1>No tienes permiso para acceder a esta página</h1>
            <button id="goBack" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Regresar</button>
        </div>
    `;

    document.getElementById("goBack").addEventListener("click", () => {
        window.location.href = rolePages[role] || "index.html";
    });
}
