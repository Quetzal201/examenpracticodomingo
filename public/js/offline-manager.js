// ===========================
// GESTOR DE ESTADO OFFLINE
// ===========================

class OfflineManager {
  constructor() {
    this.pendingTasks = [];
    this.loadPendingTasks();
    this.setupNetworkListeners();

    // Si ya estamos online al inicializar, intentar sincronizar automáticamente
    if (navigator.onLine && this.hasPendingTasks()) {
      // Deferir para que el resto de la app inicialice
      setTimeout(() => this.handleOnline(), 500);
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });
  }

  handleOffline() {
    showToast('📴 Modo Offline - Los cambios se guardarán automáticamente', 'offline', 3000);
    document.body.classList.add('offline-mode');
  }

  handleOnline() {
    // Mostrar mensajes de aviso para cada tarea pendiente (estado en espera)
    const tasks = this.getPendingTasks();
    tasks.forEach((t) => {
      const action = t.action;
      if (action === 'CREATE') showToast('Creación de producto en espera', 'success', 2500);
      else if (action === 'UPDATE') showToast('Modificación de producto en espera', 'success', 2500);
      else if (action === 'DELETE') showToast('Eliminación de producto en espera', 'success', 2500);
    });

    showToast('Conectado - Sincronizando cambios...', 'success', 2000);
    document.body.classList.remove('offline-mode');
    this.syncPendingTasks();
  }

  addPendingTask(action, data) {
    const task = {
      id: Date.now(),
      action,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    this.pendingTasks.push(task);
    this.savePendingTasks();

    // Mostrar con estado de espera
    this.showTaskStatusInUI(task);

    return task.id;
  }

  showTaskStatusInUI(task) {
    const colors = {
      CREATE: '#10b981',
      UPDATE: '#f59e0b',
      DELETE: '#ef4444',
      READ: '#3b82f6',
    };

    console.log(`⏳ ${task.action} pendiente - ID: ${task.id}`);
  }

  async syncPendingTasks() {
    if (this.pendingTasks.length === 0) return;

    // Iterar sobre copia para permitir remoción durante la sincronización
    const tasks = [...this.pendingTasks];
    for (const task of tasks) {
      try {
        console.log('Intentando sincronizar tarea', task.id, task.action);
        await this.executePendingTask(task);
        this.removePendingTask(task.id);
        console.log('Tarea sincronizada correctamente', task.id);
      } catch (error) {
        console.error('Error al sincronizar tarea', task.id, error);
        task.retries++;
        if (task.retries > 3) {
          showToast(`Error sincronizando ${task.action}`, 'error', 5000);
          this.removePendingTask(task.id);
        }
      }
    }

    this.savePendingTasks();
    showToast('Sincronización completada', 'success', 2000);

    // Limpiar localStorage de productos locales después de sincronizar
    localStorage.removeItem('localProductos');

    // Recargar productos desde servidor
    if (window.ui) {
      window.ui.loadProductos();
    }
  }

  async executePendingTask(task) {
    const { action, data } = task;
    const { endpoint, method, data: requestData } = data;

    // Construir URL completa (normalizar si el endpoint contiene ya /api)
    let url;
    if (String(endpoint).startsWith('/api')) url = `${window.location.origin}${endpoint}`;
    else url = `${window.location.origin}/api${endpoint}`;

    // Headers incluyendo autorización
    const headers = (window.api && window.api.getHeaders && window.api.getHeaders()) || { 'Content-Type': 'application/json' };

    // Ejecutar la petición directamente con fetch para evitar re-adding a la cola
    switch (action) {
      case 'CREATE': {
        const body = { ...requestData };
        // quitar tempId antes de enviar
        if (body.tempId) delete body.tempId;

        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`CREATE failed: ${resp.status} ${txt}`);
        }

        return await resp.json();
      }
      case 'UPDATE': {
        const id = endpoint.split('/').pop();
        const body = { ...requestData };
        if (body.id) delete body.id;

        const resp = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`UPDATE failed: ${resp.status} ${txt}`);
        }

        return await resp.json();
      }
      case 'DELETE': {
        const resp = await fetch(url, {
          method: 'DELETE',
          headers,
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`DELETE failed: ${resp.status} ${txt}`);
        }

        return await resp.json();
      }
      default:
        throw new Error('Acción desconocida');
    }
  }

  removePendingTask(taskId) {
    this.pendingTasks = this.pendingTasks.filter((t) => t.id !== taskId);
    this.savePendingTasks();
  }

  savePendingTasks() {
    localStorage.setItem('pendingTasks', JSON.stringify(this.pendingTasks));
  }

  loadPendingTasks() {
    const stored = localStorage.getItem('pendingTasks');
    this.pendingTasks = stored ? JSON.parse(stored) : [];
  }

  getPendingTasks() {
    return this.pendingTasks;
  }

  // Retorna un Set de IDs (tempId o id) que están afectados por tareas pendientes
  getPendingIds() {
    const ids = new Set();
    for (const t of this.pendingTasks) {
      // Estructuras posibles: t.data.data.tempId | t.data.data.id | t.data.tempId | t.data.id
      const maybe = (t && t.data) || {};
      const inner = maybe.data || maybe;
      if (!inner) continue;
      if (inner.tempId) ids.add(String(inner.tempId));
      if (inner.id) ids.add(String(inner.id));
      // También si endpoint incluye an id at end (/productos/123)
      if (maybe.endpoint) {
        const parts = String(maybe.endpoint).split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (last && !isNaN(Number(last))) ids.add(String(last));
      }
    }
    return ids;
  }

  hasPendingTasks() {
    return this.pendingTasks.length > 0;
  }
}

const offlineManager = new OfflineManager();

// Exportar globalmente
window.offlineManager = offlineManager;
