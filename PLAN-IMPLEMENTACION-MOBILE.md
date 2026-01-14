# Plan de Implementación - TiendaPOS Mobile

> Basado en el análisis completo de la aplicación de escritorio
> Fecha: 2026-01-13

## 📊 Estado Actual

### ✅ Completado (30%)

**Base de Datos:**
- ✅ Schema completo con 11 tablas
- ✅ Migraciones sincronizadas entre schema.ts e index.ts
- ✅ Sistema de precios dual (precioCompra + precioVenta)
- ✅ 40 productos mexicanos pre-cargados
- ✅ Queries básicos para productos y ventas

**Módulos Funcionales:**
- ✅ **POS (Punto de Venta)** - 95% completo
  - Búsqueda de productos en tiempo real
  - Carrito de compras con Zustand
  - Escaneo de código de barras (Bluetooth HID)
  - Validación de stock
  - Múltiples métodos de pago
  - Cálculo de IVA automático (16%)
  - Generación de tickets PDF
  - ❌ **FALTA:** Integración con caja abierta

**Infraestructura:**
- ✅ React Native + Expo SDK 54
- ✅ SQLite + Drizzle ORM
- ✅ Zustand para state management
- ✅ React Native Paper para UI
- ✅ Integración Bluetooth para scanner
- ✅ Sistema de impresión (PDF)

### ❌ Pendiente (70%)

**Módulos Críticos Faltantes:**
1. Control de Caja (0%)
2. Gestión de Productos CRUD (10%)
3. Inventario (0%)
4. Proveedores (0%)
5. Compras (0%)
6. Historial de Ventas (0%)
7. Reportes Básicos (0%)
8. Reportes Financieros (0%)
9. Configuración (0%)
10. Navegación Drawer/Tabs (20%)

---

## 🎯 Diferencias Clave: Desktop vs Mobile

### Desktop App (Fuente de Verdad)
- **Productos:** 156 pre-cargados
- **Módulos:** 12 completos
- **Líneas de código:** ~130,000
- **IPC Handlers:** 76
- **Schema:** Más avanzado con campos calculados
- **Reportes:** Sistema completo con gráficas
- **IA:** Asistente inteligente con recomendaciones

### Mobile App (Estado Actual)
- **Productos:** 40 pre-cargados
- **Módulos:** 1 completo (POS parcial)
- **Líneas de código:** ~5,000
- **Schema:** Básico pero funcional
- **Reportes:** No implementado
- **IA:** No implementado

---

## 📋 Plan de Implementación por Fases

### 🔴 FASE 1: Fundamentos Críticos (Semana 1-2)

#### 1.1 Navegación Completa
**Objetivo:** Implementar estructura de navegación drawer + tabs

**Tareas:**
- [ ] Instalar y configurar React Navigation Drawer
- [ ] Crear DrawerNavigator con menú lateral
- [ ] Implementar Bottom Tabs para módulos frecuentes
- [ ] Configurar rutas para 12 módulos
- [ ] Diseñar menú con iconos y categorías

**Archivos a crear:**
- `components/navigation/DrawerContent.tsx`
- `components/navigation/MainDrawer.tsx`
- `app/_layout.tsx` (actualizar)

**Tiempo estimado:** 2-3 días

---

#### 1.2 Módulo de Caja (Cash Register)
**Objetivo:** Sistema completo de apertura/cierre de caja

**Tareas:**
- [ ] Pantalla de apertura de caja
  - Validar monto inicial mínimo ($500)
  - Registrar usuario que abre
  - Bloquear POS si no hay caja abierta

- [ ] Pantalla de movimientos de caja
  - Retiros de efectivo
  - Depósitos
  - Gastos operativos
  - Lista de movimientos del día

- [ ] Pantalla de cierre de caja
  - Cálculo automático de monto esperado
  - Conteo físico de efectivo
  - Cálculo de diferencias
  - Desglose por método de pago
  - Resumen de ventas del día
  - Exportar reporte PDF

- [ ] Queries de base de datos
  - `abrirCaja(montoInicial)`
  - `registrarMovimiento(tipo, monto, concepto)`
  - `obtenerCajaActiva()`
  - `cerrarCaja(montoFinal)`
  - `obtenerMovimientosDelDia(cajaId)`

**Archivos a crear:**
- `app/caja/apertura.tsx`
- `app/caja/movimientos.tsx`
- `app/caja/cierre.tsx`
- `app/caja/index.tsx`
- `lib/database/queries/caja.ts`
- `lib/store/useCajaStore.ts`

**Tiempo estimado:** 4-5 días

---

#### 1.3 Gestión de Productos CRUD
**Objetivo:** Administración completa del catálogo

**Tareas:**
- [ ] Lista de productos con búsqueda/filtros
  - Búsqueda por nombre, código de barras, categoría
  - Filtros: activo/inactivo, categoría, marca
  - Ordenamiento: nombre, precio, stock
  - Paginación (50 productos por página)
  - Indicadores visuales: stock bajo, sin stock

- [ ] Agregar producto
  - Formulario completo con validación
  - Escaneo de código de barras automático
  - Cálculo de margen de ganancia
  - Foto del producto (opcional)
  - Asignación de categoría/marca

- [ ] Editar producto
  - Pre-llenar formulario con datos existentes
  - Validar cambios en precios
  - Actualizar fecha de modificación

- [ ] Ver detalles del producto
  - Información completa
  - Historial de ventas
  - Proveedores asociados
  - Gráfica de stock en el tiempo

- [ ] Gestión de categorías
  - Lista de categorías
  - Agregar/editar/eliminar categorías
  - Contador de productos por categoría

**Archivos a crear:**
- `app/productos/index.tsx` (actualizar)
- `app/productos/agregar.tsx` (actualizar)
- `app/productos/editar/[id].tsx` (actualizar)
- `app/productos/[id].tsx` (detalles)
- `app/productos/categorias.tsx`
- `components/productos/ProductoCard.tsx`
- `components/productos/ProductoForm.tsx`
- `lib/database/queries/productos.ts` (actualizar)

**Tiempo estimado:** 5-6 días

---

### 🟡 FASE 2: Operaciones Básicas (Semana 3-4)

#### 2.1 Módulo de Inventario
**Objetivo:** Control de stock y alertas

**Tareas:**
- [ ] Dashboard de inventario
  - Resumen: total productos, valor inventario, stock bajo
  - Gráfica de productos por categoría
  - Lista de productos con stock bajo
  - Lista de productos sin stock

- [ ] Ajustes de inventario
  - Entrada de mercancía
  - Salida de mercancía
  - Merma/pérdida
  - Corrección de inventario
  - Historial de ajustes

- [ ] Lista de compras automática
  - Sugerencias basadas en stock mínimo
  - Productos sin stock
  - Productos más vendidos
  - Exportar lista a PDF/Excel

**Archivos a crear:**
- `app/inventario/index.tsx` (actualizar)
- `app/inventario/ajustes.tsx`
- `app/inventario/lista-compras.tsx`
- `lib/database/queries/inventario.ts`

**Tiempo estimado:** 4-5 días

---

#### 2.2 Módulo de Proveedores
**Objetivo:** Gestión de suppliers

**Tareas:**
- [ ] Lista de proveedores
  - Búsqueda y filtros
  - Indicador de activo/inactivo
  - Productos que suministra

- [ ] Agregar/Editar proveedor
  - Datos de contacto completos
  - RFC para facturación
  - Días de entrega promedio
  - Forma de pago preferida
  - Notas

- [ ] Detalle de proveedor
  - Información completa
  - Productos asociados con precios
  - Historial de compras
  - Estadísticas (total comprado, última compra)

- [ ] Relación producto-proveedor
  - Asignar proveedores a productos
  - Precio de compra por proveedor
  - Marcar producto estrella
  - Tiempo de entrega

**Archivos a crear:**
- `app/proveedores/index.tsx` (actualizar)
- `app/proveedores/agregar.tsx` (actualizar)
- `app/proveedores/editar/[id].tsx` (actualizar)
- `app/proveedores/[id].tsx`
- `components/proveedores/ProveedorCard.tsx`
- `lib/database/queries/proveedores.ts` (actualizar)

**Tiempo estimado:** 3-4 días

---

#### 2.3 Módulo de Compras
**Objetivo:** Registro de compras a proveedores

**Tareas:**
- [ ] Registrar compra
  - Seleccionar proveedor
  - Agregar productos con cantidades
  - Precio unitario de compra
  - Cálculo de total automático
  - Folio/factura
  - Fecha de entrega esperada
  - Forma de pago
  - Estado: pendiente/recibida

- [ ] Recibir compra
  - Marcar como recibida
  - Actualizar stock automáticamente
  - Actualizar precio de compra en productos
  - Registrar fecha real de entrega

- [ ] Historial de compras
  - Lista con filtros (proveedor, fecha, estado)
  - Ver detalles de compra
  - Editar compra pendiente
  - Cancelar compra

- [ ] Estadísticas
  - Total comprado por período
  - Compras por proveedor
  - Productos más comprados

**Archivos a crear:**
- `app/compras/index.tsx` (actualizar)
- `app/compras/registrar.tsx` (actualizar)
- `app/compras/recibir/[id].tsx`
- `app/compras/[id].tsx`
- `lib/database/queries/compras.ts` (actualizar)

**Tiempo estimado:** 5-6 días

---

### 🟢 FASE 3: Reportes y Análisis (Semana 5-6)

#### 3.1 Historial de Ventas
**Objetivo:** Consulta y análisis de ventas

**Tareas:**
- [ ] Lista de ventas
  - Filtros: fecha, método de pago, monto
  - Búsqueda por folio
  - Ordenamiento
  - Resumen del período

- [ ] Detalle de venta
  - Información completa
  - Productos vendidos
  - Métodos de pago
  - Ganancia real (precio venta - precio compra)
  - Reimprimir ticket

- [ ] Estadísticas rápidas
  - Ventas del día
  - Ventas del mes
  - Comparativa con mes anterior
  - Producto más vendido

**Archivos a crear:**
- `app/historial/index.tsx` (actualizar)
- `app/historial/[id].tsx`
- `lib/database/queries/ventas.ts` (actualizar)

**Tiempo estimado:** 3-4 días

---

#### 3.2 Reportes Básicos
**Objetivo:** Reportes operativos

**Tareas:**
- [ ] Reporte de ventas por período
  - Ventas por día/semana/mes
  - Gráfica de tendencia
  - Comparativa con período anterior
  - Exportar PDF/Excel

- [ ] Productos más vendidos
  - Top 10/20/50
  - Por cantidad y por ingresos
  - Filtro por categoría
  - Gráfica de barras

- [ ] Productos con bajo movimiento
  - Productos sin ventas en X días
  - Stock acumulado
  - Sugerencias de descuento/promoción

**Archivos a crear:**
- `app/reportes/index.tsx` (actualizar)
- `app/reportes/ventas-periodo.tsx`
- `app/reportes/productos-top.tsx`
- `app/reportes/bajo-movimiento.tsx`
- `lib/utils/reportes.ts`

**Tiempo estimado:** 4-5 días

---

#### 3.3 Reportes Financieros
**Objetivo:** Análisis de rentabilidad

**Tareas:**
- [ ] Ganancias por período
  - Ingresos totales
  - Costos de mercancía
  - Ganancia neta
  - Margen de ganancia %
  - Gráfica de evolución

- [ ] Inversión en inventario
  - Valor total de stock
  - Valor por categoría
  - Rotación de inventario
  - Capital inmovilizado

- [ ] ROI por producto
  - Productos más rentables
  - Margen de ganancia por producto
  - Relación ganancia/inversión

- [ ] Estado de caja
  - Resumen de cajas cerradas
  - Diferencias encontradas
  - Tendencias de efectivo vs otros métodos

**Archivos a crear:**
- `app/reportes/financiero/ganancias.tsx`
- `app/reportes/financiero/inventario.tsx`
- `app/reportes/financiero/roi.tsx`
- `app/reportes/financiero/cajas.tsx`
- `lib/database/queries/financiero.ts` (actualizar)

**Tiempo estimado:** 5-6 días

---

### 🔵 FASE 4: Configuración y Mejoras (Semana 7-8)

#### 4.1 Módulo de Configuración
**Objetivo:** Personalización de la aplicación

**Tareas:**
- [ ] Datos de la tienda
  - Nombre comercial
  - Dirección
  - Teléfono/Email
  - RFC
  - Logo (base64)
  - Mensaje en ticket

- [ ] Configuración de POS
  - Tasa de IVA (16% default)
  - Aplicar IVA: sí/no
  - Permitir descuentos
  - Descuento máximo %
  - Control de stock: sí/no
  - Alertas de stock bajo

- [ ] Configuración de caja
  - Requerir monto inicial
  - Monto inicial mínimo
  - Permitir cierre automático

- [ ] Interfaz de usuario
  - Tema: claro/oscuro
  - Tamaño de fuente
  - Idioma (futuro)

- [ ] Impresora térmica
  - Configuración Bluetooth
  - Ancho de papel (58mm/80mm)
  - Líneas de encabezado/pie

**Archivos a crear:**
- `app/configuracion/index.tsx` (actualizar)
- `app/configuracion/tienda.tsx`
- `app/configuracion/pos.tsx`
- `app/configuracion/caja.tsx`
- `app/configuracion/interfaz.tsx`
- `app/configuracion/impresora.tsx`
- `lib/store/useConfigStore.ts` (actualizar)

**Tiempo estimado:** 4-5 días

---

#### 4.2 Catálogo de Productos
**Objetivo:** Vista de catálogo para clientes

**Tareas:**
- [ ] Vista de catálogo
  - Grid de productos con imágenes
  - Filtros por categoría
  - Búsqueda rápida
  - Vista de detalles
  - Compartir catálogo

- [ ] Generación de catálogo PDF
  - Lista de precios
  - Con/sin imágenes
  - Por categoría
  - Compartir vía WhatsApp/Email

**Archivos a crear:**
- `app/catalogo/index.tsx`
- `app/catalogo/[id].tsx`
- `lib/utils/catalogoPDF.ts`

**Tiempo estimado:** 3-4 días

---

### 🟣 FASE 5: Funcionalidades Avanzadas (Semana 9+)

#### 5.1 Asistente Inteligente (Opcional)
**Objetivo:** Dashboard con recomendaciones

**Tareas:**
- [ ] Dashboard de inicio
  - Resumen del día
  - Alertas importantes
  - Productos con stock bajo
  - Sugerencias de compra
  - Accesos rápidos

- [ ] Recomendaciones automáticas
  - Productos para reabastecer
  - Mejores horarios de venta
  - Productos complementarios
  - Análisis de tendencias

**Archivos a crear:**
- `app/asistente/index.tsx`
- `lib/utils/recomendaciones.ts`

**Tiempo estimado:** 5-7 días

---

#### 5.2 Sincronización en la Nube (Futuro)
**Objetivo:** Backup y multi-dispositivo

**Tareas:**
- [ ] Backup automático a Firebase/Supabase
- [ ] Sincronización entre dispositivos
- [ ] Restauración de backups
- [ ] Historial de cambios

**Tiempo estimado:** 7-10 días

---

## 🗂️ Estructura de Archivos Final

```
TiendaPOS-Mobile/
├── app/
│   ├── _layout.tsx                    # ✅ Drawer + Tabs navigation
│   ├── index.tsx                      # ✅ POS principal
│   │
│   ├── caja/
│   │   ├── index.tsx                  # Dashboard de caja
│   │   ├── apertura.tsx               # Abrir caja
│   │   ├── movimientos.tsx            # Movimientos del día
│   │   └── cierre.tsx                 # Cerrar caja
│   │
│   ├── productos/
│   │   ├── index.tsx                  # Lista de productos
│   │   ├── [id].tsx                   # Detalles del producto
│   │   ├── agregar.tsx                # Agregar producto
│   │   ├── editar/[id].tsx            # Editar producto
│   │   └── categorias.tsx             # Gestión de categorías
│   │
│   ├── inventario/
│   │   ├── index.tsx                  # Dashboard de inventario
│   │   ├── ajustes.tsx                # Ajustes de stock
│   │   └── lista-compras.tsx          # Lista de compras automática
│   │
│   ├── proveedores/
│   │   ├── index.tsx                  # Lista de proveedores
│   │   ├── [id].tsx                   # Detalles del proveedor
│   │   ├── agregar.tsx                # Agregar proveedor
│   │   └── editar/[id].tsx            # Editar proveedor
│   │
│   ├── compras/
│   │   ├── index.tsx                  # Historial de compras
│   │   ├── [id].tsx                   # Detalles de compra
│   │   ├── registrar.tsx              # Registrar nueva compra
│   │   └── recibir/[id].tsx           # Recibir compra
│   │
│   ├── historial/
│   │   ├── index.tsx                  # Historial de ventas
│   │   └── [id].tsx                   # Detalles de venta
│   │
│   ├── reportes/
│   │   ├── index.tsx                  # Dashboard de reportes
│   │   ├── ventas-periodo.tsx         # Ventas por período
│   │   ├── productos-top.tsx          # Productos más vendidos
│   │   ├── bajo-movimiento.tsx        # Productos con poco movimiento
│   │   └── financiero/
│   │       ├── ganancias.tsx          # Análisis de ganancias
│   │       ├── inventario.tsx         # Inversión en inventario
│   │       ├── roi.tsx                # ROI por producto
│   │       └── cajas.tsx              # Estado de cajas
│   │
│   ├── configuracion/
│   │   ├── index.tsx                  # Menú de configuración
│   │   ├── tienda.tsx                 # Datos de la tienda
│   │   ├── pos.tsx                    # Config del POS
│   │   ├── caja.tsx                   # Config de caja
│   │   ├── interfaz.tsx               # Config de UI
│   │   └── impresora.tsx              # Config de impresora
│   │
│   ├── catalogo/
│   │   ├── index.tsx                  # Vista de catálogo
│   │   └── [id].tsx                   # Detalle de producto en catálogo
│   │
│   └── asistente/
│       └── index.tsx                  # Dashboard con recomendaciones
│
├── components/
│   ├── navigation/
│   │   ├── DrawerContent.tsx          # Contenido del drawer
│   │   └── MainDrawer.tsx             # Drawer navigator
│   │
│   ├── productos/
│   │   ├── ProductoCard.tsx           # Card de producto
│   │   └── ProductoForm.tsx           # Formulario de producto
│   │
│   ├── proveedores/
│   │   └── ProveedorCard.tsx          # Card de proveedor
│   │
│   ├── ui/
│   │   ├── EmptyState.tsx             # Estado vacío
│   │   ├── ErrorState.tsx             # Estado de error
│   │   ├── LoadingSpinner.tsx         # Indicador de carga
│   │   └── StatsCard.tsx              # Card de estadísticas
│   │
│   └── common/
│       ├── SearchBar.tsx              # Barra de búsqueda
│       ├── FilterChips.tsx            # Chips de filtro
│       └── DataTable.tsx              # Tabla de datos
│
├── lib/
│   ├── database/
│   │   ├── schema.ts                  # ✅ Schema completo
│   │   ├── index.ts                   # ✅ Inicialización
│   │   └── queries/
│   │       ├── productos.ts           # Queries de productos
│   │       ├── ventas.ts              # Queries de ventas
│   │       ├── caja.ts                # Queries de caja
│   │       ├── proveedores.ts         # Queries de proveedores
│   │       ├── compras.ts             # Queries de compras
│   │       ├── inventario.ts          # Queries de inventario
│   │       └── financiero.ts          # Queries financieros
│   │
│   ├── store/
│   │   ├── useCartStore.ts            # ✅ Carrito de compras
│   │   ├── useProductStore.ts         # ✅ Productos
│   │   ├── useConfigStore.ts          # ✅ Configuración
│   │   └── useCajaStore.ts            # Estado de caja
│   │
│   ├── bluetooth/
│   │   ├── scanner.ts                 # ✅ Scanner de código de barras
│   │   └── printer.ts                 # ✅ Impresora térmica
│   │
│   └── utils/
│       ├── formatters.ts              # ✅ Formateo de datos
│       ├── seedData.ts                # ✅ Datos iniciales
│       ├── reportes.ts                # Generación de reportes
│       ├── catalogoPDF.ts             # Generación de catálogo
│       └── recomendaciones.ts         # Sistema de recomendaciones
│
└── assets/
    └── productos/
        └── productos-mexico.json      # ✅ 40 productos iniciales
```

---

## 📊 Estimación de Tiempo Total

| Fase | Módulos | Días Estimados | Días Reales | Estado |
|------|---------|---------------|-------------|--------|
| **Fase 1** | Navegación, Caja, Productos | 11-14 días | - | ⏳ Pendiente |
| **Fase 2** | Inventario, Proveedores, Compras | 12-15 días | - | ⏳ Pendiente |
| **Fase 3** | Ventas, Reportes | 12-15 días | - | ⏳ Pendiente |
| **Fase 4** | Configuración, Catálogo | 7-9 días | - | ⏳ Pendiente |
| **Fase 5** | Asistente, Cloud | 12-17 días | - | 🔮 Futuro |
| **TOTAL** | - | **54-70 días** | - | - |

**Tiempo total estimado: 8-10 semanas** (2-2.5 meses trabajando full-time)

---

## 🎯 Prioridades Inmediatas

### Esta Semana (Crítico):
1. ✅ Implementar navegación Drawer + Tabs
2. ✅ Módulo de Caja completo
3. ✅ Mejorar gestión de productos

### Próxima Semana:
4. Inventario básico
5. Proveedores CRUD
6. Registro de compras

### Mes 1:
- Completar Fases 1 y 2
- Testing exhaustivo
- Corrección de bugs

### Mes 2:
- Completar Fase 3 (Reportes)
- Completar Fase 4 (Configuración)
- Preparar para producción

---

## 🔧 Consideraciones Técnicas

### Performance
- Implementar paginación en listas largas (productos, ventas)
- Usar React.memo() para componentes pesados
- Lazy loading de imágenes de productos
- Índices en SQLite para búsquedas rápidas

### Offline-First
- Todo debe funcionar sin internet
- Backup local automático
- Sincronización opcional en el futuro

### UX/UI
- Diseño consistente con React Native Paper
- Feedback visual en todas las acciones
- Estados de carga claros
- Manejo de errores amigable
- Confirmaciones antes de acciones destructivas

### Testing
- Unit tests para funciones críticas
- Integration tests para flujos principales
- Manual testing en dispositivos reales
- Testing de hardware (scanner, impresora)

---

## 📝 Notas Importantes

1. **No hay timeline de implementación** - Este plan es flexible y se ajusta según prioridades
2. **Desktop app como referencia** - Usar `C:\Users\gaele\pos-tienda` como guía
3. **Mantener sincronización de schemas** - Mobile debe ser compatible con Desktop
4. **Priorizar funcionalidad sobre features** - Mejor un módulo completo que varios incompletos
5. **Testing continuo** - Probar cada módulo antes de continuar
6. **Documentación actualizada** - Mantener CLAUDE.MD y este archivo actualizados

---

## 🚀 Próximos Pasos

**Esperando decisión del usuario sobre:**
- ¿Qué módulo implementar primero?
- ¿Priorizar navegación o caja?
- ¿Enfocarse en productos o inventario?
- ¿Algún módulo específico es más urgente?

**Recomendación:**
Empezar con Fase 1 en orden:
1. Navegación (2-3 días)
2. Caja (4-5 días)
3. Productos mejorados (5-6 días)

Esto dará una base sólida para construir el resto de módulos.

---

*Última actualización: 2026-01-13*
*Documento vivo - se actualizará con el progreso*
