# MÓDULO DE PRODUCTOS - Implementación Completa

> Fecha: 2026-01-14
> Estado: ✅ 100% COMPLETADO

Este documento detalla la implementación completa del **Módulo de Productos** para TiendaPOS Mobile.

---

## 📋 Resumen

El módulo de productos permite la gestión completa del catálogo de productos con funcionalidades avanzadas de búsqueda, filtrado, análisis de rentabilidad y gestión de inventario.

### Estado Final: ✅ 100% Completo

**Antes:** 30% (solo lista básica)
**Ahora:** 100% (todas las funcionalidades implementadas)

---

## 🎯 Funcionalidades Implementadas

### ✅ 1. Lista Completa de Productos (`app/productos.tsx`)

#### Características Principales:
- **Búsqueda en tiempo real** por:
  - Nombre de producto
  - Código de barras
  - Categoría
  - Marca

- **Filtros Avanzados:**
  - Por categoría (chips dinámicos)
  - Por nivel de stock (Todos / Bajo / Sin stock)
  - Por rentabilidad (Rentable ≥30% / Medio 10-30% / Bajo <10%)

- **Ordenamiento:**
  - Alfabético (A-Z)
  - Por precio (mayor a menor)
  - Por ganancia (mayor a menor)
  - Por stock (menor a mayor)
  - Por fecha de creación (más recientes primero)

- **Visualización de Información:**
  - Código de barras
  - Categoría (chip)
  - Precio de compra (proveedor)
  - Precio de venta (cliente)
  - Ganancia unitaria con porcentaje
  - Stock actual con alerta visual
  - Marca y presentación
  - Estado (activo/inactivo)

#### Código Clave:

```typescript
// Filtros múltiples combinados
const filtrarProductos = () => {
  let filtered = [...productos];

  // Filtro de búsqueda
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.nombre?.toLowerCase().includes(query) ||
      p.codigoBarras?.includes(query) ||
      p.categoria?.toLowerCase().includes(query) ||
      p.marca?.toLowerCase().includes(query)
    );
  }

  // Filtro de categoría
  if (filterCategoria) {
    filtered = filtered.filter(p => p.categoria === filterCategoria);
  }

  // Filtro de stock
  if (filtroStock === 'bajo') {
    filtered = filtered.filter(p =>
      (p.stock || 0) <= (p.stockMinimo || 5) && (p.stock || 0) > 0
    );
  } else if (filtroStock === 'sinStock') {
    filtered = filtered.filter(p => (p.stock || 0) === 0);
  }

  // Filtro de rentabilidad
  if (filtroRentabilidad !== 'todos') {
    filtered = filtered.filter(p => {
      const compra = p.precioCompra || 0;
      const venta = p.precioVenta || 0;
      const ganancia = venta - compra;
      const porcentaje = compra > 0 ? ((ganancia / compra) * 100) : 0;

      if (filtroRentabilidad === 'rentable') {
        return porcentaje >= 30; // Margen >= 30%
      } else if (filtroRentabilidad === 'pocoRentable') {
        return porcentaje >= 10 && porcentaje < 30; // Margen 10-30%
      } else if (filtroRentabilidad === 'noRentable') {
        return porcentaje < 10; // Margen < 10%
      }
      return true;
    });
  }

  setFilteredProductos(filtered);
};
```

---

### ✅ 2. Formulario de Agregar Producto (`app/productos/agregar.tsx`)

#### Características:
- **Validaciones en tiempo real:**
  - Código de barras obligatorio
  - Nombre obligatorio
  - Precio de venta > 0
  - Stock ≥ 0

- **Cálculo automático de rentabilidad:**
  - Ganancia por unidad
  - Porcentaje de margen
  - Alertas visuales si margen < 10%
  - Advertencia si precio venta < precio compra

- **Campos del formulario:**
  - Información básica: código barras, nombre, SKU
  - Precios: compra (proveedor) y venta (cliente)
  - Inventario: stock inicial, stock mínimo, unidad de medida
  - Clasificación: categoría (predefinidas + personalizada), marca, presentación
  - Descripción (opcional)

- **Categorías predefinidas:**
  - Abarrotes, Lácteos, Bebidas, Snacks, Panadería
  - Limpieza, Higiene Personal, Dulces, Enlatados, Granos
  - Opción de crear categoría personalizada

- **Unidades de medida:**
  - Pieza, Kg, Litro, Paquete, Caja, Sobre

#### Código Clave:

```typescript
const handleGuardar = async () => {
  // Validaciones básicas
  if (!codigoBarras.trim()) {
    Alert.alert('Error', 'El código de barras es obligatorio');
    return;
  }

  if (!nombre.trim()) {
    Alert.alert('Error', 'El nombre del producto es obligatorio');
    return;
  }

  if (!precioVenta || parseFloat(precioVenta) <= 0) {
    Alert.alert('Error', 'El precio de venta debe ser mayor a 0');
    return;
  }

  // Validación de rentabilidad
  const validacion = queries.validarPreciosProducto(compra, venta);
  if (validacion.advertencias.length > 0) {
    Alert.alert(
      'Advertencia de Precios',
      validacion.advertencias.join('\n') + '\n\n¿Desea continuar de todos modos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => guardarProducto() }
      ]
    );
  } else {
    await guardarProducto();
  }
};

// Indicador visual de rentabilidad en tiempo real
{compra > 0 && venta > 0 && (
  <View style={styles.rentabilidadContainer}>
    <View style={styles.rentabilidadRow}>
      <Text>Ganancia por unidad:</Text>
      <Text style={[ganancia < 0 && styles.gananciaNegativa]}>
        {formatearMoneda(ganancia)}
      </Text>
    </View>
    <View style={styles.rentabilidadRow}>
      <Text>Margen de ganancia:</Text>
      <Text style={[
        porcentajeGanancia < 10 && styles.margenBajo,
        porcentajeGanancia >= 30 && styles.margenAlto
      ]}>
        {porcentajeGanancia.toFixed(1)}%
      </Text>
    </View>
    {porcentajeGanancia < 10 && (
      <HelperText type="error">
        ⚠️ Margen de ganancia muy bajo
      </HelperText>
    )}
  </View>
)}
```

---

### ✅ 3. Formulario de Editar Producto (`app/productos/editar/[id].tsx`)

#### Características:
- **Carga automática de datos existentes**
- **Código de barras deshabilitado** (no editable por seguridad)
- **Mismas validaciones que agregar producto**
- **Cálculo de rentabilidad en tiempo real**
- **Actualización de cualquier campo excepto código de barras**

#### Flujo de Edición:
1. Usuario hace clic en botón "editar" desde la lista
2. Se navega a `/productos/editar/[id]`
3. Se carga el producto por ID
4. Se muestran todos los campos prellenados
5. Usuario modifica los campos necesarios
6. Se validan los cambios
7. Se actualiza en la base de datos
8. Se regresa a la lista de productos

#### Código Clave:

```typescript
useEffect(() => {
  cargarProducto();
}, [id]);

const cargarProducto = async () => {
  try {
    setCargando(true);
    const producto = await queries.obtenerProductoPorId(Number(id));

    if (!producto) {
      Alert.alert('Error', 'Producto no encontrado');
      router.back();
      return;
    }

    // Precargar todos los campos
    setCodigoBarras(producto.codigoBarras || '');
    setNombre(producto.nombre || '');
    setDescripcion(producto.descripcion || '');
    setCategoria(producto.categoria || '');
    setMarca(producto.marca || '');
    setPresentacion(producto.presentacion || '');
    setSku(producto.sku || '');
    setPrecioCompra(producto.precioCompra?.toString() || '0');
    setPrecioVenta(producto.precioVenta?.toString() || '');
    setStock(producto.stock?.toString() || '');
    setStockMinimo(producto.stockMinimo?.toString() || '');
    setUnidadMedida(producto.unidadMedida || 'Pieza');
  } catch (error) {
    console.error('Error al cargar producto:', error);
    Alert.alert('Error', 'No se pudo cargar el producto');
  } finally {
    setCargando(false);
  }
};
```

---

### ✅ 4. Eliminación / Desactivación de Productos

#### Características:
- **Dos opciones de eliminación:**
  1. **Soft delete (recomendado):** Cambia `activo` a `false`
     - El producto se oculta de POS
     - Se mantiene historial de ventas
     - Reversible

  2. **Hard delete:** Elimina físicamente el registro
     - Solo si el producto NO tiene ventas asociadas
     - Irreversible

- **Confirmación obligatoria** antes de eliminar
- **Toggle activo/inactivo** con un clic
- **Indicador visual** de productos inactivos

#### Código Clave:

```typescript
const handleEliminarProducto = async (id: number, nombre: string) => {
  Alert.alert(
    'Eliminar Producto',
    `¿Está seguro de eliminar "${nombre}"?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await queries.eliminarProducto(id);
            Alert.alert('Éxito', 'Producto eliminado');
            cargarProductos();
          } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'No se pudo eliminar el producto');
          }
        }
      }
    ]
  );
};

const handleToggleActivo = async (id: number, nombre: string, activoActual: boolean) => {
  const nuevoEstado = !activoActual;
  try {
    await queries.actualizarProducto(id, { activo: nuevoEstado });
    Alert.alert(
      'Producto ' + (nuevoEstado ? 'Activado' : 'Desactivado'),
      `"${nombre}" ahora está ${nuevoEstado ? 'disponible' : 'no disponible'} para venta`
    );
    cargarProductos();
  } catch (error) {
    console.error('Error:', error);
    Alert.alert('Error', 'No se pudo cambiar el estado del producto');
  }
};
```

---

### ✅ 5. Gestión de Categorías

#### Características:
- **Categorías dinámicas:** Se extraen automáticamente de productos existentes
- **Filtro por categoría:** Chips horizontales deslizables
- **Categorías predefinidas** en formularios (10 categorías comunes)
- **Categoría personalizada:** Opción de crear nueva categoría
- **Sin límite de categorías**

#### Código Clave:

```typescript
// Extracción automática de categorías únicas
const cargarProductos = async () => {
  try {
    const data = await queries.obtenerProductos();
    setProductos(data);

    // Extraer categorías únicas
    const cats = [...new Set(data.map(p => p.categoria).filter(Boolean))];
    setCategorias(cats as string[]);
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
};

// Filtro de categorías con chips
<View style={styles.categoriesContainer}>
  <FlatList
    horizontal
    showsHorizontalScrollIndicator={false}
    data={categorias}
    renderItem={({ item }) => (
      <Chip
        selected={filterCategoria === item}
        onPress={() => setFilterCategoria(filterCategoria === item ? null : item)}
      >
        {item}
      </Chip>
    )}
  />
</View>
```

---

### ✅ 6. Sistema de Rentabilidad

#### Características:
- **Cálculo automático de:**
  - Ganancia por unidad: `Precio Venta - Precio Compra`
  - Porcentaje de margen: `((Venta - Compra) / Compra) × 100`

- **Clasificación por rentabilidad:**
  - **Rentable:** Margen ≥ 30% (verde)
  - **Rentabilidad media:** Margen 10-30% (amarillo)
  - **Baja rentabilidad:** Margen < 10% (naranja)
  - **No rentable:** Margen negativo (rojo)

- **Filtro por rentabilidad** en la lista principal
- **Ordenamiento por ganancia** (mayor a menor)
- **Indicadores visuales con colores**
- **Alertas en formularios** si rentabilidad es baja

#### Fórmulas Implementadas:

```typescript
const precioCompra = item.precioCompra || 0;
const precioVenta = item.precioVenta || 0;
const ganancia = precioVenta - precioCompra;
const porcentajeGanancia = precioCompra > 0 ?
  ((ganancia / precioCompra) * 100) : 0;

// Clasificación
if (porcentajeGanancia >= 30) {
  return 'rentable';  // Verde - Excelente margen
} else if (porcentajeGanancia >= 10 && porcentajeGanancia < 30) {
  return 'pocoRentable';  // Amarillo - Margen aceptable
} else if (porcentajeGanancia < 10 && porcentajeGanancia >= 0) {
  return 'noRentable';  // Naranja - Margen muy bajo
} else {
  return 'perdida';  // Rojo - Generará pérdidas
}
```

#### Visualización en Lista:

```typescript
<View style={styles.detailRow}>
  <Text variant="labelMedium">Ganancia:</Text>
  <Text
    variant="bodyLarge"
    style={[styles.ganancia, ganancia < 0 && styles.gananciaNegativa]}
  >
    {formatearMoneda(ganancia)}
    {precioCompra > 0 && (
      <Text variant="bodySmall" style={styles.porcentaje}>
        {' '}({porcentajeGanancia.toFixed(1)}%)
      </Text>
    )}
  </Text>
</View>
```

---

## 📊 Análisis de Rentabilidad

El sistema permite identificar rápidamente:

### Productos Muy Rentables (≥30%)
- Ideal para promocionar
- Enfoque de ventas
- Potencial de crecimiento

### Productos Rentabilidad Media (10-30%)
- Mantener en catálogo
- Revisar precios periódicamente
- Productos estándar

### Productos Baja Rentabilidad (<10%)
- ⚠️ Revisar estrategia de precios
- Considerar aumento de precio
- Evaluar si vale la pena mantenerlos

### Productos No Rentables (negativo)
- ❌ Acción inmediata requerida
- Ajustar precios urgentemente
- Potencial pérdida de dinero

---

## 🎨 Interfaz de Usuario

### Paleta de Colores por Estado:

| Estado | Color | Uso |
|--------|-------|-----|
| Stock bajo | `#f44336` (Rojo) | Stock ≤ stock mínimo |
| Stock OK | `#666` (Gris) | Stock > stock mínimo |
| Precio compra | `#e65100` (Naranja) | Precio proveedor |
| Precio venta | `#2c5f7c` (Azul) | Precio cliente |
| Ganancia positiva | `#4caf50` (Verde) | Margen rentable |
| Ganancia negativa | `#f44336` (Rojo) | Pérdida |
| Inactivo | `#ffebee` (Rosa claro) | Producto desactivado |

### Iconos:
- `package-variant`: Productos
- `plus`: Agregar producto
- `pencil`: Editar producto
- `delete`: Eliminar producto
- `eye` / `eye-off`: Activar/Desactivar
- `barcode-scan`: Código de barras
- `information`: Ayuda contextual

---

## 📁 Estructura de Archivos

```
app/
├── productos.tsx                    # Lista principal con filtros
└── productos/
    ├── agregar.tsx                  # Formulario de agregar
    └── editar/
        └── [id].tsx                 # Formulario de editar (dinámico)
```

---

## 🔄 Flujos de Usuario

### Flujo 1: Agregar Producto
1. Usuario hace clic en botón FAB "+"
2. Se abre formulario de agregar (`/productos/agregar`)
3. Usuario llena campos obligatorios (código barras, nombre, precio venta)
4. Usuario llena campos opcionales (categoría, marca, etc.)
5. Sistema calcula rentabilidad en tiempo real
6. Usuario hace clic en "Guardar"
7. Sistema valida datos
8. Si precio compra > precio venta, muestra advertencia
9. Crea producto en base de datos
10. Regresa a lista de productos

### Flujo 2: Editar Producto
1. Usuario busca producto en lista
2. Usuario hace clic en ícono de "editar" (lápiz)
3. Se navega a `/productos/editar/[id]`
4. Sistema carga datos del producto
5. Usuario modifica campos necesarios
6. Sistema valida cambios
7. Usuario guarda cambios
8. Producto se actualiza en base de datos
9. Regresa a lista de productos

### Flujo 3: Filtrar Productos por Rentabilidad
1. Usuario abre lista de productos
2. Usuario selecciona chip "Rentable (≥30%)"
3. Lista se filtra mostrando solo productos muy rentables
4. Usuario puede ordenar por ganancia
5. Usuario identifica productos estrella

### Flujo 4: Desactivar Producto Sin Eliminarlo
1. Usuario busca producto a desactivar
2. Usuario hace clic en ícono "ojo"
3. Sistema marca producto como inactivo
4. Producto se oculta del POS automáticamente
5. Producto sigue visible en lista con chip "Inactivo"
6. Usuario puede reactivarlo en cualquier momento

---

## ✅ Validaciones Implementadas

### En Agregar Producto:
- ✅ Código de barras obligatorio
- ✅ Código de barras único (no duplicados)
- ✅ Nombre obligatorio
- ✅ Precio de venta > 0
- ✅ Stock ≥ 0
- ✅ Advertencia si precio venta < precio compra
- ✅ Validación usando `validarPreciosProducto()` del backend

### En Editar Producto:
- ✅ Mismo conjunto de validaciones que agregar
- ✅ Código de barras no editable (protegido)
- ✅ Validación antes de guardar cambios

### En Eliminar Producto:
- ✅ Confirmación obligatoria
- ✅ Mensaje descriptivo con nombre del producto
- ✅ Manejo de errores si el producto tiene ventas asociadas

---

## 🎯 Beneficios del Módulo Completo

### Para el Dueño de la Tienda:
- ✅ **Visibilidad completa del catálogo**
- ✅ **Identificación de productos rentables vs no rentables**
- ✅ **Alertas de stock bajo**
- ✅ **Gestión fácil de precios**
- ✅ **Análisis de márgenes de ganancia**

### Para el Operador:
- ✅ **Búsqueda rápida de productos**
- ✅ **Filtros intuitivos**
- ✅ **Formularios simples y claros**
- ✅ **Validaciones que previenen errores**
- ✅ **Indicadores visuales (colores, íconos)**

### Para el Negocio:
- ✅ **Mejor control de inventario**
- ✅ **Optimización de rentabilidad**
- ✅ **Toma de decisiones basada en datos**
- ✅ **Prevención de pérdidas**
- ✅ **Catálogo organizado y escalable**

---

## 📈 Métricas y KPIs Disponibles

El módulo permite calcular:

1. **Ganancia Total del Catálogo:**
   ```typescript
   const gananciaTotal = productos.reduce((acc, p) => {
     return acc + ((p.precioVenta - p.precioCompra) * p.stock);
   }, 0);
   ```

2. **Margen Promedio:**
   ```typescript
   const margenPromedio = productos.reduce((acc, p) => {
     const margen = p.precioCompra > 0 ?
       ((p.precioVenta - p.precioCompra) / p.precioCompra * 100) : 0;
     return acc + margen;
   }, 0) / productos.length;
   ```

3. **Productos con Stock Bajo:**
   ```typescript
   const stockBajo = productos.filter(p =>
     p.stock <= (p.stockMinimo || 5)
   ).length;
   ```

4. **Valor Total del Inventario:**
   ```typescript
   const valorInventario = productos.reduce((acc, p) => {
     return acc + (p.precioCompra * p.stock);
   }, 0);
   ```

---

## 🚀 Próximas Mejoras Opcionales

Aunque el módulo está 100% completo, se podrían agregar en el futuro:

1. **Importar/Exportar catálogo** (CSV, Excel)
2. **Códigos QR personalizados** para productos sin código de barras
3. **Fotos de productos**
4. **Historial de cambios de precios**
5. **Comparativa de precios con competencia**
6. **Sugerencias de precios basadas en margen objetivo**
7. **Alertas automáticas de reabastecimiento**
8. **Etiquetas personalizadas** (ofertas, nuevo, promoción)

---

## ✅ Checklist de Completitud

- [x] Lista de productos con información completa
- [x] Búsqueda en tiempo real
- [x] Filtros por categoría
- [x] Filtros por stock
- [x] Filtros por rentabilidad
- [x] Ordenamiento múltiple
- [x] Formulario de agregar producto
- [x] Formulario de editar producto
- [x] Validaciones completas
- [x] Eliminación con confirmación
- [x] Soft delete (activar/desactivar)
- [x] Gestión de categorías dinámicas
- [x] Sistema de rentabilidad completo
- [x] Cálculo automático de ganancias
- [x] Indicadores visuales (colores)
- [x] Alertas de stock bajo
- [x] Indicadores de productos inactivos
- [x] Resumen de productos mostrados

---

## 📝 Notas Técnicas

### Performance:
- Los filtros se aplican en memoria (cliente)
- Para catálogos >1000 productos, considerar paginación
- Las categorías se extraen una sola vez al cargar

### Compatibilidad:
- React Native Paper para UI consistente
- Expo Router para navegación
- Compatible con iOS y Android

### Mantenibilidad:
- Código modular y reutilizable
- Estilos separados en StyleSheet
- Constantes definidas al inicio
- Funciones de validación compartidas

---

**Documento generado el:** 2026-01-14
**Módulo:** Productos
**Estado:** ✅ 100% Completado
**Versión de la aplicación:** v0.90 (90% completa)
