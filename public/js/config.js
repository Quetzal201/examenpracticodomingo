// ===========================
// CONFIGURACIÓN DE LA APLICACIÓN
// ===========================

// Este archivo contiene las configuraciones principales
// que puedes customizar según tus necesidades

export const config = {
  // URLs
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  
  // Timeout de peticiones (ms)
  REQUEST_TIMEOUT: 30000,
  
  // Configuración de caché
  CACHE_VERSION: 'v1',
  CACHE_STRATEGY: 'network-first', // 'cache-first' o 'network-first'
  
  // Sincronización offline
  AUTO_SYNC_ENABLED: true,
  SYNC_INTERVAL: 30000, // ms
  MAX_RETRIES: 3,
  
  // PWA
  PWA_ENABLED: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_BACKGROUND_SYNC: true,
  
  // Auth
  SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 días
  
  // UI
  TOAST_DURATION: 3000, // ms
  TOAST_POSITION: 'bottom-right',
  
  // Feature flags
  FEATURES: {
    OFFLINE_SUPPORT: true,
    LOCAL_STORAGE: true,
    SERVICE_WORKER: true,
    INSTALLABLE: true,
  },
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/register',
      LOGIN: '/login',
      LOGOUT: '/logout',
      REFRESH: '/refresh',
    },
    PEDIDOS: {
      LIST: '/pedidos',
      CREATE: '/pedidos',
      UPDATE: '/pedidos/:id',
      DELETE: '/pedidos/:id',
      GET_ONE: '/pedidos/:id',
    },
  },
  
  // Validaciones
  VALIDATION: {
    USUARIO_MIN_LENGTH: 3,
    USUARIO_MAX_LENGTH: 30,
    CONTRASEÑA_MIN_LENGTH: 6,
    CORREO_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  
  // Colores temáticos
  COLORS: {
    PRIMARY: '#1a1a1a',
    SECONDARY: '#2d2d2d',
    SUCCESS: '#10b981',
    DANGER: '#ef4444',
    WARNING: '#f59e0b',
    INFO: '#3b82f6',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#b0b0b0',
  },
};

export default config;
