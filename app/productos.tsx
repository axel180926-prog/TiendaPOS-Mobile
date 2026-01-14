import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, Card, Text, Button, FAB, IconButton, Chip } from 'react-native-paper';
import { formatearMoneda } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';
import { router } from 'expo-router';

type OrdenType = 'nombre' | 'precio' | 'stock' | 'reciente' | 'ganancia';
type FiltroStock = 'todos' | 'bajo' | 'sinStock';
type FiltroRentabilidad = 'todos' | 'rentable' | 'pocoRentable' | 'noRentable';

export default function ProductosScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [ordenamiento, setOrdenamiento] = useState<OrdenType>('nombre');
  const [filtroStock, setFiltroStock] = useState<FiltroStock>('todos');
  const [filtroRentabilidad, setFiltroRentabilidad] = useState<FiltroRentabilidad>('todos');

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    filtrarProductos();
  }, [searchQuery, filterCategoria, productos, ordenamiento, filtroStock, filtroRentabilidad]);

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

    // Filtro de rentabilidad
    if (filtroRentabilidad !== 'todos') {
      filtered = filtered.filter(p => {
        const compra = p.precioCompra || 0;
        const venta = p.precioVenta || 0;
        const ganancia = venta - compra;
        const porcentaje = compra > 0 ? ((ganancia / compra) * 100) : 0;

        if (filtroRentabilidad === 'rentable') {
          return porcentaje >= 30; // Margen >= 30%
        } else if (filtroRentabilidad === 'pocoRentable') {
          return porcentaje >= 10 && porcentaje < 30; // Margen 10-30%
        } else if (filtroRentabilidad === 'noRentable') {
          return porcentaje < 10; // Margen < 10% o negativo
        }
        return true;
      });
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
      case 'ganancia':
        filtered.sort((a, b) => {
          const gananciaA = (a.precioVenta || 0) - (a.precioCompra || 0);
          const gananciaB = (b.precioVenta || 0) - (b.precioCompra || 0);
          return gananciaB - gananciaA; // Mayor a menor
        });
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

  const handleToggleActivo = async (id: number, nombre: string, activoActual: boolean) => {
    const nuevoEstado = !activoActual;
    try {
      await queries.actualizarProducto(id, { activo: nuevoEstado });
      Alert.alert(
        'Producto ' + (nuevoEstado ? 'Activado' : 'Desactivado'),
        `"${nombre}" ahora está ${nuevoEstado ? 'disponible' : 'no disponible'} para venta`
      );
      cargarProductos();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado del producto');
    }
  };

  const renderProducto = ({ item }: { item: any }) => {
    const stockBajo = (item.stock || 0) <= (item.stockMinimo || 5);
    const precioCompra = item.precioCompra || 0;
    const precioVenta = item.precioVenta || 0;
    const ganancia = precioVenta - precioCompra;
    const porcentajeGanancia = precioCompra > 0 ? ((ganancia / precioCompra) * 100) : 0;
    const activo = item.activo === true || item.activo === 1;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <View style={styles.nombreRow}>
                <Text variant="titleMedium" style={styles.nombre}>{item.nombre}</Text>
                {!activo && (
                  <Chip mode="outlined" style={styles.chipInactivo} compact textStyle={styles.chipInactivoText}>
                    Inactivo
                  </Chip>
                )}
              </View>
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
                icon={activo ? 'eye-off' : 'eye'}
                size={20}
                iconColor={activo ? '#666' : '#4caf50'}
                onPress={() => handleToggleActivo(item.id, item.nombre, activo)}
              />
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
              <Text variant="labelMedium">Precio Proveedor:</Text>
              <Text variant="bodyLarge" style={styles.precioCompra}>
                {formatearMoneda(precioCompra)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="labelMedium">Precio Venta:</Text>
              <Text variant="bodyLarge" style={styles.precioVenta}>
                {formatearMoneda(precioVenta)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="labelMedium">Ganancia:</Text>
              <Text
                variant="bodyLarge"
                style={[styles.ganancia, ganancia < 0 && styles.gananciaNegativa]}
              >
                {formatearMoneda(ganancia)}
                {precioCompra > 0 && (
                  <Text variant="bodySmall" style={styles.porcentaje}>
                    {' '}({porcentajeGanancia.toFixed(1)}%)
                  </Text>
                )}
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
              selected={ordenamiento === 'ganancia'}
              onPress={() => setOrdenamiento('ganancia')}
              style={styles.smallChip}
            >
              Ganancia
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

        <View style={styles.filterGroup}>
          <Text variant="labelSmall" style={styles.filterLabel}>Rentabilidad:</Text>
          <View style={styles.chips}>
            <Chip
              compact
              selected={filtroRentabilidad === 'todos'}
              onPress={() => setFiltroRentabilidad('todos')}
              style={styles.smallChip}
            >
              Todos
            </Chip>
            <Chip
              compact
              selected={filtroRentabilidad === 'rentable'}
              onPress={() => setFiltroRentabilidad('rentable')}
              style={styles.smallChip}
            >
              {'Rentable (≥30%)'}
            </Chip>
            <Chip
              compact
              selected={filtroRentabilidad === 'pocoRentable'}
              onPress={() => setFiltroRentabilidad('pocoRentable')}
              style={styles.smallChip}
            >
              Medio (10-30%)
            </Chip>
            <Chip
              compact
              selected={filtroRentabilidad === 'noRentable'}
              onPress={() => setFiltroRentabilidad('noRentable')}
              style={styles.smallChip}
            >
              {'Bajo (<10%)'}
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
        {filtroRentabilidad !== 'todos' && (
          <Text variant="bodySmall" style={styles.summaryNote}>
            {filtroRentabilidad === 'rentable' && '💰 Productos muy rentables (margen ≥30%)'}
            {filtroRentabilidad === 'pocoRentable' && '📊 Productos rentabilidad media (margen 10-30%)'}
            {filtroRentabilidad === 'noRentable' && '⚠️ Productos baja rentabilidad (margen <10%)'}
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
  nombreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nombre: {
    fontWeight: 'bold',
    flex: 1,
  },
  codigo: {
    color: '#666',
    marginBottom: 4,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  chipInactivo: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  chipInactivoText: {
    color: '#c62828',
    fontSize: 11,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precioCompra: {
    color: '#e65100',
    fontWeight: '600',
  },
  precioVenta: {
    color: '#2c5f7c',
    fontWeight: '600',
  },
  ganancia: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  gananciaNegativa: {
    color: '#f44336',
  },
  porcentaje: {
    color: '#666',
    fontSize: 12,
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
