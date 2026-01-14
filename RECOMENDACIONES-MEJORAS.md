# 📋 Recomendaciones y Mejoras - TiendaPOS Mobile

> Análisis completo del backend y recomendaciones profesionales
> Fecha: 2026-01-14

## 🎯 Resumen Ejecutivo

**Estado General:** 75% Funcional - 25% Mejoras Críticas Necesarias

La aplicación tiene una base sólida, pero necesita correcciones críticas en:
1. Validación de datos antes de operaciones
2. Transacciones para mantener integridad
3. Optimización de base de datos
4. Funciones faltantes para operaciones comunes

---

## 🔴 PROBLEMAS CRÍTICOS (ALTA PRIORIDAD)

### 1. **Falta Validación de Stock en Ventas**

**Problema:**
```typescript
// lib/database/queries.ts línea 85-107
export async function crearVenta(venta, items) {
  // ❌ No valida si hay stock suficiente
  // Si stock=5 y vendo 10, queda en negativo
}
```

**Solución:**
```typescript
export async function crearVenta(venta, items) {
  // Validar stock ANTES de crear venta
  for (const item of items) {
    const producto = await obtenerProductoPorId(item.productoId);
    if (producto.stock < item.cantidad) {
      throw new Error(`Stock insuficiente para ${producto.nombre}`);
    }
  }
  // Continuar con la venta...
}
```

**Impacto:** Stock negativo = inventario incorrecto = pérdidas no detectadas

---

### 2. **Cálculo de Caja Incorrecto**

**Problema:**
```typescript
// lib/database/queries.ts línea 226-229
const montoEsperado = caja[0].montoInicial + resumen.totalEfectivo;
// ❌ No considera movimientos de caja (retiros, depósitos)
```

**Solución:**
```typescript
const montoEsperado =
  caja[0].montoInicial +
  resumen.totalEfectivo +
  totalDepositos -
  totalRetiros;
```

**Impacto:** Diferencia de caja incorrecta = no detecta faltantes reales

---

### 3. **Sin Transacciones en Operaciones Compuestas**

**Problema:**
```typescript
// Si crearVenta() falla después de insertar venta_items
// Los items quedan huérfanos en la base de datos
```

**Solución:**
```typescript
export async function crearVenta(venta, items) {
  return await db.transaction(async (tx) => {
    // Crear venta
    const [nuevaVenta] = await tx.insert(schema.ventas)...

    // Insertar items
    await tx.insert(schema.ventaItems)...

    // Actualizar stock
    for (const item of items) {
      await tx.update(schema.productos)...
    }

    return nuevaVenta;
  });
}
```

**Impacto:** Datos inconsistentes si algo falla a mitad de operación

---

### 4. **Sin Índices en Base de Datos**

**Problema:**
Queries lentos en tablas grandes sin índices

**Solución:**
```typescript
// lib/database/index.ts
await expo.execAsync(`
  CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras
  ON productos(codigo_barras);

  CREATE INDEX IF NOT EXISTS idx_ventas_fecha
  ON ventas(fecha);

  CREATE INDEX IF NOT EXISTS idx_productos_categoria
  ON productos(categoria);

  CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id
  ON venta_items(venta_id);
`);
```

**Impacto:** App lenta con muchos productos/ventas

---

### 5. **Configuración Sin Inicialización Automática**

**Problema:**
```typescript
// Si no hay configuración, la app crashea
const config = await obtenerConfiguracion();
if (!config) {
  throw new Error('No existe configuración'); // ❌
}
```

**Solución:**
```typescript
export async function obtenerConfiguracion() {
  const config = await db.select()...

  // Si no existe, crearla automáticamente
  if (!config.length) {
    return await inicializarConfiguracion();
  }

  return config[0];
}
```

**Impacto:** Primera vez que abren la app, crashea

---

## 🟡 MEJORAS IMPORTANTES (MEDIA PRIORIDAD)

### 6. **Funciones Faltantes para Validación**

**Recomendado Agregar:**

```typescript
// Validar stock disponible
export async function validarStockDisponible(
  items: Array<{productoId: number, cantidad: number}>
): Promise<{valido: boolean, errores: string[]}> {
  const errores = [];

  for (const item of items) {
    const producto = await obtenerProductoPorId(item.productoId);
    if (!producto) {
      errores.push(`Producto ${item.productoId} no existe`);
    } else if (producto.stock < item.cantidad) {
      errores.push(`Stock insuficiente para ${producto.nombre} (disponible: ${producto.stock}, solicitado: ${item.cantidad})`);
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

// Buscar productos con filtros avanzados
export async function buscarProductosAvanzado(filtros: {
  nombre?: string;
  categoria?: string;
  marca?: string;
  precioMin?: number;
  precioMax?: number;
  soloActivos?: boolean;
}) {
  let query = db.select().from(schema.productos);

  if (filtros.nombre) {
    query = query.where(like(schema.productos.nombre, `%${filtros.nombre}%`));
  }
  if (filtros.categoria) {
    query = query.where(eq(schema.productos.categoria, filtros.categoria));
  }
  // ... más filtros

  return await query;
}

// Obtener resumen completo de caja
export async function obtenerResumenCompletoCaja(cajaId: number) {
  const caja = await obtenerCajaActual();
  const movimientos = await obtenerMovimientosCaja(cajaId);
  const ventas = await db.select()
    .from(schema.ventas)
    .where(eq(schema.ventas.cajaId, cajaId));

  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const totalRetiros = movimientos
    .filter(m => m.tipo === 'retiro')
    .reduce((sum, m) => sum + m.monto, 0);
  const totalDepositos = movimientos
    .filter(m => m.tipo === 'deposito')
    .reduce((sum, m) => sum + m.monto, 0);

  return {
    caja,
    totalVentas,
    totalRetiros,
    totalDepositos,
    montoEsperado: caja.montoInicial + totalVentas + totalDepositos - totalRetiros
  };
}

// Revertir venta (cancelación)
export async function revertirVenta(ventaId: number) {
  return await db.transaction(async (tx) => {
    // Obtener items de la venta
    const items = await tx.select()
      .from(schema.ventaItems)
      .where(eq(schema.ventaItems.ventaId, ventaId));

    // Devolver stock
    for (const item of items) {
      await tx.update(schema.productos)
        .set({
          stock: sql`stock + ${item.cantidad}`
        })
        .where(eq(schema.productos.id, item.productoId));
    }

    // Marcar venta como cancelada
    await tx.update(schema.ventas)
      .set({ estado: 'cancelada' })
      .where(eq(schema.ventas.id, ventaId));
  });
}
```

---

### 7. **Agregar Campo Estado a Ventas**

**Problema:** No se puede cancelar/revertir ventas

**Solución:**
```typescript
// schema.ts
export const ventas = sqliteTable('ventas', {
  // ... campos existentes
  estado: text('estado').default('completada'), // nuevo campo
});
```

**Migración:**
```typescript
await expo.execAsync(
  'ALTER TABLE ventas ADD COLUMN estado TEXT DEFAULT "completada"'
);
```

---

### 8. **Logs de Auditoría**

**Recomendación:** Tabla de auditoría para rastrear cambios

```typescript
export const auditoria = sqliteTable('auditoria', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tabla: text('tabla').notNull(),
  accion: text('accion').notNull(), // 'insert', 'update', 'delete'
  registroId: integer('registro_id').notNull(),
  usuario: text('usuario'),
  cambios: text('cambios'), // JSON string
  fecha: text('fecha').default('CURRENT_TIMESTAMP'),
});

// Función helper
export async function registrarAuditoria(
  tabla: string,
  accion: string,
  registroId: number,
  cambios?: any
) {
  await db.insert(schema.auditoria).values({
    tabla,
    accion,
    registroId,
    cambios: cambios ? JSON.stringify(cambios) : null,
  });
}
```

---

## 🟢 MEJORAS OPCIONALES (BAJA PRIORIDAD)

### 9. **Sistema de Respaldos**

```typescript
export async function crearRespaldo(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.db`;

  // Copiar base de datos
  await FileSystem.copyAsync({
    from: `${FileSystem.documentDirectory}SQLite/tiendapos.db`,
    to: `${FileSystem.documentDirectory}backups/${filename}`
  });

  return filename;
}

export async function restaurarRespaldo(filename: string) {
  await FileSystem.copyAsync({
    from: `${FileSystem.documentDirectory}backups/${filename}`,
    to: `${FileSystem.documentDirectory}SQLite/tiendapos.db`
  });
}
```

---

### 10. **Sincronización Cloud (Futuro)**

**Para cuando quieran multi-tienda:**

```typescript
export interface SyncConfig {
  apiUrl: string;
  apiKey: string;
  lastSync: Date;
}

export async function sincronizarConNube() {
  const cambiosLocales = await obtenerCambiosDesdeUltimaSync();

  // Enviar a servidor
  const response = await fetch(config.apiUrl + '/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cambiosLocales)
  });

  const cambiosRemotos = await response.json();

  // Aplicar cambios remotos
  await aplicarCambiosRemotos(cambiosRemotos);
}
```

---

### 11. **Notificaciones Push**

```typescript
// Para alertas de stock bajo, ventas importantes, etc.
import * as Notifications from 'expo-notifications';

export async function enviarNotificacionStockBajo(producto: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Stock Bajo',
      body: `${producto.nombre} tiene solo ${producto.stock} unidades`,
      data: { productoId: producto.id },
    },
    trigger: null, // inmediato
  });
}
```

---

### 12. **Reportes Avanzados**

```typescript
// Reporte de productos por proveedor
export async function obtenerReporteProveedores() {
  return await db
    .select({
      proveedor: schema.proveedores.nombre,
      totalProductos: sql<number>`COUNT(DISTINCT ${schema.productosProveedores.productoId})`,
      inversionTotal: sql<number>`SUM(${schema.productos.stock} * ${schema.productos.precioCompra})`,
    })
    .from(schema.proveedores)
    .leftJoin(
      schema.productosProveedores,
      eq(schema.proveedores.id, schema.productosProveedores.proveedorId)
    )
    .leftJoin(
      schema.productos,
      eq(schema.productosProveedores.productoId, schema.productos.id)
    )
    .groupBy(schema.proveedores.id);
}

// Top 10 clientes (si implementan sistema de clientes)
export async function obtenerTopClientes(limite: number = 10) {
  // Implementar cuando tengan tabla de clientes
}
```

---

### 13. **Códigos de Barras Personalizados**

```typescript
// Generar códigos para productos sin código de barras
export function generarCodigoBarrasInterno(categoria: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const categoriaCode = categoria.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');

  return `${categoriaCode}${timestamp}${random}`;
}

// Ejemplo: "BEB2602141523" para Bebidas
```

---

### 14. **Validación de Integridad de Datos**

```typescript
export async function validarIntegridadBaseDatos() {
  const problemas = [];

  // Verificar productos sin stock
  const productosSinStock = await db
    .select()
    .from(schema.productos)
    .where(isNull(schema.productos.stock));

  if (productosSinStock.length > 0) {
    problemas.push(`${productosSinStock.length} productos sin stock definido`);
  }

  // Verificar ventas sin items
  const ventasSinItems = await db
    .select({ id: schema.ventas.id })
    .from(schema.ventas)
    .leftJoin(
      schema.ventaItems,
      eq(schema.ventas.id, schema.ventaItems.ventaId)
    )
    .where(isNull(schema.ventaItems.id));

  if (ventasSinItems.length > 0) {
    problemas.push(`${ventasSinItems.length} ventas sin items`);
  }

  // Verificar precios negativos
  const preciosNegativos = await db
    .select()
    .from(schema.productos)
    .where(lt(schema.productos.precioVenta, 0));

  if (preciosNegativos.length > 0) {
    problemas.push(`${preciosNegativos.length} productos con precio negativo`);
  }

  return problemas;
}
```

---

### 15. **Exportar/Importar Datos**

```typescript
// Exportar a CSV
export async function exportarProductosCSV(): Promise<string> {
  const productos = await obtenerProductos();

  let csv = 'Código,Nombre,Categoría,Precio Compra,Precio Venta,Stock,Activo\n';

  for (const p of productos) {
    csv += `"${p.codigoBarras}","${p.nombre}","${p.categoria}",${p.precioCompra},${p.precioVenta},${p.stock},${p.activo ? 'Sí' : 'No'}\n`;
  }

  const path = `${FileSystem.documentDirectory}productos-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(path, csv);

  return path;
}

// Importar desde CSV
export async function importarProductosCSV(filePath: string) {
  const csv = await FileSystem.readAsStringAsync(filePath);
  const lines = csv.split('\n').slice(1); // Skip header

  for (const line of lines) {
    if (!line.trim()) continue;

    const [codigo, nombre, categoria, precioCompra, precioVenta, stock, activo] =
      line.split(',').map(s => s.replace(/"/g, '').trim());

    await crearProducto({
      codigoBarras: codigo,
      nombre,
      categoria,
      precioCompra: parseFloat(precioCompra),
      precioVenta: parseFloat(precioVenta),
      stock: parseInt(stock),
      activo: activo === 'Sí',
    });
  }
}
```

---

## 📊 MÉTRICAS Y DASHBOARDS

### 16. **Dashboard Principal (Home Screen)**

```typescript
export async function obtenerMetricasDashboard() {
  const hoy = new Date().toISOString().split('T')[0];

  const [
    ventasHoy,
    gananciaHoy,
    productosStockBajo,
    cajaActual,
    topProductos
  ] = await Promise.all([
    obtenerTotalVentasDelDia(),
    obtenerGananciasDelDia(),
    obtenerProductosStockBajo(),
    obtenerCajaActual(),
    obtenerProductosMasVendidos(5)
  ]);

  return {
    ventasHoy: ventasHoy.total,
    gananciaHoy: gananciaHoy.gananciaTotal,
    alertasStockBajo: productosStockBajo.length,
    cajaAbierta: cajaActual !== null,
    topProductos
  };
}
```

---

## 🔐 SEGURIDAD

### 17. **Sistema de Usuarios (Futuro)**

```typescript
export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Hash con bcrypt
  rol: text('rol').default('cajero'), // 'admin', 'cajero', 'gerente'
  activo: integer('activo', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Agregar usuario_id a ventas, movimientos_caja, etc.
```

---

### 18. **Encriptación de Datos Sensibles**

```typescript
import * as Crypto from 'expo-crypto';

export async function encriptarDato(dato: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    dato
  );
  return hash;
}
```

---

## 📱 MEJORAS DE UX/UI

### 19. **Modo Offline/Online**

```typescript
import NetInfo from '@react-native-community/netinfo';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}
```

---

### 20. **Búsqueda Inteligente con Fuzzy Match**

```typescript
// Para buscar productos tolerante a errores de escritura
import Fuse from 'fuse.js';

export async function buscarProductosFuzzy(query: string) {
  const productos = await obtenerProductos();

  const fuse = new Fuse(productos, {
    keys: ['nombre', 'categoria', 'marca'],
    threshold: 0.3, // Qué tan "suelto" es el match
  });

  return fuse.search(query).map(result => result.item);
}
```

---

## 🎯 PRIORIZACIÓN RECOMENDADA

### Semana 1 (CRÍTICO)
1. ✅ Agregar validación de stock en crearVenta()
2. ✅ Corregir cálculo de caja (incluir movimientos)
3. ✅ Implementar transacciones en ventas y compras
4. ✅ Agregar índices a la base de datos

### Semana 2 (IMPORTANTE)
5. ✅ Función validarStockDisponible()
6. ✅ Función obtenerResumenCompletoCaja()
7. ✅ Función revertirVenta()
8. ✅ Inicialización automática de configuración

### Semana 3-4 (MEJORAS)
9. ⚪ Sistema de respaldos
10. ⚪ Logs de auditoría
11. ⚪ Reportes avanzados
12. ⚪ Exportar/Importar CSV

### Futuro (OPCIONAL)
13. ⚪ Sincronización cloud
14. ⚪ Sistema de usuarios
15. ⚪ Notificaciones push
16. ⚪ Dashboard principal

---

## 📖 RECURSOS Y REFERENCIAS

### Documentación Útil
- [Drizzle ORM Transactions](https://orm.drizzle.team/docs/transactions)
- [SQLite Indices](https://www.sqlite.org/lang_createindex.html)
- [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

### Librerías Recomendadas
```json
{
  "expo-file-system": "~17.0.0",
  "expo-sharing": "~12.0.0",
  "@react-native-community/netinfo": "^11.0.0",
  "fuse.js": "^7.0.0",
  "date-fns": "^3.0.0"
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Validar stock antes de ventas
- [ ] Corregir cálculo de caja
- [ ] Implementar transacciones
- [ ] Agregar índices
- [ ] Funciones de validación
- [ ] Función revertir venta
- [ ] Logs de auditoría

### Frontend
- [ ] Manejo de errores de stock
- [ ] Indicador de caja abierta/cerrada
- [ ] Confirmación antes de operaciones críticas
- [ ] Loading states en operaciones largas
- [ ] Mensajes de error descriptivos

### Testing
- [ ] Probar venta sin stock
- [ ] Probar cierre de caja con movimientos
- [ ] Probar transacciones fallidas
- [ ] Probar rendimiento con 1000+ productos

---

**Última Actualización:** 2026-01-14
**Versión del Documento:** 1.0
**Autor:** Análisis Técnico TiendaPOS
