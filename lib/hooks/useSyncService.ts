import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SYNC_CONFIG } from '../config/sync';
import {
  sincronizarTodo,
  sincronizarVentas,
  sincronizarProductos,
  verificarEstadoSync,
  guardarUltimaSyncTimestamp,
} from '../services/syncService';

export function useSyncService() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [ventasPendientes, setVentasPendientes] = useState(0);
  const [conectado, setConectado] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(SYNC_CONFIG.AUTO_SYNC_ENABLED);

  // Actualizar estado
  const actualizarEstado = useCallback(async () => {
    const estado = await verificarEstadoSync();
    setLastSync(estado.ultimaSync);
    setVentasPendientes(estado.ventasPendientes);
    setConectado(estado.conectado);
  }, []);

  // Sincronización manual completa (bidireccional)
  const syncManual = useCallback(async () => {
    if (syncing) return {
      ventas: { success: false, sincronizadas: 0, errores: 0, mensaje: 'Ya hay una sincronización en curso' },
      productos: { success: false, sincronizadas: 0, errores: 0, mensaje: 'Ya hay una sincronización en curso' },
      descarga: { success: false, sincronizadas: 0, errores: 0, mensaje: 'Ya hay una sincronización en curso' },
    };

    setSyncing(true);
    console.log('🔄 Sincronización manual bidireccional iniciada');

    try {
      const result = await sincronizarTodo();

      if (result.ventas.success || result.productos.success || result.descarga.success) {
        console.log('✅ Sincronización manual completada');
      }

      await actualizarEstado();

      return result;
    } catch (error) {
      console.error('❌ Error en sincronización manual:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [syncing, actualizarEstado]);

  // Sincronización automática
  const syncAuto = useCallback(async () => {
    if (syncing || !autoSyncEnabled || !conectado) return;

    console.log('⏰ Sincronización automática iniciada');

    try {
      await sincronizarVentas();
      await guardarUltimaSyncTimestamp();
      await actualizarEstado();
    } catch (error) {
      console.error('❌ Error en sincronización automática:', error);
    }
  }, [syncing, autoSyncEnabled, conectado, actualizarEstado]);

  // Toggle auto-sync
  const toggleAutoSync = useCallback(() => {
    setAutoSyncEnabled(prev => !prev);
  }, []);

  // Efecto para sincronización automática
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const interval = setInterval(syncAuto, SYNC_CONFIG.AUTO_SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, syncAuto]);

  // Efecto para sincronizar cuando la app vuelve a primer plano
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && autoSyncEnabled) {
        syncAuto();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [autoSyncEnabled, syncAuto]);

  // Actualizar estado inicial
  useEffect(() => {
    actualizarEstado();
  }, [actualizarEstado]);

  return {
    syncing,
    lastSync,
    ventasPendientes,
    conectado,
    autoSyncEnabled,
    syncManual,
    toggleAutoSync,
  };
}
