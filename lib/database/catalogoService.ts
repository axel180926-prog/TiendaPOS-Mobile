import { eq } from 'drizzle-orm';
import { db } from './index';
import { catalogoCodigos, type CatalogoCodigo, type NuevoCatalogoCodigo } from './schema';

/**
 * Buscar producto en catálogo por código de barras
 * @param codigoBarras - Código de barras del producto
 * @returns Datos del catálogo si existe, null si no
 */
export async function buscarEnCatalogo(codigoBarras: string): Promise<CatalogoCodigo | null> {
  try {
    const resultado = await db
      .select()
      .from(catalogoCodigos)
      .where(eq(catalogoCodigos.codigoBarras, codigoBarras))
      .limit(1);

    if (resultado.length > 0) {
      console.log(`✅ Código encontrado en catálogo: ${codigoBarras}`);
      return resultado[0];
    }

    console.log(`ℹ️ Código no encontrado en catálogo: ${codigoBarras}`);
    return null;
  } catch (error) {
    console.error('❌ Error al buscar en catálogo:', error);
    return null;
  }
}

/**
 * Guardar o actualizar producto en catálogo
 * Si el código ya existe, incrementa vecesUsado y actualiza datos
 * Si no existe, crea nuevo registro
 */
export async function guardarEnCatalogo(datos: {
  codigoBarras: string;
  nombre: string;
  categoria?: string;
  marca?: string;
  presentacion?: string;
  unidadMedida?: string;
}): Promise<void> {
  try {
    // Verificar si ya existe
    const existente = await buscarEnCatalogo(datos.codigoBarras);

    if (existente) {
      // Actualizar registro existente
      await db
        .update(catalogoCodigos)
        .set({
          nombre: datos.nombre,
          categoria: datos.categoria || existente.categoria,
          marca: datos.marca || existente.marca,
          presentacion: datos.presentacion || existente.presentacion,
          unidadMedida: datos.unidadMedida || existente.unidadMedida,
          vecesUsado: (existente.vecesUsado || 0) + 1,
          ultimaActualizacion: new Date().toISOString(),
        })
        .where(eq(catalogoCodigos.codigoBarras, datos.codigoBarras));

      console.log(`🔄 Catálogo actualizado para: ${datos.codigoBarras} (usado ${(existente.vecesUsado || 0) + 1} veces)`);
    } else {
      // Crear nuevo registro
      const nuevoCatalogo: NuevoCatalogoCodigo = {
        codigoBarras: datos.codigoBarras,
        nombre: datos.nombre,
        categoria: datos.categoria,
        marca: datos.marca,
        presentacion: datos.presentacion,
        unidadMedida: datos.unidadMedida || 'Pieza',
        vecesUsado: 1,
      };

      await db.insert(catalogoCodigos).values(nuevoCatalogo);
      console.log(`✨ Nuevo producto agregado al catálogo: ${datos.codigoBarras}`);
    }
  } catch (error) {
    console.error('❌ Error al guardar en catálogo:', error);
    throw error;
  }
}

/**
 * Obtener productos más usados del catálogo
 * Útil para sugerencias o estadísticas
 */
export async function obtenerMasUsados(limit: number = 10): Promise<CatalogoCodigo[]> {
  try {
    const resultado = await db
      .select()
      .from(catalogoCodigos)
      .orderBy(catalogoCodigos.vecesUsado)
      .limit(limit);

    return resultado;
  } catch (error) {
    console.error('❌ Error al obtener productos más usados:', error);
    return [];
  }
}

/**
 * Limpiar catálogo (eliminar productos poco usados)
 * Útil para mantenimiento
 */
export async function limpiarCatalogo(vecesMinimo: number = 2): Promise<number> {
  try {
    const resultado = await db
      .delete(catalogoCodigos)
      .where(eq(catalogoCodigos.vecesUsado, vecesMinimo));

    console.log(`🧹 Catálogo limpiado: eliminados productos usados menos de ${vecesMinimo} veces`);
    return resultado.changes || 0;
  } catch (error) {
    console.error('❌ Error al limpiar catálogo:', error);
    return 0;
  }
}
