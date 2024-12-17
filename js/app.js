document.addEventListener("DOMContentLoaded", () => {
    console.log("Aplicación cargada correctamente.");
  
    // Prueba de conexión a Firebase
    const db = firebase.database();
  
    db.ref("test").set({
      mensaje: "Conexión exitosa a Firebase"
    }).then(() => {
      console.log("Mensaje guardado en Firebase");
    }).catch((error) => {
      console.error("Error al conectar con Firebase:", error);
    });
  });
  