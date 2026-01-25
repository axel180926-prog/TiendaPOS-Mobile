import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { SYNC_CONFIG, AUTH_CONFIG } from '../config/sync';
import * as queries from '../database/queries';
import { db } from '../database';
import * as schema from '../database/schema';

// ============================================
// TIPOS
// ============================================
interface SyncResult {
  success: boolean;
  sincronizadas: number;
  errores: number;
  mensaje?: string;
  error?: string;
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
// SINCRONIZAR PRODUCTOS (App → Backend)
// ============================================
export async function sincronizarProductos(): Promise<SyncResult> {
  try {
    console.log('🔄 Iniciando sincronización de productos (subida)...');

    // Obtener todos los productos activos usando query directo
    const productosQuery = await db.select()
      .from(schema.productos)
      .where(eq(schema.productos.activo, true));

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
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// ============================================
// DESCARGAR PRODUCTOS (Backend → App)
// ============================================
export async function descargarProductos(): Promise<SyncResult> {
  try {
    console.log('📥 Descargando productos del backend...');

    // Obtener token
    const token = await getAuthToken();

    // Obtener productos del backend
    const response = await fetch(`${SYNC_CONFIG.API_URL}/sync/productos/${SYNC_CONFIG.TIENDA_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(SYNC_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    const productosBackend = result.productos || [];

    if (productosBackend.length === 0) {
      console.log('ℹ️ No hay productos en el backend para descargar');
      return {
        success: true,
        sincronizadas: 0,
        errores: 0,
        mensaje: 'No hay productos en el backend',
      };
    }

    console.log(`📦 ${productosBackend.length} productos recibidos del backend`);

    let insertados = 0;
    let actualizados = 0;
    let errores = 0;

    // Procesar cada producto del backend
    for (const producto of productosBackend) {
      try {
        // Verificar si el producto ya existe por código de barras
        const existente = await db.select()
          .from(schema.productos)
          .where(eq(schema.productos.codigoBarras, producto.codigo_barras || producto.codigoBarras))
          .limit(1);

        if (existente.length > 0) {
          // Actualizar producto existente
          await db.update(schema.productos)
            .set({
              nombre: producto.nombre,
              precioCompra: producto.precio_compra || producto.precioCompra || 0,
              precioVenta: producto.precio_venta || producto.precioVenta || 0,
              stock: producto.stock || 0,
              stockMinimo: producto.stock_minimo || producto.stockMinimo || 5,
              categoria: producto.categoria,
              marca: producto.marca,
              presentacion: producto.presentacion,
              descripcion: producto.descripcion,
              unidadMedida: producto.unidad_medida || producto.unidadMedida || 'Pieza',
              activo: true,
            })
            .where(eq(schema.productos.id, existente[0].id));
          actualizados++;
        } else {
          // Insertar nuevo producto
          await db.insert(schema.productos).values({
            codigoBarras: producto.codigo_barras || producto.codigoBarras,
            nombre: producto.nombre,
            precioCompra: producto.precio_compra || producto.precioCompra || 0,
            precioVenta: producto.precio_venta || producto.precioVenta || 0,
            stock: producto.stock || 0,
            stockMinimo: producto.stock_minimo || producto.stockMinimo || 5,
            categoria: producto.categoria,
            marca: producto.marca,
            presentacion: producto.presentacion,
            descripcion: producto.descripcion,
            unidadMedida: producto.unidad_medida || producto.unidadMedida || 'Pieza',
            activo: true,
          });
          insertados++;
        }
      } catch (err) {
        console.error(`Error procesando producto ${producto.nombre}:`, err);
        errores++;
      }
    }

    console.log(`✅ Descarga completada: ${insertados} nuevos, ${actualizados} actualizados, ${errores} errores`);

    return {
      success: true,
      sincronizadas: insertados + actualizados,
      errores,
      mensaje: `${insertados} nuevos, ${actualizados} actualizados`,
    };
  } catch (error) {
    console.error('❌ Error al descargar productos:', error);
    return {
      success: false,
      sincronizadas: 0,
      errores: 1,
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// ============================================
// SINCRONIZACIÓN COMPLETA (BIDIRECCIONAL)
// ============================================
export async function sincronizarTodo(): Promise<{
  ventas: SyncResult;
  productos: SyncResult;
  descarga: SyncResult;
}> {
  console.log('🚀 Iniciando sincronización bidireccional...');

  // 1. Primero descargar productos del backend (Backend → App)
  console.log('📥 Paso 1: Descargando productos del backend...');
  let descargaResult: SyncResult;
  try {
    descargaResult = await descargarProductos();
  } catch (error) {
    descargaResult = {
      success: false,
      sincronizadas: 0,
      errores: 1,
      mensaje: 'Error al descargar productos',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }

  // 2. Luego subir datos locales al backend (App → Backend)
  console.log('📤 Paso 2: Subiendo datos al backend...');
  const [ventas, productos] = await Promise.allSettled([
    sincronizarVentas(),
    sincronizarProductos(),
  ]);

  const ventasResult = ventas.status === 'fulfilled' ? ventas.value : {
    success: false,
    sincronizadas: 0,
    errores: 1,
    mensaje: 'Error al sincronizar ventas',
    error: 'Error al sincronizar ventas',
  };

  const productosResult = productos.status === 'fulfilled' ? productos.value : {
    success: false,
    sincronizadas: 0,
    errores: 1,
    mensaje: 'Error al sincronizar productos',
    error: 'Error al sincronizar productos',
  };

  // Guardar timestamp de última sincronización
  await guardarUltimaSyncTimestamp();

  console.log('✅ Sincronización bidireccional finalizada');

  return {
    ventas: ventasResult,
    productos: productosResult,
    descarga: descargaResult,
  };
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
async function obtenerVentasSinSincronizar(): Promise<any[]> {
  try {
    // Obtener IDs de ventas ya sincronizadas
    const syncedVentasStr = await AsyncStorage.getItem('synced_ventas') || '[]';
    const syncedVentas: number[] = JSON.parse(syncedVentasStr);

    // Obtener todas las ventas
    const todasLasVentas = await db.select()
      .from(schema.ventas)
      .orderBy(schema.ventas.id)
      .limit(100);

    // Filtrar ventas no sincronizadas
    const ventasSinSync = todasLasVentas.filter(v => !syncedVentas.includes(v.id));

    // Para cada venta, obtener sus items
    const ventasConItems = await Promise.all(
      ventasSinSync.map(async (venta) => {
        const items = await db.select()
          .from(schema.ventaItems)
          .where(eq(schema.ventaItems.ventaId, venta.id));

        return {
          id: venta.id,
          total: venta.total,
          metodoPago: venta.metodoPago,
          cajaId: venta.cajaId,
          fecha: venta.fecha,
          items: items.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
          })),
        };
      })
    );

    return ventasConItems;
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
