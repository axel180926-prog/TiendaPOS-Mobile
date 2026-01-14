import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, ActivityIndicator, Chip, Divider, List } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '@/lib/database';
import { compras, compraItems, proveedores, productos } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

type CompraDetalle = {
  id: number;
  folio: string | null;
  total: number;
  fecha: string | null;
  fechaEntrega: string | null;
  formaPago: string | null;
  estado: string | null;
  notas: string | null;
  proveedor: {
    nombre: string;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
  } | null;
  items: {
    id: number;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
};

export default function DetalleCompraScreen() {
  const { id } = useLocalSearchParams();
  const [compra, setCompra] = useState<CompraDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCompra();
  }, [id]);

  const cargarCompra = async () => {
    try {
      setLoading(true);

      // Cargar compra
      const compraData = await db.select().from(compras).where(eq(compras.id, Number(id)));

      if (compraData.length === 0) {
        Alert.alert('Error', 'Compra no encontrada');
        router.back();
        return;
      }

      const compraInfo = compraData[0];

      // Cargar proveedor
      const proveedorData = await db.select().from(proveedores).where(eq(proveedores.id, compraInfo.proveedorId));
      const proveedorInfo = proveedorData[0];

      // Cargar items de la compra
      const itemsData = await db.select().from(compraItems).where(eq(compraItems.compraId, Number(id)));

      // Cargar información de productos
      const productosData = await db.select().from(productos);

      // Combinar información
      const itemsConProducto = itemsData.map(item => {
        const producto = productosData.find(p => p.id === item.productoId);
        return {
          id: item.id,
          nombreProducto: producto?.nombre || 'Producto no encontrado',
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal
        };
      });

      setCompra({
        id: compraInfo.id,
        folio: compraInfo.folio,
        total: compraInfo.total,
        fecha: compraInfo.fecha,
        fechaEntrega: compraInfo.fechaEntrega,
        formaPago: compraInfo.formaPago,
        estado: compraInfo.estado,
        notas: compraInfo.notas,
        proveedor: proveedorInfo ? {
          nombre: proveedorInfo.nombre,
          telefono: proveedorInfo.telefono,
          email: proveedorInfo.email,
          direccion: proveedorInfo.direccion
        } : null,
        items: itemsConProducto
      });
    } catch (error) {
      console.error('Error al cargar compra:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la compra');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoRecibida = async () => {
    Alert.alert(
      'Marcar como Recibida',
      '¿Desea marcar esta compra como recibida? Se actualizará el inventario.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // Actualizar estado de la compra
              await db.update(compras)
                .set({
                  estado: 'recibida',
                  updatedAt: new Date().toISOString()
                })
                .where(eq(compras.id, Number(id)));

              // Actualizar inventario
              if (compra?.items) {
                for (const item of compra.items) {
                  // Obtener producto actual
                  const productoData = await db.select()
                    .from(productos)
                    .where(eq(productos.id, item.id));

                  if (productoData.length > 0) {
                    const productoActual = productoData[0];
                    const nuevoStock = (productoActual.stock || 0) + item.cantidad;

                    // Actualizar stock
                    await db.update(productos)
                      .set({ stock: nuevoStock })
                      .where(eq(productos.id, item.id));
                  }
                }
              }

              Alert.alert('Éxito', 'Compra marcada como recibida e inventario actualizado');
              cargarCompra();
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'No se pudo actualizar la compra');
            }
          }
        }
      ]
    );
  };

  const cancelarCompra = async () => {
    Alert.alert(
      'Cancelar Compra',
      '¿Está seguro de cancelar esta compra?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.update(compras)
                .set({
                  estado: 'cancelada',
                  updatedAt: new Date().toISOString()
                })
                .where(eq(compras.id, Number(id)));

              Alert.alert('Éxito', 'Compra cancelada');
              cargarCompra();
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'No se pudo cancelar la compra');
            }
          }
        }
      ]
    );
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!compra) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Compra no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            {compra.folio && (
              <Text variant="headlineSmall" style={styles.folio}>#{compra.folio}</Text>
            )}
            <Chip
              mode="flat"
              style={[styles.estadoChip, { backgroundColor: getEstadoColor(compra.estado) }]}
              textStyle={styles.estadoText}
            >
              {getEstadoLabel(compra.estado)}
            </Chip>
          </View>

          <Text variant="bodyMedium" style={styles.fecha}>
            {formatearFecha(compra.fecha)}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Proveedor" />
        <Card.Content>
          {compra.proveedor ? (
            <>
              <Text variant="titleMedium" style={styles.proveedorNombre}>
                {compra.proveedor.nombre}
              </Text>
              {compra.proveedor.telefono && (
                <Text variant="bodyMedium">📞 {compra.proveedor.telefono}</Text>
              )}
              {compra.proveedor.email && (
                <Text variant="bodyMedium">✉️ {compra.proveedor.email}</Text>
              )}
              {compra.proveedor.direccion && (
                <Text variant="bodyMedium">📍 {compra.proveedor.direccion}</Text>
              )}
            </>
          ) : (
            <Text variant="bodyMedium">No hay información del proveedor</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Detalles de la Compra" />
        <Card.Content>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>Forma de Pago:</Text>
            <Text variant="bodyMedium">{compra.formaPago}</Text>
          </View>

          {compra.fechaEntrega && (
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>Fecha de Entrega:</Text>
              <Text variant="bodyMedium">{formatearFecha(compra.fechaEntrega)}</Text>
            </View>
          )}

          {compra.notas && (
            <>
              <Divider style={styles.divider} />
              <Text variant="bodyMedium" style={styles.detailLabel}>Notas:</Text>
              <Text variant="bodyMedium">{compra.notas}</Text>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title={`Productos (${compra.items.length})`} />
        <Card.Content>
          {compra.items.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <Divider style={styles.itemDivider} />}
              <View style={styles.itemContainer}>
                <View style={styles.itemInfo}>
                  <Text variant="bodyLarge">{item.nombreProducto}</Text>
                  <Text variant="bodySmall" style={styles.itemDetails}>
                    {item.cantidad} × {formatearMoneda(item.precioUnitario)}
                  </Text>
                </View>
                <Text variant="bodyLarge" style={styles.itemSubtotal}>
                  {formatearMoneda(item.subtotal)}
                </Text>
              </View>
            </View>
          ))}

          <Divider style={styles.dividerBold} />
          <View style={styles.totalRow}>
            <Text variant="titleLarge">TOTAL:</Text>
            <Text variant="titleLarge" style={styles.totalAmount}>
              {formatearMoneda(compra.total)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {compra.estado === 'pendiente' && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={cancelarCompra}
                style={styles.button}
                icon="close"
                textColor="#F44336"
              >
                Cancelar Compra
              </Button>
              <Button
                mode="contained"
                onPress={marcarComoRecibida}
                style={styles.button}
                icon="check"
                buttonColor="#4CAF50"
              >
                Marcar Recibida
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  folio: {
    fontWeight: 'bold',
    color: '#2c5f7c',
  },
  estadoChip: {
    height: 32,
  },
  estadoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fecha: {
    color: '#666',
  },
  proveedorNombre: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemDetails: {
    color: '#666',
    marginTop: 4,
  },
  itemSubtotal: {
    fontWeight: '600',
  },
  itemDivider: {
    marginVertical: 8,
  },
  dividerBold: {
    marginVertical: 12,
    height: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#2c5f7c',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
  },
  spacer: {
    height: 20,
  },
});
