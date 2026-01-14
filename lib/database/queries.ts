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
// VENTAS
// ============================================

export async function crearVenta(
  venta: NuevaVenta,
  items: Array<Omit<NuevoVentaItem, 'ventaId'>>
) {
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

export async function cerrarCaja(cajaId: number, montoFinal: number, notas?: string) {
  const caja = await db.select().from(schema.cajas).where(eq(schema.cajas.id, cajaId));
  if (!caja[0]) throw new Error('Caja no encontrada');

  const resumen = await obtenerResumenVentas(
    caja[0].fechaApertura!.split('T')[0],
    new Date().toISOString().split('T')[0]
  );

  const montoEsperado = caja[0].montoInicial + resumen.totalEfectivo;
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
