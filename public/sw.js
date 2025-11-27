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
  self.clients.claim();
});

// Interceptar solicitudes - Estrategia Cache First para assets estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls - Network First
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirstStrategy(request));
  }
  // Static assets - Cache First
  else {
    event.respondWith(cacheFirstStrategy(request));
  }
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
    icon: '/img/icon-192.png',
    badge: '/img/icon-192.png',
    tag: 'notification',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Sincronización de fondo (opcional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pedidos') {
    event.waitUntil(syncPedidos());
  }
});

async function syncPedidos() {
  console.log('✓ Sincronizando pedidos en background...');
  // Lógica de sincronización
}
