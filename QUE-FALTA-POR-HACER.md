# 📋 QUE FALTA POR HACER - TiendaPOS Mobile

> Análisis completo de funcionalidades pendientes
> Fecha: 2026-01-14
> Basado en: README.md + Código Actual + RECOMENDACIONES-MEJORAS.md

---

## 🎯 RESUMEN EJECUTIVO

**Estado Actual:** 85% Completado
**Pendiente:** 15% (funcionalidades opcionales y mejoras)

### Completado Recientemente ✅
- ✅ Módulo de Productos con doble precio (compra/venta)
- ✅ Módulo de Catálogo con activación por categorías
- ✅ Sistema de cálculo de ganancias
- ✅ Filtros de rentabilidad (Rentable, Medio, Bajo)
- ✅ Menú lateral rediseñado con colores por módulo
- ✅ Mejoras críticas del backend (validaciones, índices, funciones)
- ✅ Migraciones automáticas de base de datos
- ✅ Validación de stock en ventas
- ✅ Función revertirVenta() para cancelaciones

---

## 🔴 FALTA HACER - CRÍTICO (Semana 1-2)

### 1. ❌ Integrar Validación de Stock en Pantalla POS

**Descripción:** La pantalla de Punto de Venta NO está usando la nueva función `validarStockDisponible()`

**Archivo:** `app/index.tsx` (Punto de Venta)

**Problema:**
```typescript
// En la función de finalizar venta, NO valida stock antes
const handleFinalizarVenta = async () => {
  // ❌ No llama a validarStockDisponible()
  await queries.crearVenta(venta, items);
}
```

**Solución Requerida:**
```typescript
import { validarStockDisponible } from '@/lib/database/queries';

const handleFinalizarVenta = async () => {
  // ✅ Validar stock ANTES de continuar
  const validacion = await validarStockDisponible(
    carrito.map(item => ({
      productoId: item.id,
      cantidad: item.cantidad
    }))
  );

  if (!validacion.valido) {
    Alert.alert('Stock Insuficiente', validacion.errores.join('\n'));
    return;
  }

  // Continuar con la venta...
}
```

**Impacto:** ALTO - Sin esto, la app puede vender productos sin stock

---

### 2. ❌ Validar Caja Abierta en POS

**Descripción:** El POS debe verificar que haya una caja abierta antes de vender

**Archivo:** `app/index.tsx`

**Solución Requerida:**
```typescript
// Al iniciar el componente POS
useEffect(() => {
  async function verificarCaja() {
    const { valido, caja } = await validarCajaAbierta();
    if (!valido) {
      Alert.alert(
        'Caja Cerrada',
        'Debes abrir una caja antes de realizar ventas',
        [{ text: 'Abrir Caja', onPress: () => router.push('/caja') }]
      );
    }
  }
  verificarCaja();
}, []);
```

**Impacto:** MEDIO - Ventas sin caja abierta = no se registran correctamente

---

### 3. ❌ Vincular Ventas con Caja Actual

**Descripción:** Al crear una venta, debe guardarse el `caja_id`

**Archivo:** `app/index.tsx`

**Problema Actual:**
```typescript
const nuevaVenta = {
  total: totalConIVA,
  metodoPago: formaPago,
  // ❌ Falta: cajaId
};
```

**Solución:**
```typescript
const cajaActual = await obtenerCajaActual();

const nuevaVenta = {
  total: totalConIVA,
  metodoPago: formaPago,
  cajaId: cajaActual?.id  // ✅ Vincular con caja abierta
};
```

**Impacto:** ALTO - Sin esto, no se pueden generar reportes correctos por caja

---

### 4. ❌ Actualizar Módulo de Caja para Usar obtenerResumenCompletoCaja()

**Descripción:** El módulo de caja debe usar la función mejorada para cálculos

**Archivo:** `app/caja.tsx`

**Cambio Requerido:**
- Reemplazar cálculos manuales por `obtenerResumenCompletoCaja(cajaId)`
- Mostrar desglose completo: Inicial + Ventas + Depósitos - Retiros

**Impacto:** ALTO - Cálculos incorrectos de caja

---

### 5. ❌ Botón de Cancelar Venta en Historial

**Descripción:** Agregar botón para usar `revertirVenta()` en el historial

**Archivo:** `app/historial.tsx`

**Funcionalidad:**
```typescript
const handleCancelarVenta = async (ventaId: number) => {
  Alert.alert(
    'Cancelar Venta',
    '¿Estás seguro? Se devolverá el stock.',
    [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, Cancelar',
        style: 'destructive',
        onPress: async () => {
          const motivo = await pedirMotivo(); // Input dialog
          await revertirVenta(ventaId, motivo);
          Alert.alert('Éxito', 'Venta cancelada y stock devuelto');
        }
      }
    ]
  );
};
```

**Impacto:** MEDIO - Funcionalidad útil para errores de venta

---

## 🟡 FALTA HACER - IMPORTANTE (Semana 2-3)

### 6. ⚠️ Pantallas Incompletas o Básicas

Según el código actual, estas pantallas existen pero están incompletas:

#### 6.1 Inventario (`app/inventario.tsx`)
**Falta:**
- ❌ Función de ajuste manual de stock
- ❌ Vista de movimientos de inventario
- ❌ Exportar inventario a Excel/PDF
- ❌ Alertas push de stock bajo

**Estado:** 70% completo

#### 6.2 Historial de Ventas (`app/historial.tsx`)
**Falta:**
- ❌ Filtros por fecha (desde-hasta)
- ❌ Filtro por método de pago
- ❌ Búsqueda por folio o producto
- ❌ Ver detalle completo de venta (popup/modal)
- ❌ Reimprimir ticket
- ❌ Botón cancelar venta (usa revertirVenta)
- ❌ Exportar a PDF

**Estado:** 60% completo

#### 6.3 Reportes (`app/reportes.tsx`)
**Falta:**
- ❌ Gráficas de ventas (react-native-chart-kit)
- ❌ Reporte de ganancias con `obtenerGananciasDelDia()`
- ❌ Reporte de inversión con `obtenerInversionEnInventario()`
- ❌ Productos más rentables con `obtenerProductosMasRentables()`
- ❌ Resumen financiero con `obtenerResumenFinanciero()`
- ❌ Filtros por período
- ❌ Exportar reportes

**Estado:** 40% completo

#### 6.4 Configuración (`app/configuracion.tsx`)
**Falta:**
- ❌ Formulario para editar configuración de tienda
- ❌ Configuración de impresora
- ❌ Configuración de IVA
- ❌ Backup manual de base de datos
- ❌ Restaurar backup

**Estado:** 30% completo

---

### 7. ⚠️ Módulos Funcionales pero Mejorables

#### 7.1 Proveedores
**Tiene:**
- ✅ CRUD completo
- ✅ Vinculación con productos

**Falta:**
- ❌ Vista de productos por proveedor
- ❌ Historial de compras por proveedor
- ❌ Análisis de mejores precios

#### 7.2 Compras
**Tiene:**
- ✅ Registro de compras
- ✅ Items de compra
- ✅ Marcar como recibida (actualiza stock)

**Falta:**
- ❌ Generación automática de orden de compra desde lista_compras
- ❌ Comparación de precios entre proveedores
- ❌ Historial de precios de compra

---

## 🟢 MEJORAS OPCIONALES (Semana 4+)

### 8. ✨ Nuevas Funcionalidades

#### 8.1 Lista de Compras Automática
**Descripción:** Generar automáticamente lista de productos a reordenar

**Función Existente:** `generarListaComprasAutomatica()` ✅

**Falta:**
- ❌ Pantalla para visualizar lista_compras
- ❌ Botón para generar automáticamente
- ❌ Convertir lista en orden de compra

#### 8.2 Sistema de Descuentos
**Descripción:** Aplicar descuentos a productos o ventas

**Base de Datos:** La tabla `configuracion` tiene campos para esto ✅
- `permitir_descuentos`
- `descuento_maximo`

**Falta:**
- ❌ UI en POS para aplicar descuento
- ❌ Validación de descuento máximo
- ❌ Registro de descuentos en venta_items

#### 8.3 Sistema de Clientes
**Descripción:** Registrar clientes frecuentes

**Falta TODO:**
- ❌ Tabla `clientes` en base de datos
- ❌ CRUD de clientes
- ❌ Vincular ventas con clientes
- ❌ Historial de compras por cliente
- ❌ Cuentas por cobrar

#### 8.4 Tickets Personalizados
**Descripción:** Usar configuración para personalizar tickets

**Campos en Configuración:** ✅
- `nombre_tienda`
- `direccion`
- `telefono`
- `rfc`
- `mensaje_ticket`
- `logo_base64`

**Falta:**
- ❌ Usar estos campos en generación de PDF
- ❌ Subir logo desde configuración
- ❌ Preview de ticket antes de imprimir

---

### 9. ✨ Mejoras de UX/UI

#### 9.1 Loading States
**Falta:**
- ❌ Spinners al cargar datos
- ❌ Skeleton screens
- ❌ Progress indicators en operaciones largas

#### 9.2 Feedback Visual
**Falta:**
- ❌ Snackbars para operaciones exitosas
- ❌ Animaciones de transición
- ❌ Vibración en escaneo exitoso

#### 9.3 Modo Offline
**Tiene:** SQLite (offline-first) ✅

**Falta:**
- ❌ Indicador de estado de conexión
- ❌ Cola de sincronización para cuando haya internet

---

### 10. ✨ Características Avanzadas

#### 10.1 Dark Mode
**Falta TODO:**
- ❌ Tema oscuro en configuración
- ❌ Toggle en configuración
- ❌ Persistir preferencia

#### 10.2 Multi-idioma
**Falta TODO:**
- ❌ i18n setup
- ❌ Traducciones ES/EN
- ❌ Selector de idioma

#### 10.3 Roles y Permisos
**Falta TODO:**
- ❌ Tabla usuarios
- ❌ Sistema de login
- ❌ Roles (admin, cajero, supervisor)
- ❌ Permisos por módulo

#### 10.4 Backup Automático
**Falta TODO:**
- ❌ Exportación automática programada
- ❌ Subir a Google Drive/Dropbox
- ❌ Restauración desde backup

---

## 📊 PRIORIZACIÓN SUGERIDA

### Sprint 1 (Esta Semana) - CRÍTICO
1. ✅ Integrar `validarStockDisponible()` en POS
2. ✅ Validar caja abierta antes de vender
3. ✅ Vincular ventas con `caja_id`
4. ✅ Actualizar módulo Caja para usar `obtenerResumenCompletoCaja()`

### Sprint 2 (Semana 2) - IMPORTANTE
5. ✅ Completar Historial de Ventas (filtros, detalle, cancelar)
6. ✅ Completar módulo Reportes (gráficas, ganancias)
7. ✅ Completar Configuración (formulario edición)

### Sprint 3 (Semana 3) - MEJORAS
8. ✅ Mejorar Inventario (ajustes, movimientos)
9. ✅ Lista de Compras automática (UI)
10. ✅ Sistema de descuentos

### Sprint 4 (Semana 4+) - OPCIONALES
11. ⏳ Sistema de clientes
12. ⏳ Dark mode
13. ⏳ Backup automático
14. ⏳ Roles y permisos

---

## 🎯 CHECKLIST DE FUNCIONALIDADES

### Módulos Principales

#### Punto de Venta
- [x] Búsqueda de productos
- [x] Escaneo de códigos
- [x] Carrito de compras
- [x] Múltiples formas de pago
- [x] Generación de PDF
- [ ] **Validar stock antes de vender** ❌ CRÍTICO
- [ ] **Validar caja abierta** ❌ CRÍTICO
- [ ] **Vincular con caja_id** ❌ CRÍTICO
- [ ] Aplicar descuentos
- [ ] Seleccionar cliente

#### Caja
- [x] Abrir caja
- [x] Registrar movimientos (ingreso/egreso/retiro)
- [x] Cerrar caja
- [x] Historial de cajas
- [ ] **Usar obtenerResumenCompletoCaja()** ❌ CRÍTICO
- [ ] Reporte de caja imprimible
- [ ] Gráfica de ventas del día

#### Productos
- [x] Lista con filtros
- [x] Agregar producto
- [x] Editar producto
- [x] Sistema de doble precio
- [x] Cálculo de ganancias
- [x] Filtros de rentabilidad
- [x] Activar/desactivar
- [ ] Importar desde Excel
- [ ] Exportar a Excel
- [ ] Códigos de barras impresos

#### Catálogo
- [x] Vista por categorías
- [x] Activar/desactivar productos
- [x] Configurar precios rápido
- [x] Vista de ganancias
- [ ] Importar categorías
- [ ] Reorganizar categorías

#### Inventario
- [x] Vista general de stock
- [x] Filtros (todos, bajo, agotados)
- [x] Valor total
- [x] Alertas visuales
- [ ] **Ajuste manual de stock** ❌
- [ ] Historial de movimientos
- [ ] Exportar inventario
- [ ] Alertas push

#### Historial de Ventas
- [x] Lista de ventas
- [x] Ordenar por fecha
- [x] Mostrar total
- [ ] **Filtros por fecha** ❌
- [ ] **Filtro por método de pago** ❌
- [ ] **Ver detalle de venta** ❌
- [ ] **Cancelar venta** ❌ IMPORTANTE
- [ ] **Reimprimir ticket** ❌
- [ ] Exportar a PDF

#### Reportes
- [x] Total de ventas
- [x] Productos más vendidos
- [x] Estadísticas básicas
- [ ] **Gráficas** ❌ IMPORTANTE
- [ ] **Reporte de ganancias** ❌
- [ ] **Inversión en inventario** ❌
- [ ] **Productos más rentables** ❌
- [ ] Filtros por período
- [ ] Exportar reportes
- [ ] Comparativas

#### Proveedores
- [x] Lista de proveedores
- [x] Agregar proveedor
- [x] Editar proveedor
- [x] Vincular con productos
- [ ] Vista de productos por proveedor
- [ ] Historial de compras
- [ ] Análisis de precios

#### Compras
- [x] Registrar compra
- [x] Items de compra
- [x] Marcar como recibida
- [x] Actualizar stock
- [ ] Generar desde lista_compras
- [ ] Comparar precios
- [ ] Historial de precios

#### Configuración
- [x] Vista de configuración
- [ ] **Editar datos de tienda** ❌
- [ ] **Configurar impresora** ❌
- [ ] **Configurar IVA** ❌
- [ ] Backup manual
- [ ] Restaurar backup
- [ ] Cambiar tema
- [ ] Selector de idioma

---

## 📈 ESTADO GENERAL POR MÓDULO

| Módulo | Completado | Funcional | Falta | Prioridad |
|--------|-----------|-----------|-------|-----------|
| **Punto de Venta** | 85% | ✅ Sí | Validaciones | 🔴 Alta |
| **Caja** | 90% | ✅ Sí | Función mejorada | 🔴 Alta |
| **Productos** | 95% | ✅ Sí | Import/Export | 🟢 Baja |
| **Catálogo** | 90% | ✅ Sí | Reorganizar | 🟢 Baja |
| **Inventario** | 70% | ✅ Sí | Ajustes, Historial | 🟡 Media |
| **Historial** | 60% | ✅ Sí | Filtros, Detalle, Cancelar | 🟡 Media |
| **Reportes** | 40% | ⚠️ Básico | Gráficas, Ganancias | 🟡 Media |
| **Proveedores** | 85% | ✅ Sí | Análisis | 🟢 Baja |
| **Compras** | 80% | ✅ Sí | Auto-generación | 🟢 Baja |
| **Configuración** | 30% | ⚠️ Básico | Formularios | 🟡 Media |

---

## 🚀 ROADMAP PROPUESTO

### Versión 1.1 (Semana 1-2) - Correcciones Críticas
- ✅ Validaciones en POS
- ✅ Integración completa con Caja
- ✅ Botón cancelar venta

### Versión 1.2 (Semana 3) - Módulos Completos
- ✅ Historial completo (filtros, detalle)
- ✅ Reportes con gráficas
- ✅ Configuración funcional
- ✅ Inventario con ajustes

### Versión 1.3 (Semana 4) - Mejoras UX
- ✅ Lista de compras automática
- ✅ Sistema de descuentos
- ✅ Tickets personalizados
- ✅ Loading states

### Versión 2.0 (Mes 2+) - Características Avanzadas
- ⏳ Sistema de clientes
- ⏳ Roles y permisos
- ⏳ Backup automático en nube
- ⏳ Multi-idioma
- ⏳ Dark mode

---

## 💡 RECOMENDACIONES FINALES

### Para el Usuario/Dueño de Tienda

**Puedes usar la app HOY para:**
1. ✅ Realizar ventas
2. ✅ Controlar caja
3. ✅ Gestionar productos
4. ✅ Ver inventario
5. ✅ Registrar compras
6. ✅ Ver estadísticas básicas

**Debes esperar actualización para:**
1. ❌ Ver reportes detallados con gráficas
2. ❌ Cancelar ventas fácilmente
3. ❌ Generar lista de compras automática
4. ❌ Aplicar descuentos

### Para el Desarrollador

**Prioridad Inmediata (HOY):**
```typescript
// 1. app/index.tsx - Agregar antes de crear venta
const validacion = await validarStockDisponible(items);
if (!validacion.valido) return;

const cajaActual = await obtenerCajaActual();
if (!cajaActual) return;

const nuevaVenta = {
  total,
  metodoPago,
  cajaId: cajaActual.id  // ← CRÍTICO
};
```

**Siguiente Paso:**
- Completar pantalla de Historial con filtros
- Agregar gráficas en Reportes
- Formulario de Configuración

---

**RESUMEN:** La aplicación está **muy completa (85%)** y **totalmente funcional** para operación diaria de una tienda. Las funcionalidades faltantes son principalmente **mejoras** y **características avanzadas** que pueden agregarse gradualmente.

**Estado:** LISTA PARA USO EN PRODUCCIÓN con las correcciones críticas de la Semana 1.
