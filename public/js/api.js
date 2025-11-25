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
      const stored = localStorage.getItem('localProductos');
      const localProductos = stored ? JSON.parse(stored) : [];
      return { success: true, data: localProductos };
    }

    const res = await this.request('/productos', {
      method: 'GET',
    });

    // Guardar en cache local para uso offline
    try {
      if (res && res.data) {
        localStorage.setItem('localProductos', JSON.stringify(res.data));
      }
    } catch (e) {
      console.warn('No se pudo guardar cache local de productos', e);
    }

    return res;
  }

  async createProducto(data) {
    // Generar ID temporal para offline
    if (!navigator.onLine) {
      const tempId = 'temp_' + Date.now();
      const producto = { ...data, id: tempId, offline: true };

      // Guardar localmente
      const stored = localStorage.getItem('localProductos') || '[]';
      const productos = JSON.parse(stored);
      productos.push(producto);
      localStorage.setItem('localProductos', JSON.stringify(productos));

      // Agregar tarea pendiente para sincronizar cuando vuelva la red
      offlineManager.addPendingTask('CREATE', {
        endpoint: '/productos',
        method: 'POST',
        data: { ...data, tempId },
      });

      return { success: true, data: { id: tempId, ...data, offline: true } };
    }

    return this.request('/productos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProducto(id, data) {
    // Si es ID temporal o está offline, actualizar localmente
    if (!navigator.onLine || (typeof id === 'string' && id.startsWith('temp_'))) {
      const stored = localStorage.getItem('localProductos') || '[]';
      const productos = JSON.parse(stored);
      const index = productos.findIndex(p => p.id == id);

      if (index !== -1) {
        productos[index] = { ...productos[index], ...data, id };
        localStorage.setItem('localProductos', JSON.stringify(productos));
      }

      // Agregar tarea pendiente
      offlineManager.addPendingTask('UPDATE', {
        endpoint: `/productos/${id}`,
        method: 'PUT',
        data: { ...data, id },
      });

      return { success: true, data: { id, ...data } };
    }

    return this.request(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProducto(id) {
    // Si es ID temporal o está offline, eliminar localmente
    if (!navigator.onLine || (typeof id === 'string' && id.startsWith('temp_'))) {
      const stored = localStorage.getItem('localProductos') || '[]';
      const productos = JSON.parse(stored).filter(p => p.id != id);
      localStorage.setItem('localProductos', JSON.stringify(productos));

      // Agregar tarea pendiente
      offlineManager.addPendingTask('DELETE', {
        endpoint: `/productos/${id}`,
        method: 'DELETE',
        data: { id },
      });

      return { success: true, message: 'Producto eliminado' };
    }

    return this.request(`/productos/${id}`, {
      method: 'DELETE',
    });
  }
}

const api = new APIClient();
window.api = api;
