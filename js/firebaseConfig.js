// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-storage.js";

// Configuración de Firebase
export const firebaseConfig = {
    apiKey: "AIzaSyASB9v9O2Yrq78UycG2xsyYJVVA8J80hok",
    authDomain: "preguntas-frecuentes-purifika.firebaseapp.com",
    databaseURL: "https://preguntas-frecuentes-purifika-default-rtdb.firebaseio.com",
    projectId: "preguntas-frecuentes-purifika",
    storageBucket: "preguntas-frecuentes-purifika.appspot.com",
    messagingSenderId: "748673560391",
    appId: "1:748673560391:web:f5f2211615a95b2ba0e662",
    measurementId: "G-E2BXKQE67W"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();
const storage = getStorage(app);

// Exportar las instancias de Firebase para usarlas en otros archivos
export { db, auth, storage };
