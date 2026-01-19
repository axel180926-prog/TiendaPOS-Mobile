# 💰 Dashboard de Ganancias - Diseño Completo

> Inspirado en: Square POS, Shopify POS, Toast POS, Clover
> Fecha: 2026-01-15
> Objetivo: Mostrar TODAS las ganancias de forma clara y accionable

---

## 🎯 Qué Necesita Ver el Dueño

### 1. **Vista General (Home Dashboard)**
- 💵 Ventas del día (GRANDE)
- 💰 Ganancia del día (GRANDE)
- 📊 Comparación con ayer/semana/mes
- 🎯 Meta del día/mes
- 📈 Tendencia (subiendo/bajando)

### 2. **Desglose de Ganancias**
- Por producto (cuál genera más ganancia)
- Por categoría (qué categoría es más rentable)
- Por método de pago
- Por hora del día (horas pico)
- Por día de la semana

### 3. **Métricas Clave (KPIs)**
- Ticket promedio
- Productos vendidos por transacción
- Margen de ganancia promedio (%)
- Efectividad de ventas
- Rotación de inventario

### 4. **Alertas y Notificaciones**
- Productos con poca ganancia
- Stock bajo de productos rentables
- Días/horas sin ventas
- Comparativas negativas

---

## 📱 Diseño del Dashboard Principal

```
┌─────────────────────────────────────────────┐
│  💰 Dashboard de Ganancias                   │
│  [Hoy] [Esta Semana] [Este Mes] [Año]       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  💵 VENTAS HOY                               │
│  $2,458.50                  ↗ +15.3%        │
│  vs. ayer: $2,132.00                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  💰 GANANCIA HOY                             │
│  $892.45                    ↗ +12.8%        │
│  Margen: 36.3% • Promedio: 38%              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📊 MÉTRICAS CLAVE                           │
│  ┌──────────┬──────────┬──────────┐        │
│  │ Ticket   │ Ventas   │ Items/   │        │
│  │ Promedio │ Totales  │ Venta    │        │
│  │ $52.47   │ 47       │ 3.2      │        │
│  └──────────┴──────────┴──────────┘        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  🏆 TOP 5 PRODUCTOS MÁS RENTABLES            │
│  #1 🥇 Coca-Cola 600ml                       │
│      68 vendidos • $340.00 ganancia         │
│  #2 🥈 Sabritas Original 40g                 │
│      52 vendidos • $260.00 ganancia         │
│  ...                                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📈 GRÁFICA DE VENTAS (Últimos 7 días)       │
│  [Gráfica de barras interactiva]            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ⚠️ ALERTAS                                  │
│  • 3 productos con stock bajo               │
│  • Ganancia -5% vs. semana pasada           │
│  • Hora pico: 2-4pm (no aprovechar?)        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  🎯 META DEL MES                             │
│  $45,000.00 meta                             │
│  $32,450.00 actual (72%)                    │
│  [█████████░░░░░] Faltan 8 días             │
└─────────────────────────────────────────────┘
```

---

## 💻 Implementación Técnica

### Archivo: `app/dashboard.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Text, SegmentedButtons, IconButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { formatearMoneda } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';

type PeriodoType = 'hoy' | 'semana' | 'mes' | 'anio';

export default function DashboardGananciasScreen() {
  const [periodo, setPeriodo] = useState<PeriodoType>('hoy');
  const [loading, setLoading] = useState(false);

  // Datos principales
  const [ventasTotal, setVentasTotal] = useState(0);
  const [gananciasTotal, setGananciasTotal] = useState(0);
  const [comparacion, setComparacion] = useState({ tipo: 'subida', porcentaje: 0 });
  const [margenPromedio, setMargenPromedio] = useState(0);

  // Métricas
  const [ticketPromedio, setTicketPromedio] = useState(0);
  const [numeroVentas, setNumeroVentas] = useState(0);
  const [itemsPorVenta, setItemsPorVenta] = useState(0);

  // Top productos
  const [topProductosRentables, setTopProductosRentables] = useState<any[]>([]);

  // Gráficas
  const [datosGrafica, setDatosGrafica] = useState({ labels: [], data: [] });

  // Alertas
  const [alertas, setAlertas] = useState<any[]>([]);

  // Meta
  const [meta, setMeta] = useState({ objetivo: 50000, actual: 0, porcentaje: 0 });

  useEffect(() => {
    cargarDashboard();
  }, [periodo]);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      const { fechaInicio, fechaFin } = obtenerRangoFechas(periodo);

      // 1. VENTAS Y GANANCIAS TOTALES
      const ventas = await queries.obtenerVentasPorRango(fechaInicio, fechaFin);
      const ventasTotal = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

      // Calcular ganancia total (necesitamos los items de cada venta)
      let gananciasTotal = 0;
      for (const venta of ventas) {
        const items = await queries.obtenerDetallesVenta(venta.id);
        for (const item of items) {
          const producto = item.producto;
          if (producto) {
            const gananciaUnitaria = item.precioUnitario - (producto.precioCompra || 0);
            gananciasTotal += gananciaUnitaria * item.cantidad;
          }
        }
      }

      setVentasTotal(ventasTotal);
      setGananciasTotal(gananciasTotal);

      // 2. COMPARACIÓN CON PERIODO ANTERIOR
      const { fechaInicio: fechaInicioAnterior, fechaFin: fechaFinAnterior } =
        obtenerPeriodoAnterior(periodo);
      const ventasAnterior = await queries.obtenerVentasPorRango(
        fechaInicioAnterior,
        fechaFinAnterior
      );
      const ventasTotalAnterior = ventasAnterior.reduce((sum, v) => sum + (v.total || 0), 0);

      const cambio = ventasTotalAnterior > 0
        ? ((ventasTotal - ventasTotalAnterior) / ventasTotalAnterior) * 100
        : 0;

      setComparacion({
        tipo: cambio >= 0 ? 'subida' : 'bajada',
        porcentaje: Math.abs(cambio),
      });

      // 3. MARGEN PROMEDIO
      const margen = ventasTotal > 0 ? (gananciasTotal / ventasTotal) * 100 : 0;
      setMargenPromedio(margen);

      // 4. MÉTRICAS
      setNumeroVentas(ventas.length);
      setTicketPromedio(ventas.length > 0 ? ventasTotal / ventas.length : 0);

      // Items por venta
      let totalItems = 0;
      for (const venta of ventas) {
        const items = await queries.obtenerDetallesVenta(venta.id);
        totalItems += items.reduce((sum, item) => sum + item.cantidad, 0);
      }
      setItemsPorVenta(ventas.length > 0 ? totalItems / ventas.length : 0);

      // 5. TOP PRODUCTOS MÁS RENTABLES
      const topProductos = await queries.obtenerProductosMasRentables(fechaInicio, fechaFin, 5);
      setTopProductosRentables(topProductos);

      // 6. DATOS PARA GRÁFICA (últimos 7 días)
      const datosGrafica = await generarDatosGrafica(periodo);
      setDatosGrafica(datosGrafica);

      // 7. ALERTAS
      const alertasGeneradas = await generarAlertas(ventas, topProductos);
      setAlertas(alertasGeneradas);

      // 8. META DEL MES
      if (periodo === 'mes') {
        const metaMes = await queries.obtenerMetaMes();
        const porcentaje = metaMes.objetivo > 0
          ? (ventasTotal / metaMes.objetivo) * 100
          : 0;
        setMeta({
          objetivo: metaMes.objetivo || 50000,
          actual: ventasTotal,
          porcentaje,
        });
      }

    } catch (error) {
      console.error('Error al cargar dashboard:', error);
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
        break;
      case 'semana':
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;
      case 'mes':
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        break;
      case 'anio':
        fechaInicio.setDate(fechaInicio.getDate() - 365);
        break;
    }

    return { fechaInicio, fechaFin: fin };
  };

  const obtenerPeriodoAnterior = (tipo: PeriodoType) => {
    const { fechaInicio, fechaFin } = obtenerRangoFechas(tipo);
    const duracion = fechaFin.getTime() - fechaInicio.getTime();

    const fechaFinAnterior = new Date(fechaInicio.getTime() - 1);
    const fechaInicioAnterior = new Date(fechaFinAnterior.getTime() - duracion);

    return { fechaInicio: fechaInicioAnterior, fechaFin: fechaFinAnterior };
  };

  const generarDatosGrafica = async (periodo: PeriodoType) => {
    // Generar datos para los últimos 7 días
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      fecha.setHours(0, 0, 0, 0);

      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);

      const ventas = await queries.obtenerVentasPorRango(fecha, fechaFin);
      const total = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

      labels.push(fecha.toLocaleDateString('es-MX', { weekday: 'short' }));
      data.push(total);
    }

    return { labels, data };
  };

  const generarAlertas = async (ventas: any[], topProductos: any[]) => {
    const alertas: any[] = [];

    // Alerta de stock bajo en productos rentables
    const productosStockBajo = await queries.obtenerProductosStockBajo(10);
    if (productosStockBajo.length > 0) {
      alertas.push({
        tipo: 'warning',
        icono: 'alert-circle',
        mensaje: `${productosStockBajo.length} productos rentables con stock bajo`,
        accion: 'Ver productos',
      });
    }

    // Alerta de baja en ventas
    if (comparacion.tipo === 'bajada' && comparacion.porcentaje > 5) {
      alertas.push({
        tipo: 'danger',
        icono: 'trending-down',
        mensaje: `Ventas -${comparacion.porcentaje.toFixed(1)}% vs. periodo anterior`,
        accion: 'Ver análisis',
      });
    }

    // Alerta de productos con baja rentabilidad
    const productosPocoRentables = await queries.obtenerProductosPocoRentables(5);
    if (productosPocoRentables.length > 0) {
      alertas.push({
        tipo: 'info',
        icono: 'information',
        mensaje: `${productosPocoRentables.length} productos con margen < 20%`,
        accion: 'Revisar precios',
      });
    }

    return alertas;
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
            { value: 'mes', label: 'Mes' },
            { value: 'anio', label: 'Año' },
          ]}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* VENTAS TOTALES */}
        <Card style={styles.cardPrincipal}>
          <Card.Content>
            <Text variant="labelLarge" style={styles.labelPrincipal}>
              💵 VENTAS {periodo.toUpperCase()}
            </Text>
            <View style={styles.valorConComparacion}>
              <Text variant="displayMedium" style={styles.valorPrincipal}>
                {formatearMoneda(ventasTotal)}
              </Text>
              <View style={[
                styles.comparacionBadge,
                { backgroundColor: comparacion.tipo === 'subida' ? '#e8f5e9' : '#ffebee' }
              ]}>
                <MaterialCommunityIcons
                  name={comparacion.tipo === 'subida' ? 'arrow-up' : 'arrow-down'}
                  size={20}
                  color={comparacion.tipo === 'subida' ? '#4caf50' : '#f44336'}
                />
                <Text style={[
                  styles.comparacionTexto,
                  { color: comparacion.tipo === 'subida' ? '#4caf50' : '#f44336' }
                ]}>
                  {comparacion.porcentaje.toFixed(1)}%
                </Text>
              </View>
            </View>
            <Text variant="bodySmall" style={styles.subtextoPrincipal}>
              vs. periodo anterior
            </Text>
          </Card.Content>
        </Card>

        {/* GANANCIA TOTAL */}
        <Card style={styles.cardGanancia}>
          <Card.Content>
            <Text variant="labelLarge" style={styles.labelGanancia}>
              💰 GANANCIA {periodo.toUpperCase()}
            </Text>
            <Text variant="displayMedium" style={styles.valorGanancia}>
              {formatearMoneda(gananciasTotal)}
            </Text>
            <View style={styles.margenRow}>
              <Text variant="bodyMedium" style={styles.margenTexto}>
                Margen: {margenPromedio.toFixed(1)}%
              </Text>
              <Chip
                mode="flat"
                style={[
                  styles.margenChip,
                  { backgroundColor: margenPromedio >= 35 ? '#e8f5e9' : '#fff3e0' }
                ]}
                textStyle={{
                  color: margenPromedio >= 35 ? '#2e7d32' : '#e65100',
                  fontWeight: '700',
                }}
              >
                {margenPromedio >= 35 ? '✓ Excelente' : '⚠ Mejorable'}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* MÉTRICAS CLAVE */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitulo}>
              📊 Métricas Clave
            </Text>
            <View style={styles.metricasGrid}>
              <View style={styles.metricaBox}>
                <MaterialCommunityIcons name="receipt" size={32} color="#2196f3" />
                <Text variant="headlineSmall" style={styles.metricaValor}>
                  {formatearMoneda(ticketPromedio)}
                </Text>
                <Text variant="bodySmall" style={styles.metricaLabel}>
                  Ticket Promedio
                </Text>
              </View>

              <View style={styles.metricaBox}>
                <MaterialCommunityIcons name="cart" size={32} color="#4caf50" />
                <Text variant="headlineSmall" style={styles.metricaValor}>
                  {numeroVentas}
                </Text>
                <Text variant="bodySmall" style={styles.metricaLabel}>
                  Ventas Totales
                </Text>
              </View>

              <View style={styles.metricaBox}>
                <MaterialCommunityIcons name="package-variant" size={32} color="#ff9800" />
                <Text variant="headlineSmall" style={styles.metricaValor}>
                  {itemsPorVenta.toFixed(1)}
                </Text>
                <Text variant="bodySmall" style={styles.metricaLabel}>
                  Items/Venta
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* TOP 5 PRODUCTOS MÁS RENTABLES */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitulo}>
              🏆 Top 5 Productos Más Rentables
            </Text>
            {topProductosRentables.length > 0 ? (
              topProductosRentables.map((producto, index) => (
                <View key={index} style={styles.productoRentableRow}>
                  <View style={[
                    styles.rankBadge,
                    { backgroundColor: getRankColor(index) }
                  ]}>
                    <Text style={styles.rankTexto}>#{index + 1}</Text>
                  </View>
                  <View style={styles.productoInfo}>
                    <Text variant="titleMedium" style={styles.productoNombre}>
                      {producto.nombre}
                    </Text>
                    <Text variant="bodySmall" style={styles.productoDetalle}>
                      {producto.cantidad} vendidos • Margen: {producto.margen.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.productoGanancia}>
                    <Text style={styles.gananciaValor}>
                      {formatearMoneda(producto.gananciaTotal)}
                    </Text>
                    <Text style={styles.gananciaLabel}>ganancia</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No hay datos disponibles</Text>
            )}
          </Card.Content>
        </Card>

        {/* GRÁFICA DE VENTAS */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitulo}>
              📈 Ventas Últimos 7 Días
            </Text>
            {datosGrafica.data.length > 0 && (
              <BarChart
                data={{
                  labels: datosGrafica.labels,
                  datasets: [{ data: datosGrafica.data }],
                }}
                width={Dimensions.get('window').width - 60}
                height={220}
                yAxisLabel="$"
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(44, 95, 124, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                }}
                style={styles.grafica}
              />
            )}
          </Card.Content>
        </Card>

        {/* ALERTAS */}
        {alertas.length > 0 && (
          <Card style={styles.cardAlertas}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitulo}>
                ⚠️ Alertas
              </Text>
              {alertas.map((alerta, index) => (
                <View key={index} style={styles.alertaRow}>
                  <MaterialCommunityIcons
                    name={alerta.icono}
                    size={24}
                    color={getAlertColor(alerta.tipo)}
                  />
                  <Text style={styles.alertaTexto}>{alerta.mensaje}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* META DEL MES */}
        {periodo === 'mes' && (
          <Card style={styles.cardMeta}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitulo}>
                🎯 Meta del Mes
              </Text>
              <View style={styles.metaInfo}>
                <Text variant="headlineMedium" style={styles.metaActual}>
                  {formatearMoneda(meta.actual)}
                </Text>
                <Text variant="bodyMedium" style={styles.metaObjetivo}>
                  de {formatearMoneda(meta.objetivo)} ({meta.porcentaje.toFixed(0)}%)
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(meta.porcentaje, 100)}%` }
                  ]}
                />
              </View>
              <Text variant="bodySmall" style={styles.metaRestante}>
                Faltan {formatearMoneda(meta.objetivo - meta.actual)} para alcanzar la meta
              </Text>
            </Card.Content>
          </Card>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

// Funciones auxiliares
const getRankColor = (index: number) => {
  const colors = ['#ffd700', '#c0c0c0', '#cd7f32', '#2196f3', '#2196f3'];
  return colors[index] || '#2196f3';
};

const getAlertColor = (tipo: string) => {
  switch (tipo) {
    case 'danger': return '#f44336';
    case 'warning': return '#ff9800';
    case 'info': return '#2196f3';
    default: return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#2c5f7c',
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  cardPrincipal: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
    elevation: 4,
  },
  labelPrincipal: {
    color: '#1565c0',
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valorConComparacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  valorPrincipal: {
    fontSize: 42,
    fontWeight: '700',
    color: '#2c5f7c',
  },
  comparacionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  comparacionTexto: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtextoPrincipal: {
    color: '#666',
    marginTop: 8,
  },
  cardGanancia: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#4caf50',
    elevation: 4,
  },
  labelGanancia: {
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valorGanancia: {
    fontSize: 42,
    fontWeight: '700',
    color: '#2e7d32',
    marginTop: 12,
  },
  margenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  margenTexto: {
    color: '#388e3c',
    fontWeight: '600',
  },
  margenChip: {
    height: 28,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardTitulo: {
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  metricasGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricaBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricaValor: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  metricaLabel: {
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  productoRentableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  productoDetalle: {
    color: '#666',
    marginTop: 4,
  },
  productoGanancia: {
    alignItems: 'flex-end',
  },
  gananciaValor: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
  },
  gananciaLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  grafica: {
    marginVertical: 8,
    borderRadius: 16,
  },
  cardAlertas: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff3e0',
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  alertaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  alertaTexto: {
    flex: 1,
    fontSize: 14,
    color: '#e65100',
  },
  cardMeta: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f3e5f5',
    borderWidth: 2,
    borderColor: '#9c27b0',
  },
  metaInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  metaActual: {
    fontSize: 32,
    fontWeight: '700',
    color: '#9c27b0',
  },
  metaObjetivo: {
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9c27b0',
  },
  metaRestante: {
    color: '#666',
    textAlign: 'center',
  },
  noData: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  spacer: {
    height: 32,
  },
});
```

---

## 🔧 Queries Necesarias en `lib/database/queries.ts`

```typescript
// Obtener productos más rentables (por ganancia total)
export async function obtenerProductosMasRentables(
  fechaInicio: Date,
  fechaFin: Date,
  limite: number = 5
): Promise<any[]> {
  const db = await getDatabase();

  // Esta query necesita calcular: (precioVenta - precioCompra) * cantidad
  const resultado = await db.select({
    productoId: ventaItems.productoId,
    nombre: productos.nombre,
    cantidad: sql<number>`sum(${ventaItems.cantidad})`,
    ventasTotal: sql<number>`sum(${ventaItems.cantidad} * ${ventaItems.precioUnitario})`,
    gananciaTotal: sql<number>`sum(${ventaItems.cantidad} * (${ventaItems.precioUnitario} - ${productos.precioCompra}))`,
    margen: sql<number>`avg(((${ventaItems.precioUnitario} - ${productos.precioCompra}) / ${productos.precioCompra}) * 100)`,
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
    .orderBy(sql`sum(${ventaItems.cantidad} * (${ventaItems.precioUnitario} - ${productos.precioCompra})) DESC`)
    .limit(limite)
    .all();

  return resultado;
}

// Obtener productos con stock bajo
export async function obtenerProductosStockBajo(
  limite: number = 10
): Promise<any[]> {
  const db = await getDatabase();

  return db.select()
    .from(productos)
    .where(
      and(
        lte(productos.stock, productos.stockMinimo),
        eq(productos.activo, true)
      )
    )
    .orderBy(productos.stock)
    .limit(limite)
    .all();
}

// Obtener productos poco rentables (margen < 20%)
export async function obtenerProductosPocoRentables(
  limite: number = 5
): Promise<any[]> {
  const db = await getDatabase();

  return db.select()
    .from(productos)
    .where(
      and(
        eq(productos.activo, true),
        gt(productos.precioVenta, 0),
        sql`((${productos.precioVenta} - ${productos.precioCompra}) / ${productos.precioCompra} * 100) < 20`
      )
    )
    .orderBy(sql`((${productos.precioVenta} - ${productos.precioCompra}) / ${productos.precioCompra} * 100)`)
    .limit(limite)
    .all();
}

// Obtener/Actualizar meta del mes
export async function obtenerMetaMes(): Promise<{ objetivo: number }> {
  const db = await getDatabase();

  const config = await db.select()
    .from(configuracion)
    .where(eq(configuracion.clave, 'meta_mensual'))
    .get();

  return { objetivo: config?.valor ? parseFloat(config.valor) : 50000 };
}

export async function actualizarMetaMes(monto: number): Promise<void> {
  const db = await getDatabase();

  await db.insert(configuracion)
    .values({
      clave: 'meta_mensual',
      valor: monto.toString(),
    })
    .onConflictDoUpdate({
      target: configuracion.clave,
      set: { valor: monto.toString() },
    })
    .run();
}
```

---

## 📦 Dependencias Adicionales

```bash
npm install react-native-chart-kit react-native-svg
```

---

## 🎯 Cómo Usar en la App

Agregar en el drawer/tabs de navegación:

```tsx
// En app/_layout.tsx o donde tengas la navegación
<DrawerItem
  label="💰 Dashboard Ganancias"
  onPress={() => router.push('/dashboard')}
  icon={({ color, size }) => (
    <MaterialCommunityIcons name="chart-line" size={size} color={color} />
  )}
/>
```

---

## 💡 Beneficios para el Dueño

1. **Vista 360° de ganancias** - Todo en un solo lugar
2. **Comparativas automáticas** - Sabe si está mejorando o empeorando
3. **Top productos rentables** - Sabe qué impulsar
4. **Alertas proactivas** - No se le pasa nada importante
5. **Metas visuales** - Motivación para alcanzar objetivos
6. **Gráficas claras** - Entiende tendencias de un vistazo
7. **Métricas accionables** - Puede tomar decisiones basadas en datos

---

*¿Quieres que implemente este Dashboard completo ahora?*
