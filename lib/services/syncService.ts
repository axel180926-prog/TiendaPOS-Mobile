import AsyncStorage from '@react-native-async-storage/async-storage';
import { SYNC_CONFIG, AUTH_CONFIG } from '../config/sync';
import * as queries from '../database/queries';
import { db } from '../database';

// ============================================
// TIPOS
// ============================================
interface SyncResult {
  success: boolean;
  sincronizadas: number;
  errores: number;
  mensaje?: string;
}

interface AuthToken {
  token: string;
  expiry: number;
}

// ============================================
// AUTENTICACIÓN
// ============================================
let authToken: string | null = null;

async function getAuthToken(): Promise<string> {
  try {
    // Verificar si ya tenemos un token válido en memoria
    if (authToken) {
      return authToken;
    }

    // Verificar si hay token guardado en AsyncStorage
    const storedToken = await AsyncStorage.getItem('sync_auth_token');
    const storedExpiry = await AsyncStorage.getItem('sync_token_expiry');

    if (storedToken && storedExpiry) {
      const expiry = parseInt(storedExpiry, 10);
      if (Date.now() < expiry) {
        authToken = storedToken;
        return authToken;
      }
    }

    // Token no válido o expirado, hacer login
    const response = await fetch(`${SYNC_CONFIG.API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: AUTH_CONFIG.EMAIL,
        password: AUTH_CONFIG.PASSWORD,
      }),
      signal: AbortSignal.timeout(SYNC_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error('Error al autenticar con el servidor');
    }

    const data = await response.json();
    authToken = data.token;

    // Guardar token (expira en 6 días)
    const expiry = Date.now() + 6 * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem('sync_auth_token', authToken);
    await AsyncStorage.setItem('sync_token_expiry', expiry.toString());

    console.log('✅ Autenticación exitosa con servidor de sync');
    return authToken;
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    throw error;
  }
}

// ============================================
// SINCRONIZAR VENTAS
// ============================================
export async function sincronizarVentas(): Promise<SyncResult> {
  try {
    console.log('🔄 Iniciando sincronización de ventas...');

    // Obtener ventas no sincronizadas
    const ventas = await obtenerVentasSinSincronizar();

    if (ventas.length === 0) {
      console.log('ℹ️ No hay ventas pendientes de sincronizar');
      return {
        success: true,
        sincronizadas: 0,
        errores: 0,
        mensaje: 'No hay ventas pendientes',
      };
    }

    console.log(`📊 ${ventas.length} ventas pendientes de sincronizar`);

    // Obtener token de autenticación
    const token = await getAuthToken();

    // Enviar ventas al servidor
    const response = await fetch(`${SYNC_CONFIG.API_URL}/sync/ventas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ventas,
        tienda_id: SYNC_CONFIG.TIENDA_ID,
      }),
      signal: AbortSignal.timeout(SYNC_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();

    // Marcar ventas como sincronizadas
    if (result.detalles?.exitosas) {
      for (const venta of result.detalles.exitosas) {
        await marcarVentaComoSincronizada(venta.venta_local_id);
      }
    }

    console.log(`✅ Ventas sincronizadas: ${result.sincronizadas}`);

    return {
      success: true,
      sincronizadas: result.sincronizadas || 0,
      errores: result.errores || 0,
      mensaje: `${result.sincronizadas} ventas sincronizadas`,
    };
  } catch (error) {
    console.error('❌ Error al sincronizar ventas:', error);
    return {
      success: false,
      sincronizadas: 0,
      errores: 1,
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// ============================================
// SINCRONIZAR PRODUCTOS
// ============================================
export async function sincronizarProductos(): Promise<SyncResult> {
  try {
    console.log('🔄 Iniciando sincronización de productos...');

    // Obtener todos los productos activos
    const productosQuery = await db.query.productos.findMany({
      where: (productos, { eq }) => eq(productos.activo, true),
    });

    if (productosQuery.length === 0) {
      console.log('ℹ️ No hay productos para sincronizar');
      return {
        success: true,
        sincronizadas: 0,
        errores: 0,
        mensaje: 'No hay productos',
      };
    }

    console.log(`📦 ${productosQuery.length} productos para sincronizar`);

    // Obtener token
    const token = await getAuthToken();

    // Enviar productos
    const response = await fetch(`${SYNC_CONFIG.API_URL}/sync/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        productos: productosQuery,
        tienda_id: SYNC_CONFIG.TIENDA_ID,
      }),
      signal: AbortSignal.timeout(SYNC_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();

    console.log(`✅ Productos sincronizados: ${result.sincronizados}`);

    return {
      success: true,
      sincronizadas: result.sincronizados || 0,
      errores: 0,
      mensaje: `${result.sincronizados} productos sincronizados`,
    };
  } catch (error) {
    console.error('❌ Error al sincronizar productos:', error);
    return {
      success: false,
      sincronizadas: 0,
      errores: 1,
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// ============================================
// SINCRONIZACIÓN COMPLETA
// ============================================
export async function sincronizarTodo(): Promise<{
  ventas: SyncResult;
  productos: SyncResult;
}> {
  console.log('🚀 Iniciando sincronización completa...');

  const [ventas, productos] = await Promise.allSettled([
    sincronizarVentas(),
    sincronizarProductos(),
  ]);

  const ventasResult = ventas.status === 'fulfilled' ? ventas.value : {
    success: false,
    sincronizadas: 0,
    errores: 1,
    mensaje: 'Error al sincronizar ventas',
  };

  const productosResult = productos.status === 'fulfilled' ? productos.value : {
    success: false,
    sincronizadas: 0,
    errores: 1,
    mensaje: 'Error al sincronizar productos',
  };

  console.log('✅ Sincronización completa finalizada');

  return {
    ventas: ventasResult,
    productos: productosResult,
  };
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
async function obtenerVentasSinSincronizar(): Promise<any[]> {
  try {
    // Obtener ventas que no han sido sincronizadas
    const ventas = await db.query.ventas.findMany({
      with: {
        items: true,
      },
      // Obtener las últimas 100 ventas no sincronizadas
      limit: 100,
    });

    // Transformar al formato esperado por el backend
    return ventas.map(venta => ({
      id: venta.id,
      total: venta.total,
      metodoPago: venta.metodoPago,
      cajaId: venta.cajaId,
      fecha: venta.fecha,
      items: venta.items?.map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      })) || [],
    }));
  } catch (error) {
    console.error('Error al obtener ventas sin sincronizar:', error);
    return [];
  }
}

async function marcarVentaComoSincronizada(ventaId: number): Promise<void> {
  try {
    // Guardar en AsyncStorage las ventas sincronizadas
    const syncedVentas = await AsyncStorage.getItem('synced_ventas') || '[]';
    const syncedArray = JSON.parse(syncedVentas);

    if (!syncedArray.includes(ventaId)) {
      syncedArray.push(ventaId);
      await AsyncStorage.setItem('synced_ventas', JSON.stringify(syncedArray));
    }
  } catch (error) {
    console.error('Error al marcar venta como sincronizada:', error);
  }
}

// ============================================
// VERIFICAR ESTADO DE SINCRONIZACIÓN
// ============================================
export async function verificarEstadoSync(): Promise<{
  ultimaSync: Date | null;
  ventasPendientes: number;
  conectado: boolean;
}> {
  try {
    const ultimaSyncStr = await AsyncStorage.getItem('ultima_sync');
    const ultimaSync = ultimaSyncStr ? new Date(ultimaSyncStr) : null;

    const ventas = await obtenerVentasSinSincronizar();
    const ventasPendientes = ventas.length;

    // Verificar conectividad
    let conectado = false;
    try {
      const response = await fetch(`${SYNC_CONFIG.API_URL.replace('/api', '')}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      conectado = response.ok;
    } catch {
      conectado = false;
    }

    return {
      ultimaSync,
      ventasPendientes,
      conectado,
    };
  } catch (error) {
    console.error('Error al verificar estado de sync:', error);
    return {
      ultimaSync: null,
      ventasPendientes: 0,
      conectado: false,
    };
  }
}

// ============================================
// GUARDAR TIMESTAMP DE ÚLTIMA SYNC
// ============================================
export async function guardarUltimaSyncTimestamp(): Promise<void> {
  try {
    await AsyncStorage.setItem('ultima_sync', new Date().toISOString());
  } catch (error) {
    console.error('Error al guardar timestamp de sync:', error);
  }
}
