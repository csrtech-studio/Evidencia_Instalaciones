let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt activado'); // Para verificar que el evento se dispara
  e.preventDefault(); // Evita el banner automático del navegador
  deferredPrompt = e;

  // Muestra un mensaje personalizado
  const installMessage = document.createElement('div');
  installMessage.innerHTML = `
    <div id="install-message" style="
      position: fixed; 
      bottom: 20px; 
      left: 50%; 
      transform: translateX(-50%); 
      background-color: #004080; 
      color: white; 
      padding: 10px 20px; 
      border-radius: 5px; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
      z-index: 1000;">
      📲 Instala la aplicación para una mejor experiencia. Toca aquí.
    </div>
  `;
  document.body.appendChild(installMessage);

  // Evento de clic para mostrar el prompt de instalación
  installMessage.addEventListener('click', () => {
    installMessage.style.display = 'none'; // Oculta el mensaje
    deferredPrompt.prompt(); // Muestra el prompt de instalación

    // Maneja la respuesta del usuario
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('El usuario aceptó la instalación');
      } else {
        console.log('El usuario rechazó la instalación');
      }
      deferredPrompt = null; // Limpia la referencia
    });
  });
});
