import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, TextInput as RNTextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Card, Text, TextInput, IconButton, Portal, Modal, FAB } from 'react-native-paper';
import { useCartStore } from '@/lib/store/useCartStore';
import { useProductStore } from '@/lib/store/useProductStore';
import { useConfigStore } from '@/lib/store/useConfigStore';
import { useBarcodeScannerInput } from '@/lib/bluetooth/scanner';
import { formatearMoneda, generarFolio } from '@/lib/utils/formatters';
import { imprimirTicket } from '@/lib/bluetooth/printer';
import * as queries from '@/lib/database/queries';
import { clearDatabase } from '@/lib/database';
import { cargarProductosIniciales } from '@/lib/utils/seedData';

type FormaPago = 'efectivo' | 'tarjeta' | 'transferencia';

export default function VentasScreen() {
  const { items, total, subtotal, iva, agregarProducto, removerProducto, actualizarCantidad, limpiarCarrito } = useCartStore();
  const { obtenerProductoPorCodigo, buscarProductos, cargarProductos } = useProductStore();
  const { configuracion } = useConfigStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Modal de pago
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Scanner bluetooth
  const { scannedCode, handleTextChange, resetScannedCode } = useBarcodeScannerInput();
  const scannerInputRef = useRef<RNTextInput>(null);

  // Procesar código escaneado
  useEffect(() => {
    if (scannedCode) {
      handleBarcodeScanned(scannedCode);
      resetScannedCode();
    }
  }, [scannedCode]);

  // Mantener foco en el input del escáner
  useEffect(() => {
    const timer = setInterval(() => {
      scannerInputRef.current?.focus();
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // Buscar producto por código de barras
  const handleBarcodeScanned = async (codigo: string) => {
    try {
      const producto = await obtenerProductoPorCodigo(codigo);

      if (producto) {
        if ((producto.stock || 0) > 0) {
          agregarProducto(producto, 1);
          Alert.alert('Producto agregado', `${producto.nombre} - ${formatearMoneda(producto.precioVenta)}`);
        } else {
          Alert.alert('Sin stock', `El producto "${producto.nombre}" no tiene stock disponible`);
        }
      } else {
        Alert.alert('Producto no encontrado', `No se encontró un producto con el código: ${codigo}`);
      }
    } catch (error) {
      console.error('Error al buscar producto:', error);
      Alert.alert('Error', 'No se pudo buscar el producto');
    }
  };

  // Buscar productos por texto
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await buscarProductos(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error al buscar:', error);
    }
  };

  // Agregar producto desde búsqueda
  const handleAddFromSearch = (producto: any) => {
    if ((producto.stock || 0) > 0) {
      agregarProducto(producto, 1);
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      scannerInputRef.current?.focus();
    } else {
      Alert.alert('Sin stock', `El producto "${producto.nombre}" no tiene stock disponible`);
    }
  };

  // Cambiar cantidad de un producto
  const handleChangeQuantity = (productoId: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      removerProducto(productoId);
    } else {
      const producto = items.find(item => item.id === productoId);
      if (producto && nuevaCantidad > (producto.stock || 0)) {
        Alert.alert('Stock insuficiente', `Solo hay ${producto.stock || 0} unidades disponibles`);
        return;
      }
      actualizarCantidad(productoId, nuevaCantidad);
    }
  };

  // Abrir modal de pago
  const handleOpenPaymentModal = () => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos para realizar una venta');
      return;
    }
    setPaymentModalVisible(true);
  };

  // FUNCIÓN TEMPORAL: Reiniciar base de datos
  const handleReiniciarBD = async () => {
    Alert.alert(
      'Reiniciar Base de Datos',
      '¿Estás seguro? Esto eliminará todos los datos y cargará los 40 productos iniciales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, reiniciar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Limpiando base de datos...');
              await clearDatabase();
              console.log('📦 Cargando productos iniciales...');
              await cargarProductosIniciales();
              console.log('🔄 Recargando productos en el store...');
              await cargarProductos();
              Alert.alert('Éxito', '¡Base de datos reiniciada! Ahora puedes buscar productos.');
            } catch (error) {
              console.error('❌ Error al reiniciar BD:', error);
              Alert.alert('Error', 'No se pudo reiniciar la base de datos');
            }
          }
        }
      ]
    );
  };

  // Procesar venta
  const handleProcessPayment = async () => {
    if (formaPago === 'efectivo') {
      const recibido = parseFloat(montoRecibido);
      if (isNaN(recibido) || recibido < total) {
        Alert.alert('Monto insuficiente', 'El monto recibido debe ser mayor o igual al total');
        return;
      }
    }

    setProcessingPayment(true);

    try {
      const cambio = formaPago === 'efectivo' ? parseFloat(montoRecibido) - total : 0;
      const folio = generarFolio();

      // Obtener caja actual (si hay una abierta)
      const cajaActual = await queries.obtenerCajaActual();

      // Crear venta en la base de datos
      const ventaData = {
        total,
        metodoPago: formaPago,
        cajaId: cajaActual?.id
      };

      const ventaItems = items.map(item => ({
        productoId: item.id,
        cantidad: item.cantidad,
        precioUnitario: item.precioVenta
      }));

      await queries.crearVenta(ventaData, ventaItems);

      // Imprimir ticket
      if (configuracion) {
        const ticketData = {
          nombreTienda: configuracion.nombreTienda || 'MI TIENDA',
          direccion: configuracion.direccion || '',
          telefono: configuracion.telefono || '',
          rfc: configuracion.rfc || undefined,
          folio,
          fecha: new Date(),
          productos: items.map(item => ({
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precioVenta,
            subtotal: item.subtotal
          })),
          subtotal,
          iva,
          total,
          formaPago,
          montoRecibido: formaPago === 'efectivo' ? parseFloat(montoRecibido) : undefined,
          cambio: formaPago === 'efectivo' ? cambio : undefined,
          mensajeFinal: configuracion.mensajeTicket || undefined
        };

        await imprimirTicket(ticketData, { imprimir: true });
      }

      // Limpiar carrito y cerrar modal
      limpiarCarrito();
      setPaymentModalVisible(false);
      setMontoRecibido('');
      setFormaPago('efectivo');

      Alert.alert(
        'Venta completada',
        formaPago === 'efectivo'
          ? `Cambio: ${formatearMoneda(cambio)}\nFolio: ${folio}`
          : `Folio: ${folio}`,
        [{ text: 'OK', onPress: () => scannerInputRef.current?.focus() }]
      );
    } catch (error) {
      console.error('Error al procesar venta:', error);
      Alert.alert('Error', 'No se pudo completar la venta');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Input oculto para escáner bluetooth */}
      <RNTextInput
        ref={scannerInputRef}
        autoFocus={true}
        showSoftInputOnFocus={false}
        onChangeText={handleTextChange}
        style={styles.hiddenInput}
      />

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          label="Buscar producto o escanear código"
          value={searchQuery}
          onChangeText={handleSearch}
          mode="outlined"
          style={styles.searchBar}
          right={<TextInput.Icon icon="barcode-scan" />}
        />
        {/* BOTÓN TEMPORAL - Eliminar después de probar */}
        <Button
          mode="outlined"
          onPress={handleReiniciarBD}
          style={{ marginTop: 8 }}
          icon="database-refresh"
        >
          Reiniciar BD (Temporal)
        </Button>
      </View>

      {/* Resultados de búsqueda */}
      {isSearching && searchResults.length > 0 && (
        <View style={styles.searchResults}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Card style={styles.searchResultCard} onPress={() => handleAddFromSearch(item)}>
                <Card.Content>
                  <Text variant="titleMedium">{item.nombre}</Text>
                  <Text variant="bodySmall">
                    {formatearMoneda(item.precioVenta)} • Stock: {item.stock}
                  </Text>
                </Card.Content>
              </Card>
            )}
          />
        </View>
      )}

      {/* Lista de productos en el carrito */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <Card style={styles.productCard}>
            <Card.Content>
              <View style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Text variant="titleMedium">{item.nombre}</Text>
                  <Text variant="bodySmall" style={styles.productPrice}>
                    {formatearMoneda(item.precioVenta)} × {item.cantidad} = {formatearMoneda(item.subtotal)}
                  </Text>
                </View>
                <View style={styles.productActions}>
                  <IconButton
                    icon="minus"
                    size={20}
                    onPress={() => handleChangeQuantity(item.id, item.cantidad - 1)}
                  />
                  <Text variant="titleLarge" style={styles.quantity}>{item.cantidad}</Text>
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={() => handleChangeQuantity(item.id, item.cantidad + 1)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#d32f2f"
                    onPress={() => removerProducto(item.id)}
                  />
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="titleLarge" style={styles.emptyText}>
              Escanea o busca productos para comenzar
            </Text>
          </View>
        }
      />

      {/* Footer con totales */}
      <View style={styles.footer}>
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text variant="bodyLarge">Subtotal:</Text>
            <Text variant="bodyLarge">{formatearMoneda(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text variant="bodyLarge">IVA (16%):</Text>
            <Text variant="bodyLarge">{formatearMoneda(iva)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text variant="displaySmall" style={styles.totalText}>Total:</Text>
            <Text variant="displaySmall" style={styles.totalText}>{formatearMoneda(total)}</Text>
          </View>
        </View>
        <Button
          mode="contained"
          onPress={handleOpenPaymentModal}
          disabled={items.length === 0}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
        >
          Cobrar
        </Button>
      </View>

      {/* Modal de pago */}
      <Portal>
        <Modal
          visible={paymentModalVisible}
          onDismiss={() => setPaymentModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>Forma de pago</Text>

          <View style={styles.paymentMethodsContainer}>
            <Button
              mode={formaPago === 'efectivo' ? 'contained' : 'outlined'}
              onPress={() => setFormaPago('efectivo')}
              style={styles.paymentMethodButton}
            >
              Efectivo
            </Button>
            <Button
              mode={formaPago === 'tarjeta' ? 'contained' : 'outlined'}
              onPress={() => setFormaPago('tarjeta')}
              style={styles.paymentMethodButton}
            >
              Tarjeta
            </Button>
            <Button
              mode={formaPago === 'transferencia' ? 'contained' : 'outlined'}
              onPress={() => setFormaPago('transferencia')}
              style={styles.paymentMethodButton}
            >
              Transferencia
            </Button>
          </View>

          {formaPago === 'efectivo' && (
            <TextInput
              label="Monto recibido"
              value={montoRecibido}
              onChangeText={setMontoRecibido}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
            />
          )}

          <View style={styles.modalTotalContainer}>
            <Text variant="headlineMedium">Total a pagar:</Text>
            <Text variant="headlineMedium" style={styles.modalTotal}>
              {formatearMoneda(total)}
            </Text>
          </View>

          {formaPago === 'efectivo' && montoRecibido && (
            <View style={styles.changeContainer}>
              <Text variant="titleLarge">Cambio:</Text>
              <Text variant="titleLarge" style={styles.changeAmount}>
                {formatearMoneda(Math.max(0, parseFloat(montoRecibido) - total))}
              </Text>
            </View>
          )}

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setPaymentModalVisible(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleProcessPayment}
              loading={processingPayment}
              disabled={processingPayment}
              style={styles.modalButton}
            >
              Confirmar venta
            </Button>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  hiddenInput: {
    position: 'absolute',
    left: -9999,
    width: 1,
    height: 1
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  searchBar: {
    backgroundColor: '#fff'
  },
  searchResults: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  searchResultCard: {
    marginHorizontal: 16,
    marginVertical: 4
  },
  listContainer: {
    padding: 16,
    flexGrow: 1
  },
  productCard: {
    marginBottom: 12,
    backgroundColor: '#fff'
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  productInfo: {
    flex: 1
  },
  productPrice: {
    marginTop: 4,
    color: '#666'
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quantity: {
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    color: '#999',
    textAlign: 'center'
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16
  },
  totalsContainer: {
    marginBottom: 16
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  totalText: {
    fontWeight: 'bold'
  },
  checkoutButton: {
    marginTop: 8
  },
  checkoutButtonContent: {
    paddingVertical: 8
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 8
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center'
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20
  },
  paymentMethodButton: {
    flex: 1
  },
  input: {
    marginBottom: 20
  },
  modalTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  modalTotal: {
    fontWeight: 'bold',
    color: '#2196F3'
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    marginBottom: 20
  },
  changeAmount: {
    fontWeight: 'bold',
    color: '#4caf50'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  modalButton: {
    flex: 1
  }
});
