import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

// Inicializa Firebase Auth y Realtime Database
const auth = getAuth();
const db = getDatabase();

// Objeto para manejar las redirecciones según el rol
const roleRedirects = {
    "Instalador": "index.html",
    "Tecnico": "tecnicos.html",
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
        errorMessage.textContent = "Por favor, ingrese su correo electrónico y contraseña.";
        return;
    }

    // Validar formato de correo electrónico
    if (!validateEmail(email)) {
        errorMessage.textContent = "Por favor, ingrese un correo electrónico válido.";
        return;
    }

    try {
        // Iniciar sesión
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Obtener datos del usuario desde Realtime Database
        const userRef = ref(db, `usuarios/${user.uid}`); // Ruta en tu base de datos
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
                errorMessage.textContent = "Rol desconocido. Por favor, contacte al administrador.";
            }
        } else {
            errorMessage.textContent = "No se encontró información del usuario en la base de datos. Por favor, contacte al administrador.";
        }
    } catch (error) {
        // Mostrar errores específicos
        handleError(error, errorMessage);
    }
});

// Validar formato de correo electrónico
function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailPattern.test(email);
}

// Manejar errores de autenticación
function handleError(error, errorMessage) {
    switch (error.code) {
        case "auth/invalid-email":
            errorMessage.textContent = "El formato del correo electrónico no es válido. Por favor, verifíquelo.";
            break;
        case "auth/user-not-found":
            errorMessage.textContent = "Usuario no registrado. Por favor, verifique sus datos o regístrese.";
            break;
        case "auth/wrong-password":
            errorMessage.textContent = "Contraseña incorrecta. Por favor, inténtelo de nuevo.";
            break;
        case "auth/too-many-requests":
            errorMessage.textContent = "Demasiados intentos fallidos. Por favor, intente nuevamente más tarde.";
            break;
        default:
            errorMessage.textContent = "Ocurrió un error inesperado. Por favor, intente nuevamente.";
    }
}
