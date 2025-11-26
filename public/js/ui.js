// ===========================
// INTERFAZ DE USUARIO
// ===========================

class UI {
  renderAuthPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-box">
          <h1 class="auth-title">Tienda</h1>
          <p class="auth-subtitle">Gestor de productos PWA</p>

          <div class="auth-tabs">
            <button class="auth-tab active" onclick="ui.switchAuthTab('login')">Login</button>
            <button class="auth-tab" onclick="ui.switchAuthTab('register')">Registro</button>
          </div>

          <!-- Login Form -->
          <form class="auth-form active" id="loginForm" onsubmit="ui.handleLogin(event)">
            <div id="loginError"></div>

            <div class="form-group">
              <label>Correo</label>
              <input type="email" name="correo" required />
            </div>

            <div class="form-group">
              <label>Contraseña</label>
              <input type="password" name="contraseña" required />
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              Iniciar Sesión
            </button>
          </form>

          <!-- Register Form -->
          <form class="auth-form" id="registerForm" onsubmit="ui.handleRegister(event)">
            <div id="registerError"></div>

            <div class="form-group">
              <label>Usuario</label>
              <input type="text" name="usuario" required />
            </div>

            <div class="form-group">
              <label>Correo</label>
              <input type="email" name="correo" required />
            </div>

            <div class="form-group">
              <label>Contraseña</label>
              <input type="password" name="contraseña" required />
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              Registrarse
            </button>
          </form>
        </div>
      </div>
    `;
  }

  switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((btn) => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach((form) => form.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
  }

  async handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const { correo, contraseña } = Object.fromEntries(formData);

    try {
      const success = await authManager.login(correo, contraseña);
      if (success) {
        setTimeout(() => {
          this.renderProductosPage();
        }, 500);
      }
    } catch (error) {
      document.getElementById('loginError').innerHTML = `
        <div class="auth-error">${error.message}</div>
      `;
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const { usuario, correo, contraseña } = Object.fromEntries(formData);

    try {
      const success = await authManager.register(usuario, correo, contraseña);
      if (success) {
        setTimeout(() => {
          this.renderProductosPage();
        }, 500);
      }
    } catch (error) {
      document.getElementById('registerError').innerHTML = `
        <div class="auth-error">${error.message}</div>
      `;
    }
  }

  renderProductosPage() {
    const app = document.getElementById('app');
    const user = authManager.getUser();

    app.innerHTML = `
      <header>
        <div class="header-title">🛍️ Tienda de Productos</div>
        <div class="header-actions">
          <div class="user-info">👤 ${user.usuario}</div>
          <button class="btn btn-outline-secondary btn-sm" onclick="ui.logout()">Logout</button>
        </div>
      </header>

      <div class="container">
        <div class="productos-header">
          <h2 class="productos-title">Catálogo de Productos</h2>
          <button class="btn btn-outline-success" onclick="ui.openCreateModal()">
            ➕ Agregar Producto
          </button>
        </div>

        <div id="productosContent"></div>
      </div>
    `;

    // Si está offline, cargar productos locales inmediatamente
    if (!navigator.onLine) {
      this.loadLocalProductos();
    } else {
      this.loadProductos();
    }
  }

  loadLocalProductos() {
    const content = document.getElementById('productosContent');
    const stored = localStorage.getItem('localProductos');
    const productos = stored ? JSON.parse(stored) : [];

    // Obtener IDs pendientes del offlineManager (maneja varias formas de tareas)
    const pendingIds = (window.offlineManager && window.offlineManager.getPendingIds && window.offlineManager.getPendingIds()) || new Set();

    if (productos.length === 0) {
      content.innerHTML = `
        <div class="productos-empty">
          <div class="productos-empty-icon">📦</div>
          <p>📴 Offline - No hay productos guardados</p>
        </div>
      `;
      return;
    }

    const tableHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${productos
              .map((producto) => {
                const isPending = pendingIds.has(String(producto.id));
                return `
              <tr id="producto-${producto.id}" ${isPending ? 'style="opacity: 0.6; border-left: 3px solid #f59e0b;"' : ''}>
                <td>#${producto.id}<span class="clock-icon" style="display: ${isPending ? 'inline-block' : 'none'};"></span></td>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td>${window.formatCurrency(producto.precio)}</td>
                <td>${producto.existencias}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-outline-warning btn-sm" onclick="ui.openEditModal('${producto.id}', ${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                      ✏️ Editar
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="ui.openDeleteModal('${producto.id}')">
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    content.innerHTML = tableHTML;
  }

  async loadProductos() {
    const content = document.getElementById('productosContent');

    try {
      // Si hay contenido previo, no mostrar spinner
      if (!content.innerHTML) {
        content.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando...</div>';
      }

      const response = await api.getProductos();
      let productos = response.data || [];

      if (productos.length === 0) {
        content.innerHTML = `
          <div class="productos-empty">
            <div class="productos-empty-icon">📦</div>
            <p>No hay productos disponibles. ¡Agrega uno!</p>
          </div>
        `;
        return;
      }

      // Determinar IDs pendientes
      const pending = (window.offlineManager && window.offlineManager.getPendingTasks && window.offlineManager.getPendingTasks()) || [];
      const pendingIds = new Set();
      pending.forEach((t) => {
        const rd = t.data && t.data.data;
        if (!rd) return;
        if (t.action === 'CREATE' && rd.tempId) pendingIds.add(String(rd.tempId));
        if ((t.action === 'UPDATE' || t.action === 'DELETE') && rd.id) pendingIds.add(String(rd.id));
      });

      const tableHTML = `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${productos
                .map((producto) => {
                  const isPending = pendingIds.has(String(producto.id));
                  return `
                <tr id="producto-${producto.id}"${isPending ? ' style="opacity: 0.6; border-left: 3px solid #f59e0b;"' : ''}>
                  <td>#${producto.id}<span class="clock-icon" style="display: ${isPending ? 'inline-block' : 'none'};"></span></td>
                  <td>${producto.nombre}</td>
                  <td>${producto.categoria}</td>
                  <td>${window.formatCurrency(producto.precio)}</td>
                  <td>${producto.existencias}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-outline-warning btn-sm" onclick="ui.openEditModal('${producto.id}', ${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                        ✏️ Editar
                      </button>
                      <button class="btn btn-outline-danger btn-sm" onclick="ui.openDeleteModal('${producto.id}')">
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `;

      content.innerHTML = tableHTML;
    } catch (error) {
      content.innerHTML = `
        <div class="card">
          <div class="auth-error">Error cargando productos: ${error.message}</div>
        </div>
      `;
    }
  }

  openCreateModal() {
    const formHTML = `
      <form onsubmit="return false;">
        <div class="form-group">
          <label>Nombre del Producto</label>
          <input type="text" id="nombre" required />
        </div>
        <div class="form-group">
          <label>Categoría</label>
          <input type="text" id="categoria" required />
        </div>
        <div class="form-group">
          <label>Precio</label>
          <input type="number" id="precio" step="0.01" required />
        </div>
        <div class="form-group">
          <label>Stock Disponible</label>
          <input type="number" id="existencias" required />
        </div>
      </form>
    `;

    showModal('➕ Agregar Producto', formHTML, 'Crear', async () => {
      const nombre = document.getElementById('nombre').value;
      const categoria = document.getElementById('categoria').value;
      const precio = parseFloat(document.getElementById('precio').value);
      const existencias = parseInt(document.getElementById('existencias').value);

      if (!nombre || !categoria || !precio || !existencias) {
        showToast('Completa todos los campos', 'warning');
        return;
      }

      try {
        showToast('⏳ Creando producto...', 'loading');
        const result = await api.createProducto({ nombre, categoria, precio: Number(precio), existencias: Number(existencias) });
        // Si la creación quedó en espera (offline), indicar mensaje acorde
        if (result && result.data && result.data.offline) {
          showToast('Creación de producto en espera', 'success');
        } else {
          showToast('Producto creado', 'success');
        }
        closeModal();

        // Agregar fila a la tabla sin recargar
        if (result.data && result.data.id) {
          this.addProductoToTable(result.data);
        }
      } catch (error) {
        showToast(`${error.message}`, 'error');
      }
    });
  }

  openEditModal(id, producto) {
    const formHTML = `
      <form onsubmit="return false;">
        <div class="form-group">
          <label>Nombre del Producto</label>
          <input type="text" id="nombre" value="${producto.nombre}" required />
        </div>
        <div class="form-group">
          <label>Categoría</label>
          <input type="text" id="categoria" value="${producto.categoria}" required />
        </div>
        <div class="form-group">
          <label>Precio</label>
          <input type="number" id="precio" value="${producto.precio}" step="0.01" required />
        </div>
        <div class="form-group">
          <label>Stock Disponible</label>
          <input type="number" id="existencias" value="${producto.existencias}" required />
        </div>
      </form>
    `;

    showModal('✏️ Editar Producto', formHTML, 'Actualizar', async () => {
      const nombre = document.getElementById('nombre').value;
      const categoria = document.getElementById('categoria').value;
      const precio = parseFloat(document.getElementById('precio').value);
      const existencias = parseInt(document.getElementById('existencias').value);

      if (!nombre || !categoria || !precio || !existencias) {
        showToast('Completa todos los campos', 'warning');
        return;
      }

      try {
        showToast('⏳ Actualizando producto...', 'loading');
        const res = await api.updateProducto(id, { nombre, categoria, precio: Number(precio), existencias: Number(existencias) });
        if (res && res.data && (res.data.offline || String(id).startsWith('temp_'))) {
          showToast('Modificación de producto en espera', 'success');
        } else {
          showToast('Producto actualizado', 'success');
        }
        closeModal();

        // Actualizar fila en la tabla sin recargar
        this.updateProductoInTable(id, { nombre, categoria, precio: Number(precio), existencias: Number(existencias) });
      } catch (error) {
        showToast(`${error.message}`, 'error');
      }
    });
  }

  openDeleteModal(id) {
    const content = `
      <p>¿Estás seguro de que deseas eliminar este producto?</p>
      <p style="color: var(--text-secondary); font-size: 12px; margin-top: 10px;">
        Esta acción no se puede deshacer.
      </p>
    `;

    showModal('🗑️ Confirmar Eliminación', content, 'Eliminar', async () => {
      try {
        showToast('⏳ Eliminando producto...', 'loading');
        const res = await api.deleteProducto(id);
        // Si la eliminación fue en espera, mostrar mensaje acorde
        if (res && res.message && res.message.includes('eliminado') && !navigator.onLine) {
          showToast('Eliminación de producto en espera', 'success');
        } else if (res && res.success && navigator.onLine) {
          showToast('Producto eliminado', 'success');
        } else {
          // Fallback: si la respuesta indica offline behavior
          showToast('Eliminación de producto en espera', 'success');
        }
        closeModal();

        // Remover fila de la tabla sin recargar
        this.removeProductoFromTable(id);
      } catch (error) {
        showToast(`${error.message}`, 'error');
      }
    });
  }

  logout() {
    if (confirm('¿Deseas cerrar sesión?')) {
      authManager.logout();
      this.renderAuthPage();
    }
  }

  // Métodos AJAX para actualizar tabla sin recargar
  addProductoToTable(producto) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    // Ocultar mensaje de vacío si existe
    const emptyMsg = document.querySelector('.productos-empty');
    if (emptyMsg) emptyMsg.remove();

    const tr = document.createElement('tr');
    tr.id = `producto-${producto.id}`;
    if (producto.offline) {
      tr.style.opacity = '0.6';
      tr.style.borderLeft = '3px solid #f59e0b';
    }

    tr.innerHTML = `
      <td>#${producto.id}<span class="clock-icon" style="display: ${producto.offline ? 'inline-block' : 'none'};"></span></td>
      <td>${producto.nombre}</td>
      <td>${producto.categoria}</td>
      <td>${window.formatCurrency(producto.precio)}</td>
      <td>${producto.existencias}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline-warning btn-sm" onclick="ui.openEditModal('${producto.id}', ${JSON.stringify(producto).replace(/"/g, '&quot;')})">
            ✏️ Editar
          </button>
          <button class="btn btn-outline-danger btn-sm" onclick="ui.openDeleteModal('${producto.id}')">
            🗑️ Eliminar
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  }

  updateProductoInTable(id, data) {
    const tr = document.getElementById(`producto-${id}`);
    if (!tr) return;

    const cells = tr.querySelectorAll('td');
    if (cells.length >= 5) {
      cells[1].textContent = data.nombre;
      cells[2].textContent = data.categoria;
      cells[3].textContent = window.formatCurrency(data.precio);
      cells[4].textContent = data.existencias;
    }

    // Aplicar estilo de pendiente si existe una tarea pendiente para este ID
    try {
      const pendingIds = (window.offlineManager && window.offlineManager.getPendingIds && window.offlineManager.getPendingIds()) || new Set();
      const isPending = pendingIds.has(String(id)) || String(id).startsWith('temp_');
      if (isPending) {
        tr.style.opacity = '0.6';
        tr.style.borderLeft = '3px solid #f59e0b';
        const icon = tr.querySelector('.clock-icon');
        if (icon) icon.style.display = 'inline-block';
      } else {
        tr.style.opacity = '';
        tr.style.borderLeft = '';
        const icon = tr.querySelector('.clock-icon');
        if (icon) icon.style.display = 'none';
      }
    } catch (e) {
      // ignore
    }
  }

  removeProductoFromTable(id) {
    const tr = document.getElementById(`producto-${id}`);
    if (tr) {
      tr.remove();
    }

    // Si la tabla está vacía, mostrar mensaje
    const tbody = document.querySelector('table tbody');
    if (tbody && tbody.children.length === 0) {
      const content = document.getElementById('productosContent');
      content.innerHTML = `
        <div class="productos-empty">
          <div class="productos-empty-icon">📦</div>
          <p>No hay productos disponibles. ¡Agrega uno!</p>
        </div>
      `;
    }
  }

  // Refrescar indicadores visuales de tareas pendientes sin recargar la página
  refreshPendingIndicators() {
    try {
      const pendingIds = (window.offlineManager && window.offlineManager.getPendingIds && window.offlineManager.getPendingIds()) || new Set();
      const rows = document.querySelectorAll('table tbody tr');
      rows.forEach((tr) => {
        const rid = tr.id ? String(tr.id).replace('producto-', '') : null;
        if (!rid) return;
        const isPending = pendingIds.has(String(rid)) || String(rid).startsWith('temp_');
        if (isPending) {
          tr.style.opacity = '0.6';
          tr.style.borderLeft = '3px solid #f59e0b';
          const icon = tr.querySelector('.clock-icon');
          if (icon) icon.style.display = 'inline-block';
        } else {
          tr.style.opacity = '';
          tr.style.borderLeft = '';
          const icon = tr.querySelector('.clock-icon');
          if (icon) icon.style.display = 'none';
        }
      });
    } catch (e) {
      // ignore
    }
  }
}

const ui = new UI();
window.ui = ui;
