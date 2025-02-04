import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js';
import { getDatabase, ref, set } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js';
import { firebaseConfig } from './firebaseConfig.js';
import { checkAuthStateAndRole } from './auth.js';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase(app);

// Verificar autenticación y rol antes de mostrar la página
checkAuthStateAndRole("Administrador");

// Evento para agregar usuario
document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const technician = document.getElementById('technician').value.trim();
    const email = document.getElementById('email').value.trim();
    const role = document.getElementById('role').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!technician || !email || !role || !password || !confirmPassword) {
        alert('Todos los campos son obligatorios.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    try {
        // Crear usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guardar datos del usuario en la base de datos
        await set(ref(db, `usuarios/${user.uid}`), {
            uid: user.uid,
            technician,
            email,
            role
        });

        alert('Usuario agregado correctamente.');
        document.getElementById('addUserForm').reset();
    } catch (error) {
        alert('Error al agregar el usuario: ' + error.message);
    }
});
