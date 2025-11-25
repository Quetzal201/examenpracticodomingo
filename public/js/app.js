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
      ui.renderAuthPage();
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
      ui.renderAuthPage();
      window.location.hash = '';
    } else if (hash === '#productos' && authManager.isAuthenticated()) {
      ui.renderProductosPage();
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
