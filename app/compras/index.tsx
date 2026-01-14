import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, Card, Text, FAB, IconButton, Chip, Badge } from 'react-native-paper';
import { router } from 'expo-router';
import { db } from '@/lib/database';
import { compras, proveedores } from '@/lib/database/schema';
import { eq, desc } from 'drizzle-orm';

type CompraConProveedor = {
  id: number;
  folio: string | null;
  total: number;
  fecha: string | null;
  fechaEntrega: string | null;
  formaPago: string | null;
  estado: string | null;
  notas: string | null;
  proveedor: {
    id: number;
    nombre: string;
  } | null;
};

export default function ComprasScreen() {
  const [comprasList, setComprasList] = useState<CompraConProveedor[]>([]);
  const [filteredCompras, setFilteredCompras] = useState<CompraConProveedor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'pendiente' | 'recibida' | 'cancelada'>('todas');

  useEffect(() => {
    cargarCompras();
  }, []);

  useEffect(() => {
    filtrarCompras();
  }, [searchQuery, comprasList, filtroEstado]);

  const cargarCompras = async () => {
    try {
      setLoading(true);

      // Cargar compras con información del proveedor
      const comprasData = await db.select().from(compras).orderBy(desc(compras.fecha));

      // Cargar proveedores
      const proveedoresData = await db.select().from(proveedores);

      // Combinar datos
      const comprasConProveedor: CompraConProveedor[] = comprasData.map(compra => {
        const proveedor = proveedoresData.find(p => p.id === compra.proveedorId);
        return {
          ...compra,
          proveedor: proveedor ? { id: proveedor.id, nombre: proveedor.nombre } : null
        };
      });

      setComprasList(comprasConProveedor);
    } catch (error) {
      console.error('Error al cargar compras:', error);
      Alert.alert('Error', 'No se pudieron cargar las compras');
    } finally {
      setLoading(false);
    }
  };

  const filtrarCompras = () => {
    let filtered = comprasList;

    // Filtrar por estado
    if (filtroEstado !== 'todas') {
      filtered = filtered.filter(c => c.estado === filtroEstado);
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.folio?.toLowerCase().includes(query) ||
        c.proveedor?.nombre.toLowerCase().includes(query) ||
        c.notas?.toLowerCase().includes(query)
      );
    }

    setFilteredCompras(filtered);
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      await db.update(compras)
        .set({
          estado: nuevoEstado,
          updatedAt: new Date().toISOString()
        })
        .where(eq(compras.id, id));

      Alert.alert('Éxito', 'Estado actualizado correctamente');
      cargarCompras();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const confirmarCambioEstado = (id: number, estadoActual: string | null) => {
    const opciones = [
      { text: 'Cancelar', style: 'cancel' as const },
    ];

    if (estadoActual !== 'recibida') {
      opciones.push({
        text: 'Marcar como Recibida',
        onPress: () => handleCambiarEstado(id, 'recibida')
      } as any);
    }

    if (estadoActual !== 'cancelada') {
      opciones.push({
        text: 'Cancelar Compra',
        onPress: () => handleCambiarEstado(id, 'cancelada'),
        style: 'destructive' as const
      } as any);
    }

    Alert.alert('Cambiar Estado', 'Seleccione el nuevo estado:', opciones);
  };

  const getEstadoColor = (estado: string | null) => {
    switch (estado) {
      case 'recibida': return '#4CAF50';
      case 'pendiente': return '#FF9800';
      case 'cancelada': return '#F44336';
      default: return '#999';
    }
  };

  const getEstadoLabel = (estado: string | null) => {
    switch (estado) {
      case 'recibida': return 'Recibida';
      case 'pendiente': return 'Pendiente';
      case 'cancelada': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  const renderCompra = ({ item }: { item: CompraConProveedor }) => (
    <Card style={styles.card} onPress={() => router.push(`/compras/detalle/${item.id}`)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View style={styles.folioRow}>
              {item.folio && (
                <Text variant="titleMedium" style={styles.folio}>#{item.folio}</Text>
              )}
              <Chip
                mode="flat"
                style={[styles.estadoChip, { backgroundColor: getEstadoColor(item.estado) }]}
                textStyle={styles.estadoText}
                compact
              >
                {getEstadoLabel(item.estado)}
              </Chip>
            </View>

            <Text variant="bodyLarge" style={styles.proveedor}>
              {item.proveedor?.nombre || 'Sin proveedor'}
            </Text>

            <Text variant="bodySmall" style={styles.fecha}>
              📅 {formatearFecha(item.fecha)}
            </Text>

            {item.fechaEntrega && (
              <Text variant="bodySmall" style={styles.fechaEntrega}>
                🚚 Entrega: {formatearFecha(item.fechaEntrega)}
              </Text>
            )}
          </View>

          <View style={styles.cardActions}>
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => confirmarCambioEstado(item.id, item.estado)}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text variant="titleLarge" style={styles.total}>
              {formatearMoneda(item.total)}
            </Text>
            <Text variant="bodySmall" style={styles.formaPago}>
              {item.formaPago}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const totalCompras = filteredCompras.reduce((sum, c) => sum + c.total, 0);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar por folio, proveedor..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filtros}>
        <Chip
          selected={filtroEstado === 'todas'}
          onPress={() => setFiltroEstado('todas')}
          style={styles.filtroChip}
        >
          Todas
        </Chip>
        <Chip
          selected={filtroEstado === 'pendiente'}
          onPress={() => setFiltroEstado('pendiente')}
          style={styles.filtroChip}
        >
          Pendientes
        </Chip>
        <Chip
          selected={filtroEstado === 'recibida'}
          onPress={() => setFiltroEstado('recibida')}
          style={styles.filtroChip}
        >
          Recibidas
        </Chip>
        <Chip
          selected={filtroEstado === 'cancelada'}
          onPress={() => setFiltroEstado('cancelada')}
          style={styles.filtroChip}
        >
          Canceladas
        </Chip>
      </View>

      <View style={styles.summary}>
        <Text variant="bodyMedium">
          {filteredCompras.length} compra{filteredCompras.length !== 1 ? 's' : ''} • {formatearMoneda(totalCompras)}
        </Text>
      </View>

      <FlatList
        data={filteredCompras}
        renderItem={renderCompra}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarCompras}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {searchQuery || filtroEstado !== 'todas'
                ? 'No se encontraron compras'
                : 'No hay compras registradas'}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Presiona el botón + para registrar una compra
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/compras/registrar')}
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
  filtros: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 8,
  },
  filtroChip: {
    height: 32,
  },
  summary: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  folioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  folio: {
    fontWeight: 'bold',
    color: '#2c5f7c',
  },
  estadoChip: {
    height: 24,
  },
  estadoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  proveedor: {
    fontWeight: '600',
    marginBottom: 4,
  },
  fecha: {
    color: '#666',
    marginBottom: 2,
  },
  fechaEntrega: {
    color: '#666',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontWeight: 'bold',
    color: '#2c5f7c',
  },
  formaPago: {
    color: '#666',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#ccc',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2c5f7c',
  },
});
