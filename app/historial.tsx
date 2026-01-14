import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Chip, Searchbar } from 'react-native-paper';
import { formatearMoneda, formatearFecha } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';

export default function HistorialScreen() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [filteredVentas, setFilteredVentas] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarVentas();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = ventas.filter(v =>
        formatearMoneda(v.total).includes(searchQuery) ||
        v.metodoPago?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVentas(filtered);
    } else {
      setFilteredVentas(ventas);
    }
  }, [searchQuery, ventas]);

  const cargarVentas = async () => {
    try {
      setLoading(true);
      const data = await queries.obtenerVentas(100);
      setVentas(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderVenta = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View>
            <Text variant="titleMedium">Venta #{item.id}</Text>
            <Text variant="bodySmall" style={styles.fecha}>
              {item.fecha ? formatearFecha(new Date(item.fecha)) : 'N/A'}
            </Text>
          </View>
          <Text variant="titleLarge" style={styles.total}>
            {formatearMoneda(item.total || 0)}
          </Text>
        </View>

        <View style={styles.details}>
          <Chip mode="outlined" style={styles.chip}>
            {item.metodoPago || 'N/A'}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const totalVentas = filteredVentas.reduce((sum, v) => sum + (v.total || 0), 0);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar ventas..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text variant="titleMedium" style={styles.summaryText}>
              Total Ventas:
            </Text>
            <Text variant="titleMedium" style={styles.summaryText}>
              {filteredVentas.length}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="titleMedium" style={styles.summaryText}>
              Total:
            </Text>
            <Text variant="titleLarge" style={styles.summaryTotal}>
              {formatearMoneda(totalVentas)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <FlatList
        data={filteredVentas}
        renderItem={renderVenta}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarVentas}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No hay ventas registradas
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 10,
  },
  summaryCard: {
    margin: 10,
    backgroundColor: '#2c5f7c',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryText: {
    color: '#fff',
  },
  summaryTotal: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  fecha: {
    color: '#666',
    marginTop: 4,
  },
  total: {
    color: '#2c5f7c',
    fontWeight: 'bold',
  },
  details: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
  },
});
