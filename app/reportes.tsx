import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, SegmentedButtons } from 'react-native-paper';
import { formatearMoneda } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';

export default function ReportesScreen() {
  const [periodo, setPeriodo] = useState('hoy');
  const [totalVentas, setTotalVentas] = useState(0);
  const [cantidadVentas, setCantidadVentas] = useState(0);
  const [productosVendidos, setProductosVendidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarReportes();
  }, [periodo]);

  const cargarReportes = async () => {
    try {
      setLoading(true);

      // Ventas del día
      const ventasHoy = await queries.obtenerVentasDelDia();
      const totalHoy = await queries.obtenerTotalVentasDelDia();

      setTotalVentas(totalHoy);
      setCantidadVentas(ventasHoy.length);

      // Productos más vendidos
      const topProductos = await queries.obtenerProductosMasVendidos(5);
      setProductosVendidos(topProductos);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <SegmentedButtons
          value={periodo}
          onValueChange={setPeriodo}
          buttons={[
            { value: 'hoy', label: 'Hoy' },
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mes' },
          ]}
          style={styles.segmented}
        />

        <Card style={styles.card}>
          <Card.Title title="Resumen de Ventas" />
          <Card.Content>
            <View style={styles.stat}>
              <Text variant="labelLarge">Total Ventas</Text>
              <Text variant="displaySmall" style={styles.statValue}>
                {formatearMoneda(totalVentas)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text variant="labelLarge">Cantidad de Ventas</Text>
              <Text variant="headlineMedium" style={styles.statValue}>
                {cantidadVentas}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text variant="labelLarge">Ticket Promedio</Text>
              <Text variant="headlineMedium" style={styles.statValue}>
                {cantidadVentas > 0
                  ? formatearMoneda(totalVentas / cantidadVentas)
                  : formatearMoneda(0)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Productos Más Vendidos" />
          <Card.Content>
            {productosVendidos.length > 0 ? (
              productosVendidos.map((item, index) => (
                <View key={index} style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text variant="titleSmall">{item.producto?.nombre || 'N/A'}</Text>
                    <Text variant="bodySmall" style={styles.productStats}>
                      {item.totalVendido} unidades • {formatearMoneda(item.totalIngresos || 0)}
                    </Text>
                  </View>
                  <Text variant="titleMedium" style={styles.ranking}>
                    #{index + 1}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No hay datos disponibles
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.comingSoon}>
            <Text variant="headlineSmall" style={styles.comingSoonText}>
              Más reportes próximamente
            </Text>
            <Text variant="bodyMedium" style={styles.comingSoonDescription}>
              • Gráficas de ventas{'\n'}
              • Análisis de tendencias{'\n'}
              • Comparativas de períodos{'\n'}
              • Reportes de categorías
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8eff5',
  },
  scrollView: {
    flex: 1,
  },
  segmented: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
    borderRadius: 12,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderRadius: 16,
    borderLeftWidth: 6,
    borderLeftColor: '#4caf50',
  },
  stat: {
    paddingVertical: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#e8eff5',
  },
  statValue: {
    color: '#2c5f7c',
    fontWeight: '900',
    marginTop: 10,
    fontSize: 32,
    letterSpacing: 0.3,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#e8eff5',
  },
  productInfo: {
    flex: 1,
  },
  productStats: {
    color: '#888',
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  ranking: {
    color: '#2c5f7c',
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: 0.3,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 30,
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  comingSoonText: {
    marginBottom: 20,
    color: '#2c5f7c',
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: 0.3,
  },
  comingSoonDescription: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    fontSize: 15,
    fontWeight: '600',
  },
});
