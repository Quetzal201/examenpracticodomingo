// ===========================
// API CLIENT
// ===========================

class APIClient {
  constructor() {
    this.baseURL = '/api';
  }

  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
        ...options,
      });

      // Leer como texto primero para evitar problemas con BigInt
      const text = await response.text();
      
      // Parsear JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: 'Error parsing response' };
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error en la solicitud');
      }

      return data;
    } catch (error) {
      // Si no hay conexión, guardar tarea pendiente para POST/PUT/DELETE
      if (!navigator.onLine && options.method && options.method !== 'GET') {
        const action = this.getActionFromMethod(options.method);
        
        // Extraer datos del body
        let requestData = {};
        if (options.body) {
          try {
            requestData = JSON.parse(options.body);
          } catch (e) {
            requestData = {};
          }
        }

        // Agregar ID temporal para creación offline
        if (action === 'CREATE') {
          requestData.tempId = 'temp_' + Date.now();
        }

        offlineManager.addPendingTask(action, {
          endpoint,
          method: options.method,
          data: requestData,
        });

        // Retornar respuesta simulada para que la UI funcione localmente
        return {
          success: true,
          data: {
            id: requestData.tempId || 'temp_' + Date.now(),
            ...requestData,
          },
          offline: true,
        };
      }
      throw error;
    }
  }

  getActionFromMethod(method) {
    const actions = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      DELETE: 'DELETE',
      GET: 'READ',
    };
    return actions[method] || 'UNKNOWN';
  }

  // Auth
  async register(usuario, correo, contraseña) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ usuario, correo, contraseña }),
    });
  }

  async login(correo, contraseña) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ correo, contraseña }),
    });
  }

  // Productos
  async getProductos() {
    // Si está offline, devolver productos guardados localmente
    if (!navigator.onLine) {
      const stored = localStorage.getItem('serverProductos');
      const localProductos = stored ? JSON.parse(stored) : [];
      return { success: true, data: localProductos };
    }

    // Si está online, obtener del servidor y guardar en cache
    const response = await this.request('/productos', {
      method: 'GET',
    });

    // Guardar en localStorage para acceso offline
    if (response.data) {
      localStorage.setItem('serverProductos', JSON.stringify(response.data));
    }

    return response;
  }

  async createProducto(data) {
    if (!navigator.onLine) {
      // Guardar en cola de pendientes sin hacer la petición
      offlineManager.addPendingTask('CREATE', {
        endpoint: '/productos',
        method: 'POST',
        data: data,
      });

      // Retornar respuesta simulada para UI
      const tempId = 'temp_' + Date.now();
      return { success: true, data: { id: tempId, ...data, offline: true } };
    }

    return this.request('/productos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProducto(id, data) {
    if (!navigator.onLine) {
      // Guardar en cola de pendientes sin hacer la petición
      offlineManager.addPendingTask('UPDATE', {
        endpoint: `/productos/${id}`,
        method: 'PUT',
        data: data,
      });

      return { success: true, data: { id, ...data, offline: true } };
    }

    return this.request(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProducto(id) {
    if (!navigator.onLine) {
      // Guardar en cola de pendientes sin hacer la petición
      offlineManager.addPendingTask('DELETE', {
        endpoint: `/productos/${id}`,
        method: 'DELETE',
      });

      return { success: true, message: 'Producto marcado para eliminación' };
    }

    return this.request(`/productos/${id}`, {
      method: 'DELETE',
    });
  }
}

const api = new APIClient();
window.api = api;
