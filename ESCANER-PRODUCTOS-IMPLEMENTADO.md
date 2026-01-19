# Escáner de Código de Barras en Módulo de Productos

## ✅ Implementación Completada

Se ha implementado la funcionalidad de búsqueda por escáner de código de barras en el módulo de productos (`app/productos.tsx`).

---

## 🎯 Funcionalidad

### Cómo Funciona

1. **TextInput Oculto**: Un campo de texto invisible mantiene el foco para capturar la entrada del escáner
2. **Detección Automática**: Cuando el escáner envía un código (terminado con Enter), se procesa automáticamente
3. **Búsqueda de Producto**: Busca el producto en la base de datos por código de barras
4. **Opciones al Usuario**: Muestra un diálogo con opciones al encontrar el producto

---

## 🔧 Características Implementadas

### 1. Búsqueda por Escáner

Cuando escaneas un código de barras:

**Si el producto EXISTE:**
- Muestra un diálogo con información del producto:
  - Nombre del producto
  - Precio de venta
  - Stock disponible
- Tres opciones disponibles:
  - **Cancelar**: Cierra el diálogo y limpia el buffer
  - **Editar**: Navega a la pantalla de edición del producto
  - **Ver Lista**: Muestra el producto en la lista (filtrado por código)

**Si el producto NO EXISTE:**
- Muestra mensaje: "Producto No Encontrado"
- Indica el código que se buscó
- Opción de cerrar y continuar escaneando

### 2. Compatibilidad

Funciona con los mismos escáneres que el POS:
- ✅ Escáner USB (HID)
- ✅ Escáner Bluetooth en modo HID
- ✅ No requiere configuración adicional

### 3. Indicadores Visuales

- **Ícono de escáner** en la barra de búsqueda (barcode-scan)
- **Placeholder actualizado**: "Buscar productos o escanear código..."
- Indica claramente que se puede usar el escáner

---

## 📋 Código Implementado

### Estados y Referencias

```typescript
// Estado para escáner de código de barras
const [scannerBuffer, setScannerBuffer] = useState('');
const scannerInputRef = useRef<RNTextInput>(null);
```

### Funciones Principales

#### handleBarcodeScanned()
```typescript
const handleBarcodeScanned = async (codigo: string) => {
  const producto = await queries.obtenerProductoPorCodigo(codigo);

  if (producto) {
    // Mostrar diálogo con opciones: Cancelar, Editar, Ver Lista
  } else {
    // Mostrar mensaje de no encontrado
  }
}
```

#### handleScannerInput()
```typescript
const handleScannerInput = (text: string) => {
  setScannerBuffer(text);
};
```

### TextInput Oculto

```typescript
<RNTextInput
  ref={scannerInputRef}
  value={scannerBuffer}
  onChangeText={handleScannerInput}
  autoFocus={true}
  showSoftInputOnFocus={false}
  keyboardType="numeric"
  onSubmitEditing={(e) => {
    const code = e.nativeEvent.text.trim();
    if (code) handleBarcodeScanned(code);
  }}
  style={styles.hiddenInput}
/>
```

### Estilos

```typescript
hiddenInput: {
  position: 'absolute',
  left: -9999,
  width: 1,
  height: 1,
},
```

---

## 🎮 Flujo de Usuario

### Escenario 1: Editar Producto Rápidamente

1. Usuario escanea código de barras
2. Sistema encuentra el producto
3. Usuario selecciona "Editar"
4. Navega a pantalla de edición
5. Usuario modifica datos y guarda

**Beneficio**: Edición rápida sin buscar manualmente

### Escenario 2: Verificar Información

1. Usuario escanea código de barras
2. Sistema muestra información del producto en el diálogo
3. Usuario verifica precio y stock
4. Usuario selecciona "Cancelar" para continuar

**Beneficio**: Consulta rápida sin cambiar de pantalla

### Escenario 3: Producto No Registrado

1. Usuario escanea código desconocido
2. Sistema indica que no existe
3. Usuario puede:
   - Escanear otro código
   - Agregar producto manualmente con el botón FAB

**Beneficio**: Identificación rápida de productos faltantes

---

## 🔄 Comparación: POS vs Productos

| Característica | POS (index.tsx) | Productos (productos.tsx) |
|----------------|-----------------|---------------------------|
| **Función Principal** | Agregar al carrito | Buscar/Editar producto |
| **Acción al escanear** | Agrega 1 unidad | Muestra opciones |
| **Validación** | Verifica stock | Busca en BD |
| **Resultado** | Producto en carrito | Diálogo con opciones |
| **Navegación** | Permanece en POS | Puede ir a editar |

---

## 📊 Beneficios

### Para el Usuario
1. **Velocidad**: Búsqueda instantánea por código de barras
2. **Precisión**: No hay errores de escritura
3. **Eficiencia**: Edición rápida de productos
4. **Versatilidad**: Múltiples opciones al encontrar producto

### Para el Negocio
1. **Gestión más rápida** de inventario
2. **Menos errores** en la administración
3. **Mejor flujo de trabajo** para reabastecimiento
4. **Compatibilidad** con equipos existentes

---

## 🚀 Casos de Uso

### 1. Reabastecimiento de Inventario

**Escenario**: Recibiste productos del proveedor

1. Escanea el código de barras del producto
2. Selecciona "Editar"
3. Actualiza el stock
4. Guarda cambios
5. Continúa con el siguiente producto

**Resultado**: Actualización rápida de todo el inventario

### 2. Actualización de Precios

**Escenario**: Cambio de precios por proveedor

1. Escanea producto
2. Edita precio de compra/venta
3. Guarda
4. Siguiente producto

**Resultado**: Precios actualizados en minutos

### 3. Verificación de Stock

**Escenario**: Cliente pregunta si hay producto

1. Escanea código
2. Ve stock en el diálogo
3. Informa al cliente
4. Cancela (o edita si es necesario)

**Resultado**: Respuesta inmediata sin buscar manualmente

### 4. Control de Calidad

**Escenario**: Revisar productos próximos a vencer

1. Escanea producto
2. Ver información
3. Si es necesario, edita o desactiva
4. Continúa revisión

**Resultado**: Control eficiente de inventario

---

## 🎨 Interfaz de Usuario

### Barra de Búsqueda
- **Ícono**: Código de barras (barcode-scan)
- **Placeholder**: "Buscar productos o escanear código..."
- **Indica claramente** que acepta escáner

### Diálogo de Producto Encontrado
```
╔═══════════════════════════════╗
║   Producto Encontrado         ║
╠═══════════════════════════════╣
║ Coca-Cola 600ml               ║
║ $15.00                        ║
║ Stock: 50                     ║
╠═══════════════════════════════╣
║ [Cancelar] [Editar] [Ver Lista]║
╚═══════════════════════════════╝
```

### Diálogo de No Encontrado
```
╔═══════════════════════════════╗
║   Producto No Encontrado      ║
╠═══════════════════════════════╣
║ No existe un producto con     ║
║ el código: 7501234567890      ║
╠═══════════════════════════════╣
║           [OK]                ║
╚═══════════════════════════════╝
```

---

## 🔧 Configuración

### Escáneres Compatibles

**Igual que en el POS:**
- Escáneres USB en modo HID
- Escáneres Bluetooth en modo HID (teclado)

**No requiere:**
- Configuración adicional en la app
- Permisos especiales
- Código nativo adicional

### Cómo Configurar el Escáner

1. **USB**: Simplemente conectar
2. **Bluetooth HID**:
   - Configurar escáner en modo HID (ver manual)
   - Emparejar como "Teclado Bluetooth"
   - Usar en la app

---

## 📝 Notas Técnicas

### Flujo de Datos

```
Escáner → TextInput Oculto → handleScannerInput()
                                      ↓
                              Actualiza scannerBuffer
                                      ↓
                              onSubmitEditing (Enter detectado)
                                      ↓
                              handleBarcodeScanned(codigo)
                                      ↓
                         obtenerProductoPorCodigo(codigo)
                                      ↓
                            ┌────────┴────────┐
                            ↓                 ↓
                    Producto Existe    Producto No Existe
                            ↓                 ↓
                    Mostrar Diálogo    Mostrar Error
                    con Opciones
```

### Gestión de Foco

- El `TextInput` oculto siempre tiene `autoFocus={true}`
- Después de cada acción, el foco vuelve al input: `scannerInputRef.current?.focus()`
- Esto asegura que el siguiente escaneo se capture correctamente

### Limpieza de Buffer

El buffer se limpia en cada acción para evitar duplicados:
```typescript
setScannerBuffer('');
```

---

## 🐛 Resolución de Problemas

### El escáner no funciona

**Verificar**:
1. ¿Funciona en el POS? (Si sí, debería funcionar aquí también)
2. ¿El escáner está en modo HID?
3. ¿Prueba en Notepad? (Debe "escribir" el código)

**Solución**: Ver SISTEMA-ESCANERES.md para configuración

### Se escanea pero no busca

**Posible causa**: El código no termina con Enter

**Solución**: Configurar "Suffix" del escáner como CR o LF

### Busca el código incorrecto

**Posible causa**: Buffer no se limpia

**Verificar**: `setScannerBuffer('')` en todas las acciones

---

## 🎯 Próximas Mejoras (Opcional)

### Posibles Funcionalidades Futuras

1. **Historial de Escaneos**
   - Guardar últimos 10 códigos escaneados
   - Acceso rápido a productos recientes

2. **Sonido de Confirmación**
   - Beep al escanear correctamente
   - Sonido diferente si no se encuentra

3. **Estadísticas**
   - Productos más escaneados
   - Tiempo promedio de edición

4. **Modo Inventario**
   - Escanear múltiples productos
   - Actualizar stock en lote

---

## ✅ Checklist de Funcionalidad

- [x] TextInput oculto implementado
- [x] Detección de código de barras
- [x] Búsqueda en base de datos
- [x] Diálogo con opciones
- [x] Navegación a edición
- [x] Filtrado en lista
- [x] Limpieza de buffer
- [x] Gestión de foco
- [x] Indicador visual (ícono)
- [x] Placeholder actualizado
- [x] Manejo de errores
- [x] Compatible con USB/Bluetooth HID

---

## 📞 Soporte

Para problemas específicos:
1. Ver `SISTEMA-ESCANERES.md` - Guía completa de escáneres
2. Verificar configuración del escáner (manual del fabricante)
3. Probar en otra aplicación primero (Notepad/Notes)

---

**Implementado**: 2026-01-14
**Archivo**: `app/productos.tsx`
**Estado**: ✅ Completamente funcional
**Compatibilidad**: USB + Bluetooth HID
