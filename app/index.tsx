import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, TextInput as RNTextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Card, Text, TextInput, IconButton, Portal, Modal, FAB } from 'react-native-paper';

// Importación de expo-camera
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCartStore } from '@/lib/store/useCartStore';
import { useProductStore } from '@/lib/store/useProductStore';
import { useConfigStore } from '@/lib/store/useConfigStore';
import { useCajaStore } from '@/lib/store/useCajaStore';
import { useBarcodeScannerInput } from '@/lib/bluetooth/scanner';
import { formatearMoneda, generarFolio } from '@/lib/utils/formatters';
import { imprimirTicket } from '@/lib/bluetooth/printer';
import * as queries from '@/lib/database/queries';
import { clearDatabase } from '@/lib/database';
import { cargarProductosIniciales } from '@/lib/utils/seedData';

type FormaPago = 'efectivo' | 'tarjeta' | 'transferencia';

export default function VentasScreen() {
  const { items, total, subtotal, iva, agregarProducto, removerProducto, actualizarCantidad, limpiarCarrito } = useCartStore();
  const { obtenerProductoPorCodigoBarras, buscarProductos, cargarProductos } = useProductStore();
  const { configuracion, cargarConfiguracion } = useConfigStore();
  const { cajaActiva, cargarCajaActiva } = useCajaStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Modal de pago
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Modal de venta exitosa
  const [ventaExitosaVisible, setVentaExitosaVisible] = useState(false);
  const [ultimaVentaData, setUltimaVentaData] = useState<any>(null);

  // Scanner bluetooth
  const { scannedCode, handleKeyPress, handleTextChange, resetScannedCode } = useBarcodeScannerInput();
  const scannerInputRef = useRef<RNTextInput>(null);
  const [scannerBuffer, setScannerBuffer] = useState('');

  // Scanner de cámara
  const [cameraScannerVisible, setCameraScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Cargar caja activa y configuración al iniciar (con delay para esperar DB)
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarCajaActiva();
      cargarConfiguracion();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Procesar código escaneado
  useEffect(() => {
    if (scannedCode) {
      console.log('📱 Código escaneado por hook:', scannedCode);
      handleBarcodeScanned(scannedCode);
      resetScannedCode();
      setScannerBuffer(''); // Limpiar el buffer visual
    }
  }, [scannedCode]);

  // Mantener foco en el input del escáner SOLO cuando no hay búsqueda activa
  // DESHABILITADO: Causaba problemas con el teclado
  // useEffect(() => {
  //   // No robar el foco si el usuario está buscando
  //   if (isSearching || searchQuery.length > 0) {
  //     return;
  //   }

  //   const timer = setInterval(() => {
  //     scannerInputRef.current?.focus();
  //   }, 500);

  //   return () => clearInterval(timer);
  // }, [isSearching, searchQuery]);

  // Solicitar permisos de cámara
  const requestCameraPermission = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (result.granted) {
        setCameraScannerVisible(true);
      } else {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para escanear códigos de barras');
      }
    } else {
      setCameraScannerVisible(true);
    }
  };

  // Manejar escaneo desde cámara
  const handleCameraScan = ({ type, data }: { type: string; data: string }) => {
    setCameraScannerVisible(false);
    handleBarcodeScanned(data);
  };

  // Buscar producto por código de barras
  const handleBarcodeScanned = async (codigo: string) => {
    console.log('🔍 Buscando producto con código:', codigo);
    try {
      const producto = await obtenerProductoPorCodigoBarras(codigo);
      console.log('📦 Producto encontrado:', producto);

      if (producto) {
        // Verificar cuántos ya hay en el carrito
        const itemEnCarrito = items.find(item => item.id === producto.id);
        const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
        const stockDisponible = (producto.stock || 0) - cantidadEnCarrito;

        console.log(`📊 Stock: ${producto.stock}, En carrito: ${cantidadEnCarrito}, Disponible: ${stockDisponible}`);

        if (stockDisponible > 0) {
          agregarProducto(producto, 1);
          console.log('✅ Producto agregado al carrito');
          Alert.alert('Producto agregado', `${producto.nombre} - ${formatearMoneda(producto.precioVenta)}`);
        } else {
          console.log('❌ Sin stock disponible');
          Alert.alert(
            'Sin stock disponible',
            `El producto "${producto.nombre}" no tiene más unidades disponibles.\nStock total: ${producto.stock || 0}\nEn carrito: ${cantidadEnCarrito}`
          );
        }
      } else {
        console.log('❌ Producto NO encontrado');
        Alert.alert('Producto no encontrado', `No se encontró un producto con el código: ${codigo}`);
      }
    } catch (error) {
      console.error('❌ Error al buscar producto:', error);
      Alert.alert('Error', 'No se pudo buscar el producto');
    }
  };

  // Buscar productos por texto
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    // Si el query son solo números y tiene 8+ caracteres, probablemente es un código de barras
    const esCodigoBarras = /^\d{8,}$/.test(query);

    if (esCodigoBarras) {
      console.log('🔍 Detectado código de barras en búsqueda:', query);
      // Procesar como código de barras
      await handleBarcodeScanned(query);
      // Limpiar el campo de búsqueda
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

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

  // Manejar opciones de venta exitosa
  const handleImprimirTicket = async () => {
    if (ultimaVentaData?.ticketData) {
      try {
        await imprimirTicket(ultimaVentaData.ticketData, { imprimir: true });
        Alert.alert('Ticket impreso', 'El ticket se ha generado correctamente');
      } catch (error) {
        Alert.alert('Error', 'No se pudo imprimir el ticket');
      }
    }
  };

  const handleNuevaVenta = () => {
    setVentaExitosaVisible(false);
    setUltimaVentaData(null);
    scannerInputRef.current?.focus();
  };

  // Agregar producto desde búsqueda
  const handleAddFromSearch = (producto: any) => {
    // Verificar cuántos ya hay en el carrito
    const itemEnCarrito = items.find(item => item.id === producto.id);
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
    const stockDisponible = (producto.stock || 0) - cantidadEnCarrito;

    if (stockDisponible > 0) {
      agregarProducto(producto, 1);
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      scannerInputRef.current?.focus();
    } else {
      Alert.alert(
        'Sin stock disponible',
        `El producto "${producto.nombre}" no tiene más unidades disponibles.\nStock total: ${producto.stock || 0}\nEn carrito: ${cantidadEnCarrito}`
      );
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
    if (!cajaActiva) {
      Alert.alert(
        'Caja Cerrada',
        'Debe abrir la caja antes de realizar ventas. ¿Desea ir a Control de Caja?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Caja', onPress: () => {
            // Aquí podrías usar el router para navegar: router.push('/caja')
            Alert.alert('Info', 'Por favor, abra la caja desde el menú de Control de Caja');
          }}
        ]
      );
      return;
    }
    setPaymentModalVisible(true);
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
      // VALIDACIÓN CRÍTICA 1: Verificar que hay una caja abierta
      const cajaActual = await queries.obtenerCajaActual();
      if (!cajaActual) {
        Alert.alert(
          'Caja Cerrada',
          'No hay ninguna caja abierta. Debe abrir una caja antes de realizar ventas.',
          [
            { text: 'OK', style: 'cancel' }
          ]
        );
        setProcessingPayment(false);
        setPaymentModalVisible(false);
        return;
      }

      // VALIDACIÓN CRÍTICA 2: Verificar stock disponible antes de procesar la venta
      const ventaItems = items.map(item => ({
        productoId: item.id,
        cantidad: item.cantidad,
        precioUnitario: item.precioVenta
      }));

      const validacion = await queries.validarStockDisponible(
        ventaItems.map(item => ({
          productoId: item.productoId,
          cantidad: item.cantidad
        }))
      );

      if (!validacion.valido) {
        Alert.alert(
          'Stock Insuficiente',
          validacion.errores.join('\n'),
          [
            { text: 'OK', style: 'cancel' }
          ]
        );
        setProcessingPayment(false);
        return;
      }

      const cambio = formaPago === 'efectivo' ? parseFloat(montoRecibido) - total : 0;
      const folio = generarFolio();

      // Crear venta en la base de datos con cajaId vinculado
      const ventaData = {
        total,
        metodoPago: formaPago,
        cajaId: cajaActual.id  // CRÍTICO: Vincular con la caja abierta
      };

      await queries.crearVenta(ventaData, ventaItems);

      // Preparar datos del ticket para usar después si el usuario quiere imprimir
      const ticketData = configuracion ? {
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
      } : null;

      // Limpiar carrito y cerrar modal de pago
      limpiarCarrito();
      setPaymentModalVisible(false);
      setMontoRecibido('');
      setFormaPago('efectivo');

      // Verificar configuración de impresión automática
      const mostrarModalTicket = configuracion?.imprimirTicketAutomatico ?? true;

      if (mostrarModalTicket) {
        // Guardar datos para el modal de venta exitosa
        setUltimaVentaData({
          folio,
          total,
          formaPago,
          cambio: formaPago === 'efectivo' ? cambio : 0,
          montoRecibido: formaPago === 'efectivo' ? parseFloat(montoRecibido) : total,
          ticketData
        });

        // Mostrar modal de venta exitosa
        setVentaExitosaVisible(true);
      } else {
        // Si está desactivado, solo mostrar alert simple
        Alert.alert(
          '✅ Venta Completada',
          `Folio: ${folio}\nTotal: ${formatearMoneda(total)}\n\nLa venta se registró correctamente.`,
          [
            { text: 'OK', onPress: () => scannerInputRef.current?.focus() }
          ]
        );
      }
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
        value={scannerBuffer}
        autoFocus={false}
        showSoftInputOnFocus={false}
        keyboardType="numeric"
        onChangeText={(text) => {
          setScannerBuffer(text);
          handleTextChange(text);
        }}
        onKeyPress={handleKeyPress}
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text.trim();
          if (code && code.length > 0) {
            console.log('📱 Código escaneado por submit:', code);
            handleBarcodeScanned(code);
            setScannerBuffer('');
          }
        }}
        style={styles.hiddenInput}
      />

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <RNTextInput
          placeholder="Buscar producto o escanear código"
          value={searchQuery}
          onChangeText={handleSearch}
          onSubmitEditing={(e) => {
            const query = e.nativeEvent.text;
            const esCodigoBarras = /^\d{8,}$/.test(query);
            if (esCodigoBarras) {
              console.log('🔍 Enter presionado con código de barras:', query);
              handleBarcodeScanned(query);
              setSearchQuery('');
            }
          }}
          style={styles.searchBarNative}
          autoComplete="off"
          keyboardType="default"
          returnKeyType="search"
        />
        <IconButton
          icon="camera"
          size={28}
          mode="contained"
          onPress={requestCameraPermission}
          style={styles.cameraButton}
        />
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
                  <Text variant="titleMedium" style={styles.searchResultName}>{item.nombre}</Text>
                  <Text variant="bodySmall" style={styles.searchResultInfo}>
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
                  <Text variant="titleLarge" style={styles.productName}>{item.nombre}</Text>
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
          <View style={[styles.totalRow, styles.totalRowMain]}>
            <Text variant="headlineMedium" style={styles.totalText}>Total a pagar:</Text>
            <Text variant="headlineMedium" style={styles.totalText}>{formatearMoneda(total)}</Text>
          </View>
        </View>
        <Button
          mode="contained"
          icon="cash-register"
          onPress={handleOpenPaymentModal}
          disabled={items.length === 0}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
          labelStyle={styles.checkoutButtonLabel}
          buttonColor="#4caf50"
        >
          Cobrar
        </Button>
      </View>

      {/* Modal de escáner de cámara */}
      <Portal>
        <Modal
          visible={cameraScannerVisible}
          onDismiss={() => setCameraScannerVisible(false)}
          contentContainerStyle={styles.cameraModalContainer}
        >
          <View style={styles.cameraContainer}>
            <CameraView
              onBarcodeScanned={handleCameraScan}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
              }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.cameraOverlay}>
              <Text variant="headlineSmall" style={styles.cameraTitle}>
                Escanea el código de barras
              </Text>
              <Button
                mode="contained"
                onPress={() => setCameraScannerVisible(false)}
                style={styles.cameraCancelButton}
                icon="close"
              >
                Cancelar
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

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
              icon="cash"
              onPress={() => setFormaPago('efectivo')}
              style={styles.paymentMethodButton}
              contentStyle={styles.paymentMethodContent}
            >
              Efectivo
            </Button>
            <Button
              mode={formaPago === 'tarjeta' ? 'contained' : 'outlined'}
              icon="credit-card"
              onPress={() => setFormaPago('tarjeta')}
              style={styles.paymentMethodButton}
              contentStyle={styles.paymentMethodContent}
            >
              Tarjeta
            </Button>
            <Button
              mode={formaPago === 'transferencia' ? 'contained' : 'outlined'}
              icon="bank-transfer"
              onPress={() => setFormaPago('transferencia')}
              style={styles.paymentMethodButton}
              contentStyle={styles.paymentMethodContent}
            >
              Transfer.
            </Button>
          </View>

          {formaPago === 'efectivo' && (
            <>
              <TextInput
                label="Monto recibido"
                value={montoRecibido}
                onChangeText={setMontoRecibido}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Affix text="$" />}
                placeholder={total.toFixed(2)}
              />

              {/* Botones de montos rápidos */}
              <View style={styles.quickAmountsContainer}>
                <Text variant="labelMedium" style={styles.quickAmountsLabel}>
                  💵 Montos rápidos:
                </Text>
                <View style={styles.quickAmountsButtons}>
                  {[20, 50, 100, 200, 500].map((amount) => (
                    <Button
                      key={amount}
                      mode="contained"
                      compact
                      onPress={() => setMontoRecibido(amount.toString())}
                      style={styles.quickAmountButton}
                      labelStyle={styles.quickAmountLabel}
                      buttonColor="#4caf50"
                    >
                      ${amount}
                    </Button>
                  ))}
                  <Button
                    mode="contained"
                    compact
                    onPress={() => setMontoRecibido(total.toFixed(2))}
                    style={[styles.quickAmountButton, styles.quickAmountExact]}
                    labelStyle={styles.quickAmountLabel}
                    buttonColor="#2196f3"
                  >
                    Exacto
                  </Button>
                </View>
              </View>
            </>
          )}

          <View style={styles.modalTotalContainer}>
            <Text variant="titleLarge" style={styles.modalTotalLabel}>Total a pagar:</Text>
            <Text variant="headlineLarge" style={styles.modalTotal}>
              {formatearMoneda(total)}
            </Text>
          </View>

          {formaPago === 'efectivo' && montoRecibido && parseFloat(montoRecibido) >= total && (
            <Card style={styles.changeCard}>
              <Card.Content>
                <View style={styles.changeContent}>
                  <Text variant="titleMedium" style={styles.changeLabel}>
                    💵 CAMBIO A ENTREGAR
                  </Text>
                  <Text variant="displayMedium" style={styles.changeAmount}>
                    {formatearMoneda(Math.max(0, parseFloat(montoRecibido) - total))}
                  </Text>
                  <View style={styles.changeDetails}>
                    <Text variant="bodyMedium" style={styles.changeDetailText}>
                      Recibido: {formatearMoneda(parseFloat(montoRecibido))}
                    </Text>
                    <Text variant="bodyMedium" style={styles.changeDetailText}>
                      Total: {formatearMoneda(total)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              icon="close"
              onPress={() => setPaymentModalVisible(false)}
              style={styles.modalButton}
              contentStyle={styles.modalButtonContent}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              icon="check-bold"
              onPress={handleProcessPayment}
              loading={processingPayment}
              disabled={processingPayment}
              style={[styles.modalButton, styles.confirmButton]}
              contentStyle={styles.modalButtonContent}
            >
              Confirmar
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Modal de venta exitosa */}
      <Portal>
        <Modal
          visible={ventaExitosaVisible}
          onDismiss={() => {}}
          contentContainerStyle={styles.ventaExitosaModal}
        >
          <Card style={styles.ventaExitosaCard}>
            <Card.Content>
              <View style={styles.ventaExitosaHeader}>
                <Text variant="displaySmall" style={styles.ventaExitosaIcon}>
                  ✅
                </Text>
                <Text variant="headlineMedium" style={styles.ventaExitosaTitulo}>
                  ¡Venta Exitosa!
                </Text>
              </View>

              {ultimaVentaData && (
                <>
                  <View style={styles.ventaExitosaInfo}>
                    <View style={styles.ventaExitosaRow}>
                      <Text variant="titleMedium" style={styles.ventaExitosaLabel}>
                        Folio:
                      </Text>
                      <Text variant="titleMedium" style={styles.ventaExitosaValor}>
                        {ultimaVentaData.folio}
                      </Text>
                    </View>

                    <View style={styles.ventaExitosaRow}>
                      <Text variant="titleMedium" style={styles.ventaExitosaLabel}>
                        Total:
                      </Text>
                      <Text variant="titleLarge" style={styles.ventaExitosaTotal}>
                        {formatearMoneda(ultimaVentaData.total)}
                      </Text>
                    </View>

                    {ultimaVentaData.formaPago === 'efectivo' && (
                      <>
                        <View style={styles.ventaExitosaRow}>
                          <Text variant="bodyLarge" style={styles.ventaExitosaLabel}>
                            Recibido:
                          </Text>
                          <Text variant="bodyLarge" style={styles.ventaExitosaValor}>
                            {formatearMoneda(ultimaVentaData.montoRecibido)}
                          </Text>
                        </View>

                        <View style={[styles.ventaExitosaRow, styles.ventaExitosaCambio]}>
                          <Text variant="titleLarge" style={styles.ventaExitosaCambioLabel}>
                            💵 Cambio:
                          </Text>
                          <Text variant="displaySmall" style={styles.ventaExitosaCambioValor}>
                            {formatearMoneda(ultimaVentaData.cambio)}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  <View style={styles.ventaExitosaOpciones}>
                    <Button
                      mode="contained"
                      icon="printer"
                      onPress={handleImprimirTicket}
                      style={styles.ventaExitosaBoton}
                      buttonColor="#2196f3"
                    >
                      Imprimir Ticket
                    </Button>

                    <Button
                      mode="contained"
                      icon="cash-register"
                      onPress={handleNuevaVenta}
                      style={styles.ventaExitosaBoton}
                      buttonColor="#4caf50"
                    >
                      Nueva Venta
                    </Button>
                  </View>

                  <Button
                    mode="text"
                    onPress={handleNuevaVenta}
                    style={styles.ventaExitosaSkip}
                  >
                    Continuar sin imprimir
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8eff5'
  },
  hiddenInput: {
    position: 'absolute',
    left: -9999,
    width: 1,
    height: 1
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: '#2c5f7c',
    borderBottomWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  searchBar: {
    backgroundColor: '#fff',
    flex: 1
  },
  searchBarNative: {
    backgroundColor: '#fff',
    flex: 1,
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 17,
    color: '#1a1a1a',
    fontWeight: '500',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  cameraButton: {
    margin: 0,
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
    marginVertical: 4,
    backgroundColor: '#fff',
    elevation: 1
  },
  searchResultName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4
  },
  searchResultInfo: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600'
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 8
  },
  productCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#4caf50'
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 26,
    letterSpacing: 0.3
  },
  productPrice: {
    marginTop: 6,
    color: '#2c5f7c',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quantity: {
    marginHorizontal: 12,
    minWidth: 40,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    padding: 20,
    paddingBottom: 24,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  totalsContainer: {
    marginBottom: 16,
    backgroundColor: '#2c5f7c',
    padding: 20,
    borderRadius: 16,
    elevation: 4
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4
  },
  totalRowMain: {
    paddingTop: 0,
    marginTop: 0,
    borderTopWidth: 0
  },
  subtotalLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600'
  },
  subtotalValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700'
  },
  totalText: {
    fontWeight: '900',
    fontSize: 32,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  checkoutButton: {
    marginTop: 8,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  checkoutButtonContent: {
    paddingVertical: 16
  },
  checkoutButtonLabel: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 22,
    color: '#1a1a1a'
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20
  },
  paymentMethodButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2
  },
  paymentMethodContent: {
    paddingVertical: 8
  },
  input: {
    marginBottom: 16
  },
  quickAmountsContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f0f7f0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4caf50'
  },
  quickAmountsLabel: {
    marginBottom: 12,
    fontWeight: '700',
    color: '#2e7d32',
    fontSize: 15,
    textAlign: 'center'
  },
  quickAmountsButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center'
  },
  quickAmountButton: {
    minWidth: 90,
    borderRadius: 10,
    elevation: 3
  },
  quickAmountExact: {
    minWidth: 100
  },
  quickAmountLabel: {
    fontSize: 16,
    fontWeight: '700'
  },
  modalTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 2,
    borderTopColor: '#2c5f7c',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c5f7c'
  },
  modalTotalLabel: {
    fontWeight: '600',
    color: '#1a1a1a',
    fontSize: 16
  },
  modalTotal: {
    fontWeight: '700',
    color: '#2c5f7c',
    fontSize: 28
  },
  changeCard: {
    marginBottom: 16,
    backgroundColor: '#fff9c4',
    borderWidth: 3,
    borderColor: '#f57f17',
    elevation: 8
  },
  changeContent: {
    alignItems: 'center',
    paddingVertical: 8
  },
  changeLabel: {
    fontWeight: '700',
    color: '#e65100',
    marginBottom: 8,
    textAlign: 'center'
  },
  changeAmount: {
    fontWeight: '900',
    color: '#f57f17',
    marginBottom: 12,
    fontSize: 48
  },
  changeDetails: {
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#fbc02d',
    borderStyle: 'dashed'
  },
  changeDetailText: {
    textAlign: 'center',
    color: '#555',
    fontWeight: '600',
    marginVertical: 2
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  modalButton: {
    flex: 1,
    borderRadius: 12
  },
  modalButtonContent: {
    paddingVertical: 8
  },
  confirmButton: {
    elevation: 4
  },
  cameraModalContainer: {
    flex: 1,
    backgroundColor: 'black'
  },
  cameraContainer: {
    flex: 1
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center'
  },
  cameraTitle: {
    color: 'white',
    marginBottom: 16,
    textAlign: 'center'
  },
  cameraCancelButton: {
    backgroundColor: '#d32f2f'
  },
  ventaExitosaModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  ventaExitosaCard: {
    backgroundColor: 'transparent'
  },
  ventaExitosaHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#e8f5e9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  ventaExitosaIcon: {
    marginBottom: 12
  },
  ventaExitosaTitulo: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2e7d32',
    textAlign: 'center'
  },
  ventaExitosaInfo: {
    paddingHorizontal: 24,
    paddingVertical: 20
  },
  ventaExitosaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  ventaExitosaLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600'
  },
  ventaExitosaValor: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '700'
  },
  ventaExitosaTotal: {
    fontSize: 28,
    color: '#2c5f7c',
    fontWeight: '900'
  },
  ventaExitosaCambio: {
    backgroundColor: '#fff9c4',
    padding: 16,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f57f17',
    alignItems: 'center'
  },
  ventaExitosaCambioLabel: {
    fontSize: 16,
    color: '#e65100',
    fontWeight: '700',
    marginBottom: 8
  },
  ventaExitosaCambioValor: {
    fontSize: 36,
    color: '#f57f17',
    fontWeight: '900'
  },
  ventaExitosaOpciones: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12
  },
  ventaExitosaBoton: {
    borderRadius: 12,
    elevation: 4
  },
  ventaExitosaSkip: {
    backgroundColor: '#757575'
  }
});
