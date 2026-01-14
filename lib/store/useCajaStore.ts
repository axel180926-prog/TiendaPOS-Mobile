import { create } from 'zustand';
import type { Caja, MovimientoCaja } from '../database/schema';
import {
  abrirCaja,
  cerrarCaja,
  obtenerCajaActiva,
  registrarMovimientoCaja,
  obtenerMovimientosCaja
} from '../database/queries';

interface CajaState {
  cajaActiva: Caja | null;
  movimientos: MovimientoCaja[];
  loading: boolean;
  error: string | null;

  // Acciones
  cargarCajaActiva: () => Promise<void>;
  abrirNuevaCaja: (montoInicial: number, usuario?: string) => Promise<boolean>;
  cerrarCajaActiva: (montoFinal: number, notas?: string) => Promise<boolean>;
  registrarMovimiento: (tipo: string, monto: number, concepto?: string) => Promise<void>;
  cargarMovimientos: (cajaId: number) => Promise<void>;
  limpiarError: () => void;
}

export const useCajaStore = create<CajaState>((set, get) => ({
  cajaActiva: null,
  movimientos: [],
  loading: false,
  error: null,

  cargarCajaActiva: async () => {
    set({ loading: true, error: null });
    try {
      const caja = await obtenerCajaActiva();
      set({ cajaActiva: caja, loading: false });

      // Si hay caja activa, cargar sus movimientos
      if (caja) {
        await get().cargarMovimientos(caja.id);
      }
    } catch (error) {
      console.error('Error al cargar caja activa:', error);
      set({
        error: 'No se pudo cargar la caja activa',
        loading: false
      });
    }
  },

  abrirNuevaCaja: async (montoInicial: number, usuario?: string) => {
    set({ loading: true, error: null });
    try {
      // Verificar que no haya una caja abierta
      const cajaExistente = await obtenerCajaActiva();
      if (cajaExistente) {
        set({
          error: 'Ya existe una caja abierta. Debe cerrarla primero.',
          loading: false
        });
        return false;
      }

      const nuevaCaja = await abrirCaja(montoInicial, usuario);
      set({
        cajaActiva: nuevaCaja,
        movimientos: [],
        loading: false
      });
      return true;
    } catch (error) {
      console.error('Error al abrir caja:', error);
      set({
        error: 'No se pudo abrir la caja',
        loading: false
      });
      return false;
    }
  },

  cerrarCajaActiva: async (montoFinal: number, notas?: string) => {
    const { cajaActiva } = get();
    if (!cajaActiva) {
      set({ error: 'No hay una caja activa para cerrar' });
      return false;
    }

    set({ loading: true, error: null });
    try {
      await cerrarCaja(cajaActiva.id, montoFinal, notas);
      set({
        cajaActiva: null,
        movimientos: [],
        loading: false
      });
      return true;
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      set({
        error: 'No se pudo cerrar la caja',
        loading: false
      });
      return false;
    }
  },

  registrarMovimiento: async (tipo: string, monto: number, concepto?: string) => {
    const { cajaActiva } = get();
    if (!cajaActiva) {
      set({ error: 'No hay una caja activa' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await registrarMovimientoCaja(cajaActiva.id, tipo, monto, concepto);
      // Recargar movimientos
      await get().cargarMovimientos(cajaActiva.id);
      set({ loading: false });
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      set({
        error: 'No se pudo registrar el movimiento',
        loading: false
      });
    }
  },

  cargarMovimientos: async (cajaId: number) => {
    try {
      const movimientos = await obtenerMovimientosCaja(cajaId);
      set({ movimientos });
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      set({ error: 'No se pudieron cargar los movimientos' });
    }
  },

  limpiarError: () => set({ error: null }),
}));
