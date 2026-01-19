# Sistema de Escáneres de Código de Barras

## 📋 Descripción General

El sistema soporta dos tipos de escáneres de código de barras:

1. **Escáner USB (HID)** - Funciona como teclado, no requiere configuración especial
2. **Escáner Bluetooth** - Requiere emparejamiento y puede funcionar de dos formas:
   - Como dispositivo HID (teclado bluetooth)
   - Como dispositivo Bluetooth nativo (requiere conexión específica)

---

## 🔧 Tipos de Escáneres Soportados

### 1. Escáner USB (HID - Human Interface Device)

**Características:**
- Plug & Play - no requiere configuración
- Se conecta por USB
- Funciona como un teclado
- Cuando escanea, "escribe" el código seguido de Enter
- **YA IMPLEMENTADO** en la aplicación

**Cómo funciona:**
- El escáner envía caracteres como si fueran tecleados
- Un TextInput oculto captura la entrada
- Se detecta el Enter al final del código
- Se procesa el código completo

**Ventajas:**
- ✅ No requiere configuración
- ✅ Funciona inmediatamente
- ✅ Compatible con cualquier escáner USB-HID
- ✅ No requiere permisos especiales

**Desventajas:**
- ❌ Requiere conexión USB
- ❌ Cable limita movilidad

---

### 2. Escáner Bluetooth (HID Mode)

**Características:**
- Se empareja como teclado Bluetooth
- Funciona exactamente igual que el USB
- Inalámbrico
- **YA IMPLEMENTADO** - usa el mismo código que USB

**Cómo configurar:**
1. Emparejar escáner desde configuración de Android/iOS
2. Escáner aparece como "Teclado Bluetooth"
3. Usar la aplicación normalmente

**Ventajas:**
- ✅ Inalámbrico
- ✅ No requiere código adicional
- ✅ Funciona con el sistema actual
- ✅ Fácil de configurar

**Desventajas:**
- ❌ Requiere emparejamiento manual
- ❌ Batería del escáner

---

### 3. Escáner Bluetooth (Native Mode)

**Características:**
- Conexión Bluetooth nativa (SPP - Serial Port Profile)
- Requiere permisos de Bluetooth
- Necesita código de conexión específico
- **PENDIENTE DE IMPLEMENTAR**

**Cómo funciona:**
- La app busca dispositivos Bluetooth cercanos
- Usuario selecciona su escáner
- App se conecta directamente
- Recibe códigos por eventos Bluetooth

**Ventajas:**
- ✅ Más control sobre la conexión
- ✅ Puede mostrar estado de batería
- ✅ Reconexión automática

**Desventajas:**
- ❌ Requiere permisos de Bluetooth
- ❌ Código más complejo
- ❌ Puede requerir bare workflow (eject de Expo)

---

## 📱 Implementación Actual (USB + Bluetooth HID)

### Archivo: `app/index.tsx` (POS)

```typescript
// TextInput oculto que captura el escáner
<TextInput
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
  style={{ position: 'absolute', left: -9999 }}
/>
```

**Cómo funciona:**
1. TextInput oculto mantiene el foco
2. Escáner "escribe" el código
3. Al detectar Enter (`onSubmitEditing`), procesa el código
4. Busca el producto y lo agrega al carrito

**Estado actual:**
- ✅ Funciona con escáneres USB
- ✅ Funciona con escáneres Bluetooth en modo HID
- ✅ No requiere configuración adicional

---

## 🚀 Implementación Futura (Bluetooth Nativo)

### Librería Recomendada

**react-native-bluetooth-classic** o **react-native-ble-plx**

```bash
npx expo install react-native-bluetooth-classic
```

### Permisos Necesarios (Android)

```xml
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

### Estructura de Código

```typescript
// lib/bluetooth/native-scanner.ts

import RNBluetoothClassic from 'react-native-bluetooth-classic';

export async function scanForDevices() {
  const devices = await RNBluetoothClassic.list();
  return devices.filter(d => d.name.includes('Scanner'));
}

export async function connectToScanner(deviceId: string) {
  const device = await RNBluetoothClassic.connectToDevice(deviceId);

  device.onDataReceived((data) => {
    const code = data.data.trim();
    // Emitir evento con el código
    EventEmitter.emit('barcode-scanned', code);
  });

  return device;
}
```

### Pantalla de Configuración

```typescript
// app/configuracion-escaner.tsx

export default function ConfiguracionEscanerScreen() {
  const [tipoEscaner, setTipoEscaner] = useState('usb');
  const [devices, setDevices] = useState([]);

  return (
    <View>
      <SegmentedButtons
        value={tipoEscaner}
        onValueChange={setTipoEscaner}
        buttons={[
          { value: 'usb', label: 'USB/HID' },
          { value: 'bluetooth', label: 'Bluetooth Nativo' }
        ]}
      />

      {tipoEscaner === 'bluetooth' && (
        <>
          <Button onPress={buscarDispositivos}>
            Buscar Escáneres
          </Button>
          <FlatList
            data={devices}
            renderItem={({ item }) => (
              <List.Item
                title={item.name}
                onPress={() => conectarEscaner(item.id)}
              />
            )}
          />
        </>
      )}
    </View>
  );
}
```

---

## 🎯 Recomendación Actual

### Para la mayoría de usuarios:

**Usar Escáner Bluetooth en Modo HID**

**Razones:**
1. ✅ Ya está implementado
2. ✅ No requiere código adicional
3. ✅ No requiere permisos especiales
4. ✅ Funciona en Expo Go
5. ✅ Fácil de configurar

**Pasos para el usuario:**
1. Configurar el escáner en modo HID (consultar manual)
2. Emparejar como "Teclado Bluetooth" desde Android/iOS
3. Abrir TiendaPOS
4. El escáner funcionará automáticamente

### Para usuarios avanzados:

**Implementar Bluetooth Nativo** (futuro)

**Cuándo usar:**
- Necesitas mostrar batería del escáner
- Quieres reconexión automática
- Necesitas control total sobre la conexión
- El escáner no soporta modo HID

**Requisitos:**
- Expo bare workflow (ejected)
- Configurar permisos nativos
- Implementar pantalla de configuración
- Probar en dispositivos reales

---

## 📊 Comparación de Opciones

| Característica | USB HID | Bluetooth HID | Bluetooth Nativo |
|----------------|---------|---------------|------------------|
| Implementación | ✅ Completa | ✅ Completa | ❌ Pendiente |
| Configuración | Ninguna | Emparejamiento simple | Pantalla de config |
| Permisos | No | No | Sí (Bluetooth) |
| Expo Go | ✅ Funciona | ✅ Funciona | ❌ Requiere build |
| Inalámbrico | ❌ No | ✅ Sí | ✅ Sí |
| Batería visible | ❌ No | ❌ No | ✅ Sí |
| Reconexión auto | N/A | Manual | ✅ Automática |

---

## 🔄 Estado Actual de Implementación

### ✅ Completado (70%)
- [x] Soporte USB HID
- [x] Soporte Bluetooth HID
- [x] TextInput oculto para captura
- [x] Procesamiento de códigos
- [x] Búsqueda de productos
- [x] Agregar al carrito

### 🚧 En Progreso (20%)
- [ ] Documentación para usuarios
- [ ] Pantalla de ayuda/configuración
- [ ] Indicador visual cuando escanea

### ⏳ Pendiente (10%)
- [ ] Bluetooth nativo (opcional)
- [ ] Pantalla de configuración de escáner
- [ ] Selección de dispositivo Bluetooth
- [ ] Reconexión automática
- [ ] Indicador de batería

---

## 📝 Notas para el Usuario

### Configurar Escáner Bluetooth como HID

**La mayoría de escáneres tienen un manual con códigos QR/barras para configurar el modo:**

1. **Buscar en el manual:** "HID Mode" o "Keyboard Mode"
2. **Escanear el código de configuración** que activa modo HID
3. **Emparejar desde el dispositivo:**
   - Android: Configuración > Bluetooth > Emparejar nuevo dispositivo
   - iOS: Configuración > Bluetooth > Buscar dispositivos
4. **El escáner aparecerá como "Teclado"** o similar
5. **Abrir TiendaPOS** y comenzar a escanear

### Marcas Comunes y Sus Configuraciones

**Honeywell:**
- Escanear código "Enable HID Mode" del manual
- Mantener botón trigger por 5 segundos para modo pairing

**Zebra/Motorola:**
- Código de configuración: "Bluetooth HID"
- LED azul parpadeante indica modo pairing

**Inateck:**
- Interruptor físico HID/SPP
- Colocar en posición HID

**Genéricos chinos:**
- Buscar manual en línea por modelo
- Usualmente tienen código QR para HID mode

---

## 🐛 Troubleshooting

### El escáner no funciona

1. **Verificar modo HID:**
   - Revisar manual del escáner
   - Escanear código de configuración HID

2. **Verificar emparejamiento:**
   - Debe aparecer como "Teclado" o "HID Device"
   - Si aparece como "Serial Port", está en modo SPP

3. **Probar en otra app:**
   - Abrir Notes/Notepad
   - Escanear un código
   - Debe "escribir" el código

4. **Reiniciar conexión:**
   - Olvidar dispositivo Bluetooth
   - Resetear escáner (ver manual)
   - Emparejar nuevamente

### El código se escanea dos veces

- Ajustar configuración del escáner (delay entre escaneos)
- Ver manual para "Scan Interval" o similar

### El código no se detecta completo

- Verificar que el escáner envía Enter al final
- Configurar "Suffix" como CR o LF en el escáner

---

## 📞 Soporte

Para problemas con escáneres específicos:
1. Consultar manual del fabricante
2. Buscar en Google: "[modelo escáner] HID mode configuration"
3. Contactar al proveedor del escáner
4. Probar con otra app (Notes) para verificar que funciona como teclado

---

**Última actualización:** 2026-01-14
**Autor:** Sistema TiendaPOS Mobile
**Versión:** 1.0
