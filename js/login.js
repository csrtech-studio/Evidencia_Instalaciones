import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

// Inicializa Firebase Auth y Realtime Database
const auth = getAuth();
const db = getDatabase();

// Objeto para manejar las redirecciones según el rol
const roleRedirects = {
    "Instalador": "index.html",
    "Tecnico": "Tecnicos.html",
    "Vendedor": "vendedores.html",
    "Administrador": "admin.html"
};

document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMessage = document.getElementById("errorMessage");

    // Limpiar mensajes de error previos
    errorMessage.textContent = "";

    // Validar campos vacíos
    if (!email || !password) {
        showError("Por favor, ingrese su correo electrónico y contraseña.");
        return;
    }

    // Validar formato de correo electrónico
    if (!validateEmail(email)) {
        showError("Por favor, ingrese un correo electrónico válido.");
        return;
    }

    try {
        // Iniciar sesión con Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Obtener datos del usuario desde Realtime Database
        const userRef = ref(db, `usuarios/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const userData = snapshot.val();
            const role = userData.role;

            // Guardar usuario y rol en localStorage
            localStorage.setItem("loggedUser", JSON.stringify({
                uid: user.uid,
                email: user.email,
                role: role,
                technician: userData.technician
            }));

            // Redirigir según el rol
            if (roleRedirects[role]) {
                window.location.href = roleRedirects[role];
            } else {
                showError("Rol desconocido. Por favor, contacte al administrador.");
            }
        } else {
            showError("No se encontró información del usuario en la base de datos. Por favor, contacte al administrador.");
        }
    } catch (error) {
        handleError(error);
    }
});

// Validar formato de correo electrónico
function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailPattern.test(email);
}

// Mostrar mensaje de error en pantalla y como alerta
function showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = message;
    alert(message);
}

// Manejar errores de autenticación
function handleError(error) {
    console.error(error.code, error.message);

    let message;
    switch (error.code) {
        case "auth/invalid-email":
            message = "El formato del correo electrónico no es válido. Por favor, verifíquelo.";
            break;
        case "auth/user-not-found":
            message = "Usuario no registrado. Por favor, verifique sus datos o regístrese.";
            break;
        case "auth/wrong-password":
            message = "Contraseña incorrecta. Por favor, inténtelo de nuevo.";
            break;
        case "auth/too-many-requests":
            message = "Demasiados intentos fallidos. Por favor, intente nuevamente más tarde.";
            break;
        default:
            message = "Ocurrió un error inesperado. Por favor, intente nuevamente.";
    }
    
    showError(message);
}
