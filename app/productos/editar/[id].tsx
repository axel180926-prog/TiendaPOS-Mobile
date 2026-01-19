import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Card, SegmentedButtons, ActivityIndicator, Text, Portal, Modal, List, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as queries from '@/lib/database/queries';
import { formatearMoneda } from '@/lib/utils/formatters';

const CATEGORIAS = [
  'Bebidas',
  'Botanas',
  'Abarrotes',
  'Panadería',
  'Galletas',
  'Dulces',
  'Sopas',
  'Condimentos',
  'Limpieza',
  'Lácteos y Huevos',
  'Enlatados',
  'Salsas',
  'Bebidas Calientes',
  'Higiene',
];

export default function EditarProductoScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [categoriaSelectorVisible, setCategoriaSelectorVisible] = useState(false);

  // Estados para la cámara
  const [cameraScannerVisible, setCameraScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  // Campos del formulario
  const [codigoBarras, setCodigoBarras] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [sku, setSku] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stock, setStock] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Pieza');

  const unidades = [
    { value: 'Pieza', label: 'Pieza' },
    { value: 'Kg', label: 'Kg' },
    { value: 'Litro', label: 'Litro' },
  ];

  // Función para aplicar margen de ganancia
  const aplicarMargen = (porcentaje: number) => {
    if (!precioCompra) {
      Alert.alert('Aviso', 'Primero ingresa el precio de compra');
      return;
    }
    const compra = parseFloat(precioCompra);
    const venta = compra * (1 + porcentaje / 100);
    setPrecioVenta(venta.toFixed(2));
  };

  useEffect(() => {
    cargarProducto();
  }, [id]);

  const cargarProducto = async () => {
    try {
      setCargando(true);
      const producto = await queries.obtenerProductoPorId(Number(id));

      if (!producto) {
        Alert.alert('Error', 'Producto no encontrado');
        router.back();
        return;
      }

      setCodigoBarras(producto.codigoBarras || '');
      setNombre(producto.nombre || '');
      setDescripcion(producto.descripcion || '');
      setCategoria(producto.categoria || '');
      setMarca(producto.marca || '');
      setPresentacion(producto.presentacion || '');
      setSku(producto.sku || '');
      setPrecioCompra(producto.precioCompra?.toString() || '0');
      setPrecioVenta(producto.precioVenta?.toString() || '');
      setStock(producto.stock?.toString() || '');
      setStockMinimo(producto.stockMinimo?.toString() || '');
      setUnidadMedida(producto.unidadMedida || 'Pieza');
    } catch (error) {
      console.error('Error al cargar producto:', error);
      Alert.alert('Error', 'No se pudo cargar el producto');
    } finally {
      setCargando(false);
    }
  };

  const validarFormulario = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return false;
    }
    if (!precioVenta || parseFloat(precioVenta) <= 0) {
      Alert.alert('Error', 'El precio de venta debe ser mayor a 0');
      return false;
    }
    if (!stock || parseInt(stock) < 0) {
      Alert.alert('Error', 'El stock debe ser 0 o mayor');
      return false;
    }

    const compra = parseFloat(precioCompra) || 0;
    const venta = parseFloat(precioVenta);
    if (compra > venta) {
      return new Promise((resolve) => {
        Alert.alert(
          'Advertencia',
          'El precio de compra es mayor al precio de venta. Esto resultará en pérdidas. ¿Desea continuar?',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Continuar', onPress: () => resolve(true) }
          ]
        );
      });
    }
    return true;
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
    // Prevenir escaneos duplicados
    if (isScanning) return;

    setIsScanning(true);
    setCameraScannerVisible(false);
    setCodigoBarras(data);

    // Resetear el flag después de 1.5 segundos
    setTimeout(() => setIsScanning(false), 1500);
  };

  const handleGuardar = async () => {
    const esValido = await validarFormulario();
    if (!esValido) return;

    try {
      setLoading(true);

      const datosActualizados = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        categoria: categoria || undefined,
        marca: marca.trim() || undefined,
        presentacion: presentacion.trim() || undefined,
        sku: sku.trim() || undefined,
        precioCompra: parseFloat(precioCompra) || 0,
        precioVenta: parseFloat(precioVenta),
        stock: parseInt(stock),
        stockMinimo: parseInt(stockMinimo),
        unidadMedida: unidadMedida,
      };

      await queries.actualizarProducto(Number(id), datosActualizados);

      Alert.alert('Éxito', 'Producto actualizado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Información Básica" />
        <Card.Content>
          {/* Código de Barras con botón de escanear */}
          <View style={styles.fieldWithButton}>
            <TextInput
              label="Código de Barras"
              value={codigoBarras}
              onChangeText={setCodigoBarras}
              mode="outlined"
              style={[styles.input, styles.inputFlex]}
              keyboardType="numeric"
            />
            <IconButton
              icon="camera"
              mode="contained"
              size={28}
              onPress={requestCameraPermission}
              style={styles.scanButton}
              containerColor="#4caf50"
              iconColor="#fff"
            />
          </View>

          <TextInput
            label="Nombre del Producto *"
            value={nombre}
            onChangeText={setNombre}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
          />

          <TouchableOpacity onPress={() => setCategoriaSelectorVisible(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Categoría"
                value={categoria}
                mode="outlined"
                style={styles.input}
                right={<TextInput.Icon icon="chevron-down" />}
                editable={false}
              />
            </View>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Detalles del Producto" />
        <Card.Content>
          <TextInput
            label="Marca"
            value={marca}
            onChangeText={setMarca}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Presentación"
            value={presentacion}
            onChangeText={setPresentacion}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="SKU"
            value={sku}
            onChangeText={setSku}
            mode="outlined"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Precio y Stock" />
        <Card.Content>
          <TextInput
            label="Precio de Compra (Proveedor)"
            value={precioCompra}
            onChangeText={setPrecioCompra}
            mode="outlined"
            keyboardType="decimal-pad"
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
            label="Precio de Venta (Cliente) *"
            value={precioVenta}
            onChangeText={setPrecioVenta}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
            left={<TextInput.Affix text="$" />}
            right={
              <TextInput.Icon
                icon="information"
                onPress={() => Alert.alert('Info', 'Precio al que vendes el producto a tus clientes')}
              />
            }
          />

          {/* Cálculo de ganancia */}
          {precioCompra && precioVenta && (
            <Card style={styles.gananciaCard}>
              <Card.Content>
                <View style={styles.gananciaContainer}>
                  <Text variant="labelMedium">Ganancia por unidad:</Text>
                  <Text variant="titleMedium" style={[
                    styles.gananciaValue,
                    (parseFloat(precioVenta) - parseFloat(precioCompra)) < 0 && styles.gananciaNegativa
                  ]}>
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

          <TextInput
            label="Stock Actual *"
            value={stock}
            onChangeText={setStock}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Stock Mínimo"
            value={stockMinimo}
            onChangeText={setStockMinimo}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <SegmentedButtons
            value={unidadMedida}
            onValueChange={setUnidadMedida}
            buttons={unidades}
            style={styles.segmented}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.button}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleGuardar}
              style={styles.button}
              loading={loading}
              icon="content-save"
            >
              Guardar
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.spacer} />

      {/* Modal de Selección de Categoría */}
      <Portal>
        <Modal
          visible={categoriaSelectorVisible}
          onDismiss={() => setCategoriaSelectorVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Title title="Seleccionar Categoría" />
            <Card.Content>
              <ScrollView style={styles.modalScrollView}>
                {CATEGORIAS.map((cat) => (
                  <List.Item
                    key={cat}
                    title={cat}
                    onPress={() => {
                      setCategoria(cat);
                      setCategoriaSelectorVisible(false);
                    }}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={categoria === cat ? 'check-circle' : 'circle-outline'}
                        color={categoria === cat ? '#4caf50' : '#999'}
                      />
                    )}
                    style={categoria === cat ? styles.selectedItem : undefined}
                  />
                ))}
              </ScrollView>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setCategoriaSelectorVisible(false)}>
                Cerrar
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>

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
                Escanea el nuevo código de barras
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
  input: {
    marginBottom: 15,
  },
  segmented: {
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
  },
  gananciaCard: {
    marginBottom: 15,
    backgroundColor: '#e8f5e9',
  },
  gananciaContainer: {
    alignItems: 'center',
  },
  gananciaValue: {
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  gananciaNegativa: {
    color: '#f44336',
  },
  gananciaPorcentaje: {
    color: '#2e7d32',
  },
  spacer: {
    height: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  selectedItem: {
    backgroundColor: '#e8f5e9',
  },
  fieldWithButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 15,
  },
  inputFlex: {
    flex: 1,
    marginBottom: 0,
  },
  scanButton: {
    marginTop: 8,
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
});
