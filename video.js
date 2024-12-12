// Variables para grabación de video
let installationRecorder;
let tdsRecorder;
let installationStream;
let tdsStream;
let installationVideoURL;
let tdsVideoURL;

// Función para iniciar la grabación de video
async function startRecording(type) {
    try {
        // Solicitar acceso a la cámara
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Mostrar vista previa del video
        const videoPreview = document.getElementById(type + "VideoPreview");
        videoPreview.srcObject = stream;

        // Configurar la grabación para cada tipo de video (instalación o TDS)
        if (type === "installation") {
            installationStream = stream;
            installationRecorder = new MediaRecorder(stream);
            installationRecorder.ondataavailable = event => {
                const videoBlob = event.data;
                const videoUrl = URL.createObjectURL(videoBlob);
                document.getElementById("installationVideo").value = videoUrl; // Guardamos la URL del video
            };
        } else {
            tdsStream = stream;
            tdsRecorder = new MediaRecorder(stream);
            tdsRecorder.ondataavailable = event => {
                const videoBlob = event.data;
                const videoUrl = URL.createObjectURL(videoBlob);
                document.getElementById("tdsVideo").value = videoUrl; // Guardamos la URL del video
            };
        }
    } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        alert("No se pudo acceder a la cámara.");
    }
}

// Función para detener la grabación de video
function stopRecording(type) {
    if (type === "installation") {
        installationRecorder.stop();
        installationStream.getTracks().forEach(track => track.stop());
    } else {
        tdsRecorder.stop();
        tdsStream.getTracks().forEach(track => track.stop());
    }
}

// Asignación de eventos a los botones de grabación
document.getElementById("startInstallationRecording").addEventListener("click", () => startRecording("installation"));
document.getElementById("stopInstallationRecording").addEventListener("click", () => stopRecording("installation"));
document.getElementById("startTdsRecording").addEventListener("click", () => startRecording("tds"));
document.getElementById("stopTdsRecording").addEventListener("click", () => stopRecording("tds"));

// Función para enviar el formulario y almacenar los videos en Firebase
document.getElementById("submitBtn").addEventListener("click", async () => {
    const submitButton = document.getElementById("submitBtn");
    submitButton.disabled = true; // Deshabilitar el botón de guardar mientras se procesa

    try {
        const date = document.getElementById("date").value;
        const technician = document.getElementById("technician").value;
        const company = document.getElementById("company").value;
        const installationVideoFile = document.getElementById("installationVideo").value;
        const tdsVideoFile = document.getElementById("tdsVideo").value;

        // Validar campos
        if (!date || !technician || !company || !installationVideoFile || !tdsVideoFile) {
            alert("Por favor, completa todos los campos.");
            submitButton.disabled = false; // Volver a habilitar el botón si hay un error
            return;
        }

        // Aquí debes subir los videos a Firebase o donde los estés almacenando
        // Lógica para subir videos y guardar la información en la base de datos

        // Mostrar mensaje de éxito
        alert("Formulario enviado exitosamente");
    } catch (error) {
        console.error("Error al enviar el formulario:", error);
        alert("Hubo un error al enviar el formulario.");
        submitButton.disabled = false; // Habilitar el botón en caso de error
    }
});
