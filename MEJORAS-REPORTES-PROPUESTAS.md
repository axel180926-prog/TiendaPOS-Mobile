# 📊 Mejoras Propuestas - Reportes y Estadísticas

> Fecha: 2026-01-15
> Pantalla: app/historial.tsx (actualmente es solo historial de ventas)
> Estado: Análisis completo

---

## 📊 Análisis Actual

### ✅ Lo que SÍ funciona:
1. Historial de ventas con filtros
2. Búsqueda por ID
3. Filtros por fecha y método de pago
4. Detalle de ventas
5. Cancelar ventas

### ❌ Lo que FALTA (según la captura):
1. **NO hay estadísticas reales** - Solo se muestra $0.00 porque no hay ventas
2. **NO hay gráficas** - Solo dice "próximamente"
3. **Título incorrecto** - Dice "Reportes y Estadísticas" pero solo muestra historial
4. **Resumen muy básico** - No hay métricas útiles
5. **Diseño poco visual** - Números pequeños, sin jerarquía
6. **Pestañas Hoy/Semana/Mes no existen** - en el código actual

---

## 🎯 MEJORAS CRÍTICAS (Prioridad MÁXIMA)

### 1. 📊 **Crear Pantalla de Reportes Real con Tabs**

**Problema:** La captura muestra "Reportes y Estadísticas" con tabs (Hoy/Semana/Mes) pero el código actual es solo historial de ventas.

**Solución:** Crear archivo nuevo `app/reportes.tsx` con tabs funcionales:

```tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SegmentedButtons, Card, Text } from 'react-native-paper';
import { formatearMoneda } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';

type PeriodoType = 'hoy' | 'semana' | 'mes';

export default function ReportesScreen() {
  const [periodo, setPeriodo] = useState<PeriodoType>('hoy');
  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    cantidadVentas: 0,
    ticketPromedio: 0,
    productosVendidos: 0,
  });
  const [topProductos, setTopProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarEstadisticas();
  }, [periodo]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const { fechaInicio, fechaFin } = obtenerRangoFechas(periodo);

      // Obtener ventas del periodo
      const ventas = await queries.obtenerVentasPorRango(fechaInicio, fechaFin);

      const totalVentas = ventas.reduce((sum, v) => sum + (v.total || 0), 0);
      const cantidadVentas = ventas.length;
      const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

      // Obtener productos más vendidos
      const productos = await queries.obtenerProductosMasVendidos(fechaInicio, fechaFin, 5);

      setEstadisticas({
        totalVentas,
        cantidadVentas,
        ticketPromedio,
        productosVendidos: productos.reduce((sum, p) => sum + p.cantidad, 0),
      });
      setTopProductos(productos);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerRangoFechas = (tipo: PeriodoType) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    let fechaInicio = new Date(hoy);

    switch (tipo) {
      case 'hoy':
        // Ya está configurado
        break;
      case 'semana':
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;
      case 'mes':
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        break;
    }

    return { fechaInicio, fechaFin: fin };
  };

  return (
    <View style={styles.container}>
      {/* Tabs de periodo */}
      <View style={styles.tabsContainer}>
        <SegmentedButtons
          value={periodo}
          onValueChange={(value) => setPeriodo(value as PeriodoType)}
          buttons={[
            { value: 'hoy', label: 'Hoy' },
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mes' }
          ]}
          style={styles.tabs}
        />
      </View>

      <ScrollView>
        {/* Resumen de Ventas GRANDE */}
        <Card style={styles.resumenCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.resumenTitulo}>
              Resumen de Ventas
            </Text>

            {/* Total Ventas MUY GRANDE */}
            <View style={styles.metricaPrincipal}>
              <Text variant="labelLarge" style={styles.metricaLabel}>
                Total Ventas
              </Text>
              <Text variant="displayMedium" style={styles.metricaValor}>
                {formatearMoneda(estadisticas.totalVentas)}
              </Text>
            </View>

            {/* Métricas secundarias */}
            <View style={styles.metricasRow}>
              <View style={styles.metricaItem}>
                <Text variant="labelMedium" style={styles.metricaSecundariaLabel}>
                  Cantidad de Ventas
                </Text>
                <Text variant="headlineSmall" style={styles.metricaSecundariaValor}>
                  {estadisticas.cantidadVentas}
                </Text>
              </View>

              <View style={styles.metricaItem}>
                <Text variant="labelMedium" style={styles.metricaSecundariaLabel}>
                  Ticket Promedio
                </Text>
                <Text variant="headlineSmall" style={styles.metricaSecundariaValor}>
                  {formatearMoneda(estadisticas.ticketPromedio)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Productos Más Vendidos */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitulo}>
              Productos Más Vendidos
            </Text>

            {topProductos.length > 0 ? (
              topProductos.map((producto, index) => (
                <View key={index} style={styles.productoRow}>
                  <View style={styles.productoRank}>
                    <Text style={styles.rankNumero}>#{index + 1}</Text>
                  </View>
                  <View style={styles.productoInfo}>
                    <Text variant="titleMedium" style={styles.productoNombre}>
                      {producto.nombre}
                    </Text>
                    <Text variant="bodySmall" style={styles.productoDetalle}>
                      {producto.cantidad} unidades • {formatearMoneda(producto.total)}
                    </Text>
                  </View>
                  <View style={styles.productoEstadistica}>
                    <Text style={styles.productoCantidad}>{producto.cantidad}</Text>
                    <Text style={styles.productoUnidades}>uds</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No hay datos disponibles</Text>
            )}
          </Card.Content>
        </Card>

        {/* Próximamente */}
        <Card style={styles.card}>
          <Card.Content style={styles.proximamente}>
            <Text variant="headlineSmall" style={styles.proximamenteTitulo}>
              Más reportes próximamente
            </Text>
            <Text variant="bodyMedium" style={styles.proximamenteSubtitulo}>
              • Gráficas de ventas
            </Text>
            <Text variant="bodyMedium" style={styles.proximamenteSubtitulo}>
              • Análisis de tendencias
            </Text>
            <Text variant="bodyMedium" style={styles.proximamenteSubtitulo}>
              • Comparativas de periodos
            </Text>
            <Text variant="bodyMedium" style={styles.proximamenteSubtitulo}>
              • Reportes de categorías
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
```

**Beneficio:** Pantalla real de reportes con datos funcionales, no solo $0.00.

---

### 2. 💰 **Métricas MUY GRANDES y Visibles**

**Problema:** Los números están muy pequeños (como en la captura: $0.00 no se ve importante).

**Solución:** Usar tamaños gigantes para métricas principales:

```tsx
// Estilos para métricas destacadas
metricaPrincipal: {
  alignItems: 'center',
  paddingVertical: 24,
  backgroundColor: '#e3f2fd',
  borderRadius: 16,
  marginTop: 16,
  borderWidth: 2,
  borderColor: '#2196f3',
},
metricaLabel: {
  color: '#1565c0',
  fontWeight: '700',
  fontSize: 14,
  textTransform: 'uppercase',
  letterSpacing: 1,
},
metricaValor: {
  fontSize: 48, // ¡ENORME!
  fontWeight: '700',
  color: '#2c5f7c',
  marginTop: 8,
},
metricasRow: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 16,
},
metricaItem: {
  flex: 1,
  backgroundColor: '#f8f9fa',
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
},
metricaSecundariaLabel: {
  color: '#555',
  fontSize: 12,
  textAlign: 'center',
  marginBottom: 8,
},
metricaSecundariaValor: {
  fontSize: 24,
  fontWeight: '700',
  color: '#1a1a1a',
},
```

**Resultado:**
- Total Ventas: **48px** (vs 14px actual)
- Cantidad/Ticket: **24px** (vs 14px actual)
- +240% más visible

---

### 3. 🏆 **Top Productos con Ranking Visual**

**Problema:** "No hay datos disponibles" es aburrido y poco útil.

**Solución:** Mostrar top 5 productos con diseño atractivo:

```tsx
productoRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
},
productoRank: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#2196f3',
  justifyContent: 'center',
  alignItems: 'center',
},
rankNumero: {
  color: '#fff',
  fontSize: 18,
  fontWeight: '700',
},
productoInfo: {
  flex: 1,
},
productoNombre: {
  fontSize: 16,
  fontWeight: '700',
  color: '#1a1a1a',
},
productoDetalle: {
  color: '#666',
  marginTop: 4,
},
productoEstadistica: {
  alignItems: 'center',
  backgroundColor: '#e8f5e9',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 8,
},
productoCantidad: {
  fontSize: 20,
  fontWeight: '700',
  color: '#2e7d32',
},
productoUnidades: {
  fontSize: 11,
  color: '#388e3c',
  fontWeight: '600',
},
```

**Beneficio:** Ver rápidamente qué productos generan más ingresos.

---

### 4. 📈 **Queries de Base de Datos Faltantes**

**Problema:** No existen las queries necesarias para obtener estadísticas.

**Solución:** Agregar queries en `lib/database/queries.ts`:

```typescript
// Obtener ventas por rango de fechas
export async function obtenerVentasPorRango(
  fechaInicio: Date,
  fechaFin: Date
): Promise<any[]> {
  const db = await getDatabase();

  return db.select()
    .from(ventas)
    .where(
      and(
        gte(ventas.fecha, fechaInicio.toISOString()),
        lte(ventas.fecha, fechaFin.toISOString())
      )
    )
    .orderBy(desc(ventas.fecha))
    .all();
}

// Obtener productos más vendidos
export async function obtenerProductosMasVendidos(
  fechaInicio: Date,
  fechaFin: Date,
  limite: number = 5
): Promise<any[]> {
  const db = await getDatabase();

  const resultado = await db.select({
    productoId: ventaItems.productoId,
    nombre: productos.nombre,
    cantidad: sql<number>`sum(${ventaItems.cantidad})`,
    total: sql<number>`sum(${ventaItems.cantidad} * ${ventaItems.precioUnitario})`,
  })
    .from(ventaItems)
    .innerJoin(ventas, eq(ventaItems.ventaId, ventas.id))
    .innerJoin(productos, eq(ventaItems.productoId, productos.id))
    .where(
      and(
        gte(ventas.fecha, fechaInicio.toISOString()),
        lte(ventas.fecha, fechaFin.toISOString())
      )
    )
    .groupBy(ventaItems.productoId, productos.nombre)
    .orderBy(sql`sum(${ventaItems.cantidad}) DESC`)
    .limit(limite)
    .all();

  return resultado;
}

// Obtener estadísticas de ventas por periodo
export async function obtenerEstadisticasPeriodo(
  fechaInicio: Date,
  fechaFin: Date
): Promise<{
  totalVentas: number;
  cantidadVentas: number;
  ticketPromedio: number;
  ventasPorMetodo: Record<string, number>;
}> {
  const db = await getDatabase();

  const ventasDelPeriodo = await obtenerVentasPorRango(fechaInicio, fechaFin);

  const totalVentas = ventasDelPeriodo.reduce((sum, v) => sum + (v.total || 0), 0);
  const cantidadVentas = ventasDelPeriodo.length;
  const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

  // Ventas por método de pago
  const ventasPorMetodo: Record<string, number> = {};
  ventasDelPeriodo.forEach(v => {
    const metodo = v.metodoPago || 'desconocido';
    ventasPorMetodo[metodo] = (ventasPorMetodo[metodo] || 0) + (v.total || 0);
  });

  return {
    totalVentas,
    cantidadVentas,
    ticketPromedio,
    ventasPorMetodo,
  };
}
```

---

### 5. 🎨 **Tabs Modernos con Colores**

**Problema:** Los tabs de la captura se ven básicos.

**Solución:** Agregar estilos modernos:

```tsx
tabsContainer: {
  padding: 16,
  backgroundColor: '#fff',
  borderBottomWidth: 2,
  borderBottomColor: '#2c5f7c',
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
},
tabs: {
  backgroundColor: '#f8f9fa',
},
```

---

## 🎯 MEJORAS IMPORTANTES (Prioridad ALTA)

### 6. 📊 **Comparativa con Periodo Anterior**

Mostrar si las ventas subieron o bajaron:

```tsx
<View style={styles.comparativa}>
  <Text variant="labelSmall">vs. periodo anterior</Text>
  <View style={styles.comparativaRow}>
    <MaterialCommunityIcons
      name={cambio >= 0 ? "arrow-up" : "arrow-down"}
      size={20}
      color={cambio >= 0 ? "#4caf50" : "#f44336"}
    />
    <Text style={[
      styles.comparativaTexto,
      { color: cambio >= 0 ? "#4caf50" : "#f44336" }
    ]}>
      {Math.abs(cambio).toFixed(1)}%
    </Text>
  </View>
</View>
```

---

### 7. 💳 **Ventas por Método de Pago**

Tarjetas individuales para cada método:

```tsx
<View style={styles.metodosRow}>
  <Card style={[styles.metodoCard, styles.metodoEfectivo]}>
    <Card.Content>
      <MaterialCommunityIcons name="cash" size={32} color="#4caf50" />
      <Text style={styles.metodoLabel}>Efectivo</Text>
      <Text style={styles.metodoValor}>
        {formatearMoneda(ventasPorMetodo.efectivo || 0)}
      </Text>
    </Card.Content>
  </Card>

  <Card style={[styles.metodoCard, styles.metodoTarjeta]}>
    <Card.Content>
      <MaterialCommunityIcons name="credit-card" size={32} color="#2196f3" />
      <Text style={styles.metodoLabel}>Tarjeta</Text>
      <Text style={styles.metodoValor}>
        {formatearMoneda(ventasPorMetodo.tarjeta || 0)}
      </Text>
    </Card.Content>
  </Card>

  <Card style={[styles.metodoCard, styles.metodoTransferencia]}>
    <Card.Content>
      <MaterialCommunityIcons name="bank-transfer" size={32} color="#ff9800" />
      <Text style={styles.metodoLabel}>Transfer.</Text>
      <Text style={styles.metodoValor}>
        {formatearMoneda(ventasPorMetodo.transferencia || 0)}
      </Text>
    </Card.Content>
  </Card>
</View>
```

---

### 8. ⏰ **Horas Pico de Ventas**

Mostrar en qué horas se vende más:

```tsx
const obtenerHorasPico = (ventas: any[]) => {
  const ventasPorHora: Record<number, number> = {};

  ventas.forEach(v => {
    const hora = new Date(v.fecha).getHours();
    ventasPorHora[hora] = (ventasPorHora[hora] || 0) + 1;
  });

  const horasPico = Object.entries(ventasPorHora)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return horasPico;
};

// UI
<Card style={styles.card}>
  <Card.Content>
    <Text variant="titleLarge">⏰ Horas Pico</Text>
    {horasPico.map(([hora, cantidad]) => (
      <View key={hora} style={styles.horaRow}>
        <Text style={styles.horaTexto}>
          {hora}:00 - {hora}:59
        </Text>
        <Text style={styles.horaCantidad}>
          {cantidad} ventas
        </Text>
      </View>
    ))}
  </Card.Content>
</Card>
```

---

### 9. 📅 **Selector de Fechas Personalizado**

Permitir elegir rango específico:

```tsx
import DateTimePicker from '@react-native-community/datetimepicker';

<Button
  mode="outlined"
  onPress={() => setShowDatePicker(true)}
  icon="calendar"
>
  Personalizar periodo
</Button>

{showDatePicker && (
  <DateTimePicker
    value={fechaInicio || new Date()}
    mode="date"
    onChange={(event, date) => {
      setFechaInicio(date);
      setShowDatePicker(false);
    }}
  />
)}
```

---

### 10. 📥 **Exportar Reporte a PDF**

Botón para generar PDF con todos los datos:

```tsx
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const exportarReporte = async () => {
  const html = `
    <html>
      <body>
        <h1>Reporte de Ventas - ${periodo}</h1>
        <p>Total Ventas: ${formatearMoneda(estadisticas.totalVentas)}</p>
        <p>Cantidad: ${estadisticas.cantidadVentas}</p>
        <p>Ticket Promedio: ${formatearMoneda(estadisticas.ticketPromedio)}</p>

        <h2>Productos Más Vendidos</h2>
        <table>
          ${topProductos.map(p => `
            <tr>
              <td>${p.nombre}</td>
              <td>${p.cantidad} uds</td>
              <td>${formatearMoneda(p.total)}</td>
            </tr>
          `).join('')}
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
};

// Botón
<Button
  mode="contained"
  icon="file-pdf"
  onPress={exportarReporte}
>
  Exportar PDF
</Button>
```

---

## 🎨 DISEÑO VISUAL MODERNO

### Paleta de Colores

```tsx
const COLORES = {
  // Fondos
  fondoPrincipal: '#f8f9fa',
  fondoCard: '#ffffff',

  // Métricas
  metricaPrincipal: {
    fondo: '#e3f2fd',
    borde: '#2196f3',
    texto: '#2c5f7c',
  },
  metricaSecundaria: {
    fondo: '#f8f9fa',
    texto: '#1a1a1a',
  },

  // Métodos de pago
  efectivo: {
    fondo: '#e8f5e9',
    icono: '#4caf50',
  },
  tarjeta: {
    fondo: '#e3f2fd',
    icono: '#2196f3',
  },
  transferencia: {
    fondo: '#fff3e0',
    icono: '#ff9800',
  },

  // Ranking
  top1: '#ffd700', // Oro
  top2: '#c0c0c0', // Plata
  top3: '#cd7f32', // Bronce
  otros: '#2196f3',
};
```

---

## 📊 Resumen de Beneficios

| Mejora | Impacto | Tiempo |
|--------|---------|--------|
| Tabs Hoy/Semana/Mes funcionales | 🔥 CRÍTICO | 20 min |
| Métricas grandes (48px) | 🔥 CRÍTICO | 10 min |
| Top 5 productos con ranking | 🔥 CRÍTICO | 15 min |
| Queries de estadísticas | 🔥 CRÍTICO | 25 min |
| Comparativa periodo anterior | ⭐ ALTO | 15 min |
| Ventas por método pago | ⭐ ALTO | 10 min |
| Horas pico | ⭐ ALTO | 10 min |
| Selector fechas personalizado | 💡 MEDIO | 15 min |
| Exportar PDF | 💡 MEDIO | 20 min |

**Total implementación completa:** ~2.5 horas

---

## 🚀 Plan de Implementación

### Fase 1 (45 min) - CRÍTICAS
1. ✅ Crear `app/reportes.tsx` con tabs
2. ✅ Agregar queries de estadísticas
3. ✅ Métricas grandes y destacadas
4. ✅ Top 5 productos con diseño visual

### Fase 2 (35 min) - IMPORTANTES
5. Comparativa con periodo anterior
6. Cards de métodos de pago
7. Horas pico de ventas

### Fase 3 (35 min) - OPCIONALES
8. Selector de fechas personalizado
9. Exportar reporte a PDF
10. Gráficas simples con react-native-chart-kit

---

## 💡 Diferencia: Historial vs Reportes

**Historial (historial.tsx - ya existe):**
- Lista detallada de todas las ventas
- Búsqueda y filtros
- Ver detalle de cada venta
- Cancelar ventas

**Reportes (reportes.tsx - NUEVO):**
- Resumen de ventas con números grandes
- Estadísticas y métricas
- Top productos
- Comparativas
- Análisis visual

**Ambos módulos son diferentes y complementarios.**

---

*¿Quieres que implemente la Fase 1 (45 min) ahora mismo para transformar la pantalla?*
