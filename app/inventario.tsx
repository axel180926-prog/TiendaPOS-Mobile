import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Chip, SegmentedButtons, Searchbar } from 'react-native-paper';
import { formatearMoneda } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';

export default function InventarioScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [searchQuery, filter, productos]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await queries.obtenerProductos();
      setProductos(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...productos];

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre?.toLowerCase().includes(query) ||
        p.codigoBarras?.includes(query)
      );
    }

    // Filtro por stock
    if (filter === 'bajo') {
      filtered = filtered.filter(p => (p.stock || 0) <= (p.stockMinimo || 5));
    } else if (filter === 'agotado') {
      filtered = filtered.filter(p => (p.stock || 0) === 0);
    }

    setFilteredProductos(filtered);
  };

  const renderProducto = ({ item }: { item: any }) => {
    const stockBajo = (item.stock || 0) <= (item.stockMinimo || 5);
    const agotado = (item.stock || 0) === 0;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.info}>
              <Text variant="titleMedium">{item.nombre}</Text>
              <Text variant="bodySmall" style={styles.codigo}>{item.codigoBarras}</Text>
            </View>
            {agotado && <Chip mode="flat" textStyle={styles.agotadoText}>AGOTADO</Chip>}
            {!agotado && stockBajo && <Chip mode="flat" textStyle={styles.bajoText}>BAJO</Chip>}
          </View>

          <View style={styles.details}>
            <View style={styles.row}>
              <Text variant="labelMedium">Stock Actual:</Text>
              <Text variant="bodyLarge" style={[styles.stock, agotado && styles.stockAgotado]}>
                {item.stock || 0}
              </Text>
            </View>
            <View style={styles.row}>
              <Text variant="labelMedium">Stock Mínimo:</Text>
              <Text variant="bodyMedium">{item.stockMinimo || 5}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="labelMedium">Precio:</Text>
              <Text variant="bodyMedium">{formatearMoneda(item.precioVenta || 0)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="labelMedium">Valor en Inventario:</Text>
              <Text variant="bodyLarge" style={styles.valor}>
                {formatearMoneda((item.stock || 0) * (item.precioVenta || 0))}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const totalValor = filteredProductos.reduce(
    (sum, p) => sum + ((p.stock || 0) * (p.precioVenta || 0)),
    0
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar productos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        buttons={[
          { value: 'todos', label: 'Todos' },
          { value: 'bajo', label: 'Stock Bajo' },
          { value: 'agotado', label: 'Agotados' },
        ]}
        style={styles.segmented}
      />

      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text variant="titleMedium">Total Productos:</Text>
            <Text variant="titleMedium">{filteredProductos.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="titleMedium">Valor Total:</Text>
            <Text variant="titleLarge" style={styles.totalValor}>
              {formatearMoneda(totalValor)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <FlatList
        data={filteredProductos}
        renderItem={renderProducto}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarProductos}
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
  segmented: {
    marginHorizontal: 10,
    marginBottom: 10,
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
  totalValor: {
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
  info: {
    flex: 1,
  },
  codigo: {
    color: '#666',
    marginTop: 4,
  },
  agotadoText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  bajoText: {
    color: '#ff9800',
    fontWeight: 'bold',
  },
  details: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stock: {
    fontWeight: 'bold',
  },
  stockAgotado: {
    color: '#f44336',
  },
  valor: {
    fontWeight: 'bold',
    color: '#2c5f7c',
  },
});
