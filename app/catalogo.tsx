import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import {
  Card,
  Text,
  Chip,
  Button,
  Portal,
  Modal,
  TextInput,
  Divider,
  IconButton,
  Switch,
  SegmentedButtons
} from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { formatearMoneda } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';
import { useScannerFeedback } from '@/lib/hooks/useScannerFeedback';
import { useScannerConfigStore } from '@/lib/store/useScannerConfigStore';

export default function CatalogoScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de configuración rápida
  const [modalConfig, setModalConfig] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any>(null);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stockInicial, setStockInicial] = useState('');

  // Estados para el escáner de cámara
  const [cameraScannerVisible, setCameraScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Estados para el escáner de cámara del modal
  const [modalCameraScannerVisible, setModalCameraScannerVisible] = useState(false);
  const [modalPermission, requestModalPermission] = useCameraPermissions();
  const [modalIsScanning, setModalIsScanning] = useState(false);
  const [modalTorchOn, setModalTorchOn] = useState(false);

  // Configuración y feedback del escáner
  const scannerConfig = useScannerConfigStore();
  const { triggerScanSuccess, triggerScanError, showSuccessFlash, flashOpacity } = useScannerFeedback();

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await queries.obtenerTodosLosProductos();
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

  const obtenerProductosPorCategoria = () => {
    let filtered = productos;

    // Búsqueda por nombre o código de barras
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        p.codigoBarras?.toLowerCase().includes(query)
      );
    }

    // Filtro de categoría
    if (categoriaSeleccionada) {
      filtered = filtered.filter(p => p.categoria === categoriaSeleccionada);
    }

    return filtered;
  };

  const contarProductosCategoria = (categoria: string) => {
    return productos.filter(p => p.categoria === categoria).length;
  };

  const calcularGanancia = (compra: number, venta: number) => {
    const ganancia = venta - compra;
    const porcentaje = compra > 0 ? ((ganancia / compra) * 100) : 0;
    return { ganancia, porcentaje };
  };


  const handleAbrirConfiguracion = (producto: any) => {
    setProductoEditando(producto);
    setCodigoBarras(producto.codigoBarras || '');
    setPrecioCompra((producto.precioCompra || 0).toString());
    setPrecioVenta((producto.precioVenta || 0).toString());
    setStockInicial((producto.stock || 0).toString());
    setModalConfig(true);
  };

  const handleGuardarConfiguracion = async () => {
    if (!productoEditando) return;

    const compra = parseFloat(precioCompra);
    const venta = parseFloat(precioVenta);
    const stock = parseInt(stockInicial);

    if (!precioVenta || venta <= 0) {
      Alert.alert('Error', 'El precio de venta debe ser mayor a 0');
      return;
    }

    if (compra > venta) {
      Alert.alert(
        'Advertencia',
        'El precio de compra es mayor al precio de venta. ¿Desea continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => guardarCambios() }
        ]
      );
      return;
    }

    await guardarCambios();
  };

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
    if (isScanning) return;

    setIsScanning(true);
    handleBarcodeScanned(data);

    setTimeout(() => setIsScanning(false), 1500);
  };

  // Manejar escaneo desde cámara del modal
  const handleModalCameraScan = ({ type, data }: { type: string; data: string }) => {
    if (modalIsScanning) return;

    setModalIsScanning(true);

    // Actualizar el campo de código de barras
    setCodigoBarras(data);

    // Feedback visual/sonoro
    triggerScanSuccess();

    // Cerrar cámara después de escanear
    setTimeout(() => {
      setModalCameraScannerVisible(false);
      setModalIsScanning(false);
    }, 500);
  };

  // Abrir cámara para modal
  const handleOpenModalCamera = async () => {
    if (!modalPermission) {
      const { granted } = await requestModalPermission();
      if (granted) {
        setModalCameraScannerVisible(true);
      } else {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para escanear códigos de barras');
      }
    } else if (!modalPermission.granted) {
      const { granted } = await requestModalPermission();
      if (granted) {
        setModalCameraScannerVisible(true);
      } else {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para escanear códigos de barras');
      }
    } else {
      setModalCameraScannerVisible(true);
    }
  };

  // Cerrar cámara del modal
  const handleCloseModalCamera = () => {
    setModalCameraScannerVisible(false);
    setModalIsScanning(false);
    setModalTorchOn(false);
  };

  // Cerrar cámara y resetear estados
  const handleCloseCamera = () => {
    setCameraScannerVisible(false);
    setTorchOn(false);
  };

  // Manejar escaneo de código de barras
  const handleBarcodeScanned = async (codigo: string) => {
    try {
      const producto = await queries.obtenerProductoPorCodigoBarras(codigo);

      if (producto) {
        triggerScanSuccess();

        Alert.alert(
          'Producto Encontrado',
          `${producto.nombre}\n${formatearMoneda(producto.precioVenta)}\nStock: ${producto.stock || 0}`,
          [
            {
              text: 'Cerrar',
              style: 'cancel',
              onPress: () => {}
            },
            {
              text: 'Configurar',
              onPress: () => {
                handleCloseCamera();
                handleAbrirConfiguracion(producto);
              }
            },
            {
              text: 'Buscar',
              onPress: () => {
                handleCloseCamera();
                setSearchQuery(codigo);
              }
            }
          ]
        );
      } else {
        triggerScanError();

        Alert.alert(
          'Producto No Encontrado',
          `No existe un producto con el código: ${codigo}`,
          [
            {
              text: 'OK',
              onPress: () => {}
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error al buscar producto:', error);
      triggerScanError();
      Alert.alert('Error', 'No se pudo buscar el producto');
    }
  };

  const guardarCambios = async () => {
    if (!productoEditando) return;

    try {
      const datosActualizar: any = {
        precioCompra: parseFloat(precioCompra) || 0,
        precioVenta: parseFloat(precioVenta),
        stock: parseInt(stockInicial) || 0
      };

      // Solo actualizar código de barras si se modificó
      if (codigoBarras && codigoBarras !== productoEditando.codigoBarras) {
        datosActualizar.codigoBarras = codigoBarras.trim();
      }

      await queries.actualizarProducto(productoEditando.id, datosActualizar);

      Alert.alert('Éxito', 'Producto configurado correctamente');
      setModalConfig(false);
      cargarProductos();
    } catch (error: any) {
      console.error('Error:', error);
      if (error.message?.includes('UNIQUE')) {
        Alert.alert('Error', 'Ya existe otro producto con ese código de barras');
      } else {
        Alert.alert('Error', 'No se pudo guardar la configuración');
      }
    }
  };

  const productosCategoria = obtenerProductosPorCategoria();

  return (
    <View style={styles.container}>
      {/* Campo de búsqueda con botón de cámara */}
      {!cameraScannerVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            label="Buscar producto por nombre"
            value={searchQuery}
            onChangeText={setSearchQuery}
            mode="outlined"
            style={styles.searchInput}
            left={<TextInput.Icon icon="magnify" />}
            right={searchQuery.length > 0 ? (
              <TextInput.Icon
                icon="close"
                onPress={() => setSearchQuery('')}
              />
            ) : undefined}
          />
          <IconButton
            icon="camera"
            size={24}
            mode="contained"
            onPress={requestCameraPermission}
            style={styles.cameraButton}
            containerColor="#2c5f7c"
            iconColor="#fff"
          />
        </View>
      )}

      {/* Vista de cámara cuando está activa */}
      {cameraScannerVisible && (
        <View style={styles.cameraViewContainer}>
          <CameraView
            onBarcodeScanned={handleCameraScan}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
            }}
            enableTorch={torchOn}
            style={styles.cameraView}
          >
            {/* Marco de escaneo visual */}
            {scannerConfig.marcoEscaneoVisible && (
              <View style={styles.scanFrame}>
                <View style={styles.scanCorner} />
                <Text style={styles.scanFrameText}>Coloca el código aquí</Text>
              </View>
            )}

            {/* Flash de éxito */}
            {showSuccessFlash && (
              <Animated.View style={[styles.successFlash, { opacity: flashOpacity }]} />
            )}

            {/* Overlay superior con controles */}
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraInfo}>
                <Text variant="titleSmall" style={styles.cameraTitle}>
                  Escanear Código de Barras
                </Text>
              </View>

              <View style={styles.cameraControls}>
                {/* Botón de linterna */}
                {scannerConfig.linternaHabilitada && (
                  <IconButton
                    icon={torchOn ? "flashlight" : "flashlight-off"}
                    size={24}
                    iconColor="#fff"
                    onPress={() => setTorchOn(!torchOn)}
                    style={styles.torchButton}
                  />
                )}

                <Button
                  mode="contained"
                  onPress={handleCloseCamera}
                  icon="close"
                  compact
                  buttonColor="rgba(0,0,0,0.7)"
                >
                  Cerrar
                </Button>
              </View>
            </View>
          </CameraView>
        </View>
      )}

      {/* Categorías */}
      {!cameraScannerVisible && (
        <View style={styles.categoriasContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categorias}>
              <Chip
                selected={categoriaSeleccionada === null}
                onPress={() => setCategoriaSeleccionada(null)}
                style={styles.categoriaChip}
              >
                Todas ({productos.length})
              </Chip>
              {categorias.map((cat) => {
                const total = contarProductosCategoria(cat);
                return (
                  <Chip
                    key={cat}
                    selected={categoriaSeleccionada === cat}
                    onPress={() => setCategoriaSeleccionada(cat)}
                    style={styles.categoriaChip}
                  >
                    {cat} ({total})
                  </Chip>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Lista de productos */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {productosCategoria.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {categoriaSeleccionada
                ? `No hay productos en esta categoría`
                : searchQuery
                ? 'No se encontraron productos'
                : 'No hay productos'}
            </Text>
          </View>
        ) : (
          productosCategoria.map((producto) => {
            const compra = producto.precioCompra || 0;
            const venta = producto.precioVenta || 0;
            const { ganancia, porcentaje } = calcularGanancia(compra, venta);

            // Determinar color del stock
            const stock = producto.stock || 0;
            const stockMinimo = producto.stockMinimo || 10;
            const stockColor = stock === 0 ? '#d32f2f' : stock <= stockMinimo ? '#ff9800' : '#4caf50';

            return (
              <Card
                key={producto.id}
                style={[
                  styles.cardModerna,
                  stock === 0 && styles.cardAgotado
                ]}
                elevation={3}
              >
                <Card.Content style={styles.cardContent}>
                  {/* Header: Nombre */}
                  <View style={styles.headerRow}>
                    <Text style={styles.nombreProducto}>
                      {producto.nombre}
                    </Text>
                  </View>

                  {/* Detalles: Marca y Presentación */}
                  {(producto.marca || producto.presentacion) && (
                    <View style={styles.detallesRow}>
                      {producto.marca && (
                        <Text style={styles.detalle}>
                          🏷️ {producto.marca}
                        </Text>
                      )}
                      {producto.presentacion && (
                        <Text style={styles.detalle}>
                          📦 {producto.presentacion}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Precios y Ganancia - Diseño Compacto */}
                  <View style={styles.preciosCompactos}>
                    <View style={styles.precioItem}>
                      <Text style={styles.labelCompacto}>Venta</Text>
                      <Text style={styles.valorVentaCompacto}>
                        {formatearMoneda(venta)}
                      </Text>
                    </View>

                    <View style={styles.separadorVertical} />

                    <View style={styles.precioItem}>
                      <Text style={styles.labelCompacto}>Ganancia</Text>
                      <Text style={[
                        styles.valorGananciaCompacto,
                        ganancia < 0 && styles.gananciaNegativa
                      ]}>
                        {formatearMoneda(ganancia)}
                      </Text>
                      {compra > 0 && (
                        <Text style={styles.porcentajeCompacto}>
                          {porcentaje.toFixed(1)}%
                        </Text>
                      )}
                    </View>

                    <View style={styles.separadorVertical} />

                    <View style={styles.precioItem}>
                      <Text style={styles.labelCompacto}>Stock</Text>
                      <Text style={[
                        styles.valorStockCompacto,
                        { color: stockColor }
                      ]}>
                        {stock}
                      </Text>
                      <Text style={styles.unidadCompacta}>
                        {producto.unidadMedida || 'pzas'}
                      </Text>
                    </View>

                    <View style={styles.accionesCompactas}>
                      <IconButton
                        icon="pencil"
                        mode="contained"
                        size={20}
                        onPress={() => handleAbrirConfiguracion(producto)}
                        containerColor="#2196f3"
                        iconColor="#fff"
                        style={styles.iconButtonCompacto}
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal de configuración rápida */}
      <Portal>
        <Modal
          visible={modalConfig}
          onDismiss={() => setModalConfig(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Configurar Producto
            </Text>

            {productoEditando && (
              <>
                <Text variant="bodyMedium" style={styles.modalSubtitle}>
                  {productoEditando.nombre}
                </Text>

                <View style={styles.barcodeInputContainer}>
                  <TextInput
                    label="Código de Barras"
                    value={codigoBarras}
                    onChangeText={setCodigoBarras}
                    keyboardType="numeric"
                    mode="outlined"
                    style={[styles.input, styles.barcodeInput]}
                    left={<TextInput.Icon icon="barcode" />}
                    placeholder="Escribe o escanea el código"
                  />
                  <IconButton
                    icon="camera"
                    size={28}
                    iconColor="#2c5f7c"
                    style={styles.cameraButtonModal}
                    onPress={handleOpenModalCamera}
                  />
                </View>

                {/* Cámara de escaneo del modal */}
                {modalCameraScannerVisible && (
                  <View style={styles.modalCameraContainer}>
                    <CameraView
                      onBarcodeScanned={handleModalCameraScan}
                      barcodeScannerSettings={{
                        barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
                      }}
                      enableTorch={modalTorchOn}
                      style={styles.modalCameraView}
                    >
                      {/* Marco de escaneo visual */}
                      {scannerConfig.marcoEscaneoVisible && (
                        <View style={styles.modalScanFrame}>
                          <View style={styles.scanCorner} />
                          <Text style={styles.scanFrameText}>Coloca el código aquí</Text>
                        </View>
                      )}

                      {/* Overlay superior con controles */}
                      <View style={styles.modalCameraControls}>
                        <View style={styles.cameraInfo}>
                          <Text variant="titleSmall" style={styles.cameraTitle}>
                            Escanear Código
                          </Text>
                        </View>

                        <View style={styles.cameraControls}>
                          {/* Botón de linterna */}
                          {scannerConfig.linternaHabilitada && (
                            <IconButton
                              icon={modalTorchOn ? "flashlight" : "flashlight-off"}
                              size={24}
                              iconColor="#fff"
                              onPress={() => setModalTorchOn(!modalTorchOn)}
                              style={styles.modalCameraButton}
                            />
                          )}

                          <Button
                            mode="contained"
                            onPress={handleCloseModalCamera}
                            icon="close"
                            compact
                            buttonColor="rgba(0,0,0,0.7)"
                          >
                            Cerrar
                          </Button>
                        </View>
                      </View>
                    </CameraView>
                  </View>
                )}

                <TextInput
                  label="Precio de Compra (Proveedor)"
                  value={precioCompra}
                  onChangeText={setPrecioCompra}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Affix text="$" />}
                  right={
                    <TextInput.Icon
                      icon="information"
                      onPress={() => Alert.alert('Info', 'Precio al que compras el producto a tu proveedor')}
                    />
                  }
                />

                <TextInput
                  label="Precio de Venta (Cliente)"
                  value={precioVenta}
                  onChangeText={setPrecioVenta}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Affix text="$" />}
                  right={
                    <TextInput.Icon
                      icon="information"
                      onPress={() => Alert.alert('Info', 'Precio al que vendes el producto a tus clientes')}
                    />
                  }
                />

                <TextInput
                  label="Stock Inicial"
                  value={stockInicial}
                  onChangeText={setStockInicial}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  right={
                    <TextInput.Affix text={productoEditando.unidadMedida || 'Pieza'} />
                  }
                />

                {/* Cálculo de ganancia en tiempo real */}
                {precioCompra && precioVenta && (
                  <Card style={styles.gananciaCard}>
                    <Card.Content>
                      <View style={styles.gananciaPreview}>
                        <Text variant="labelMedium">Ganancia por unidad:</Text>
                        <Text variant="titleMedium" style={styles.gananciaValue}>
                          {formatearMoneda(parseFloat(precioVenta) - parseFloat(precioCompra))}
                        </Text>
                        <Text variant="bodySmall" style={styles.gananciaPorcentaje}>
                          {parseFloat(precioCompra) > 0
                            ? `(${(((parseFloat(precioVenta) - parseFloat(precioCompra)) / parseFloat(precioCompra)) * 100).toFixed(1)}%)`
                            : ''}
                        </Text>
                      </View>
                    </Card.Content>
                  </Card>
                )}

                <View style={styles.modalButtons}>
                  <Button onPress={() => setModalConfig(false)} style={styles.modalButton}>
                    Cancelar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleGuardarConfiguracion}
                    style={styles.modalButton}
                    loading={loading}
                  >
                    Guardar
                  </Button>
                </View>
              </>
            )}
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
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#2c5f7c',
    elevation: 8,
    borderRadius: 16,
    shadowColor: '#2c5f7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '900',
    marginBottom: 6,
    fontSize: 20,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#fff',
    opacity: 0.95,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#2c5f7c',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    elevation: 2,
    borderRadius: 12,
  },
  cameraButton: {
    margin: 0,
    elevation: 4,
  },
  filtroContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoriasContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2c5f7c',
    paddingBottom: 16,
  },
  sectionTitle: {
    marginBottom: 10,
    paddingLeft: 4,
    fontWeight: '800',
    fontSize: 15,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  categorias: {
    flexDirection: 'row',
    gap: 10,
  },
  categoriaChip: {
    marginRight: 4,
    backgroundColor: '#ffffff',
    elevation: 2,
    borderRadius: 20,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  cardModerna: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#4caf50',
  },
  cardContent: {
    padding: 10,
  },
  cardInactivo: {
    opacity: 0.65,
    borderLeftColor: '#888',
  },
  cardAgotado: {
    borderLeftColor: '#d32f2f',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nombreProducto: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.2,
    lineHeight: 26,
  },
  estadoChip: {
    height: 28,
    paddingHorizontal: 12,
    elevation: 1,
    borderRadius: 14,
  },
  estadoActivo: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
    borderWidth: 1.5,
  },
  estadoActivoText: {
    color: '#2e7d32',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  estadoInactivo: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1.5,
  },
  estadoInactivoText: {
    color: '#c62828',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  detallesRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  detalle: {
    color: '#444',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // Nuevo diseño compacto horizontal
  preciosCompactos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 5,
  },
  precioItem: {
    alignItems: 'center',
    flex: 1,
  },
  labelCompacto: {
    fontSize: 9,
    fontWeight: '600',
    color: '#888',
    marginBottom: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  valorVentaCompacto: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1976d2',
    letterSpacing: 0,
  },
  valorGananciaCompacto: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2e7d32',
    letterSpacing: 0,
  },
  gananciaNegativa: {
    color: '#d32f2f',
  },
  porcentajeCompacto: {
    fontSize: 9,
    fontWeight: '600',
    color: '#388e3c',
    marginTop: 1,
  },
  valorStockCompacto: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  unidadCompacta: {
    fontSize: 9,
    fontWeight: '600',
    color: '#999',
    marginTop: 1,
  },
  separadorVertical: {
    width: 1,
    height: 26,
    backgroundColor: '#e0e0e0',
  },
  accionesCompactas: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 6,
  },
  iconButtonCompacto: {
    margin: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  modal: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 20,
    maxHeight: '90%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalTitle: {
    marginBottom: 10,
    fontWeight: '800',
    fontSize: 22,
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    color: '#666',
    marginBottom: 24,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  gananciaCard: {
    marginBottom: 18,
    backgroundColor: '#e8f5e9',
    elevation: 2,
    borderRadius: 12,
  },
  gananciaPreview: {
    alignItems: 'center',
  },
  gananciaValue: {
    color: '#2e7d32',
    fontWeight: '800',
    marginTop: 6,
    fontSize: 20,
    letterSpacing: 0.3,
  },
  gananciaPorcentaje: {
    color: '#388e3c',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 110,
    borderRadius: 10,
  },
  cameraViewContainer: {
    height: 280,
    backgroundColor: 'black',
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cameraView: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  torchButton: {
    margin: 0,
  },
  cameraTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -60 }],
    width: 200,
    height: 120,
    borderWidth: 3,
    borderColor: '#4caf50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCorner: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4caf50',
  },
  scanFrameText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  successFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4caf50',
  },
  barcodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  barcodeInput: {
    flex: 1,
  },
  cameraButtonModal: {
    marginTop: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
  },
  modalCameraContainer: {
    height: 280,
    backgroundColor: 'black',
    position: 'relative',
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
  },
  modalCameraView: {
    flex: 1,
  },
  modalScanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -60 }],
    width: 200,
    height: 120,
    borderWidth: 3,
    borderColor: '#4caf50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCameraControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCameraButton: {
    margin: 0,
  },
});
