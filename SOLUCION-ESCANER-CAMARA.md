# 🔧 Solución: Escáner de Cámara en Expo Go

> Fecha: 2026-01-14
> Estado: ⚠️ Funcionalidad limitada en Expo Go
> Solución: ✅ Implementada con fallback

---

## 🚨 Problema Encontrado

Al intentar usar `expo-barcode-scanner` para escanear códigos con la cámara, se presenta el siguiente error:

```
Uncaught Error
Cannot find native module 'ExpoBarCodeScanner'
```

### ¿Por qué ocurre esto?

**`expo-barcode-scanner` NO funciona en Expo Go** porque requiere código nativo compilado que no está incluido en la app de Expo Go.

---

## ✅ Solución Implementada

He implementado una **carga condicional** que:

1. ✅ Intenta cargar el módulo
2. ✅ Si falla (Expo Go), muestra un mensaje informativo
3. ✅ No bloquea la app
4. ✅ Los escáneres USB/Bluetooth siguen funcionando perfectamente

### Código de la Solución

**En ambos archivos (app/index.tsx y app/productos.tsx):**

```typescript
// Importación condicional para evitar errores en Expo Go
let BarCodeScanner: any = null;
try {
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
} catch (e) {
  console.warn('expo-barcode-scanner no está disponible. La funcionalidad de cámara estará deshabilitada.');
}

// Al solicitar permisos
const requestCameraPermission = async () => {
  if (!BarCodeScanner) {
    Alert.alert(
      'Función no disponible',
      'El escáner de cámara requiere un development build de Expo. Por favor usa el escáner físico USB/Bluetooth o crea un development build.',
      [{ text: 'Entendido' }]
    );
    return;
  }

  // ... resto del código
};

// Renderizar modal solo si está disponible
{BarCodeScanner && (
  <Portal>
    <Modal>
      <BarCodeScanner />
    </Modal>
  </Portal>
)}
```

---

## 📱 Estado Actual de los Escáneres

| Tipo de Escáner | Expo Go | Development Build | Producción |
|------------------|---------|-------------------|------------|
| **USB HID** | ✅ Funciona | ✅ Funciona | ✅ Funciona |
| **Bluetooth HID** | ✅ Funciona | ✅ Funciona | ✅ Funciona |
| **Cámara** | ❌ No disponible | ✅ Funciona | ✅ Funciona |

---

## 🎯 Opciones para Habilitar Escáner de Cámara

### Opción 1: Crear un Development Build (Recomendado)

Un **development build** es una compilación personalizada de tu app que incluye todos los módulos nativos.

#### Pasos:

1. **Instalar EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Iniciar sesión en Expo:**
```bash
eas login
```

3. **Configurar el proyecto:**
```bash
eas build:configure
```

4. **Crear build de desarrollo para Android:**
```bash
eas build --profile development --platform android
```

5. **Instalar el APK generado en tu teléfono**

#### Ventajas:
- ✅ Escáner de cámara funcionará
- ✅ Todos los módulos nativos disponibles
- ✅ Mejor rendimiento
- ✅ Más cercano a producción

#### Desventajas:
- ⏱️ Tarda 10-20 minutos en compilar
- 📱 Necesitas instalar APK en el teléfono
- 🔄 Cada cambio nativo requiere rebuild

---

### Opción 2: Usar Solo Escáneres Físicos (Actual)

**Esta es la opción activa ahora.**

#### Ventajas:
- ✅ Funciona inmediatamente
- ✅ No requiere compilación
- ✅ Desarrollo más rápido con Expo Go
- ✅ Los escáneres físicos son más rápidos y precisos

#### Desventajas:
- ❌ Necesitas comprar un escáner USB/Bluetooth ($500-2000 MXN)
- ❌ No puedes usar la cámara como backup

---

### Opción 3: Compilación para Producción (Futuro)

Cuando estés listo para lanzar la app a Google Play / App Store:

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

La versión de producción tendrá **todos los escáneres funcionando**, incluyendo la cámara.

---

## 💡 Recomendación

### Para Desarrollo (AHORA):

✅ **Usar escáner físico USB/Bluetooth**
- Más rápido para probar
- No necesitas recompilar
- Es la forma en que lo usarás en producción

### Para Producción (DESPUÉS):

✅ **Crear build de producción con EAS**
- Escáner de cámara como backup
- Mejor experiencia de usuario
- Más opciones para el cliente

---

## 🔄 Flujo de Trabajo Recomendado

### Durante Desarrollo:
1. Usa Expo Go para desarrollo rápido
2. Prueba con escáner físico USB/Bluetooth
3. El botón de cámara mostrará mensaje informativo

### Para Testing Final:
1. Crea development build con EAS
2. Prueba escáner de cámara
3. Verifica que todo funcione

### Para Lanzamiento:
1. Crea build de producción
2. Todos los escáneres funcionarán
3. Publica en tiendas

---

## 📝 Notas Adicionales

### ¿Por qué Expo Go no soporta todos los módulos?

Expo Go es una app "genérica" que incluye los módulos más comunes. No puede incluir TODOS los módulos posibles porque:
- La app sería muy pesada
- Actualizaciones serían lentas
- Algunos módulos tienen conflictos entre sí

### ¿Qué es un Development Build?

Es tu propia versión personalizada de Expo Go que:
- Incluye solo los módulos que TÚ necesitas
- Se compila en la nube (EAS Build)
- Se comporta igual que Expo Go pero con tus módulos nativos

---

## 🎓 Documentación Oficial

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [expo-barcode-scanner](https://docs.expo.dev/versions/latest/sdk/bar-code-scanner/)

---

## ✅ Conclusión

La implementación actual es **funcional y práctica**:

✅ **Escáneres USB/Bluetooth funcionan perfectamente** en Expo Go
✅ **Botón de cámara muestra mensaje claro** si no está disponible
✅ **No hay errores ni crashes**
✅ **Código listo para production builds**

Cuando hagas el build de producción, los **tres métodos de escaneo** funcionarán automáticamente sin cambios de código.

---

*Documentación generada: 2026-01-14*
