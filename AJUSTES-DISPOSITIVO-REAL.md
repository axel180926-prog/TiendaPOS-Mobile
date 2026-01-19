# 📱 Ajustes para Dispositivos Reales

> Fecha: 2026-01-14
> Problema: Textos muy pequeños en dispositivos físicos
> Solución: ✅ Tamaños de fuente aumentados

---

## 🔍 ¿Por qué se ve diferente en el emulador vs dispositivo real?

### Causas Principales:

1. **Densidad de Píxeles (DPI/PPI)**
   - Emuladores: ~160-240 DPI
   - Dispositivos reales modernos: 300-500+ DPI
   - Más píxeles = texto más pequeño

2. **Escalado del Sistema**
   - El usuario puede tener configurado "Tamaño de fuente" en ajustes de Android
   - El sistema operativo aplica escalado automático
   - Puede variar entre dispositivos

3. **Renderizado de Fuentes**
   - Motor de renderizado diferente
   - Anti-aliasing distinto
   - Suavizado de fuentes

4. **Tamaño Físico de Pantalla**
   - Mismo tamaño lógico (dp) = tamaño físico diferente (mm)
   - Pantalla de 5.5" vs 6.5" con misma resolución

---

## ✅ Ajustes Implementados

### 1. **Labels de Precios (COMPRA, VENTA, GANANCIA)**

**Antes:**
```typescript
fontSize: 9,
fontWeight: '600',
color: '#666',
letterSpacing: 0.5,
```

**Ahora:**
```typescript
fontSize: 11,        // +2 más grande
fontWeight: '700',   // Más bold
color: '#444',       // Más oscuro = más legible
letterSpacing: 1,    // Mayor espaciado
```

### 2. **Valores de Precios**

**Antes:**
```typescript
fontSize: 15,
```

**Ahora:**
```typescript
fontSize: 17,  // +2 más grande
```

### 3. **Valor de Ganancia**

**Antes:**
```typescript
fontSize: 14,
```

**Ahora:**
```typescript
fontSize: 16,  // +2 más grande
```

### 4. **Porcentaje de Ganancia**

**Antes:**
```typescript
fontSize: 10,
fontWeight: '600',
```

**Ahora:**
```typescript
fontSize: 11,      // +1 más grande
fontWeight: '700', // Más bold
```

### 5. **Label de Stock**

**Antes:**
```typescript
fontSize: 9,
fontWeight: '600',
color: '#666',
letterSpacing: 0.5,
```

**Ahora:**
```typescript
fontSize: 11,        // +2 más grande
fontWeight: '700',   // Más bold
color: '#555',       // Más oscuro
letterSpacing: 0.8,  // Mayor espaciado
```

### 6. **Valor de Stock**

**Antes:**
```typescript
fontWeight: '700',
color: '#333',
// Sin fontSize definido
```

**Ahora:**
```typescript
fontWeight: '700',
color: '#333',
fontSize: 16,  // Tamaño explícito
```

### 7. **Chip de Categoría**

**Antes:**
```typescript
fontSize: 11,
fontWeight: '600',
```

**Ahora:**
```typescript
fontSize: 12,      // +1 más grande
fontWeight: '700', // Más bold
```

### 8. **Código de Barras**

**Antes:**
```typescript
color: '#999',
fontSize: 11,
```

**Ahora:**
```typescript
color: '#888',       // Más oscuro = más legible
fontSize: 12,        // +1 más grande
fontWeight: '500',   // Medium weight
```

### 9. **Tarjetas de Precio**

**Antes:**
```typescript
padding: 10,
minHeight: 56,
```

**Ahora:**
```typescript
padding: 12,     // +2 más espacioso
minHeight: 68,   // +12 más alto
```

### 10. **Searchbar Placeholder**

**Antes:**
```typescript
placeholder="Buscar productos o escanear código..."
// Sin color definido
```

**Ahora:**
```typescript
placeholder="Buscar productos o escanear..."
placeholderTextColor="#888"  // Más oscuro = más visible
```

---

## 📊 Tabla de Mejoras

| Elemento | Antes | Ahora | Mejora |
|----------|-------|-------|--------|
| Labels (COMPRA/VENTA) | 9px | 11px | +22% |
| Valores precios | 15px | 17px | +13% |
| Ganancia | 14px | 16px | +14% |
| Porcentaje | 10px | 11px | +10% |
| Stock label | 9px | 11px | +22% |
| Stock value | auto | 16px | Definido |
| Chip categoría | 11px | 12px | +9% |
| Código barras | 11px | 12px | +9% |
| Altura precio card | 56px | 68px | +21% |
| Padding card | 10px | 12px | +20% |

---

## 🎯 Resultado Esperado

### En Dispositivos Reales:

✅ **Textos más legibles** - Todos los tamaños aumentados
✅ **Mejor contraste** - Colores más oscuros (#444 vs #666)
✅ **Mayor claridad** - Fuentes más bold (700 vs 600)
✅ **Más espacio** - Padding y altura aumentados
✅ **Placeholder visible** - Color más oscuro (#888)

---

## 💡 Buenas Prácticas para Apps Móviles

### Tamaños de Fuente Recomendados:

```typescript
// Muy pequeño (auxiliar)
fontSize: 10-11

// Pequeño (labels)
fontSize: 11-12

// Normal (texto body)
fontSize: 14-16

// Títulos secundarios
fontSize: 16-18

// Títulos principales
fontSize: 20-24

// Display / Hero
fontSize: 28-32
```

### Pesos de Fuente:

```typescript
// Normal
fontWeight: '400'

// Medium (más visible)
fontWeight: '500'

// Semi-bold (labels)
fontWeight: '600'

// Bold (destacados)
fontWeight: '700'

// Extra bold (hero)
fontWeight: '800'
```

### Contraste de Colores:

```typescript
// Texto primario (máximo contraste)
color: '#1a1a1a' o '#000'

// Texto secundario (buen contraste)
color: '#333' o '#444'

// Texto terciario (contraste medio)
color: '#555' o '#666'

// Texto deshabilitado (bajo contraste)
color: '#888' o '#999'
```

---

## 🧪 Cómo Probar

1. **Recarga la app** (presiona `r` en terminal de Expo)
2. **Compara textos** - Deberían verse más grandes y claros
3. **Verifica legibilidad** - ¿Puedes leer COMPRA/VENTA/GANANCIA fácilmente?
4. **Prueba en diferentes condiciones**:
   - Luz brillante (exterior)
   - Luz tenue (interior)
   - Diferentes ángulos de visión

---

## 🔧 Ajustes Adicionales (Si Aún Se Ve Pequeño)

Si después de estos cambios aún se ve pequeño en tu dispositivo, puedes:

### Opción 1: Aumentar Escala Global
```typescript
// En _layout.tsx o App.tsx
import { Platform, PixelRatio } from 'react-native';

// Calcular factor de escala
const fontScale = PixelRatio.getFontScale();
const adjustedSize = baseFontSize * fontScale;
```

### Opción 2: Usar Responsive Font Size
```bash
npm install react-native-responsive-fontsize
```

```typescript
import { RFValue } from 'react-native-responsive-fontsize';

fontSize: RFValue(12) // Se ajusta automáticamente
```

### Opción 3: Detectar DPI y Ajustar
```typescript
import { Dimensions, PixelRatio } from 'react-native';

const pixelDensity = PixelRatio.get();
const adjustedFontSize = pixelDensity > 2 ? 13 : 11;
```

---

## 📝 Notas Importantes

1. **Siempre prueba en dispositivos reales** - Los emuladores no son 100% precisos
2. **Considera diferentes tamaños de pantalla** - 5", 6", 6.5", tablets
3. **Respeta configuración del usuario** - Si tiene fuentes grandes en sistema
4. **Mantén jerarquía visual** - No todos los textos del mismo tamaño
5. **Usa weights para diferenciar** - Bold para importante, regular para secundario

---

## ✅ Checklist de Legibilidad

- [x] ¿Puedes leer los labels (COMPRA/VENTA) sin esfuerzo?
- [x] ¿Los precios se ven claros y grandes?
- [x] ¿El chip de categoría es legible?
- [x] ¿El código de barras se lee bien (aunque sea secundario)?
- [x] ¿El stock se ve con claridad?
- [x] ¿Hay buen contraste entre texto y fondo?
- [x] ¿Los elementos importantes destacan?

---

*Ajustes para dispositivos reales aplicados: 2026-01-14*
