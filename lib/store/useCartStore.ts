import { create } from 'zustand';
import type { Producto } from '../database/schema';
import { useConfigStore } from './useConfigStore';

export interface ProductoCarrito extends Producto {
  cantidad: number;
  subtotal: number;
}

interface CartState {
  items: ProductoCarrito[];
  total: number;
  subtotal: number;
  iva: number;

  // Acciones
  agregarProducto: (producto: Producto, cantidad?: number) => void;
  removerProducto: (productoId: number) => void;
  actualizarCantidad: (productoId: number, cantidad: number) => void;
  limpiarCarrito: () => void;
  calcularTotales: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  subtotal: 0,
  iva: 0,

  agregarProducto: (producto: Producto, cantidad = 1) => {
    const items = get().items;
    const existingItem = items.find(item => item.id === producto.id);

    let newItems: ProductoCarrito[];

    if (existingItem) {
      // Si el producto ya existe, incrementar la cantidad
      newItems = items.map(item =>
        item.id === producto.id
          ? {
              ...item,
              cantidad: item.cantidad + cantidad,
              subtotal: (item.cantidad + cantidad) * item.precioVenta
            }
          : item
      );
    } else {
      // Si es un producto nuevo, agregarlo
      newItems = [
        ...items,
        {
          ...producto,
          cantidad,
          subtotal: cantidad * producto.precioVenta
        }
      ];
    }

    set({ items: newItems });
    get().calcularTotales();
  },

  removerProducto: (productoId: number) => {
    const items = get().items;
    const newItems = items.filter(item => item.id !== productoId);

    set({ items: newItems });
    get().calcularTotales();
  },

  actualizarCantidad: (productoId: number, cantidad: number) => {
    if (cantidad <= 0) {
      get().removerProducto(productoId);
      return;
    }

    const items = get().items;
    const newItems = items.map(item =>
      item.id === productoId
        ? {
            ...item,
            cantidad,
            subtotal: cantidad * item.precioVenta
          }
        : item
    );

    set({ items: newItems });
    get().calcularTotales();
  },

  limpiarCarrito: () => {
    set({
      items: [],
      total: 0,
      subtotal: 0,
      iva: 0
    });
  },

  calcularTotales: () => {
    const items = get().items;
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);

    console.log('💰 Calculando totales del carrito:');
    console.log('  - Subtotal:', subtotal);
    console.log('  - Total:', subtotal);

    // Sin IVA - el total es igual al subtotal
    const iva = 0;
    const total = subtotal;

    set({ subtotal, iva, total });
  }
}));
