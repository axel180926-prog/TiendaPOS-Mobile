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
        <Card.Content style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.info}>
              <Text style={styles.nombreProducto}>{item.nombre}</Text>
              <Text style={styles.codigo}>{item.codigoBarras}</Text>
            </View>
            {agotado && (
              <Chip
                mode="flat"
                textStyle={styles.agotadoText}
                style={styles.chipAgotado}
              >
                AGOTADO
              </Chip>
            )}
            {!agotado && stockBajo && (
              <Chip
                mode="flat"
                textStyle={styles.bajoText}
                style={styles.chipBajo}
              >
                BAJO
              </Chip>
            )}
          </View>

          <View style={styles.details}>
            <View style={styles.row}>
              <Text style={styles.label}>Stock Actual:</Text>
              <Text style={[styles.stock, agotado && styles.stockAgotado]}>
                {item.stock || 0}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Stock Mínimo:</Text>
              <Text style={styles.labelValue}>{item.stockMinimo || 5}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Precio Venta:</Text>
              <Text style={styles.precioValue}>{formatearMoneda(item.precioVenta || 0)}</Text>
            </View>
            <View style={styles.rowDestacado}>
              <Text style={styles.labelDestacado}>Valor en Inventario:</Text>
              <Text style={styles.valor}>
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
    backgroundColor: '#e8eff5',
  },
  searchbar: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    elevation: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  segmented: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
    borderRadius: 12,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#2c5f7c',
    elevation: 8,
    borderRadius: 16,
    shadowColor: '#2c5f7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalValor: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.3,
  },
  list: {
    padding: 16,
  },
  card: {
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
  cardContent: {
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  info: {
    flex: 1,
  },
  nombreProducto: {
    fontWeight: '800',
    fontSize: 20,
    color: '#1a1a1a',
    letterSpacing: 0.2,
    lineHeight: 26,
  },
  codigo: {
    color: '#888',
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  chipAgotado: {
    backgroundColor: '#ffebee',
    height: 30,
    borderRadius: 15,
    elevation: 1,
  },
  agotadoText: {
    color: '#c62828',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  chipBajo: {
    backgroundColor: '#fff3e0',
    height: 30,
    borderRadius: 15,
    elevation: 1,
  },
  bajoText: {
    color: '#e65100',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  details: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowDestacado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e8eff5',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 0.3,
  },
  labelDestacado: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  labelValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c5f7c',
    letterSpacing: 0.3,
  },
  precioValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976d2',
    letterSpacing: 0.3,
  },
  stock: {
    fontWeight: '800',
    fontSize: 20,
    color: '#2c5f7c',
    letterSpacing: 0.3,
  },
  stockAgotado: {
    color: '#f44336',
  },
  valor: {
    fontWeight: '900',
    color: '#2e7d32',
    fontSize: 22,
    letterSpacing: 0.3,
  },
});
