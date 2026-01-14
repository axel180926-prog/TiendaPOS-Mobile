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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  segmented: {
    margin: 10,
  },
  card: {
    margin: 10,
  },
  stat: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statValue: {
    color: '#2c5f7c',
    fontWeight: 'bold',
    marginTop: 8,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productInfo: {
    flex: 1,
  },
  productStats: {
    color: '#666',
    marginTop: 4,
  },
  ranking: {
    color: '#2c5f7c',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  comingSoonText: {
    marginBottom: 15,
    color: '#2c5f7c',
  },
  comingSoonDescription: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
