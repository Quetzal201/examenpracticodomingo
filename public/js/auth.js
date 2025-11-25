// ===========================
// MANEJO DE AUTENTICACIÓN
// ===========================

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.loadFromLocalStorage();
  }

  loadFromLocalStorage() {
    const userStr = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');

    if (userStr && token) {
      this.currentUser = JSON.parse(userStr);
      window.currentUser = this.currentUser;
    }
  }

  async register(usuario, correo, contraseña) {
    try {
      const response = await api.register(usuario, correo, contraseña);

      if (response.success) {
        this.setUser(response.user, response.token);
        showToast('Registro exitoso', 'success');
        return true;
      }
    } catch (error) {
      showToast(`${error.message}`, 'error');
      return false;
    }
  }

  async login(correo, contraseña) {
    try {
      const response = await api.login(correo, contraseña);

      if (response.success) {
        this.setUser(response.user, response.token);
        showToast('Inicio de sesión exitoso', 'success');
        return true;
      }
    } catch (error) {
      showToast(`${error.message}`, 'error');
      return false;
    }
  }

  setUser(user, token) {
    this.currentUser = user;
    window.currentUser = user;

    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
  }

  logout() {
    this.currentUser = null;
    window.currentUser = null;

    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');

    showToast('Sesión cerrada', 'success');
  }

  isAuthenticated() {
    return !!this.currentUser && !!localStorage.getItem('authToken');
  }

  getUser() {
    return this.currentUser;
  }
}

const authManager = new AuthManager();
window.authManager = authManager;
window.currentUser = authManager.currentUser;
