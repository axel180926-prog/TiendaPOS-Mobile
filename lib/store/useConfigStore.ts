import { create } from 'zustand';
import type { Configuracion } from '../database/schema';
import * as queries from '../database/queries';

interface ConfigState {
  configuracion: Configuracion | null;
  isLoading: boolean;
  error: string | null;

  // Acciones
  cargarConfiguracion: () => Promise<void>;
  actualizarConfiguracion: (datos: Partial<Configuracion>) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  configuracion: null,
  isLoading: false,
  error: null,

  cargarConfiguracion: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await queries.obtenerConfiguracion();
      set({ configuracion: config, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar configuración',
        isLoading: false
      });
    }
  },

  actualizarConfiguracion: async (datos: Partial<Configuracion>) => {
    set({ isLoading: true, error: null });
    try {
      const configActualizada = await queries.actualizarConfiguracion(datos);
      set({ configuracion: configActualizada, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar configuración',
        isLoading: false
      });
    }
  }
}));
