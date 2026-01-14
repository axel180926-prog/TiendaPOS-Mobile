# Instrucciones de Prueba - TiendaPOS Mobile

## 🚀 Cómo Probar la Aplicación

### Opción 1: Expo Go (Más Rápido)

1. **Instala Expo Go en tu celular:**
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. **Inicia el servidor de desarrollo:**
   ```bash
   cd TiendaPOS-Mobile
   npx expo start
   ```

3. **Escanea el código QR:**
   - Android: Usa la app de Expo Go
   - iOS: Usa la cámara del iPhone

### Opción 2: Emulador Android

1. **Instala Android Studio:**
   - Descarga desde: https://developer.android.com/studio
   - Instala un emulador Android

2. **Inicia el emulador y luego ejecuta:**
   ```bash
   cd TiendaPOS-Mobile
   npx expo start --android
   ```

### Opción 3: Dispositivo Físico Conectado

1. **Habilita USB Debugging en tu Android:**
   - Configuración → Acerca del teléfono
   - Toca 7 veces en "Número de compilación"
   - Ve a Configuración → Opciones de desarrollador
   - Activa "Depuración USB"

2. **Conecta tu teléfono por USB y ejecuta:**
   ```bash
   cd TiendaPOS-Mobile
   npx expo start --android
   ```

## 📱 Funcionalidades a Probar

### 1. Búsqueda de Productos

- En la pantalla principal, escribe en la barra de búsqueda: "coca"
- Deberías ver "Coca-Cola 600ml" en los resultados
- Toca el producto para agregarlo al carrito

### 2. Códigos de Barras de Prueba

Usa estos códigos para probar (escribe en la búsqueda o usa un escáner):

```
7501000110049  → Coca-Cola 600ml ($15.00)
7501055300013  → Sabritas Original 40g ($15.00)
7501005102728  → Salsa Valentina 370ml ($18.00)
7501030400053  → Cheetos Flamin Hot 62g ($17.00)
7501011115033  → Marinela Gansito ($13.00)
```

### 3. Gestión del Carrito

1. Agrega varios productos
2. Usa los botones +/- para cambiar cantidades
3. Usa el botón de eliminar (🗑️) para quitar productos
4. Verifica que los totales se actualicen correctamente

### 4. Proceso de Venta

1. Agrega productos al carrito
2. Presiona el botón "Cobrar"
3. Selecciona forma de pago:
   - **Efectivo:** Ingresa un monto (ej: $100) y verifica que calcule el cambio
   - **Tarjeta:** Solo presiona confirmar
   - **Transferencia:** Solo presiona confirmar
4. Confirma la venta
5. Se generará un ticket PDF que puedes compartir

### 5. Verificar Base de Datos

Los productos se guardan en SQLite. Puedes verificar que las ventas se registran:

```bash
# En la consola de desarrollo deberías ver:
# ✅ Base de datos lista
# 🔧 Inicializando base de datos...
# 40 productos cargados exitosamente
```

## 🔍 Escáner Bluetooth (Opcional)

Si tienes un escáner bluetooth:

1. Empareja el escáner con tu dispositivo
2. El escáner debe funcionar como teclado HID
3. Abre la app
4. Escanea un código de barras de un producto real
5. El producto se agregará automáticamente si existe en la BD

**Nota:** En Expo Go el escáner bluetooth puede tener limitaciones. Para funcionalidad completa, compila la app con `npx expo prebuild`.

## 📊 Datos de Prueba

La base de datos viene pre-cargada con:

- **40 productos mexicanos** (Coca-Cola, Sabritas, Bimbo, etc.)
- **Configuración inicial** de tienda
- **Categorías:** Bebidas, Botanas, Abarrotes, Dulces, Limpieza, etc.

## 🐛 Problemas Comunes

### "No se pudo inicializar la base de datos"

- Cierra y vuelve a abrir la app
- Verifica los logs en la consola
- Asegúrate de que todas las dependencias estén instaladas

### "Producto no encontrado"

- Los códigos de barras deben coincidir exactamente
- Usa los códigos de prueba listados arriba
- Verifica que la base de datos se haya cargado correctamente

### El escáner bluetooth no funciona

- En Expo Go, el soporte de bluetooth es limitado
- Compila la app para usar funcionalidad completa de bluetooth
- Verifica que el escáner esté emparejado correctamente

### Los totales no se calculan bien

- Verifica que el IVA esté configurado al 16%
- Los cálculos son: subtotal + (subtotal * 0.16) = total
- Los precios incluyen centavos, verifica los redondeos

## 📝 Logging y Debugging

Para ver logs en tiempo real:

```bash
# Terminal 1: Servidor de desarrollo
npx expo start

# Observa los logs en la consola
# Verás mensajes como:
# 🔧 Inicializando base de datos...
# ✅ Base de datos lista
# Código escaneado: 7501000110049
# Venta completada: V-1234567890-123
```

## ✅ Checklist de Pruebas

- [ ] La app inicia sin errores
- [ ] Se carga la base de datos
- [ ] Puedo buscar productos por nombre
- [ ] Puedo agregar productos al carrito
- [ ] Los totales se calculan correctamente
- [ ] Puedo cambiar cantidades
- [ ] Puedo eliminar productos del carrito
- [ ] Puedo completar una venta con efectivo
- [ ] Se calcula el cambio correctamente
- [ ] Se genera el ticket PDF
- [ ] Puedo compartir el ticket
- [ ] El carrito se limpia después de la venta

## 🎯 Siguiente Paso Recomendado

Después de probar la funcionalidad básica, el siguiente paso es:

1. **Implementar pantalla de productos** (CRUD)
2. **Agregar reportes de ventas**
3. **Implementar configuración de tienda**
4. **Compilar para producción** (`npx expo prebuild`)

## 💡 Tips

- Mantén la consola abierta para ver logs
- Usa el botón de reload (Cmd+R / Ctrl+R) si algo no funciona
- Los datos persisten entre reinicios (SQLite)
- Puedes borrar la app y reinstalar para reset completo

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en la consola
2. Verifica que todas las dependencias estén instaladas
3. Intenta `npm install` de nuevo
4. Limpia cache: `npx expo start --clear`
