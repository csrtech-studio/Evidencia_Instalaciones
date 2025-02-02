// Asegúrate de importar todo lo necesario desde Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js';
import { getDatabase, ref, set } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js';
import { firebaseConfig } from './firebaseConfig.js';
import { checkAuthStateAndRole } from './auth.js';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase(app);

// Verificar el estado de autenticación al cargar la página
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Si el usuario está autenticado, muestra su nombre en el formulario
        const technicianName = user.displayName;
        if (technicianName) {
            document.getElementById('technician').value = technicianName;
        }
        // Verificar rol solo si el usuario está autenticado
        checkAuthStateAndRole();
    } else {
        // Si no está autenticado, redirige al login
        window.location.href = 'login.html';
    }
});

// Función para agregar el usuario
document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener los valores del formulario
    const technician = document.getElementById('technician').value;
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validar que las contraseñas coinciden
    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    try {
        // Crear usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guardar datos del usuario en la base de datos de Firebase, incluyendo el uid
        const userRef = ref(db, 'usuarios/' + user.uid);
        set(userRef, {
            uid: user.uid, // Guardar el uid del usuario
            technician: technician,
            email: email,
            role: role // Asignar el rol
        });

        // Mostrar mensaje de éxito
        alert('Usuario agregado correctamente');

        // Limpiar el formulario
        document.getElementById('addUserForm').reset();
    } catch (error) {
        alert('Error al agregar el usuario: ' + error.message);
    }
});
