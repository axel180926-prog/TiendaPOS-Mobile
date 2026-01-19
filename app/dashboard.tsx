import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Card, Text, SegmentedButtons, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { formatearMoneda } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';

type PeriodoType = 'hoy' | 'semana' | 'mes';

export default function DashboardGananciasScreen() {
  const [periodo, setPeriodo] = useState<PeriodoType>('hoy');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
  const [datosGrafica, setDatosGrafica] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: [],
  });

  useEffect(() => {
    cargarDashboard();
  }, [periodo]);

  const cargarDashboard = async (esRefresh = false) => {
    try {
      if (esRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { fechaInicio, fechaFin } = obtenerRangoFechas(periodo);

      // 1. VENTAS Y GANANCIAS TOTALES
      const ventas = await queries.obtenerVentasPorRango(fechaInicio, fechaFin);
      const ventasTotal = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

      // Calcular ganancia total
      let gananciasTotal = 0;
      let totalItems = 0;

      for (const venta of ventas) {
        const items = await queries.obtenerDetallesVenta(venta.id);
        for (const item of items) {
          const producto = item.producto;
          if (producto) {
            const gananciaUnitaria = item.precioUnitario - (producto.precioCompra || 0);
            gananciasTotal += gananciaUnitaria * item.cantidad;
          }
          totalItems += item.cantidad;
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

      const cambio =
        ventasTotalAnterior > 0
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
      setItemsPorVenta(ventas.length > 0 ? totalItems / ventas.length : 0);

      // 5. TOP PRODUCTOS MÁS RENTABLES (simplificado)
      const todosLosProductos: any = {};

      for (const venta of ventas) {
        const items = await queries.obtenerDetallesVenta(venta.id);
        for (const item of items) {
          const producto = item.producto;
          if (producto) {
            const gananciaUnitaria = item.precioUnitario - (producto.precioCompra || 0);
            const gananciaTotal = gananciaUnitaria * item.cantidad;

            if (!todosLosProductos[producto.id]) {
              todosLosProductos[producto.id] = {
                id: producto.id,
                nombre: producto.nombre,
                cantidad: 0,
                gananciaTotal: 0,
                margen: 0,
              };
            }

            todosLosProductos[producto.id].cantidad += item.cantidad;
            todosLosProductos[producto.id].gananciaTotal += gananciaTotal;
          }
        }
      }

      const topProductos = Object.values(todosLosProductos)
        .sort((a: any, b: any) => b.gananciaTotal - a.gananciaTotal)
        .slice(0, 5);

      setTopProductosRentables(topProductos);

      // 6. DATOS PARA GRÁFICA
      const datosGrafica = await generarDatosGrafica();
      setDatosGrafica(datosGrafica);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const generarDatosGrafica = async () => {
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

      const diaSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fecha.getDay()];
      labels.push(diaSemana);
      data.push(total);
    }

    return { labels, data };
  };

  const getRankColor = (index: number) => {
    const colors = ['#ffd700', '#c0c0c0', '#cd7f32', '#2196f3', '#2196f3'];
    return colors[index] || '#2196f3';
  };

  const onRefresh = () => {
    cargarDashboard(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5f7c" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

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
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
              {comparacion.porcentaje > 0 && (
                <View
                  style={[
                    styles.comparacionBadge,
                    { backgroundColor: comparacion.tipo === 'subida' ? '#e8f5e9' : '#ffebee' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={comparacion.tipo === 'subida' ? 'arrow-up' : 'arrow-down'}
                    size={20}
                    color={comparacion.tipo === 'subida' ? '#4caf50' : '#f44336'}
                  />
                  <Text
                    style={[
                      styles.comparacionTexto,
                      { color: comparacion.tipo === 'subida' ? '#4caf50' : '#f44336' },
                    ]}
                  >
                    {comparacion.porcentaje.toFixed(1)}%
                  </Text>
                </View>
              )}
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
                  { backgroundColor: margenPromedio >= 30 ? '#e8f5e9' : '#fff3e0' },
                ]}
                textStyle={{
                  color: margenPromedio >= 30 ? '#2e7d32' : '#e65100',
                  fontWeight: '700',
                }}
              >
                {margenPromedio >= 30 ? '✓ Excelente' : '⚠ Mejorable'}
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
                <View key={producto.id} style={styles.productoRentableRow}>
                  <View
                    style={[styles.rankBadge, { backgroundColor: getRankColor(index) }]}
                  >
                    <Text style={styles.rankTexto}>#{index + 1}</Text>
                  </View>
                  <View style={styles.productoInfo}>
                    <Text variant="titleMedium" style={styles.productoNombre}>
                      {producto.nombre}
                    </Text>
                    <Text variant="bodySmall" style={styles.productoDetalle}>
                      {producto.cantidad} vendidos
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
              <Text style={styles.noData}>
                No hay datos disponibles para este periodo
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* GRÁFICA DE VENTAS */}
        {datosGrafica.data.length > 0 && datosGrafica.data.some((d) => d > 0) && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitulo}>
                📈 Ventas Últimos 7 Días
              </Text>
              <View style={styles.chartContainer}>
                <BarChart
                  data={datosGrafica.data.map((value, index) => ({
                    value: value,
                    label: datosGrafica.labels[index],
                    frontColor: '#2c5f7c',
                  }))}
                  barWidth={35}
                  spacing={20}
                  roundedTop
                  roundedBottom
                  hideRules
                  xAxisThickness={1}
                  yAxisThickness={1}
                  yAxisTextStyle={{ color: '#666' }}
                  xAxisLabelTextStyle={{ color: '#666', fontSize: 12 }}
                  noOfSections={4}
                  maxValue={Math.max(...datosGrafica.data) * 1.2}
                  height={200}
                  width={Dimensions.get('window').width - 100}
                />
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Mensaje informativo si no hay datos */}
        {ventasTotal === 0 && (
          <Card style={styles.cardInfo}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.infoTitulo}>
                💡 Aún no hay ventas registradas
              </Text>
              <Text variant="bodyMedium" style={styles.infoTexto}>
                Las estadísticas se mostrarán aquí una vez que empieces a realizar ventas.
              </Text>
            </Card.Content>
          </Card>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
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
    borderRadius: 16,
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
    borderRadius: 16,
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
    borderRadius: 16,
    elevation: 2,
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
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 10,
  },
  grafica: {
    marginVertical: 8,
    borderRadius: 16,
  },
  cardInfo: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff3e0',
    borderWidth: 2,
    borderColor: '#ff9800',
    borderRadius: 16,
  },
  infoTitulo: {
    fontWeight: '700',
    color: '#e65100',
    marginBottom: 8,
  },
  infoTexto: {
    color: '#e65100',
  },
  noData: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  spacer: {
    height: 32,
  },
});
