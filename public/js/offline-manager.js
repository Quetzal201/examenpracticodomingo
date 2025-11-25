// ===========================
// GESTOR DE ESTADO OFFLINE
// ===========================

class OfflineManager {
  constructor() {
    this.pendingTasks = [];
    this.loadPendingTasks();
    this.setupNetworkListeners();
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

    for (const task of this.pendingTasks) {
      try {
        await this.executePendingTask(task);
        this.removePendingTask(task.id);
      } catch (error) {
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

    try {
      switch (action) {
        case 'CREATE':
          return await fetch('/api/productos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify(data.data),
          }).then(r => r.json());

        case 'UPDATE':
          return await fetch(data.endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify(data.data),
          }).then(r => r.json());

        case 'DELETE':
          return await fetch(data.endpoint, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          }).then(r => r.json());

        default:
          throw new Error('Acción desconocida');
      }
    } catch (error) {
      throw new Error(`Error sincronizando ${action}: ${error.message}`);
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

  hasPendingTasks() {
    return this.pendingTasks.length > 0;
  }
}

const offlineManager = new OfflineManager();

// Exportar globalmente
window.offlineManager = offlineManager;
