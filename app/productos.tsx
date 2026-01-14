import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, Card, Text, Button, FAB, IconButton, Chip } from 'react-native-paper';
import { formatearMoneda } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';
import { router } from 'expo-router';

type OrdenType = 'nombre' | 'precio' | 'stock' | 'reciente';
type FiltroStock = 'todos' | 'bajo' | 'sinStock';

export default function ProductosScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [ordenamiento, setOrdenamiento] = useState<OrdenType>('nombre');
  const [filtroStock, setFiltroStock] = useState<FiltroStock>('todos');

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    filtrarProductos();
  }, [searchQuery, filterCategoria, productos, ordenamiento, filtroStock]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await queries.obtenerProductos();
      setProductos(data);

      // Extraer categorías únicas
      const cats = [...new Set(data.map(p => p.categoria).filter(Boolean))];
      setCategorias(cats as string[]);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const filtrarProductos = () => {
    let filtered = [...productos];

    // Filtro de búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre?.toLowerCase().includes(query) ||
        p.codigoBarras?.includes(query) ||
        p.categoria?.toLowerCase().includes(query) ||
        p.marca?.toLowerCase().includes(query)
      );
    }

    // Filtro de categoría
    if (filterCategoria) {
      filtered = filtered.filter(p => p.categoria === filterCategoria);
    }

    // Filtro de stock
    if (filtroStock === 'bajo') {
      filtered = filtered.filter(p => (p.stock || 0) <= (p.stockMinimo || 5) && (p.stock || 0) > 0);
    } else if (filtroStock === 'sinStock') {
      filtered = filtered.filter(p => (p.stock || 0) === 0);
    }

    // Ordenamiento
    switch (ordenamiento) {
      case 'nombre':
        filtered.sort((a, b) => a.nombre?.localeCompare(b.nombre));
        break;
      case 'precio':
        filtered.sort((a, b) => (b.precioVenta || 0) - (a.precioVenta || 0));
        break;
      case 'stock':
        filtered.sort((a, b) => (a.stock || 0) - (b.stock || 0));
        break;
      case 'reciente':
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    setFilteredProductos(filtered);
  };

  const handleEliminarProducto = async (id: number, nombre: string) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Está seguro de eliminar "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await queries.eliminarProducto(id);
              Alert.alert('Éxito', 'Producto eliminado');
              cargarProductos();
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  const renderProducto = ({ item }: { item: any }) => {
    const stockBajo = (item.stock || 0) <= (item.stockMinimo || 5);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text variant="titleMedium" style={styles.nombre}>{item.nombre}</Text>
              <Text variant="bodySmall" style={styles.codigo}>
                Código: {item.codigoBarras}
              </Text>
              {item.categoria && (
                <Chip mode="outlined" style={styles.chip} compact>
                  {item.categoria}
                </Chip>
              )}
            </View>
            <View style={styles.cardActions}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => router.push(`/productos/editar/${item.id}`)}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleEliminarProducto(item.id, item.nombre)}
              />
            </View>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text variant="labelMedium">Precio:</Text>
              <Text variant="bodyLarge" style={styles.precio}>
                {formatearMoneda(item.precioVenta || 0)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="labelMedium">Stock:</Text>
              <Text
                variant="bodyLarge"
                style={[styles.stock, stockBajo && styles.stockBajo]}
              >
                {item.stock || 0} {item.unidadMedida || 'pzas'}
                {stockBajo && ' ⚠️'}
              </Text>
            </View>
            {item.marca && (
              <View style={styles.detailRow}>
                <Text variant="labelMedium">Marca:</Text>
                <Text variant="bodyMedium">{item.marca}</Text>
              </View>
            )}
            {item.presentacion && (
              <View style={styles.detailRow}>
                <Text variant="labelMedium">Presentación:</Text>
                <Text variant="bodyMedium">{item.presentacion}</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar productos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Filtros de categoría */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categorias}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categories}
          renderItem={({ item }) => (
            <Chip
              selected={filterCategoria === item}
              onPress={() => setFilterCategoria(filterCategoria === item ? null : item)}
              style={styles.categoryChip}
            >
              {item}
            </Chip>
          )}
        />
      </View>

      {/* Filtros adicionales */}
      <View style={styles.filtersRow}>
        <View style={styles.filterGroup}>
          <Text variant="labelSmall" style={styles.filterLabel}>Ordenar:</Text>
          <View style={styles.chips}>
            <Chip
              compact
              selected={ordenamiento === 'nombre'}
              onPress={() => setOrdenamiento('nombre')}
              style={styles.smallChip}
            >
              A-Z
            </Chip>
            <Chip
              compact
              selected={ordenamiento === 'precio'}
              onPress={() => setOrdenamiento('precio')}
              style={styles.smallChip}
            >
              Precio
            </Chip>
            <Chip
              compact
              selected={ordenamiento === 'stock'}
              onPress={() => setOrdenamiento('stock')}
              style={styles.smallChip}
            >
              Stock
            </Chip>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text variant="labelSmall" style={styles.filterLabel}>Stock:</Text>
          <View style={styles.chips}>
            <Chip
              compact
              selected={filtroStock === 'todos'}
              onPress={() => setFiltroStock('todos')}
              style={styles.smallChip}
            >
              Todos
            </Chip>
            <Chip
              compact
              selected={filtroStock === 'bajo'}
              onPress={() => setFiltroStock('bajo')}
              style={styles.smallChip}
            >
              Bajo
            </Chip>
            <Chip
              compact
              selected={filtroStock === 'sinStock'}
              onPress={() => setFiltroStock('sinStock')}
              style={styles.smallChip}
            >
              Sin stock
            </Chip>
          </View>
        </View>
      </View>

      {/* Resumen */}
      <View style={styles.summary}>
        <Text variant="bodyMedium">
          Mostrando {filteredProductos.length} de {productos.length} productos
        </Text>
        {filtroStock !== 'todos' && (
          <Text variant="bodySmall" style={styles.summaryNote}>
            {filtroStock === 'bajo' && '⚠️ Productos con stock bajo'}
            {filtroStock === 'sinStock' && '❌ Productos sin stock'}
          </Text>
        )}
      </View>

      {/* Lista de productos */}
      <FlatList
        data={filteredProductos}
        renderItem={renderProducto}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarProductos}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {searchQuery || filterCategoria
                ? 'No se encontraron productos'
                : 'No hay productos registrados'}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/productos/agregar')}
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
    elevation: 2,
  },
  categoriesContainer: {
    paddingHorizontal: 10,
  },
  categories: {
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  filtersRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 12,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    paddingLeft: 4,
    opacity: 0.7,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  smallChip: {
    height: 32,
  },
  summary: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  summaryNote: {
    color: '#666',
    marginTop: 4,
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
  },
  nombre: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  codigo: {
    color: '#666',
    marginBottom: 4,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precio: {
    color: '#2c5f7c',
    fontWeight: 'bold',
  },
  stock: {
    fontWeight: '600',
  },
  stockBajo: {
    color: '#f44336',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2c5f7c',
  },
});
