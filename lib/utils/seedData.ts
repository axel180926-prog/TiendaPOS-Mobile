import productosIniciales from '../../assets/productos/productos-mexico.json';
import { db } from '../database';
import { productos } from '../database/schema';
import type { NuevoProducto } from '../database/schema';

export async function cargarProductosIniciales(): Promise<boolean> {
  try {
    const productosExistentes = await db.select().from(productos);

    if (productosExistentes.length > 0) {
      console.log('✅ Ya existen productos en la base de datos');
      return false;
    }

    console.log('📦 Cargando productos iniciales...');

    for (const producto of productosIniciales) {
      const nuevoProducto: NuevoProducto = {
        codigoBarras: producto.codigo_barras,
        nombre: producto.nombre,
        descripcion: producto.descripcion || null,
        categoria: producto.categoria || null,
        precioCompra: producto.precio_compra || 0,
        precioVenta: producto.precio_venta,
        stock: producto.stock || 0,
        stockMinimo: producto.stock_minimo || 5,
        activo: true
      };

      await db.insert(productos).values(nuevoProducto);
    }

    console.log(`✅ ${productosIniciales.length} productos cargados exitosamente`);
    return true;
  } catch (error) {
    console.error('❌ Error al cargar productos iniciales:', error);
    throw error;
  }
}

/**
 * Elimina TODOS los productos y vuelve a cargarlos desde el JSON
 * ⚠️ CUIDADO: Esta función borra todos los productos de la base de datos
 */
export async function recargarProductosForzado(): Promise<boolean> {
  try {
    console.log('🔄 Eliminando todos los productos...');
    await db.delete(productos);

    console.log('📦 Recargando productos desde JSON...');

    for (const producto of productosIniciales) {
      const nuevoProducto: NuevoProducto = {
        codigoBarras: producto.codigo_barras,
        nombre: producto.nombre,
        descripcion: producto.descripcion || null,
        categoria: producto.categoria || null,
        precioCompra: producto.precio_compra || 0,
        precioVenta: producto.precio_venta,
        stock: producto.stock || 0,
        stockMinimo: producto.stock_minimo || 5,
        activo: true
      };

      await db.insert(productos).values(nuevoProducto);
    }

    console.log(`✅ ${productosIniciales.length} productos recargados exitosamente`);
    return true;
  } catch (error) {
    console.error('❌ Error al recargar productos:', error);
    throw error;
  }
}

export const productosEjemplo: NuevoProducto[] = [
  {
    codigoBarras: '0000000000001',
    nombre: 'Producto de Prueba 1',
    descripcion: 'Producto para testing',
    categoria: 'Pruebas',
    precioCompra: 6.00,
    precioVenta: 10.00,
    stock: 100,
    stockMinimo: 10,
    activo: true
  }
];
