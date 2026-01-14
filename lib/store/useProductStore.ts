import { create } from 'zustand';
import type { Producto, NuevoProducto } from '../database/schema';
import * as queries from '../database/queries';

interface ProductState {
  productos: Producto[];
  productosBajoStock: Producto[];
  isLoading: boolean;
  error: string | null;

  // Acciones
  cargarProductos: () => Promise<void>;
  cargarProductosBajoStock: () => Promise<void>;
  buscarProductos: (query: string) => Promise<Producto[]>;
  obtenerProductoPorCodigo: (codigoBarras: string) => Promise<Producto | null>;
  crearProducto: (producto: NuevoProducto) => Promise<Producto | null>;
  actualizarProducto: (id: number, datos: Partial<NuevoProducto>) => Promise<Producto | null>;
  eliminarProducto: (id: number) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  productos: [],
  productosBajoStock: [],
  isLoading: false,
  error: null,

  cargarProductos: async () => {
    set({ isLoading: true, error: null });
    try {
      const productos = await queries.obtenerProductos();
      set({ productos, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar productos',
        isLoading: false
      });
    }
  },

  cargarProductosBajoStock: async () => {
    try {
      const productosBajoStock = await queries.obtenerProductosStockBajo();
      set({ productosBajoStock });
    } catch (error) {
      console.error('Error al cargar productos bajo stock:', error);
    }
  },

  buscarProductos: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const productos = await queries.buscarProductos(query);
      set({ isLoading: false });
      return productos;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al buscar productos',
        isLoading: false
      });
      return [];
    }
  },

  obtenerProductoPorCodigo: async (codigoBarras: string) => {
    try {
      const producto = await queries.obtenerProductoPorCodigoBarras(codigoBarras);
      return producto;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      return null;
    }
  },

  crearProducto: async (producto: NuevoProducto) => {
    set({ isLoading: true, error: null });
    try {
      const nuevoProducto = await queries.crearProducto(producto);
      await get().cargarProductos();
      set({ isLoading: false });
      return nuevoProducto;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al crear producto',
        isLoading: false
      });
      return null;
    }
  },

  actualizarProducto: async (id: number, datos: Partial<NuevoProducto>) => {
    set({ isLoading: true, error: null });
    try {
      const productoActualizado = await queries.actualizarProducto(id, datos);
      await get().cargarProductos();
      set({ isLoading: false });
      return productoActualizado;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar producto',
        isLoading: false
      });
      return null;
    }
  },

  eliminarProducto: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await queries.eliminarProducto(id);
      await get().cargarProductos();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al eliminar producto',
        isLoading: false
      });
    }
  }
}));
