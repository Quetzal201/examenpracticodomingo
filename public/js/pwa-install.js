// Manejo del evento beforeinstallprompt para PWA y mostrar toast de instalación
(function () {
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Previene que el navegador muestre el diálogo por defecto
    e.preventDefault();
    deferredPrompt = e;

    // Mostrar toast para que el usuario instale
    if (window.showActionToast) {
      window.showActionToast('Instalar aplicación', 'Instalar', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          window.showToast('Gracias — la app se ha instalado', 'success', 4000);
        } else {
          window.showToast('Instalación cancelada', 'warning', 3000);
        }
        deferredPrompt = null;
      }, 0);
    }
  });

  // Si ya tenemos soporte para instalación programática, podemos mostrar la sugerencia
  // en ciertos flujos, por ejemplo cuando el usuario visita la app frecuentemente.

  // También escuchar appinstalled para limpiar estado
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    try {
      // Marcar para mostrar splash en el próximo lanzamiento de la app instalada
      localStorage.setItem('showSplashOnInstall', '1');
    } catch (e) {}
    window.showToast('Aplicación instalada', 'success', 3000);
  });
})();
