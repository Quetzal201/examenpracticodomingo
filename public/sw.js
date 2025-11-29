// ===========================
// SERVICE WORKER - PWA
// ===========================

const CACHE_NAME = 'pwa-orders-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/utils.js',
  '/js/offline-manager.js',
  '/js/api.js',
  '/js/auth.js',
  '/js/ui.js',
  '/js/app.js',
  '/img/product-icon.svg',
  '/img/product-splash.svg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    console.log('> SW install: caching static assets');
    // Cache each asset individually and ignore failures so install doesn't fail
    await Promise.all(STATIC_ASSETS.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res && res.ok) {
          await cache.put(url, res.clone());
        } else {
          console.warn('> SW install: failed to fetch', url, res && res.status);
        }
      } catch (e) {
        console.warn('> SW install: error fetching', url, e && e.message);
      }
    }));
  })());
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('✓ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil((async () => {
    // Enable navigation preload if available
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) { /* ignore */ }
    }
    await self.clients.claim();
  })());
});

// Interceptar solicitudes - Estrategia Cache First para assets estáticos
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // API calls -> network first
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Navigation requests (SPA routing / page reloads) -> try network then cache fallback
  if (request.mode === 'navigate' || (request.method === 'GET' && url.pathname === '/')) {
    event.respondWith((async () => {
      try {
        // Try navigation preload response first
        const preload = await event.preloadResponse;
        if (preload) return preload;

        const response = await fetch(request);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match('/index.html') || await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        return new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' }, status: 503 });
      }
    })());
    return;
  }

  // Other requests -> cache-first then network with runtime caching
  event.respondWith(cacheFirstStrategy(request));
});

// Estrategia Cache First
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    const runtimeCache = await caches.open(RUNTIME_CACHE);
    runtimeCache.put(request, response.clone());
    return response;
  } catch (error) {
    // Retornar página offline o assets de fallback si no hay cache
    // Navigation/document requests -> serve index.html from cache if available
    if (request.destination === 'document' || request.mode === 'navigate') {
      const fallback = await cache.match('/index.html');
      if (fallback) return fallback;
      return new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' }, status: 503 });
    }

    // Styles -> try to return cached stylesheet
    if (request.destination === 'style' || request.url.endsWith('.css')) {
      const fallback = await cache.match('/css/styles.css');
      if (fallback) return fallback;
    }

    // Scripts -> try cached script
    if (request.destination === 'script' || request.url.endsWith('.js')) {
      const fallback = await cache.match('/js/app.js');
      if (fallback) return fallback;
      return new Response('', { status: 503 });
    }

    // Images -> try product icon or a tiny svg placeholder
    if (request.destination === 'image' || request.url.match(/\.(png|jpg|jpeg|svg)$/)) {
      const img = await cache.match('/img/product-icon.svg');
      if (img) return img;
      // return a small inline SVG fallback
      const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><rect width="100%" height="100%" fill="#1a1a1a"/><text x="50%" y="50%" fill="#fff" font-size="10" text-anchor="middle" dy=".3em">App</text></svg>`;
      return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
    }

    // Fallback generic
    return new Response('Offline', { status: 503 });
  }
}

// Estrategia Network First
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(
      JSON.stringify({ error: 'Sin conexión a la red' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Notificaciones push (opcional)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Notificación';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/img/product-icon.svg',
    badge: '/img/product-icon.svg',
    tag: 'notification',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Sincronización de fondo (opcional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pedidos') {
    event.waitUntil(syncPedidos());
  }
  if (event.tag === 'sync-pedidos' || event.tag === 'sync-pending-tasks') {
    event.waitUntil((async () => {
      await syncPedidos();
      await processPendingTasksFromIDB();
    })());
  }
});

async function syncPedidos() {
  console.log('✓ Sincronizando pedidos en background...');
  // Lógica de sincronización
}

// --- IDB helpers inside Service Worker ---
function swOpenDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('examen-pwa-db', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pendingTasks')) {
        db.createObjectStore('pendingTasks', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function swGetAllTasks(){
  const db = await swOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingTasks', 'readonly');
    const store = tx.objectStore('pendingTasks');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function swRemoveTask(id){
  const db = await swOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingTasks', 'readwrite');
    const store = tx.objectStore('pendingTasks');
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function processPendingTasksFromIDB(){
  try {
    const tasks = await swGetAllTasks();
    if (!tasks || tasks.length === 0) return;
    for (const task of tasks) {
      try {
        await executeTaskInSW(task);
        await swRemoveTask(task.id);
        // Optionally notify clients
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach(c => c.postMessage({ type: 'task-synced', id: task.id }));
      } catch (e) {
        // increment retries or leave for next sync
        console.warn('SW: failed to sync task', task.id, e && e.message);
      }
    }
  } catch (e) {
    console.warn('SW: error processing pending tasks', e && e.message);
  }
}

async function executeTaskInSW(task){
  const action = task.action;
  const maybe = task.data || {};
  const endpoint = maybe.endpoint || '/productos';
  let url = endpoint;
  if (String(endpoint).startsWith('/api')) url = `${self.location.origin}${endpoint}`;
  else url = `${self.location.origin}/api${endpoint}`;

  const headers = { 'Content-Type': 'application/json' };

  switch (action) {
    case 'CREATE': {
      const body = JSON.stringify((maybe.data) ? maybe.data : maybe);
      const resp = await fetch(url, { method: 'POST', headers, body });
      if (!resp.ok) throw new Error('CREATE failed in SW');
      return await resp.json();
    }
    case 'UPDATE': {
      const body = JSON.stringify((maybe.data) ? maybe.data : maybe);
      const resp = await fetch(url, { method: 'PUT', headers, body });
      if (!resp.ok) throw new Error('UPDATE failed in SW');
      return await resp.json();
    }
    case 'DELETE': {
      const resp = await fetch(url, { method: 'DELETE', headers });
      if (!resp.ok) throw new Error('DELETE failed in SW');
      return await resp.json();
    }
    default:
      throw new Error('Unknown action in SW');
  }
}
