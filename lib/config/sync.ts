// ============================================
// CONFIGURACIÓN DE SINCRONIZACIÓN
// ============================================

export const SYNC_CONFIG = {
  // URL del backend (cambiar en producción)
  API_URL: __DEV__
    ? 'http://localhost:3000/api'
    : 'http://srv949273.hstgr.cloud/api',

  // Intervalo de sincronización automática (en milisegundos)
  AUTO_SYNC_INTERVAL: 30000, // 30 segundos

  // Tiempo de espera para requests
  TIMEOUT: 10000, // 10 segundos

  // Reintentos en caso de fallo
  MAX_RETRIES: 3,

  // ID de la tienda (para multi-tienda)
  TIENDA_ID: 1,

  // Habilitar sincronización automática
  AUTO_SYNC_ENABLED: true,

  // Sincronizar solo con WiFi
  WIFI_ONLY: false,
};

// Credenciales de autenticación (cambiar en producción)
export const AUTH_CONFIG = {
  EMAIL: 'admin@tienda.com',
  PASSWORD: 'admin123',
};
