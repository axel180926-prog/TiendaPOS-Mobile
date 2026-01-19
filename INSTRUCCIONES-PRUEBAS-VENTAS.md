# 🧪 Instrucciones - Pruebas de Ventas Automáticas

> Fecha: 2026-01-15
> Propósito: Generar datos de prueba para validar el Dashboard de Ganancias

---

## 📋 ¿Qué Hace Este Sistema de Pruebas?

El sistema de pruebas **simula un día completo de operación** de la tienda, desde que se abre la caja hasta que se cierra.

### Proceso Completo:

1. **📂 Apertura de Caja**
   - Monto inicial: $500.00
   - Registra fecha y hora de apertura
   - Crea registro en tabla `cajas`

2. **💰 Generación de 10 Ventas Aleatorias**
   - Cada venta incluye entre 1 y 5 productos aleatorios
   - Cantidad por producto: entre 1 y 3 unidades
   - Métodos de pago aleatorios: efectivo, tarjeta, transferencia
   - Calcula precio, ganancia y margen automáticamente

3. **📝 Movimientos de Caja**
   - Retiro: $200.00 (simulando depósito bancario)
   - Gasto: $50.00 (compra de bolsas u otros gastos)

4. **🔒 Cierre de Caja**
   - Calcula monto final esperado
   - Cierra la caja con notas
   - Registra fecha y hora de cierre

---

## 🚀 Cómo Usar (Desde la App)

### Opción 1: Pantalla de Pruebas (Recomendado)

1. **Navega a la pantalla "Pruebas"** (app/pruebas.tsx)
   - Si no está en el menú, agrégala temporalmente al drawer

2. **Lee la información mostrada:**
   - Descripción de lo que hará el script
   - Número de ventas que se crearán
   - Movimientos que se registrarán

3. **Presiona "Iniciar Pruebas"**
   - El botón se deshabilitará durante la ejecución
   - Verás un indicador de progreso

4. **Observa los logs en tiempo real:**
   - Cada paso se muestra en pantalla
   - Ventas individuales con su total
   - Movimientos de caja registrados

5. **Revisa el Resumen Final:**
   - Total de ventas generadas
   - Total vendido
   - Ganancias netas
   - Margen promedio
   - Ticket promedio
   - Monto inicial y final de caja

6. **Ve al Dashboard de Ganancias:**
   - Navega a `/dashboard`
   - Selecciona "HOY" en los tabs
   - Verás todas las métricas con datos reales

---

## 💻 Cómo Usar (Desde Terminal)

Si prefieres ejecutar desde terminal (útil para desarrollo):

```bash
# Desde la raíz del proyecto
npx ts-node scripts/generarVentasPrueba.ts
```

**Salida esperada:**
```
🚀 === INICIANDO PRUEBAS DE VENTAS COMPLETAS ===

📂 PASO 1: Abriendo caja...
✅ Caja abierta - ID: 1
   - Monto inicial: $500.00
   - Fecha: 15/1/2026, 10:30:25

💰 PASO 2: Generando 10 ventas...

✅ Venta 1/10 creada:
   - Total: $45.50
   - Items: 3
   - Método: efectivo
   - Productos: Coca-Cola 600ml, Sabritas Original, Gansito

✅ Venta 2/10 creada:
   - Total: $32.00
   ...

✅ 10 ventas generadas exitosamente!
   - Total vendido: $423.50
   - Ganancias totales: $127.05
   - Margen promedio: 30.0%

📝 PASO 3: Registrando movimientos adicionales...
   - Retiro: $200.00 (para banco)
   - Gasto: $50.00 (bolsas)

🔒 PASO 4: Cerrando caja...
✅ Caja cerrada exitosamente!
   - Monto final: $673.50
   - Diferencia: $0.00 (correcto)

📊 === RESUMEN FINAL ===

Total ventas: 10
Total vendido: $423.50
Ganancias netas: $127.05
Margen de ganancia: 30.0%
Ticket promedio: $42.35

Monto inicial caja: $500.00
Movimientos:
  + Ventas: $423.50
  - Retiros: $200.00
  - Gastos: $50.00
Monto final: $673.50

✅ === PRUEBAS COMPLETADAS EXITOSAMENTE ===
```

---

## 📊 Validación en el Dashboard

Después de ejecutar las pruebas, ve al Dashboard y verifica:

### Tab "HOY"

1. **💵 Ventas Totales:**
   - Debe mostrar el total vendido (ej: $423.50)
   - Badge de comparación (probablemente sin datos previos)

2. **💰 Ganancias Netas:**
   - Debe mostrar las ganancias calculadas (ej: $127.05)
   - Margen de ganancia en porcentaje

3. **📊 Métricas Clave:**
   - **Ticket Promedio:** Total vendido / 10 ventas
   - **Ventas Totales:** 10
   - **Items/Venta:** Promedio de items por venta

4. **🏆 Top 5 Productos Rentables:**
   - Lista de productos más vendidos
   - Ganancia total por producto
   - Medallas para top 3

5. **📈 Gráfica de Últimos 7 Días:**
   - Barra para hoy con el total de ventas
   - Barras vacías para días anteriores (si no hay datos)

---

## 🔧 Personalización

Puedes modificar los parámetros en `app/pruebas.tsx` o `scripts/generarVentasPrueba.ts`:

```typescript
// Cambiar monto inicial de caja
const MONTO_INICIAL_CAJA = 500; // Modificar aquí

// Cambiar número de ventas
const NUMERO_VENTAS = 10; // Modificar aquí

// Agregar más métodos de pago
const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia']; // Agregar más aquí
```

---

## 🗄️ Datos Generados en Base de Datos

### Tabla `cajas`
```sql
id | montoInicial | montoFinal | fechaApertura | fechaCierre | notas
1  | 500.00       | 673.50     | 2026-01-15... | 2026-01-15... | Caja de prueba...
```

### Tabla `ventas`
```sql
id | total | fecha       | metodoPago    | cajaId
1  | 45.50 | 2026-01-15  | efectivo      | 1
2  | 32.00 | 2026-01-15  | tarjeta       | 1
...
10 | 28.50 | 2026-01-15  | transferencia | 1
```

### Tabla `venta_items`
```sql
id | ventaId | productoId | cantidad | precioUnitario | subtotal
1  | 1       | 5          | 2        | 15.00          | 30.00
2  | 1       | 12         | 1        | 15.50          | 15.50
...
```

### Tabla `movimientos_caja`
```sql
id | cajaId | tipo   | monto  | concepto
1  | 1      | retiro | 200.00 | Retiro para banco
2  | 1      | gasto  | 50.00  | Compra de bolsas
```

---

## ⚠️ Consideraciones Importantes

### Stock de Productos

- **El sistema NO valida stock** en pruebas automáticas
- Si un producto tiene stock 0, igual se venderá
- **Solución:** Antes de ejecutar pruebas, asegúrate de que los productos activos tengan stock > 0

### Productos Activos

- Solo se usan productos con `activo = true`
- Si no hay productos activos, el script fallará
- **Mínimo requerido:** 5 productos activos para buena variedad

### Precios Configurados

- Los productos deben tener `precioVenta` > 0
- Deben tener `precioCompra` > 0 para calcular ganancias
- Si no están configurados, la ganancia será incorrecta

### Datos Previos

- Si ya hay cajas abiertas, cierralas antes
- Las ventas se acumularán en el dashboard
- **Para limpiar:** Borra la base de datos y recarga productos

---

## 🧹 Limpiar Datos de Prueba

Si quieres empezar de nuevo:

### Opción 1: Desde SQLite (Terminal)

```bash
# Abrir base de datos
sqlite3 <ruta-a-tu-db>/tienda.db

# Eliminar datos de prueba
DELETE FROM movimientos_caja WHERE concepto LIKE '%prueba%';
DELETE FROM venta_items WHERE ventaId IN (SELECT id FROM ventas WHERE cajaId IN (SELECT id FROM cajas WHERE notas LIKE '%prueba%'));
DELETE FROM ventas WHERE cajaId IN (SELECT id FROM cajas WHERE notas LIKE '%prueba%');
DELETE FROM cajas WHERE notas LIKE '%prueba%';

# Salir
.quit
```

### Opción 2: Resetear Base de Datos Completa

```bash
# Desde lib/database/index.ts, agregar función de reset
# O borrar el archivo de base de datos y reiniciar la app
```

---

## 📱 Ejemplo de Uso Completo

1. **Prepara la app:**
   ```bash
   npm start
   ```

2. **Navega a Catálogo:**
   - Verifica que hay productos activos
   - Configura precios si es necesario

3. **Navega a Pruebas:**
   - Presiona "Iniciar Pruebas"
   - Espera ~10 segundos

4. **Ve al Dashboard:**
   - Tab "HOY"
   - Verifica todas las métricas

5. **Revisa Historial:**
   - Ve a "Historial de Ventas"
   - Verás las 10 ventas listadas

6. **Revisa Caja:**
   - Ve a "Caja"
   - Verás la caja cerrada con todos los movimientos

---

## 🎯 Resultados Esperados

Después de ejecutar las pruebas, deberías ver:

- ✅ 10 ventas registradas en el historial
- ✅ Dashboard mostrando métricas del día
- ✅ Gráfica con barra para hoy
- ✅ Top productos rentables
- ✅ Caja cerrada con movimientos
- ✅ Totales y ganancias correctos

---

## ❓ Troubleshooting

### Error: "No hay productos activos"
**Solución:** Ve a Catálogo y activa algunos productos.

### Error: "Producto sin precio"
**Solución:** Configura precioVenta y precioCompra en productos.

### Error: "Ya hay una caja abierta"
**Solución:** Cierra la caja actual primero.

### Dashboard muestra $0.00
**Solución:** Verifica que las ventas se crearon en la fecha de hoy.

### Ganancias incorrectas
**Solución:** Verifica que todos los productos tengan precioCompra configurado.

---

## 📄 Archivos Relacionados

- **Pantalla de pruebas:** `app/pruebas.tsx`
- **Script de terminal:** `scripts/generarVentasPrueba.ts`
- **Queries de DB:** `lib/database/queries.ts`
- **Dashboard:** `app/dashboard.tsx`

---

*¡Ahora tienes un sistema completo para probar el Dashboard de Ganancias con datos realistas!*
