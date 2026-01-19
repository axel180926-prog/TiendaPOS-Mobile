import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Text, Chip, Searchbar, IconButton, Portal, Modal, Divider, Button } from 'react-native-paper';
import { formatearMoneda, formatearFecha } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';

type FiltroMetodoPago = 'todos' | 'efectivo' | 'tarjeta' | 'transferencia';
type OrdenType = 'reciente' | 'antiguo' | 'mayorMonto' | 'menorMonto';

export default function HistorialScreen() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [filteredVentas, setFilteredVentas] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Filtros
  const [filtroMetodoPago, setFiltroMetodoPago] = useState<FiltroMetodoPago>('todos');
  const [ordenamiento, setOrdenamiento] = useState<OrdenType>('reciente');
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);

  // Modal de detalle
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detallesVenta, setDetallesVenta] = useState<any[]>([]);

  useEffect(() => {
    cargarVentas();
  }, []);

  useEffect(() => {
    filtrarYOrdenarVentas();
  }, [searchQuery, ventas, filtroMetodoPago, ordenamiento, fechaInicio, fechaFin]);

  const filtrarYOrdenarVentas = () => {
    let filtered = [...ventas];

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.id.toString().includes(query) ||
        formatearMoneda(v.total).includes(searchQuery) ||
        v.metodoPago?.toLowerCase().includes(query)
      );
    }

    // Filtro por método de pago
    if (filtroMetodoPago !== 'todos') {
      filtered = filtered.filter(v => v.metodoPago === filtroMetodoPago);
    }

    // Filtro por rango de fechas
    if (fechaInicio && fechaFin) {
      filtered = filtered.filter(v => {
        if (!v.fecha) return false;
        const fechaVenta = new Date(v.fecha);
        return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
      });
    }

    // Ordenamiento
    switch (ordenamiento) {
      case 'reciente':
        filtered.sort((a, b) => {
          const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
          const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'antiguo':
        filtered.sort((a, b) => {
          const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
          const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'mayorMonto':
        filtered.sort((a, b) => (b.total || 0) - (a.total || 0));
        break;
      case 'menorMonto':
        filtered.sort((a, b) => (a.total || 0) - (b.total || 0));
        break;
    }

    setFilteredVentas(filtered);
  };

  const cargarVentas = async () => {
    try {
      setLoading(true);
      const data = await queries.obtenerVentas(500);
      setVentas(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = async (venta: any) => {
    try {
      const detalles = await queries.obtenerDetallesVenta(venta.id);
      setDetallesVenta(detalles);
      setVentaSeleccionada(venta);
      setModalVisible(true);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles de la venta');
    }
  };

  const handleCancelarVenta = () => {
    if (!ventaSeleccionada) return;

    Alert.alert(
      'Cancelar Venta',
      `¿Está seguro de cancelar la venta #${ventaSeleccionada.id}?\n\nEsto devolverá el stock de los productos y, si fue en efectivo, registrará un retiro de caja.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const resultado = await queries.revertirVenta(ventaSeleccionada.id, 'Cancelación manual desde historial');

              if (resultado.exito) {
                Alert.alert('Éxito', resultado.mensaje);
                setModalVisible(false);
                cargarVentas();
              }
            } catch (error: any) {
              console.error('Error al cancelar venta:', error);
              Alert.alert('Error', error.message || 'No se pudo cancelar la venta');
            }
          }
        }
      ]
    );
  };

  const aplicarFiltroFecha = (tipo: 'hoy' | 'ayer' | 'semana' | 'mes') => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    switch (tipo) {
      case 'hoy':
        setFechaInicio(hoy);
        setFechaFin(fin);
        break;
      case 'ayer':
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        const ayerFin = new Date(ayer);
        ayerFin.setHours(23, 59, 59, 999);
        setFechaInicio(ayer);
        setFechaFin(ayerFin);
        break;
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(inicioSemana.getDate() - 7);
        setFechaInicio(inicioSemana);
        setFechaFin(fin);
        break;
      case 'mes':
        const inicioMes = new Date(hoy);
        inicioMes.setDate(inicioMes.getDate() - 30);
        setFechaInicio(inicioMes);
        setFechaFin(fin);
        break;
    }
  };

  const limpiarFiltros = () => {
    setFiltroMetodoPago('todos');
    setFechaInicio(null);
    setFechaFin(null);
    setSearchQuery('');
    setOrdenamiento('reciente');
  };

  const renderVenta = ({ item }: { item: any }) => {
    const getMetodoPagoIcon = (metodo: string) => {
      switch (metodo) {
        case 'efectivo': return '💵';
        case 'tarjeta': return '💳';
        case 'transferencia': return '📱';
        default: return '💰';
      }
    };

    const getMetodoPagoColor = (metodo: string) => {
      switch (metodo) {
        case 'efectivo': return '#4caf50';
        case 'tarjeta': return '#2196F3';
        case 'transferencia': return '#FF9800';
        default: return '#999';
      }
    };

    return (
      <TouchableOpacity onPress={() => handleVerDetalle(item)} activeOpacity={0.7}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={[styles.metodoPagoIndicator, { backgroundColor: getMetodoPagoColor(item.metodoPago) }]} />

            <View style={styles.cardBody}>
              <View style={styles.ventaHeader}>
                <View style={styles.ventaNumber}>
                  <Text variant="labelSmall" style={styles.ventaLabel}>VENTA</Text>
                  <Text variant="headlineSmall" style={styles.ventaId}>#{item.id}</Text>
                </View>
                <View style={styles.ventaTotalContainer}>
                  <Text variant="displayMedium" style={styles.ventaTotal}>
                    {formatearMoneda(item.total || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.ventaFooter}>
                <View style={styles.metodoPagoTag}>
                  <Text style={styles.metodoPagoIcon}>{getMetodoPagoIcon(item.metodoPago)}</Text>
                  <Text variant="labelMedium" style={[styles.metodoPagoText, { color: getMetodoPagoColor(item.metodoPago) }]}>
                    {(item.metodoPago || 'N/A').toUpperCase()}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.ventaFecha}>
                  {formatearFecha(item.fecha).split(' ')[0]}
                </Text>
              </View>
            </View>

            <IconButton
              icon="chevron-right"
              size={24}
              iconColor="#2c5f7c"
              style={styles.chevron}
              onPress={() => handleVerDetalle(item)}
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const totalVentas = filteredVentas.reduce((sum, v) => sum + (v.total || 0), 0);
  const totalProductosVendidos = detallesVenta.reduce((sum, d) => sum + (d.cantidad || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header con búsqueda moderna */}
      <View style={styles.headerContainer}>
        <Searchbar
          placeholder="Buscar por número o monto..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#2c5f7c"
          placeholderTextColor="#888"
        />
      </View>

      {/* Resumen de ventas con diseño moderno */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text variant="labelLarge" style={styles.summaryLabel}>
                📊 Total Ventas
              </Text>
              <Text variant="displaySmall" style={styles.summaryValue}>
                {filteredVentas.length}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text variant="labelLarge" style={styles.summaryLabel}>
                💰 Monto Total
              </Text>
              <Text variant="displaySmall" style={styles.summaryTotal}>
                {formatearMoneda(totalVentas)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Lista de ventas */}
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
              {searchQuery || filtroMetodoPago !== 'todos' || fechaInicio
                ? 'No se encontraron ventas con los filtros aplicados'
                : 'No hay ventas registradas'}
            </Text>
          </View>
        }
      />

      {/* Modal de detalle de venta */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text variant="headlineSmall">Venta #{ventaSeleccionada?.id}</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setModalVisible(false)}
              />
            </View>

            <Divider />

            {/* Información de la venta */}
            <View style={styles.modalSection}>
              <View style={styles.modalRow}>
                <Text variant="bodyMedium">Fecha:</Text>
                <Text variant="bodyMedium">
                  {formatearFecha(ventaSeleccionada?.fecha)}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text variant="bodyMedium">Método de pago:</Text>
                <Chip mode="outlined" style={styles.chipSmall}>
                  {ventaSeleccionada?.metodoPago || 'N/A'}
                </Chip>
              </View>
              <View style={styles.modalRow}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Total:</Text>
                <Text variant="titleLarge" style={styles.modalTotal}>
                  {formatearMoneda(ventaSeleccionada?.total || 0)}
                </Text>
              </View>
            </View>

            <Divider />

            {/* Productos de la venta */}
            <View style={styles.modalSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Productos ({detallesVenta.length})
              </Text>
              {detallesVenta.map((detalle, index) => (
                <View key={index} style={styles.productoRow}>
                  <View style={styles.productoInfo}>
                    <Text variant="bodyMedium">{detalle.producto?.nombre || 'Producto eliminado'}</Text>
                    <Text variant="bodySmall" style={styles.productoDetalle}>
                      {formatearMoneda(detalle.precioUnitario)} × {detalle.cantidad}
                    </Text>
                  </View>
                  <Text variant="bodyLarge" style={styles.productoSubtotal}>
                    {formatearMoneda(detalle.precioUnitario * detalle.cantidad)}
                  </Text>
                </View>
              ))}

              <Divider style={styles.dividerSmall} />

              <View style={styles.totalRow}>
                <Text variant="bodyMedium">Total productos:</Text>
                <Text variant="bodyLarge">{totalProductosVendidos} unidades</Text>
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              >
                Cerrar
              </Button>
              <Button
                mode="contained"
                onPress={handleCancelarVenta}
                style={[styles.modalButton, styles.buttonCancel]}
                buttonColor="#f44336"
              >
                Cancelar Venta
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8eff5',
  },
  headerContainer: {
    backgroundColor: '#2c5f7c',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  searchbar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    backgroundColor: '#fff',
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryDivider: {
    width: 2,
    height: 60,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  summaryLabel: {
    color: '#666',
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: '#2c5f7c',
    fontWeight: '900',
    fontSize: 36,
  },
  summaryTotal: {
    color: '#4caf50',
    fontWeight: '900',
    fontSize: 32,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 14,
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    position: 'relative',
  },
  metodoPagoIndicator: {
    width: 6,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingLeft: 24,
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ventaNumber: {
    flex: 1,
  },
  ventaLabel: {
    color: '#888',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  ventaId: {
    color: '#1a1a1a',
    fontWeight: '900',
    fontSize: 24,
  },
  ventaTotalContainer: {
    alignItems: 'flex-end',
  },
  ventaTotal: {
    color: '#2c5f7c',
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: 0.5,
  },
  ventaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  metodoPagoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  metodoPagoIcon: {
    fontSize: 16,
  },
  metodoPagoText: {
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  ventaFecha: {
    color: '#888',
    fontWeight: '600',
    fontSize: 13,
  },
  chevron: {
    margin: 0,
    marginRight: 8,
  },
  chipSmall: {
    height: 28,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 24,
    maxHeight: '90%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalSection: {
    padding: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTotal: {
    color: '#2c5f7c',
    fontWeight: '900',
    fontSize: 24,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 16,
    fontSize: 18,
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  productoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productoInfo: {
    flex: 1,
  },
  productoDetalle: {
    color: '#888',
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  productoSubtotal: {
    fontWeight: '800',
    fontSize: 16,
    color: '#2c5f7c',
  },
  dividerSmall: {
    marginVertical: 16,
    height: 2,
    backgroundColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
  },
  buttonCancel: {
    backgroundColor: '#e53935',
  },
});
