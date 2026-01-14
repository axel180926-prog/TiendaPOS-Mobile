# Sistema de Productos y Catálogo - TiendaPOS Mobile

> Sistema dual de gestión de productos con cálculo automático de ganancias y márgenes
> Fecha: 2026-01-14

## 📋 Índice

1. [Visión General](#visión-general)
2. [Módulos del Sistema](#módulos-del-sistema)
3. [Flujo de Datos](#flujo-de-datos)
4. [Cálculo de Ganancias](#cálculo-de-ganancias)
5. [Integración con POS](#integración-con-pos)
6. [Guía de Uso](#guía-de-uso)

---

## 🎯 Visión General

El sistema cuenta con **dos interfaces diferentes** para gestionar los mismos productos:

1. **Módulo de Productos** (`app/productos.tsx`)
   - Interfaz avanzada con CRUD completo
   - Para usuarios que dominan el sistema
   - Edición detallada de todos los campos

2. **Módulo de Catálogo** (`app/catalogo.tsx`)
   - Interfaz simplificada tipo onboarding
   - Organización por categorías
   - Configuración rápida (solo precios y stock)
   - Ideal para nuevos usuarios

**Ambos módulos trabajan sobre la misma base de datos**, sin duplicación de información.

---

## 📦 Módulos del Sistema

### 1. Módulo de Productos (Avanzado)

**Ubicación:** `app/productos.tsx`

**Características:**
- ✅ CRUD completo de productos
- ✅ Búsqueda en tiempo real
- ✅ Filtros avanzados (categoría, stock, ordenamiento)
- ✅ Edición de todos los campos del producto
- ✅ Eliminación de productos
- ✅ Vista de lista con cards detalladas

**Ideal para:**
- Agregar productos nuevos desde cero
- Modificar descripciones, marcas, presentaciones
- Cambiar códigos de barras
- Usuarios experimentados

**Datos que muestra:**
- Nombre, código de barras, categoría
- Precio de venta (destacado)
- Stock actual con alertas
- Marca y presentación
- Unidad de medida

### 2. Módulo de Catálogo (Simplificado)

**Ubicación:** `app/catalogo.tsx`

**Características:**
- ✅ Vista organizada por categorías
- ✅ Contador de productos activos/totales por categoría
- ✅ Sistema de activación/desactivación
- ✅ Configuración rápida con modal
- ✅ Cálculo de ganancia en tiempo real
- ✅ Filtro por estado (todos/activos/inactivos)

**Ideal para:**
- Setup inicial de una tienda nueva
- Configurar rápidamente productos pre-cargados
- Ver ganancias por producto
- Usuarios novatos

**Datos que muestra:**
- Nombre, descripción, marca, presentación
- **Precio Proveedor** (precio de compra)
- **Precio Venta** (precio al cliente)
- **Ganancia** (diferencia y porcentaje)
- Stock actual
- Estado: ACTIVO / Inactivo

---

## 🔄 Flujo de Datos

### Esquema de Base de Datos

```typescript
// lib/database/schema.ts - Tabla productos
{
  id: number (autoincrement)
  codigoBarras: string (unique)
  nombre: string
  precioCompra: number      // ← Precio del PROVEEDOR
  precioVenta: number       // ← Precio al CLIENTE
  stock: number
  stockMinimo: number
  categoria: string
  marca: string
  presentacion: string
  descripcion: string
  sku: string
  unidadMedida: string
  activo: boolean          // ← Control de activación
  createdAt: timestamp
}
```

### Sincronización entre Módulos

```
┌─────────────────┐
│   PRODUCTOS     │ ────────┐
│   (Avanzado)    │         │
└─────────────────┘         │
                            ▼
                    ┌───────────────┐
                    │   PRODUCTOS   │
                    │   (Tabla DB)  │
                    └───────────────┘
                            ▲
┌─────────────────┐         │
│   CATÁLOGO      │ ────────┘
│  (Simplificado) │
└─────────────────┘
```

**Ejemplo de flujo:**

1. Usuario activa producto en **Catálogo** → campo `activo = true`
2. Usuario configura precios en **Catálogo** → `precioCompra` y `precioVenta`
3. Producto aparece automáticamente en **Productos** con los mismos datos
4. Usuario edita nombre en **Productos** → se refleja en **Catálogo**
5. Cambios son instantáneos en ambos módulos

---

## 💰 Cálculo de Ganancias

### Fórmula de Ganancia

```typescript
precioCompra = 9.30    // Lo que pagas al proveedor
precioVenta = 15.00    // Lo que cobras al cliente

ganancia = precioVenta - precioCompra
ganancia = 15.00 - 9.30 = $5.70

porcentaje = (ganancia / precioCompra) * 100
porcentaje = (5.70 / 9.30) * 100 = 61.3%
```

### Ejemplo Real: Coca-Cola 600ml

| Concepto | Monto | Descripción |
|----------|-------|-------------|
| **Precio Proveedor** | $9.30 | Lo que compras al distribuidor |
| **Precio Venta** | $15.00 | Lo que cobras en tu tienda |
| **Ganancia** | $5.70 | Tu utilidad por pieza |
| **Margen** | 61.3% | Porcentaje de ganancia |

Si vendes 50 piezas al día:
- **Inversión:** 50 × $9.30 = $465.00
- **Ingresos:** 50 × $15.00 = $750.00
- **Ganancia Diaria:** $285.00

### Vista en Catálogo

El módulo de catálogo muestra esta información en cards visuales:

```
┌────────────────────────────────────┐
│ Coca-Cola 600ml         [ACTIVO]  │
│ Refresco de cola 600ml             │
│ 🏷️ Coca-Cola  📦 600ml            │
├────────────────────────────────────┤
│ Precio Proveedor    $9.30          │
│ Precio Venta        $15.00         │
│ Ganancia           +$5.70 (61.3%)  │
│ Stock              50 Pieza        │
├────────────────────────────────────┤
│ [Editar Precio] [Desactivar]       │
└────────────────────────────────────┘
```

---

## 🛒 Integración con POS

### Flujo de Venta

```
POS (app/index.tsx)
    │
    ├─ Busca producto por código de barras
    │
    ├─ Verifica que esté activo
    │  (activo === true)
    │
    ├─ Toma precioVenta como precio del producto
    │
    ├─ Registra venta en tabla `ventas`
    │
    └─ Descuenta del stock
```

### Registro de Venta

Cuando se vende 1 Coca-Cola:

```typescript
// Se registra en venta_items
{
  ventaId: 123,
  productoId: 1,
  cantidad: 1,
  precioUnitario: 15.00  // ← precioVenta del producto
}

// Se actualiza stock
productos.stock = 50 - 1 = 49
```

### Cálculo de Ganancias en Ventas

El sistema **NO registra automáticamente** el costo en cada venta (simplificación para la v1), pero puedes calcularlo:

```typescript
// Para calcular ganancia de una venta:
const itemsVenta = await obtenerItemsVenta(ventaId);

let costoTotal = 0;
let ventaTotal = 0;

for (const item of itemsVenta) {
  const producto = await obtenerProducto(item.productoId);

  costoTotal += (producto.precioCompra * item.cantidad);
  ventaTotal += item.precioUnitario * item.cantidad;
}

const gananciaVenta = ventaTotal - costoTotal;
```

---

## 📚 Guía de Uso

### Para Dueño Nuevo (Setup Inicial)

**Recomendación:** Usar el **Módulo de Catálogo**

1. **Ir a Catálogo** desde el menú lateral
2. **Seleccionar una categoría** (ej: "Bebidas")
3. **Ver productos** pre-cargados de esa categoría
4. Para cada producto que vendes:
   - Presionar **"Editar Precio"**
   - Ingresar **Precio de Compra** (lo que te cobra el proveedor)
   - Ingresar **Precio de Venta** (lo que cobrarás al cliente)
   - Ingresar **Stock Inicial**
   - Ver la ganancia calculada automáticamente
   - Presionar **"Guardar"**
5. El producto queda **ACTIVO** automáticamente
6. Repetir con todos los productos que vendes

**Ventajas:**
- En 15-20 minutos tienes tu tienda configurada
- Ves las ganancias mientras configuras
- Solo configuras lo esencial

### Para Usuario Avanzado

**Recomendación:** Usar el **Módulo de Productos**

1. **Ir a Productos** desde el menú lateral
2. **Buscar, filtrar y ordenar** productos
3. **Editar producto** presionando el ícono de lápiz
4. Modificar cualquier campo:
   - Nombre, código de barras, categoría
   - Precio de compra y venta
   - Stock, stock mínimo
   - Marca, presentación, descripción
   - etc.
5. **Guardar cambios**

**Ventajas:**
- Control total sobre todos los campos
- Puedes crear productos desde cero
- Ideal para productos sin código de barras
- Puedes eliminar productos

### Activar/Desactivar Productos

**En Catálogo:**
- Botón **"Activar"** / **"Desactivar"** en cada card
- Filtro rápido: Todos / Activos / Inactivos

**En Productos:**
- No hay botón visual (pendiente)
- Se puede editar el campo `activo` manualmente

**Efecto de Desactivar:**
- Producto NO aparece en búsqueda del POS
- No se puede vender
- Sigue en la base de datos
- Puedes reactivarlo cuando quieras

---

## 🔧 Mantenimiento

### Actualizar Precios Masivamente

Si tu proveedor sube precios:

**Opción 1: Catálogo (Visual)**
1. Filtrar por categoría afectada
2. Editar cada producto
3. Actualizar precio de compra y/o venta

**Opción 2: Productos (Rápido)**
1. Usar búsqueda para encontrar productos
2. Editar uno por uno

**Opción 3: Base de Datos (Avanzado)**
```typescript
// Subir 10% todos los precios de Bebidas
await db.update(productos)
  .set({
    precioVenta: sql`precio_venta * 1.10`,
    precioCompra: sql`precio_compra * 1.10`
  })
  .where(eq(productos.categoria, 'Bebidas'));
```

### Ver Productos No Rentables

En el Catálogo, buscar productos donde:
- Ganancia es negativa (rojo)
- Porcentaje < 20% (muy bajo margen)

Revisar si:
- El precio de compra está bien capturado
- El precio de venta debe subir
- El producto debe descontinuarse

---

## 🎯 Casos de Uso

### Caso 1: Tienda Nueva

**Juan acaba de comprar una tienda:**

1. Abre la app TiendaPOS
2. Va a **Catálogo**
3. Selecciona "Bebidas"
4. Ve 25 productos pre-cargados
5. Activa solo los 8 que vende:
   - Coca-Cola 600ml: Compra $9.30, Vende $15
   - Sprite 600ml: Compra $9.30, Vende $15
   - etc.
6. Repite con "Botanas", "Galletas", etc.
7. En 20 minutos tiene 40 productos listos
8. Empieza a vender inmediatamente

### Caso 2: Usuario Experimentado

**María ya tiene experiencia:**

1. Va directo a **Productos**
2. Agrega un producto artesanal sin código de barras
3. Crea SKU personalizado
4. Configura todos los campos
5. Establece stock mínimo personalizado
6. Lo categoriza y etiqueta

### Caso 3: Análisis de Ganancias

**Roberto quiere ver qué tan rentable es su negocio:**

1. Va a **Catálogo**
2. Filtra por "Activos"
3. Revisa categoría por categoría
4. Toma nota de productos con ganancia < 20%
5. Decide:
   - Subir precio de venta
   - Buscar otro proveedor más barato
   - Descontinuar productos no rentables

---

## 📱 Capturas de Pantalla

### Catálogo - Vista Principal

```
┌─────────────────────────────────────────┐
│ 📦 Catálogo de Productos                │
│ Selecciona categoría, configura precios │
├─────────────────────────────────────────┤
│ [Todos] [Activos] [Inactivos]           │
├─────────────────────────────────────────┤
│ Categorías                               │
│ ⊙ Todas (40) ○ Bebidas (1/25)          │
│ ○ Botanas (5/24) ○ Galletas (2/8)      │
└─────────────────────────────────────────┘
```

### Catálogo - Card de Producto

```
┌─────────────────────────────────────────┐
│ Coca-Cola 600ml         [ACTIVO]        │
│ Refresco de cola 600ml                  │
│ 🏷️ Coca-Cola  📦 600ml                 │
├─────────────────────────────────────────┤
│ Precio Proveedor    $9.30               │
│ Precio Venta        $15.00              │
│ Ganancia           +$5.70 (61.3%) ✓     │
│ Stock              50 Pieza             │
├─────────────────────────────────────────┤
│ [Editar Precio] [Desactivar]            │
└─────────────────────────────────────────┘
```

### Modal de Configuración

```
┌─────────────────────────────────────────┐
│ Configurar Producto                      │
│ Coca-Cola 600ml                          │
├─────────────────────────────────────────┤
│ Precio de Compra (Proveedor)      ⓘ    │
│ $ 9.30                                   │
│                                          │
│ Precio de Venta (Cliente)         ⓘ    │
│ $ 15.00                                  │
│                                          │
│ Stock Inicial                            │
│ 50                           pzas        │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Ganancia por unidad:                │ │
│ │      $5.70                          │ │
│ │      (61.3%)                        │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│              [Cancelar] [Guardar]        │
└─────────────────────────────────────────┘
```

---

## ✅ Ventajas del Sistema Dual

1. **Flexibilidad:** Cada usuario elige su flujo preferido
2. **Misma Fuente de Datos:** Sin duplicación, sin inconsistencias
3. **Onboarding Rápido:** Catálogo acelera el setup inicial
4. **Transparencia:** Ves ganancias en tiempo real
5. **Control Total:** Productos permite edición avanzada
6. **Sistema de Activación:** Controlas qué se vende sin eliminar datos

---

## 🔮 Futuras Mejoras

- [ ] Botón activar/desactivar en módulo Productos
- [ ] Reportes de rentabilidad por producto
- [ ] Alertas de productos con margen bajo
- [ ] Importación masiva desde Excel
- [ ] Historial de cambios de precio
- [ ] Comparación de precios con competencia
- [ ] Sugerencias de precio óptimo basado en margen deseado

---

**Documentación Completa - TiendaPOS Mobile**
*Actualizado: 2026-01-14*
