import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ============================================
// PRODUCTOS
// ============================================

export const productos = sqliteTable('productos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codigoBarras: text('codigo_barras').notNull().unique(),
  nombre: text('nombre').notNull(),
  precioCompra: real('precio_compra').default(0),
  precioVenta: real('precio_venta').notNull(),
  stock: integer('stock').default(0),
  stockMinimo: integer('stock_minimo').default(5),
  categoria: text('categoria'),
  marca: text('marca'),
  presentacion: text('presentacion'),
  descripcion: text('descripcion'),
  sku: text('sku'),
  unidadMedida: text('unidad_medida').default('Pieza'),
  activo: integer('activo', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

// ============================================
// VENTAS
// ============================================

export const ventas = sqliteTable('ventas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  total: real('total').notNull(),
  fecha: text('fecha').default('CURRENT_TIMESTAMP'),
  metodoPago: text('metodo_pago'),
  cajaId: integer('caja_id'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

export const ventaItems = sqliteTable('venta_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ventaId: integer('venta_id').notNull().references(() => ventas.id),
  productoId: integer('producto_id').notNull().references(() => productos.id),
  cantidad: integer('cantidad').notNull(),
  precioUnitario: real('precio_unitario').notNull()
});

// ============================================
// CAJA
// ============================================

export const cajas = sqliteTable('cajas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fechaApertura: text('fecha_apertura').default('CURRENT_TIMESTAMP'),
  fechaCierre: text('fecha_cierre'),
  montoInicial: real('monto_inicial').notNull(),
  montoFinal: real('monto_final'),
  montoEsperado: real('monto_esperado'),
  diferencia: real('diferencia'),
  estado: text('estado').default('abierta'),
  notas: text('notas')
});

export const movimientosCaja = sqliteTable('movimientos_caja', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cajaId: integer('caja_id').notNull().references(() => cajas.id),
  tipo: text('tipo').notNull(),
  monto: real('monto').notNull(),
  concepto: text('concepto'),
  fecha: text('fecha').default('CURRENT_TIMESTAMP')
});

// ============================================
// PROVEEDORES
// ============================================

export const proveedores = sqliteTable('proveedores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  contacto: text('contacto'),
  telefono: text('telefono'),
  email: text('email'),
  direccion: text('direccion'),
  rfc: text('rfc'),
  productosSuministra: text('productos_suministra'),
  diasEntrega: integer('dias_entrega').default(7),
  formaPago: text('forma_pago').default('Efectivo'),
  notas: text('notas'),
  activo: integer('activo', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
});

export const productosProveedores = sqliteTable('productos_proveedores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productoId: integer('producto_id').notNull().references(() => productos.id),
  proveedorId: integer('proveedor_id').notNull().references(() => proveedores.id),
  precioProveedor: real('precio_proveedor'),
  tiempoEntregaDias: integer('tiempo_entrega_dias').default(7),
  productoEstrella: integer('producto_estrella', { mode: 'boolean' }).default(false),
  notas: text('notas'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

// ============================================
// COMPRAS
// ============================================

export const compras = sqliteTable('compras', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  proveedorId: integer('proveedor_id').notNull().references(() => proveedores.id),
  folio: text('folio'),
  total: real('total').notNull(),
  fecha: text('fecha').default('CURRENT_TIMESTAMP'),
  fechaEntrega: text('fecha_entrega'),
  formaPago: text('forma_pago').default('Efectivo'),
  estado: text('estado').default('pendiente'), // pendiente, recibida, cancelada
  notas: text('notas'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
});

export const compraItems = sqliteTable('compra_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  compraId: integer('compra_id').notNull().references(() => compras.id),
  productoId: integer('producto_id').notNull().references(() => productos.id),
  cantidad: integer('cantidad').notNull(),
  precioUnitario: real('precio_unitario').notNull(),
  subtotal: real('subtotal').notNull()
});

// ============================================
// LISTA DE COMPRAS
// ============================================

export const listaCompras = sqliteTable('lista_compras', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productoId: integer('producto_id').notNull().references(() => productos.id),
  cantidadSugerida: integer('cantidad_sugerida').notNull(),
  cantidadComprar: integer('cantidad_comprar'),
  prioridad: text('prioridad').default('media'),
  estado: text('estado').default('pendiente'),
  notas: text('notas'),
  fechaAgregado: text('fecha_agregado').default('CURRENT_TIMESTAMP')
});

// ============================================
// CONFIGURACIÓN
// ============================================

export const configuracion = sqliteTable('configuracion', {
  id: integer('id').primaryKey(),
  nombreTienda: text('nombre_tienda').default('MI TIENDA'),
  direccion: text('direccion'),
  telefono: text('telefono'),
  email: text('email'),
  rfc: text('rfc'),
  mensajeTicket: text('mensaje_ticket'),
  logoBase64: text('logo_base64'),

  // Configuración de interfaz
  tema: text('tema').default('claro'),
  tamanoFuente: text('tamano_fuente').default('mediano'),

  // Configuración de POS
  ivaTasa: real('iva_tasa').default(16),
  aplicarIva: integer('aplicar_iva', { mode: 'boolean' }).default(true),
  permitirDescuentos: integer('permitir_descuentos', { mode: 'boolean' }).default(true),
  descuentoMaximo: real('descuento_maximo').default(50),
  controlStock: integer('control_stock', { mode: 'boolean' }).default(true),
  alertaStockBajo: integer('alerta_stock_bajo', { mode: 'boolean' }).default(true),
  imprimirTicketAutomatico: integer('imprimir_ticket_automatico', { mode: 'boolean' }).default(true),

  // Configuración de caja
  montoInicialRequerido: integer('monto_inicial_requerido', { mode: 'boolean' }).default(true),
  montoInicialMinimo: real('monto_inicial_minimo').default(500),

  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
});

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export type Producto = typeof productos.$inferSelect;
export type NuevoProducto = typeof productos.$inferInsert;
export type Venta = typeof ventas.$inferSelect;
export type NuevaVenta = typeof ventas.$inferInsert;
export type VentaItem = typeof ventaItems.$inferSelect;
export type NuevoVentaItem = typeof ventaItems.$inferInsert;
export type Caja = typeof cajas.$inferSelect;
export type NuevaCaja = typeof cajas.$inferInsert;
export type MovimientoCaja = typeof movimientosCaja.$inferSelect;
export type NuevoMovimientoCaja = typeof movimientosCaja.$inferInsert;
export type Proveedor = typeof proveedores.$inferSelect;
export type NuevoProveedor = typeof proveedores.$inferInsert;
export type ProductoProveedor = typeof productosProveedores.$inferSelect;
export type NuevoProductoProveedor = typeof productosProveedores.$inferInsert;
export type Compra = typeof compras.$inferSelect;
export type NuevaCompra = typeof compras.$inferInsert;
export type CompraItem = typeof compraItems.$inferSelect;
export type NuevoCompraItem = typeof compraItems.$inferInsert;
export type ItemListaCompras = typeof listaCompras.$inferSelect;
export type NuevoItemListaCompras = typeof listaCompras.$inferInsert;
export type Configuracion = typeof configuracion.$inferSelect;
export type NuevaConfiguracion = typeof configuracion.$inferInsert;
