// ===========================
// APLICACIÓN PRINCIPAL
// ===========================

class App {
  constructor() {
    this.init();
  }

  init() {
    // Verificar si usuario está autenticado
    if (authManager.isAuthenticated()) {
      ui.renderProductosPage();
    } else {
      // Mostrar landing page si no hay hash, sino mostrar login
      const hash = window.location.hash;
      if (hash === '#login' || hash === '#register') {
        ui.renderAuthPage();
      } else {
        ui.renderLandingPage();
      }
    }

    // Verificar estado de conexión
    if (!navigator.onLine) {
      offlineManager.handleOffline();
    }

    // Escuchar cambios en conexión
    window.addEventListener('online', () => offlineManager.handleOnline());
    window.addEventListener('offline', () => offlineManager.handleOffline());

    // Escuchar cambios en el hash para navegación simple (SPA)
    window.addEventListener('hashchange', () => this.handleNavigation());
  }

  handleNavigation() {
    const hash = window.location.hash;

    if (hash === '#logout') {
      authManager.logout();
      ui.renderLandingPage();
      window.location.hash = '';
    } else if (hash === '#login' || hash === '#register') {
      ui.renderAuthPage();
    } else if (hash === '#productos' && authManager.isAuthenticated()) {
      ui.renderProductosPage();
    } else if (!authManager.isAuthenticated() && !hash) {
      ui.renderLandingPage();
    }
  }
}

// Inicializar app cuando DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
  });
} else {
  window.app = new App();
}
