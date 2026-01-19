# 🧪 Plan de Pruebas - Modo Oscuro

> Fecha: 2026-01-15
> Estado: ⏳ LISTO PARA PROBAR

---

## 🎯 Objetivo de las Pruebas

Verificar que el modo oscuro se aplica **en tiempo real** sin necesidad de recargar la aplicación, después de la corrección implementada en `configuracion.tsx`.

---

## ✅ Pre-requisitos

1. Expo iniciado con `npx expo start --clear`
2. App abierta en Expo Go en tu dispositivo/emulador
3. Conexión estable entre el dispositivo y Metro Bundler

---

## 🧪 Pruebas a Realizar

### Prueba 1: Estado Inicial (Modo Claro)

**Objetivo:** Verificar que la app inicia en modo claro por defecto

**Pasos:**
1. Abre la app en Expo Go
2. Observa los colores del header principal
3. Abre el menú lateral (drawer)

**Resultado Esperado:**
- ✅ Header azul (#2c5f7c)
- ✅ Drawer con fondo blanco
- ✅ Texto negro sobre fondo blanco
- ✅ Iconos con color azul (#2c5f7c)

**Capturas:**
- [ ] Screenshot del header en modo claro
- [ ] Screenshot del drawer en modo claro

---

### Prueba 2: Activar Modo Oscuro

**Objetivo:** Verificar que el tema cambia INMEDIATAMENTE al activar modo oscuro

**Pasos:**
1. Desde el drawer, selecciona **"Configuración"**
2. Busca la sección **"Apariencia"**
3. Encuentra el switch **"🌙 Modo Oscuro"**
4. **Observa el estado actual:** Switch debe estar APAGADO
5. **Activa el switch** (muévelo a la derecha)
6. **NO cierres la pantalla todavía**
7. Presiona el botón **"Guardar Configuración"** (botón azul grande al final)
8. **OBSERVA INMEDIATAMENTE** si algo cambia

**Resultado Esperado (INMEDIATO después de presionar Guardar):**
- ✅ Header cambia a gris oscuro (#1E1E1E) **SIN RECARGAR**
- ✅ Alert "Éxito: Configuración guardada correctamente" aparece
- ✅ Al cerrar el alert y volver al drawer, el fondo debe ser oscuro
- ✅ Texto en drawer debe ser claro/blanco
- ✅ Iconos con color azul claro (#42A5F5)

**❌ NO debe pasar:**
- ❌ Necesitar recargar la app manualmente
- ❌ Necesitar presionar 'r' en Expo
- ❌ Que el tema se quede en modo claro después de guardar

**Capturas:**
- [ ] Screenshot del switch activado ANTES de guardar
- [ ] Screenshot INMEDIATAMENTE después de presionar Guardar
- [ ] Screenshot del drawer en modo oscuro

---

### Prueba 3: Desactivar Modo Oscuro

**Objetivo:** Verificar que el tema vuelve a claro INMEDIATAMENTE

**Pasos:**
1. Con modo oscuro activo, ve a **Configuración**
2. Desactiva el switch **"🌙 Modo Oscuro"**
3. Presiona **"Guardar Configuración"**
4. **OBSERVA INMEDIATAMENTE**

**Resultado Esperado:**
- ✅ Header vuelve a azul (#2c5f7c) **SIN RECARGAR**
- ✅ Drawer vuelve a fondo blanco
- ✅ Texto vuelve a negro
- ✅ Cambio INSTANTÁNEO

**Capturas:**
- [ ] Screenshot del cambio de oscuro a claro

---

### Prueba 4: Persistencia del Tema

**Objetivo:** Verificar que el tema seleccionado se guarda en la base de datos

**Pasos:**
1. Activa modo oscuro y guarda
2. **Cierra completamente la app** (force stop en Android o swipe up en iOS)
3. **Vuelve a abrir la app desde cero**
4. Observa el estado inicial

**Resultado Esperado:**
- ✅ App inicia con modo oscuro activado
- ✅ Header oscuro desde el inicio
- ✅ Al ir a Configuración, el switch está ACTIVADO

**Capturas:**
- [ ] Screenshot de la app recién abierta con modo oscuro

---

### Prueba 5: Navegación entre Pantallas

**Objetivo:** Verificar que el tema se mantiene al navegar

**Pasos:**
1. Con modo oscuro activo, navega a diferentes pantallas:
   - POS (Punto de Venta)
   - Catálogo
   - Historial
   - Dashboard Ganancias
   - Productos
   - Inventario
   - Configuración

**Resultado Esperado:**
- ✅ Todos los headers en gris oscuro
- ✅ Drawer mantiene colores oscuros
- ✅ No hay "flashes" de modo claro al cambiar de pantalla

**Capturas:**
- [ ] Screenshot de al menos 3 pantallas diferentes en modo oscuro

---

## 🐛 Posibles Errores a Reportar

Si encuentras alguno de estos problemas, documéntalos:

### Error 1: Tema No Cambia al Guardar
**Síntoma:** Presionas Guardar pero el tema sigue igual
**Causa posible:** ConfigStore no se está actualizando
**Qué hacer:** Verifica en console si hay errores

### Error 2: App Crashea al Cambiar Tema
**Síntoma:** La app se cierra o muestra pantalla blanca
**Causa posible:** Error en algún componente que usa el tema
**Qué hacer:** Revisa los logs de Expo

### Error 3: Tema Se Resetea al Navegar
**Síntoma:** Cambias de pantalla y vuelve a modo claro
**Causa posible:** Problema en _layout.tsx
**Qué hacer:** Documenta en qué pantallas pasa

### Error 4: Switch No Refleja Estado Real
**Síntoma:** El switch muestra un estado pero el tema es otro
**Causa posible:** Desincronización entre estado local y ConfigStore
**Qué hacer:** Cierra y abre Configuración varias veces

---

## 📊 Checklist de Verificación

### Funcionalidad Básica
- [ ] App inicia correctamente
- [ ] Puedo abrir la pantalla de Configuración
- [ ] Veo la sección "Apariencia" con el switch
- [ ] Puedo activar/desactivar el switch
- [ ] Puedo presionar "Guardar Configuración"

### Cambio en Tiempo Real (CRÍTICO)
- [ ] ✅ Header cambia INMEDIATAMENTE al guardar modo oscuro
- [ ] ✅ Header cambia INMEDIATAMENTE al guardar modo claro
- [ ] ✅ NO necesito recargar la app manualmente
- [ ] ✅ Drawer se actualiza automáticamente

### Persistencia
- [ ] Tema se guarda en la base de datos
- [ ] Al reabrir la app, mantiene el tema seleccionado
- [ ] Switch en Configuración refleja el estado correcto

### Navegación
- [ ] Tema se mantiene al cambiar de pantalla
- [ ] No hay flashes de color incorrecto
- [ ] Todas las pantallas respetan el tema

---

## 📝 Formato de Reporte

Si encuentras errores, usa este formato:

```
## Error Encontrado

**Prueba:** [Número de prueba]
**Paso:** [Paso específico donde falló]
**Esperado:** [Qué debería pasar]
**Actual:** [Qué pasó realmente]
**Screenshot:** [Adjuntar si es posible]
**Logs de Expo:** [Copiar errores de consola]
```

---

## ✅ Criterios de Éxito

La prueba será EXITOSA si:

1. ✅ **Tiempo Real:** El tema cambia INMEDIATAMENTE al guardar (sin recargar)
2. ✅ **Bidireccional:** Funciona tanto activar como desactivar
3. ✅ **Persistente:** Se guarda correctamente en DB
4. ✅ **Consistente:** Se mantiene al navegar entre pantallas
5. ✅ **Sin Errores:** No hay crashes ni warnings críticos

---

## 🎬 Listo para Probar

**Estado de Metro Bundler:** ⏳ Compilando...

Una vez que veas en la consola de Expo algo como:
```
Metro waiting on exp://192.168.x.x:8081
Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

**¡Estarás listo para empezar las pruebas!**

---

## 📞 Si Necesitas Ayuda

Si encuentras problemas durante las pruebas:
1. Copia los logs de la consola de Expo
2. Toma screenshots del comportamiento
3. Describe exactamente qué paso de qué prueba estabas haciendo
4. Comparte toda esta información

---

*Plan de Pruebas creado: 2026-01-15*
*Próximo paso: Ejecutar las 5 pruebas documentadas*
