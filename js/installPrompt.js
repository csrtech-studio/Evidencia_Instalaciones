let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Evita que el navegador muestre el banner por defecto
  e.preventDefault();

  // Guarda el evento para usarlo más tarde
  deferredPrompt = e;

  // Muestra el mensaje de instalación
  const installMessage = document.getElementById('install-message');
  installMessage.style.display = 'block';

  // Evento del mensaje de instalación
  installMessage.addEventListener('click', () => {
    installMessage.style.display = 'none';

    // Muestra el prompt de instalación
    deferredPrompt.prompt();

    // Maneja el resultado del prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('El usuario aceptó la instalación');
      } else {
        console.log('El usuario rechazó la instalación');
      }
      deferredPrompt = null;
    });
  });
});
