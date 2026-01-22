import { eq, desc, like, and, sql } from 'drizzle-orm';
import { db } from './index';
import * as schema from './schema';
import type {
  Producto,
  NuevoProducto,
  Venta,
  NuevaVenta,
  VentaItem,
  NuevoVentaItem,
  Configuracion
} from './schema';

// ============================================
// PRODUCTOS
// ============================================

export async function obtenerProductos() {
  return await db.select().from(schema.productos).where(eq(schema.productos.activo, true));
}

export async function obtenerProductoPorId(id: number) {
  const result = await db.select().from(schema.productos).where(eq(schema.productos.id, id));
  return result[0] || null;
}

export async function obtenerProductoPorCodigoBarras(codigoBarras: string) {
  const result = await db.select()
    .from(schema.productos)
    .where(and(
      eq(schema.productos.codigoBarras, codigoBarras),
      eq(schema.productos.activo, true)
    ));
  return result[0] || null;
}

export async function buscarProductos(query: string) {
  return await db.select()
    .from(schema.productos)
    .where(and(
      like(schema.productos.nombre, `%${query}%`),
      eq(schema.productos.activo, true)
    ));
}

export async function crearProducto(producto: NuevoProducto) {
  const result = await db.insert(schema.productos).values(producto).returning();
  return result[0];
}

export async function actualizarProducto(id: number, datos: Partial<NuevoProducto>) {
  const result = await db.update(schema.productos)
    .set(datos)
    .where(eq(schema.productos.id, id))
    .returning();
  return result[0];
}

export async function eliminarProducto(id: number) {
  // Soft delete
  return await actualizarProducto(id, { activo: false });
}

export async function actualizarStock(id: number, cantidad: number) {
  const producto = await obtenerProductoPorId(id);
  if (!producto) throw new Error('Producto no encontrado');

  const nuevoStock = (producto.stock || 0) + cantidad;
  return await actualizarProducto(id, { stock: nuevoStock });
}

export async function obtenerProductosStockBajo() {
  return await db.select()
    .from(schema.productos)
    .where(and(
      sql`${schema.productos.stock} <= ${schema.productos.stockMinimo}`,
      eq(schema.productos.activo, true)
    ));
}

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida si hay suficiente stock para una venta
 */
export async function validarStockDisponible(
  items: Array<{ productoId: number; cantidad: number }>
): Promise<{ valido: boolean; errores: string[] }> {
  const errores: string[] = [];

  for (const item of items) {
    const producto = await obtenerProductoPorId(item.productoId);
    if (!producto) {
      errores.push(`Producto con ID ${item.productoId} no encontrado`);
      continue;
    }

    const stockActual = producto.stock || 0;
    if (stockActual < item.cantidad) {
      errores.push(
        `Stock insuficiente para ${producto.nombre}. Disponible: ${stockActual}, Solicitado: ${item.cantidad}`
      );
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Valida si existe una caja abierta
 */
export async function validarCajaAbierta(): Promise<{ valido: boolean; caja: any | null }> {
  const caja = await obtenerCajaActual();
  return {
    valido: caja !== null,
    caja
  };
}

/**
 * Valida los precios de un producto
 */
export function validarPreciosProducto(
  precioCompra: number,
  precioVenta: number
): { valido: boolean; advertencias: string[] } {
  const advertencias: string[] = [];

  if (precioVenta <= 0) {
    advertencias.push('El precio de venta debe ser mayor a 0');
  }

  if (precioCompra < 0) {
    advertencias.push('El precio de compra no puede ser negativo');
  }

  if (precioCompra > precioVenta) {
    advertencias.push('El precio de compra es mayor al precio de venta (generará pérdidas)');
  }

  const margen = precioVenta > 0 ? ((precioVenta - precioCompra) / precioVenta) * 100 : 0;
  if (margen < 10 && margen >= 0) {
    advertencias.push(`Margen de ganancia muy bajo (${margen.toFixed(1)}%)`);
  }

  return {
    valido: precioVenta > 0 && precioCompra >= 0,
    advertencias
  };
}

// ============================================
// VENTAS
// ============================================

export async function crearVenta(
  venta: NuevaVenta,
  items: Array<Omit<NuevoVentaItem, 'ventaId'>>
) {
  // VALIDACIÓN CRÍTICA: Verificar stock antes de crear la venta
  const validacion = await validarStockDisponible(items);
  if (!validacion.valido) {
    throw new Error(`Error de stock: ${validacion.errores.join(', ')}`);
  }

  // TODO: Implementar transacción completa cuando expo-sqlite soporte transacciones
  // Por ahora, usamos el enfoque secuencial con validación previa

  try {
    // Crear la venta
    const ventaCreada = await db.insert(schema.ventas).values(venta).returning();
    const ventaId = ventaCreada[0].id;

    // Crear los items de la venta
    const itemsConVentaId = items.map(item => ({
      ...item,
      ventaId
    }));

    await db.insert(schema.ventaItems).values(itemsConVentaId);

    // Actualizar el stock de los productos
    for (const item of items) {
      await actualizarStock(item.productoId, -item.cantidad);
    }

    return ventaCreada[0];
  } catch (error) {
    // Si algo falla, el error se propaga
    // En una transacción real, aquí se haría rollback automático
    throw new Error(`Error al crear venta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function obtenerVentas(limite = 50) {
  return await db.select()
    .from(schema.ventas)
    .orderBy(desc(schema.ventas.fecha))
    .limit(limite);
}

export async function obtenerVentaPorId(id: number) {
  const result = await db.select().from(schema.ventas).where(eq(schema.ventas.id, id));
  return result[0] || null;
}

export async function obtenerDetallesVenta(ventaId: number) {
  return await db.select({
    id: schema.ventaItems.id,
    cantidad: schema.ventaItems.cantidad,
    precioUnitario: schema.ventaItems.precioUnitario,
    subtotal: sql<number>`${schema.ventaItems.cantidad} * ${schema.ventaItems.precioUnitario}`,
    producto: schema.productos
  })
  .from(schema.ventaItems)
  .leftJoin(schema.productos, eq(schema.ventaItems.productoId, schema.productos.id))
  .where(eq(schema.ventaItems.ventaId, ventaId));
}

export async function obtenerVentasDelDia() {
  const hoy = new Date().toISOString().split('T')[0];
  return await db.select()
    .from(schema.ventas)
    .where(sql`DATE(${schema.ventas.fecha}) = ${hoy}`)
    .orderBy(desc(schema.ventas.fecha));
}

export async function obtenerTotalVentasDelDia() {
  const hoy = new Date().toISOString().split('T')[0];
  const result = await db.select({
    total: sql<number>`COALESCE(SUM(${schema.ventas.total}), 0)`
  })
  .from(schema.ventas)
  .where(sql`DATE(${schema.ventas.fecha}) = ${hoy}`);

  return result[0]?.total || 0;
}

export async function obtenerVentasPorRango(fechaInicio: Date, fechaFin: Date) {
  return await db.select()
    .from(schema.ventas)
    .where(
      and(
        sql`${schema.ventas.fecha} >= ${fechaInicio.toISOString()}`,
        sql`${schema.ventas.fecha} <= ${fechaFin.toISOString()}`
      )
    )
    .orderBy(desc(schema.ventas.fecha));
}

/**
 * Revierte una venta (cancela y devuelve stock)
 * IMPORTANTE: Solo debe usarse para cancelaciones autorizadas
 */
export async function revertirVenta(ventaId: number, motivo: string = 'Cancelación') {
  try {
    // Obtener la venta
    const venta = await obtenerVentaPorId(ventaId);
    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    // Obtener los items de la venta
    const items = await obtenerDetallesVenta(ventaId);

    // Devolver el stock de cada producto
    for (const item of items) {
      if (item.producto) {
        await actualizarStock(item.producto.id, item.cantidad);
      }
    }

    // Marcar la venta como cancelada agregando nota
    // Como no tenemos campo 'estado' en ventas, registramos en movimientos de caja
    const cajaActual = await obtenerCajaActual();
    if (cajaActual && venta.metodoPago === 'efectivo') {
      await registrarMovimientoCaja(
        cajaActual.id,
        'retiro',
        venta.total,
        `Cancelación de venta #${ventaId}: ${motivo}`
      );
    }

    return {
      exito: true,
      mensaje: `Venta #${ventaId} revertida correctamente`,
      stockDevuelto: items.length
    };
  } catch (error) {
    throw new Error(`Error al revertir venta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Función removida: el campo ticketImpreso no existe en el nuevo esquema
// Si se necesita en el futuro, agregar el campo a la tabla ventas

// ============================================
// CONFIGURACIÓN
// ============================================

export async function obtenerConfiguracion() {
  const result = await db.select().from(schema.configuracion).limit(1);
  return result[0] || null;
}

export async function actualizarConfiguracion(datos: Partial<Configuracion>) {
  const config = await obtenerConfiguracion();
  if (!config) {
    throw new Error('No existe configuración');
  }

  const result = await db.update(schema.configuracion)
    .set(datos)
    .where(eq(schema.configuracion.id, config.id))
    .returning();
  return result[0];
}

// ============================================
// REPORTES
// ============================================

export async function obtenerProductosMasVendidos(limite = 10) {
  return await db.select({
    producto: schema.productos,
    totalVendido: sql<number>`SUM(${schema.ventaItems.cantidad})`,
    totalIngresos: sql<number>`SUM(${schema.ventaItems.cantidad} * ${schema.ventaItems.precioUnitario})`
  })
  .from(schema.ventaItems)
  .leftJoin(schema.productos, eq(schema.ventaItems.productoId, schema.productos.id))
  .groupBy(schema.ventaItems.productoId)
  .orderBy(desc(sql`SUM(${schema.ventaItems.cantidad})`))
  .limit(limite);
}

export async function obtenerResumenVentas(fechaInicio: string, fechaFin: string) {
  const result = await db.select({
    totalVentas: sql<number>`COUNT(*)`,
    totalIngresos: sql<number>`COALESCE(SUM(${schema.ventas.total}), 0)`,
    totalEfectivo: sql<number>`COALESCE(SUM(CASE WHEN ${schema.ventas.metodoPago} = 'efectivo' THEN ${schema.ventas.total} ELSE 0 END), 0)`,
    totalTarjeta: sql<number>`COALESCE(SUM(CASE WHEN ${schema.ventas.metodoPago} = 'tarjeta' THEN ${schema.ventas.total} ELSE 0 END), 0)`,
    totalTransferencia: sql<number>`COALESCE(SUM(CASE WHEN ${schema.ventas.metodoPago} = 'transferencia' THEN ${schema.ventas.total} ELSE 0 END), 0)`
  })
  .from(schema.ventas)
  .where(sql`DATE(${schema.ventas.fecha}) BETWEEN ${fechaInicio} AND ${fechaFin}`);

  return result[0];
}

// ============================================
// CAJAS (Control de Caja)
// ============================================

export async function abrirCaja(montoInicial: number, notas?: string) {
  const result = await db.insert(schema.cajas).values({
    montoInicial,
    estado: 'abierta',
    notas
  }).returning();
  return result[0];
}

/**
 * Obtiene el resumen completo de una caja incluyendo movimientos
 */
export async function obtenerResumenCompletoCaja(cajaId: number) {
  const caja = await db.select().from(schema.cajas).where(eq(schema.cajas.id, cajaId));
  if (!caja[0]) throw new Error('Caja no encontrada');

  // Ventas de esta caja específica (filtrado por cajaId)
  const ventasCaja = await db.select({
    totalVentas: sql<number>`COUNT(*)`,
    totalIngresos: sql<number>`COALESCE(SUM(${schema.ventas.total}), 0)`,
    totalEfectivo: sql<number>`COALESCE(SUM(CASE WHEN ${schema.ventas.metodoPago} = 'efectivo' THEN ${schema.ventas.total} ELSE 0 END), 0)`,
    totalTarjeta: sql<number>`COALESCE(SUM(CASE WHEN ${schema.ventas.metodoPago} = 'tarjeta' THEN ${schema.ventas.total} ELSE 0 END), 0)`,
    totalTransferencia: sql<number>`COALESCE(SUM(CASE WHEN ${schema.ventas.metodoPago} = 'transferencia' THEN ${schema.ventas.total} ELSE 0 END), 0)`
  })
  .from(schema.ventas)
  .where(eq(schema.ventas.cajaId, cajaId));

  const resumen = ventasCaja[0];

  // Movimientos de caja (retiros y depósitos)
  const movimientos = await db.select({
    totalRetiros: sql<number>`COALESCE(SUM(CASE WHEN ${schema.movimientosCaja.tipo} = 'retiro' THEN ${schema.movimientosCaja.monto} ELSE 0 END), 0)`,
    totalDepositos: sql<number>`COALESCE(SUM(CASE WHEN ${schema.movimientosCaja.tipo} = 'deposito' THEN ${schema.movimientosCaja.monto} ELSE 0 END), 0)`,
    numeroMovimientos: sql<number>`COUNT(*)`
  })
  .from(schema.movimientosCaja)
  .where(eq(schema.movimientosCaja.cajaId, cajaId));

  const mov = movimientos[0];

  // Cálculo correcto del monto esperado:
  // Monto Inicial + Ventas en Efectivo + Depósitos - Retiros
  const montoEsperado =
    caja[0].montoInicial +
    resumen.totalEfectivo +
    mov.totalDepositos -
    mov.totalRetiros;

  return {
    caja: caja[0],
    ventas: resumen,
    movimientos: mov,
    montoEsperado
  };
}

export async function cerrarCaja(cajaId: number, montoFinal: number, notas?: string) {
  // Obtener resumen completo incluyendo movimientos
  const resumen = await obtenerResumenCompletoCaja(cajaId);

  const montoEsperado = resumen.montoEsperado;
  const diferencia = montoFinal - montoEsperado;

  const result = await db.update(schema.cajas)
    .set({
      fechaCierre: new Date().toISOString(),
      montoFinal,
      montoEsperado,
      diferencia,
      estado: 'cerrada',
      notas
    })
    .where(eq(schema.cajas.id, cajaId))
    .returning();

  return result[0];
}

export async function obtenerCajaActual() {
  const result = await db.select()
    .from(schema.cajas)
    .where(eq(schema.cajas.estado, 'abierta'))
    .orderBy(desc(schema.cajas.fechaApertura))
    .limit(1);

  return result[0] || null;
}

export async function obtenerHistorialCajas(limite = 30) {
  return await db.select()
    .from(schema.cajas)
    .orderBy(desc(schema.cajas.fechaApertura))
    .limit(limite);
}

export async function registrarMovimientoCaja(cajaId: number, tipo: string, monto: number, concepto?: string) {
  const result = await db.insert(schema.movimientosCaja).values({
    cajaId,
    tipo,
    monto,
    concepto
  }).returning();
  return result[0];
}

export async function obtenerMovimientosCaja(cajaId: number) {
  return await db.select()
    .from(schema.movimientosCaja)
    .where(eq(schema.movimientosCaja.cajaId, cajaId))
    .orderBy(desc(schema.movimientosCaja.fecha));
}

// ============================================
// PROVEEDORES
// ============================================

export async function obtenerProveedores() {
  return await db.select().from(schema.proveedores).where(eq(schema.proveedores.activo, true));
}

export async function obtenerProveedorPorId(id: number) {
  const result = await db.select().from(schema.proveedores).where(eq(schema.proveedores.id, id));
  return result[0] || null;
}

export async function buscarProveedores(query: string) {
  return await db.select()
    .from(schema.proveedores)
    .where(and(
      like(schema.proveedores.nombre, `%${query}%`),
      eq(schema.proveedores.activo, true)
    ));
}

export async function crearProveedor(proveedor: typeof schema.proveedores.$inferInsert) {
  const result = await db.insert(schema.proveedores).values(proveedor).returning();
  return result[0];
}

export async function actualizarProveedor(id: number, datos: Partial<typeof schema.proveedores.$inferInsert>) {
  const result = await db.update(schema.proveedores)
    .set({ ...datos, updatedAt: new Date().toISOString() })
    .where(eq(schema.proveedores.id, id))
    .returning();
  return result[0];
}

export async function eliminarProveedor(id: number) {
  // Soft delete
  return await actualizarProveedor(id, { activo: false });
}

// ============================================
// PRODUCTOS-PROVEEDORES
// ============================================

export async function vincularProductoProveedor(
  productoId: number,
  proveedorId: number,
  datos?: Partial<typeof schema.productosProveedores.$inferInsert>
) {
  const result = await db.insert(schema.productosProveedores).values({
    productoId,
    proveedorId,
    ...datos
  }).returning();
  return result[0];
}

export async function obtenerProveedoresDeProducto(productoId: number) {
  return await db.select({
    id: schema.productosProveedores.id,
    precioProveedor: schema.productosProveedores.precioProveedor,
    tiempoEntregaDias: schema.productosProveedores.tiempoEntregaDias,
    productoEstrella: schema.productosProveedores.productoEstrella,
    notas: schema.productosProveedores.notas,
    proveedor: schema.proveedores
  })
  .from(schema.productosProveedores)
  .leftJoin(schema.proveedores, eq(schema.productosProveedores.proveedorId, schema.proveedores.id))
  .where(eq(schema.productosProveedores.productoId, productoId));
}

export async function obtenerProductosDeProveedor(proveedorId: number) {
  return await db.select({
    id: schema.productosProveedores.id,
    precioProveedor: schema.productosProveedores.precioProveedor,
    tiempoEntregaDias: schema.productosProveedores.tiempoEntregaDias,
    productoEstrella: schema.productosProveedores.productoEstrella,
    notas: schema.productosProveedores.notas,
    producto: schema.productos
  })
  .from(schema.productosProveedores)
  .leftJoin(schema.productos, eq(schema.productosProveedores.productoId, schema.productos.id))
  .where(eq(schema.productosProveedores.proveedorId, proveedorId));
}

export async function desvincularProductoProveedor(id: number) {
  await db.delete(schema.productosProveedores).where(eq(schema.productosProveedores.id, id));
}

// ============================================
// COMPRAS
// ============================================

export async function crearCompra(
  compra: typeof schema.compras.$inferInsert,
  items: Array<Omit<typeof schema.compraItems.$inferInsert, 'compraId'>>
) {
  // NOTA: Idealmente esto debería estar en una transacción
  // expo-sqlite en versiones futuras podría soportar db.transaction()
  // Por ahora usamos enfoque secuencial con manejo de errores

  try {
    // Validar que existan los productos
    for (const item of items) {
      const producto = await obtenerProductoPorId(item.productoId);
      if (!producto) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }
    }

    // Crear la compra
    const compraCreada = await db.insert(schema.compras).values(compra).returning();
    const compraId = compraCreada[0].id;

    // Crear los items de la compra
    const itemsConCompraId = items.map(item => ({
      ...item,
      compraId
    }));

    await db.insert(schema.compraItems).values(itemsConCompraId);

    return compraCreada[0];
  } catch (error) {
    throw new Error(`Error al crear compra: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function obtenerCompras(limite = 50) {
  return await db.select({
    compra: schema.compras,
    proveedor: schema.proveedores
  })
  .from(schema.compras)
  .leftJoin(schema.proveedores, eq(schema.compras.proveedorId, schema.proveedores.id))
  .orderBy(desc(schema.compras.fecha))
  .limit(limite);
}

export async function obtenerCompraPorId(id: number) {
  const result = await db.select({
    compra: schema.compras,
    proveedor: schema.proveedores
  })
  .from(schema.compras)
  .leftJoin(schema.proveedores, eq(schema.compras.proveedorId, schema.proveedores.id))
  .where(eq(schema.compras.id, id));

  return result[0] || null;
}

export async function obtenerDetallesCompra(compraId: number) {
  return await db.select({
    id: schema.compraItems.id,
    cantidad: schema.compraItems.cantidad,
    precioUnitario: schema.compraItems.precioUnitario,
    subtotal: schema.compraItems.subtotal,
    producto: schema.productos
  })
  .from(schema.compraItems)
  .leftJoin(schema.productos, eq(schema.compraItems.productoId, schema.productos.id))
  .where(eq(schema.compraItems.compraId, compraId));
}

export async function actualizarCompra(id: number, datos: Partial<typeof schema.compras.$inferInsert>) {
  const result = await db.update(schema.compras)
    .set({ ...datos, updatedAt: new Date().toISOString() })
    .where(eq(schema.compras.id, id))
    .returning();
  return result[0];
}

export async function marcarCompraRecibida(compraId: number) {
  const detalles = await obtenerDetallesCompra(compraId);

  // Actualizar stock de productos
  for (const detalle of detalles) {
    if (detalle.producto) {
      await actualizarStock(detalle.producto.id, detalle.cantidad);
    }
  }

  // Marcar compra como recibida
  return await actualizarCompra(compraId, { estado: 'recibida' });
}

export async function cancelarCompra(compraId: number) {
  return await actualizarCompra(compraId, { estado: 'cancelada' });
}

// ============================================
// LISTA DE COMPRAS
// ============================================

export async function obtenerListaCompras() {
  return await db.select({
    id: schema.listaCompras.id,
    cantidadSugerida: schema.listaCompras.cantidadSugerida,
    cantidadComprar: schema.listaCompras.cantidadComprar,
    prioridad: schema.listaCompras.prioridad,
    estado: schema.listaCompras.estado,
    notas: schema.listaCompras.notas,
    fechaAgregado: schema.listaCompras.fechaAgregado,
    producto: schema.productos
  })
  .from(schema.listaCompras)
  .leftJoin(schema.productos, eq(schema.listaCompras.productoId, schema.productos.id))
  .where(eq(schema.listaCompras.estado, 'pendiente'))
  .orderBy(desc(schema.listaCompras.prioridad));
}

export async function agregarAListaCompras(
  productoId: number,
  cantidadSugerida: number,
  prioridad: string = 'media',
  notas?: string
) {
  const result = await db.insert(schema.listaCompras).values({
    productoId,
    cantidadSugerida,
    prioridad,
    notas,
    estado: 'pendiente'
  }).returning();
  return result[0];
}

export async function actualizarItemListaCompras(
  id: number,
  datos: Partial<typeof schema.listaCompras.$inferInsert>
) {
  const result = await db.update(schema.listaCompras)
    .set(datos)
    .where(eq(schema.listaCompras.id, id))
    .returning();
  return result[0];
}

export async function eliminarDeListaCompras(id: number) {
  await db.delete(schema.listaCompras).where(eq(schema.listaCompras.id, id));
}

export async function generarListaComprasAutomatica() {
  // Obtener productos con stock bajo
  const productosBajoStock = await obtenerProductosStockBajo();

  // Agregar a lista de compras si no están ya
  for (const producto of productosBajoStock) {
    const yaEnLista = await db.select()
      .from(schema.listaCompras)
      .where(and(
        eq(schema.listaCompras.productoId, producto.id),
        eq(schema.listaCompras.estado, 'pendiente')
      ));

    if (yaEnLista.length === 0) {
      const cantidadSugerida = (producto.stockMinimo || 5) * 3 - (producto.stock || 0);
      await agregarAListaCompras(
        producto.id,
        cantidadSugerida,
        'alta',
        'Generado automáticamente por stock bajo'
      );
    }
  }

  return await obtenerListaCompras();
}

// ============================================
// REPORTES DE GANANCIAS E INVERSIONES
// ============================================

export async function obtenerGananciasDelDia() {
  const hoy = new Date().toISOString().split('T')[0];

  const result = await db.select({
    totalVentas: sql<number>`COALESCE(SUM(${schema.ventaItems.cantidad} * ${schema.ventaItems.precioUnitario}), 0)`,
    totalCosto: sql<number>`COALESCE(SUM(${schema.ventaItems.cantidad} * ${schema.productos.precioCompra}), 0)`,
    gananciaTotal: sql<number>`COALESCE(SUM(${schema.ventaItems.cantidad} * (${schema.ventaItems.precioUnitario} - ${schema.productos.precioCompra})), 0)`,
    unidadesVendidas: sql<number>`COALESCE(SUM(${schema.ventaItems.cantidad}), 0)`
  })
  .from(schema.ventaItems)
  .leftJoin(schema.productos, eq(schema.ventaItems.productoId, schema.productos.id))
  .leftJoin(schema.ventas, eq(schema.ventaItems.ventaId, schema.ventas.id))
  .where(sql`DATE(${schema.ventas.fecha}) = ${hoy}`);

  const datos = result[0];
  const margenPorcentaje = datos.totalVentas > 0
    ? ((datos.gananciaTotal / datos.totalVentas) * 100)
    : 0;

  return {
    ...datos,
    margenPorcentaje
  };
}

export async function obtenerGananciasPorPeriodo(fechaInicio: string, fechaFin: string) {
  const result = await db.select({
    totalVentas: sql<number>`COALESCE(SUM(${schema.ventaItems.cantidad} * ${schema.ventaItems.precioUnitario}), 0)`,
    totalCosto: sql<number>`COALESCE(SUM(${schema.ventaItems.cantidad} * ${schema.productos.precioCompra}), 0)`,
    gananciaTotal: sql<number>`COALESCE(SUM(${schema.ventaItems.cantidad} * (${schema.ventaItems.precioUnitario} - ${schema.productos.precioCompra})), 0)`,
    unidadesVendidas: sql<number>`COALESCE(SUM(${schema.ventaItems.cantidad}), 0)`
  })
  .from(schema.ventaItems)
  .leftJoin(schema.productos, eq(schema.ventaItems.productoId, schema.productos.id))
  .leftJoin(schema.ventas, eq(schema.ventaItems.ventaId, schema.ventas.id))
  .where(sql`DATE(${schema.ventas.fecha}) BETWEEN ${fechaInicio} AND ${fechaFin}`);

  const datos = result[0];
  const margenPorcentaje = datos.totalVentas > 0
    ? ((datos.gananciaTotal / datos.totalVentas) * 100)
    : 0;

  return {
    ...datos,
    margenPorcentaje
  };
}

export async function obtenerProductosMasRentables(limite = 10) {
  return await db.select({
    producto: schema.productos,
    totalVendido: sql<number>`SUM(${schema.ventaItems.cantidad})`,
    totalIngresos: sql<number>`SUM(${schema.ventaItems.cantidad} * ${schema.ventaItems.precioUnitario})`,
    totalCosto: sql<number>`SUM(${schema.ventaItems.cantidad} * ${schema.productos.precioCompra})`,
    gananciaTotal: sql<number>`SUM(${schema.ventaItems.cantidad} * (${schema.ventaItems.precioUnitario} - ${schema.productos.precioCompra}))`,
    margenPorcentaje: sql<number>`CASE
      WHEN SUM(${schema.ventaItems.cantidad} * ${schema.ventaItems.precioUnitario}) > 0
      THEN (SUM(${schema.ventaItems.cantidad} * (${schema.ventaItems.precioUnitario} - ${schema.productos.precioCompra})) * 100.0) / SUM(${schema.ventaItems.cantidad} * ${schema.ventaItems.precioUnitario})
      ELSE 0
    END`
  })
  .from(schema.ventaItems)
  .leftJoin(schema.productos, eq(schema.ventaItems.productoId, schema.productos.id))
  .groupBy(schema.ventaItems.productoId)
  .orderBy(desc(sql`SUM(${schema.ventaItems.cantidad} * (${schema.ventaItems.precioUnitario} - ${schema.productos.precioCompra}))`))
  .limit(limite);
}

export async function obtenerInversionEnInventario() {
  const result = await db.select({
    totalProductos: sql<number>`COUNT(*)`,
    totalUnidades: sql<number>`COALESCE(SUM(${schema.productos.stock}), 0)`,
    inversionTotal: sql<number>`COALESCE(SUM(${schema.productos.stock} * ${schema.productos.precioCompra}), 0)`,
    valorVentaPotencial: sql<number>`COALESCE(SUM(${schema.productos.stock} * ${schema.productos.precioVenta}), 0)`,
    gananciaPotencial: sql<number>`COALESCE(SUM(${schema.productos.stock} * (${schema.productos.precioVenta} - ${schema.productos.precioCompra})), 0)`
  })
  .from(schema.productos)
  .where(eq(schema.productos.activo, true));

  return result[0];
}

export async function obtenerInversionPorCategoria() {
  return await db.select({
    categoria: schema.productos.categoria,
    totalProductos: sql<number>`COUNT(*)`,
    totalUnidades: sql<number>`COALESCE(SUM(${schema.productos.stock}), 0)`,
    inversionTotal: sql<number>`COALESCE(SUM(${schema.productos.stock} * ${schema.productos.precioCompra}), 0)`,
    valorVentaPotencial: sql<number>`COALESCE(SUM(${schema.productos.stock} * ${schema.productos.precioVenta}), 0)`,
    gananciaPotencial: sql<number>`COALESCE(SUM(${schema.productos.stock} * (${schema.productos.precioVenta} - ${schema.productos.precioCompra})), 0)`
  })
  .from(schema.productos)
  .where(eq(schema.productos.activo, true))
  .groupBy(schema.productos.categoria)
  .orderBy(desc(sql`SUM(${schema.productos.stock} * ${schema.productos.precioCompra})`));
}

export async function obtenerResumenFinanciero(fechaInicio: string, fechaFin: string) {
  // Ganancias por ventas
  const ganancias = await obtenerGananciasPorPeriodo(fechaInicio, fechaFin);

  // Inversión en compras del periodo
  const comprasResult = await db.select({
    totalCompras: sql<number>`COALESCE(SUM(${schema.compras.total}), 0)`,
    numeroCompras: sql<number>`COUNT(*)`
  })
  .from(schema.compras)
  .where(and(
    sql`DATE(${schema.compras.fecha}) BETWEEN ${fechaInicio} AND ${fechaFin}`,
    eq(schema.compras.estado, 'recibida')
  ));

  // Inversión actual en inventario
  const inventario = await obtenerInversionEnInventario();

  return {
    periodo: { fechaInicio, fechaFin },
    ventas: ganancias,
    compras: comprasResult[0],
    inventario,
    balanceNeto: ganancias.gananciaTotal - comprasResult[0].totalCompras
  };
}

// ============================================
// CATÁLOGO DE PRODUCTOS
// ============================================

/**
 * Carga el catálogo inicial de productos mexicanos desde el JSON
 * Los productos se cargan como inactivos (activo=0) para que el dueño configure precios
 */
export async function cargarCatalogoInicial() {
  try {
    // Importar el catálogo desde el archivo JSON
    const catalogoCompleto = require('../../assets/productos/catalogo-mexico-completo.json');

    let cargados = 0;
    let omitidos = 0;
    const errores: string[] = [];

    for (const producto of catalogoCompleto) {
      try {
        // Verificar si ya existe el código de barras
        const existe = await db.select()
          .from(schema.productos)
          .where(eq(schema.productos.codigoBarras, producto.codigo_barras))
          .limit(1);

        if (existe.length > 0) {
          omitidos++;
          continue;
        }

        // Insertar producto con precios en 0 y stock en 0 (inactivo por defecto)
        await db.insert(schema.productos).values({
          nombre: producto.nombre,
          codigoBarras: producto.codigo_barras,
          marca: producto.marca || null,
          presentacion: producto.presentacion || null,
          categoria: producto.categoria || 'General',
          descripcion: producto.descripcion || null,
          unidadMedida: producto.unidad_medida || 'pieza',
          precioCompra: 0,
          precioVenta: 0,
          stock: 0,
          stockMinimo: 5,
          activo: false // Inactivo hasta que el dueño configure precios
        });

        cargados++;
      } catch (error) {
        errores.push(`Error al cargar ${producto.nombre}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    return {
      exito: true,
      mensaje: `Catálogo cargado exitosamente`,
      cargados,
      omitidos,
      total: catalogoCompleto.length,
      errores: errores.length > 0 ? errores : undefined
    };
  } catch (error) {
    throw new Error(`Error al cargar catálogo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Obtiene todos los productos del catálogo (incluye inactivos)
 * Útil para mostrar el catálogo completo al dueño
 */
export async function obtenerCatalogoCompleto(filtro?: {
  categoria?: string;
  marca?: string;
  activo?: boolean;
  busqueda?: string;
}) {
  const condiciones = [];

  if (filtro?.categoria) {
    condiciones.push(eq(schema.productos.categoria, filtro.categoria));
  }

  if (filtro?.marca) {
    condiciones.push(eq(schema.productos.marca, filtro.marca));
  }

  if (filtro?.activo !== undefined) {
    condiciones.push(eq(schema.productos.activo, filtro.activo));
  }

  if (filtro?.busqueda) {
    condiciones.push(like(schema.productos.nombre, `%${filtro.busqueda}%`));
  }

  if (condiciones.length > 0) {
    return await db.select().from(schema.productos).where(and(...condiciones));
  }

  return await db.select().from(schema.productos);
}

/**
 * Activa un producto del catálogo después de configurar precios
 */
export async function activarProductoCatalogo(
  id: number,
  precioCompra: number,
  precioVenta: number,
  stock: number,
  stockMinimo?: number
) {
  // Validar precios
  const validacion = validarPreciosProducto(precioCompra, precioVenta);
  if (!validacion.valido) {
    throw new Error('Precios inválidos: ' + validacion.advertencias.join(', '));
  }

  const result = await db.update(schema.productos)
    .set({
      precioCompra,
      precioVenta,
      stock,
      stockMinimo: stockMinimo || 5,
      activo: true
    })
    .where(eq(schema.productos.id, id))
    .returning();

  return result[0];
}
