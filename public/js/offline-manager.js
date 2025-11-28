// ===========================
// GESTOR DE ESTADO OFFLINE
// ===========================

class OfflineManager {
  constructor() {
    this.pendingTasks = [];
    this.loadPendingTasks();
    this.syncing = false;
    this.lastSyncTime = null;
    this.setupNetworkListeners();
    this.startNetworkMonitor();

    // Si ya estamos online al inicializar, verificar si realmente hay tareas pendientes
    // y evitar sincronización si ya se sincronizó recientemente
    if (navigator.onLine && this.hasPendingTasks()) {
      // Verificar si hay una sincronización reciente (últimos 5 segundos)
      const lastSync = localStorage.getItem('lastSyncTime');
      const now = Date.now();
      const shouldSync = !lastSync || (now - parseInt(lastSync, 10)) > 5000;
      
      if (shouldSync) {
        // Deferir para que el resto de la app inicialice
        setTimeout(() => this.handleOnline(), 500);
      }
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Escuchar cambios de localStorage desde otras pestañas
    window.addEventListener('storage', (e) => {
      try {
        if (e.key === 'pendingTasks') {
          // Actualizar la cola local y refrescar indicadores en la UI
          this.loadPendingTasks();
          if (window.ui && typeof window.ui.refreshPendingIndicators === 'function') {
            window.ui.refreshPendingIndicators();
          }
        }

        if (e.key === 'networkStatus' && e.newValue && String(e.newValue).startsWith('online')) {
          // Otra pestaña pasó a online: intentar sincronizar aquí también
          showToast('Conexión detectada en otra pestaña - sincronizando...', 'success', 2000);
          this.handleOnline();
        }
      } catch (err) {
        console.warn('Error manejando evento storage', err);
      }
    });

    // Intentar sincronizar cuando la ventana recupere foco o visibilidad
    window.addEventListener('focus', () => {
      if (navigator.onLine) this.handleOnline();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.handleOnline();
      }
    });

    // Escuchar mensajes desde el Service Worker (tareas sincronizadas en background)
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.addEventListener) {
        navigator.serviceWorker.addEventListener('message', (ev) => {
          try {
            const msg = ev.data || {};
            if (msg && msg.type === 'task-synced') {
              // Remover tarea de la cola local y refrescar UI
              this.removePendingTask(msg.id);
              if (window.ui && typeof window.ui.refreshPendingIndicators === 'function') {
                window.ui.refreshPendingIndicators();
              }
            }
          } catch (e) {}
        });
      }
    } catch (e) {}
  }

  // Monitor activo para detectar transiciones de offline -> online
  startNetworkMonitor(intervalMs = 1500) {
    try {
      this._lastOnline = navigator.onLine;
      this._networkMonitor = setInterval(() => {
        try {
          const nowOnline = navigator.onLine;
          if (!this._lastOnline && nowOnline) {
            // transición offline -> online detectada
            console.log('Network monitor: detected online transition');
            this.handleOnline();
          }
          this._lastOnline = nowOnline;
        } catch (e) {
          // ignore errors in monitor
        }
      }, intervalMs);
    } catch (e) {
      // ignore
    }
  }

  handleOffline() {
    showToast('📴 Modo Offline - Los cambios se guardarán automáticamente', 'offline', 3000);
    document.body.classList.add('offline-mode');
  }

  handleOnline() {
    // Evitar que varias sincronizaciones se ejecuten simultáneamente
    if (this.syncing) return;

    // Verificar si realmente hay tareas pendientes antes de sincronizar
    const tasks = this.getPendingTasks();
    if (tasks.length === 0) {
      document.body.classList.remove('offline-mode');
      return;
    }

    // Verificar si ya se sincronizó recientemente (últimos 3 segundos)
    // para evitar sincronizaciones duplicadas en recargas rápidas
    const lastSync = localStorage.getItem('lastSyncTime');
    const now = Date.now();
    if (lastSync && (now - parseInt(lastSync, 10)) < 3000) {
      console.log('Sincronización reciente detectada, omitiendo...');
      document.body.classList.remove('offline-mode');
      return;
    }

    // Registrar el estado de red en localStorage para notificar a otras pestañas
    try {
      localStorage.setItem('networkStatus', 'online:' + Date.now());
    } catch (e) {
      // ignorar
    }

    // Mostrar mensajes de aviso para cada tarea pendiente (estado en espera)
    tasks.forEach((t) => {
      const action = t.action;
      if (action === 'CREATE') showToast('Creación de producto en espera', 'success', 2500);
      else if (action === 'UPDATE') showToast('Modificación de producto en espera', 'success', 2500);
      else if (action === 'DELETE') showToast('Eliminación de producto en espera', 'success', 2500);
    });

    showToast('Conectado - Sincronizando cambios...', 'success', 2000);
    document.body.classList.remove('offline-mode');
    // Iniciar sincronización
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

    // Persistir en IndexedDB si está disponible para que el Service Worker pueda sincronizar
    try {
      if (window.idbTasks && typeof window.idbTasks.addTask === 'function') {
        window.idbTasks.addTask(task).catch(() => {});
      }
    } catch (e) {}

    // Intentar registrar Background Sync si está disponible
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(reg => {
          try { reg.sync.register('sync-pending-tasks'); } catch (e) { /* ignore */ }
        }).catch(() => {});
      }
    } catch (e) {}

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

    // Notificar a la UI de este cambio para que marque filas/elementos en la misma pestaña
    try {
      if (window.ui && typeof window.ui.refreshPendingIndicators === 'function') {
        window.ui.refreshPendingIndicators();
      }
    } catch (e) {
      // ignore
    }
  }

  async syncPendingTasks() {
    if (this.pendingTasks.length === 0) return;

    if (this.syncing) return;
    this.syncing = true;
    try {
      // Señal a otras pestañas que hay sincronización en curso (opcional)
      try { localStorage.setItem('syncInProgress', '1'); } catch (e) {}

      // Iterar sobre copia para permitir remoción durante la sincronización
      const tasks = [...this.pendingTasks];
      const syncedTaskIds = [];
      
      for (const task of tasks) {
        try {
          console.log('Intentando sincronizar tarea', task.id, task.action);
          await this.executePendingTask(task);
          syncedTaskIds.push(task.id);
          this.removePendingTask(task.id);
          // También eliminar de IDB
          try {
            if (window.idbTasks && typeof window.idbTasks.removeTask === 'function') {
              await window.idbTasks.removeTask(task.id);
            }
          } catch (e) {
            console.warn('Error removiendo tarea de IDB', e);
          }
          console.log('Tarea sincronizada correctamente', task.id);
        } catch (error) {
          console.error('Error al sincronizar tarea', task.id, error);
          task.retries++;
          if (task.retries > 3) {
            showToast(`Error sincronizando ${task.action}`, 'error', 5000);
            this.removePendingTask(task.id);
            // Eliminar de IDB también
            try {
              if (window.idbTasks && typeof window.idbTasks.removeTask === 'function') {
                await window.idbTasks.removeTask(task.id);
              }
            } catch (e) {}
          } else {
            // Guardar tarea actualizada con más reintentos
            this.savePendingTasks();
          }
        }
      }

      // Guardar timestamp de última sincronización
      try {
        localStorage.setItem('lastSyncTime', String(Date.now()));
      } catch (e) {}

      this.savePendingTasks();
      
      if (syncedTaskIds.length > 0) {
        showToast('Sincronización completada', 'success', 2000);
      }

      // Limpiar localStorage de productos locales después de sincronizar
      localStorage.removeItem('localProductos');

      // Recargar productos desde servidor
      if (window.ui) {
        window.ui.loadProductos();
      }
    } finally {
      this.syncing = false;
      try { localStorage.removeItem('syncInProgress'); } catch (e) {}
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
    
    // También eliminar de IDB
    try {
      if (window.idbTasks && typeof window.idbTasks.removeTask === 'function') {
        window.idbTasks.removeTask(taskId).catch(() => {});
      }
    } catch (e) {
      // ignore
    }
  }

  savePendingTasks() {
    try { localStorage.setItem('pendingTasks', JSON.stringify(this.pendingTasks)); } catch (e) {}
    // also ensure IDB is in sync - solo guardar tareas que realmente existen
    try {
      if (window.idbTasks && typeof window.idbTasks.addTask === 'function') {
        // Obtener todas las tareas de IDB primero
        window.idbTasks.getAllTasks().then(existingTasks => {
          const existingIds = new Set(existingTasks.map(t => String(t.id)));
          const currentIds = new Set(this.pendingTasks.map(t => String(t.id)));
          
          // Eliminar tareas de IDB que ya no están en pendingTasks
          existingTasks.forEach(t => {
            if (!currentIds.has(String(t.id))) {
              try {
                window.idbTasks.removeTask(t.id).catch(() => {});
              } catch (e) {}
            }
          });
          
          // Agregar/actualizar tareas actuales en IDB
          this.pendingTasks.forEach(t => {
            try { window.idbTasks.addTask(t).catch(() => {}); } catch(e){}
          });
        }).catch(() => {
          // Si falla getAllTasks, solo hacer upsert de las actuales
          this.pendingTasks.forEach(t => {
            try { window.idbTasks.addTask(t).catch(() => {}); } catch(e){}
          });
        });
      }
    } catch (e) {}
  }

  loadPendingTasks() {
    try {
      const stored = localStorage.getItem('pendingTasks');
      this.pendingTasks = stored ? JSON.parse(stored) : [];
    } catch (e) {
      this.pendingTasks = [];
    }

    // If IDB available, load from there and merge (solo si hay tareas en IDB)
    // Pero evitar duplicados: si una tarea está en ambos, usar la de localStorage como fuente de verdad
    try {
      if (window.idbTasks && typeof window.idbTasks.getAllTasks === 'function') {
        window.idbTasks.getAllTasks().then(tasks => {
          if (!tasks || tasks.length === 0) return;
          
          // Crear mapa de tareas de localStorage (fuente de verdad)
          const localMap = new Map(this.pendingTasks.map(t => [String(t.id), t]));
          
          // Agregar solo tareas de IDB que no estén en localStorage
          tasks.forEach(t => {
            const taskId = String(t.id);
            if (!localMap.has(taskId)) {
              localMap.set(taskId, t);
            }
          });
          
          this.pendingTasks = Array.from(localMap.values());
          // persist merged result back to localStorage
          try { localStorage.setItem('pendingTasks', JSON.stringify(this.pendingTasks)); } catch (e) {}
        }).catch(() => {});
      }
    } catch (e) {}
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
