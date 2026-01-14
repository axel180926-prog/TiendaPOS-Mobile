import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, Card, Text, FAB, IconButton, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { db } from '@/lib/database';
import { proveedores } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export default function ProveedoresScreen() {
  const [proveedoresList, setProveedoresList] = useState<any[]>([]);
  const [filteredProveedores, setFilteredProveedores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    filtrarProveedores();
  }, [searchQuery, proveedoresList]);

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const data = await db.select().from(proveedores).where(eq(proveedores.activo, true));
      setProveedoresList(data);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      Alert.alert('Error', 'No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  const filtrarProveedores = () => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = proveedoresList.filter(p =>
        p.nombre?.toLowerCase().includes(query) ||
        p.rfc?.toLowerCase().includes(query) ||
        p.contacto?.toLowerCase().includes(query)
      );
      setFilteredProveedores(filtered);
    } else {
      setFilteredProveedores(proveedoresList);
    }
  };

  const handleEliminarProveedor = async (id: number, nombre: string) => {
    Alert.alert(
      'Eliminar Proveedor',
      `¿Está seguro de eliminar "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.update(proveedores)
                .set({ activo: false })
                .where(eq(proveedores.id, id));

              Alert.alert('Éxito', 'Proveedor eliminado');
              cargarProveedores();
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'No se pudo eliminar el proveedor');
            }
          }
        }
      ]
    );
  };

  const renderProveedor = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text variant="titleMedium" style={styles.nombre}>{item.nombre}</Text>
            {item.rfc && (
              <Text variant="bodySmall" style={styles.rfc}>RFC: {item.rfc}</Text>
            )}
            {item.productosSuministra && (
              <Chip mode="outlined" style={styles.chip} compact>
                {item.productosSuministra}
              </Chip>
            )}
          </View>
          <View style={styles.cardActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => router.push(`/proveedores/editar/${item.id}`)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleEliminarProveedor(item.id, item.nombre)}
            />
          </View>
        </View>

        <View style={styles.details}>
          {item.contacto && (
            <View style={styles.detailRow}>
              <IconButton icon="account" size={16} style={styles.icon} />
              <Text variant="bodyMedium">{item.contacto}</Text>
            </View>
          )}
          {item.telefono && (
            <View style={styles.detailRow}>
              <IconButton icon="phone" size={16} style={styles.icon} />
              <Text variant="bodyMedium">{item.telefono}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.detailRow}>
              <IconButton icon="email" size={16} style={styles.icon} />
              <Text variant="bodyMedium">{item.email}</Text>
            </View>
          )}
          {item.direccion && (
            <View style={styles.detailRow}>
              <IconButton icon="map-marker" size={16} style={styles.icon} />
              <Text variant="bodyMedium" numberOfLines={2}>{item.direccion}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <IconButton icon="truck-delivery" size={16} style={styles.icon} />
            <Text variant="bodyMedium">
              Entrega: {item.diasEntrega || 7} días • {item.formaPago || 'Efectivo'}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar proveedores..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.summary}>
        <Text variant="bodyMedium">
          Mostrando {filteredProveedores.length} de {proveedoresList.length} proveedores
        </Text>
      </View>

      <FlatList
        data={filteredProveedores}
        renderItem={renderProveedor}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarProveedores}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {searchQuery
                ? 'No se encontraron proveedores'
                : 'No hay proveedores registrados'}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Presiona el botón + para agregar uno
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/proveedores/agregar')}
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
  summary: {
    paddingHorizontal: 15,
    paddingVertical: 8,
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
  rfc: {
    color: '#666',
    marginBottom: 4,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  details: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  icon: {
    margin: 0,
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
