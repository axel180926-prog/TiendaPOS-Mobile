import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { TextInput, Button, Card, SegmentedButtons, Text, Portal, Modal, List, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as queries from '@/lib/database/queries';
import { formatearMoneda } from '@/lib/utils/formatters';
import { useCallback } from 'react';

const CATEGORIAS = [
  'Abarrotes',
  'Bebidas',
  'Bebidas Alcohólicas',
  'Bebidas Calientes',
  'Bebidas Energéticas',
  'Botanas',
  'Carnes y Embutidos',
  'Cereales',
  'Condimentos',
  'Congelados',
  'Desechables',
  'Dulces',
  'Enlatados',
  'Especias y Granos',
  'Farmacia Básica',
  'Ferretería',
  'Frutas y Verduras',
  'Galletas',
  'Higiene',
  'Lácteos y Huevos',
  'Limpieza',
  'Mascotas',
  'Panadería',
  'Pan Dulce',
  'Papelería',
  'Salsas',
  'Snacks Salados',
  'Sopas',
  'Tabaquería',
  'Tortillería',
];

export default function AgregarProductoScreen() {
  const [loading, setLoading] = useState(false);
  const [categoriaSelectorVisible, setCategoriaSelectorVisible] = useState(false);
  const scannerInputRef = useRef<any>(null);
  const [scannerBuffer, setScannerBuffer] = useState('');

  // Estados para la cámara
  const [cameraScannerVisible, setCameraScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  // Campos del formulario
  const [codigoBarras, setCodigoBarras] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Abarrotes');
  const [marca, setMarca] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [sku, setSku] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stock, setStock] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [unidadMedida, setUnidadMedida] = useState('Pieza');

  const unidades = [
    { value: 'Pieza', label: 'Pieza' },
    { value: 'Kg', label: 'Kg' },
    { value: 'Litro', label: 'Litro' },
  ];

  // Función para manejar el escáner
  const handleScannerInput = (text: string) => {
    setScannerBuffer(text);
  };

  const handleBarcodeScanned = async (codigo: string) => {
    setCodigoBarras(codigo);
    setScannerBuffer('');

    // Verificar si el producto ya existe
    try {
      const existe = await queries.obtenerProductoPorCodigoBarras(codigo);
      if (existe) {
        Alert.alert(
          'Producto Existente',
          `Ya existe un producto con este código:\n\n${existe.nombre}\n${formatearMoneda(existe.precioVenta)}`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Ver Producto',
              onPress: () => router.replace(`/productos/editar/${existe.id}`)
            }
          ]
        );
      }
    } catch (error) {
      // El producto no existe, continuar
    }
  };

  const handleScanButton = () => {
    scannerInputRef.current?.focus();
    Alert.alert(
      'Escáner Activado',
      'Escanea el código de barras del producto con tu escáner USB/Bluetooth',
      [{ text: 'OK' }]
    );
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
    handleBarcodeScanned(data);

    // Resetear el flag después de 1.5 segundos
    setTimeout(() => setIsScanning(false), 1500);
  };

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

  const limpiarFormulario = useCallback(() => {
    setCodigoBarras('');
    setNombre('');
    setDescripcion('');
    setCategoria('Abarrotes');
    setMarca('');
    setPresentacion('');
    setSku('');
    setPrecioCompra('');
    setPrecioVenta('');
    setStock('');
    setStockMinimo('5');
    setUnidadMedida('Pieza');
    setScannerBuffer('');
  }, []);

  // Limpiar formulario cada vez que la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      limpiarFormulario();
    }, [limpiarFormulario])
  );

  const validarFormulario = async () => {
    // Validar código de barras
    if (!codigoBarras.trim()) {
      Alert.alert('Error', 'El código de barras es obligatorio');
      return false;
    }

    // Validar que el código no tenga caracteres especiales inválidos
    const codigoLimpio = codigoBarras.trim();
    if (!/^[0-9A-Za-z\-_]+$/.test(codigoLimpio)) {
      Alert.alert('Error', 'El código de barras solo puede contener números, letras, guiones y guiones bajos');
      return false;
    }

    // Verificar código duplicado antes de continuar
    try {
      const existe = await queries.obtenerProductoPorCodigoBarras(codigoLimpio);
      if (existe) {
        Alert.alert(
          'Error - Código Duplicado',
          `Ya existe un producto con este código de barras:\n\n"${existe.nombre}"\n\n¿Deseas ir a editarlo?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Ver Producto',
              onPress: () => router.replace(`/productos/editar/${existe.id}`)
            }
          ]
        );
        return false;
      }
    } catch (error) {
      // El producto no existe, continuar
    }

    // Validar nombre
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio');
      return false;
    }

    if (nombre.trim().length < 3) {
      Alert.alert('Error', 'El nombre debe tener al menos 3 caracteres');
      return false;
    }

    if (nombre.trim().length > 200) {
      Alert.alert('Error', 'El nombre no puede exceder 200 caracteres');
      return false;
    }

    // Validar precio de venta
    const venta = parseFloat(precioVenta);
    if (!precioVenta || isNaN(venta) || venta <= 0) {
      Alert.alert('Error', 'El precio de venta debe ser mayor a 0');
      return false;
    }

    // Límite máximo de precio de venta (100,000 pesos)
    if (venta > 100000) {
      Alert.alert('Error', 'El precio de venta no puede ser mayor a $100,000');
      return false;
    }

    // Validar precio de compra
    const compra = parseFloat(precioCompra) || 0;
    if (compra < 0) {
      Alert.alert('Error', 'El precio de compra no puede ser negativo');
      return false;
    }

    if (compra > 100000) {
      Alert.alert('Error', 'El precio de compra no puede ser mayor a $100,000');
      return false;
    }

    // Validar stock
    const stockNum = parseInt(stock);
    if (!stock || isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Error', 'El stock debe ser 0 o mayor');
      return false;
    }

    // Límite máximo de stock (999,999 unidades)
    if (stockNum > 999999) {
      Alert.alert('Error', 'El stock no puede ser mayor a 999,999 unidades');
      return false;
    }

    // Validar stock mínimo
    const stockMin = parseInt(stockMinimo);
    if (isNaN(stockMin) || stockMin < 0) {
      Alert.alert('Error', 'El stock mínimo debe ser 0 o mayor');
      return false;
    }

    if (stockMin > 10000) {
      Alert.alert('Error', 'El stock mínimo no puede ser mayor a 10,000');
      return false;
    }

    // Advertencia si stock mínimo es mayor al stock actual
    if (stockMin > stockNum) {
      const continuar = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Advertencia',
          `El stock mínimo (${stockMin}) es mayor al stock actual (${stockNum}).\n\nEsto activará alertas de stock bajo inmediatamente.\n\n¿Deseas continuar?`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Continuar', onPress: () => resolve(true) }
          ]
        );
      });
      if (!continuar) return false;
    }

    // Advertencia si precio de compra > precio de venta
    if (compra > venta) {
      const margenNegativo = ((venta - compra) / compra * 100).toFixed(1);
      const continuar = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Advertencia - Pérdida',
          `El precio de compra (${formatearMoneda(compra)}) es mayor al precio de venta (${formatearMoneda(venta)}).\n\nMargen: ${margenNegativo}%\n\nEsto resultará en PÉRDIDAS en cada venta.\n\n¿Estás seguro de continuar?`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Continuar de todas formas', style: 'destructive', onPress: () => resolve(true) }
          ]
        );
      });
      if (!continuar) return false;
    }

    // Advertencia si margen de ganancia es muy bajo (< 10%)
    if (compra > 0 && venta > compra) {
      const margen = ((venta - compra) / compra * 100);
      if (margen < 10) {
        const continuar = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Advertencia - Margen Bajo',
            `El margen de ganancia es muy bajo (${margen.toFixed(1)}%).\n\nGanancia por unidad: ${formatearMoneda(venta - compra)}\n\nSe recomienda un margen de al menos 10%.\n\n¿Deseas continuar?`,
            [
              { text: 'Ajustar Precio', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continuar', onPress: () => resolve(true) }
            ]
          );
        });
        if (!continuar) return false;
      }
    }

    return true;
  };

  const handleGuardar = async () => {
    const esValido = await validarFormulario();
    if (!esValido) return;

    try {
      setLoading(true);

      const nuevoProducto = {
        codigoBarras: codigoBarras.trim(),
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
        activo: true,
      };

      console.log('📦 Guardando producto:', nuevoProducto);
      const productoGuardado = await queries.crearProducto(nuevoProducto);
      console.log('✅ Producto guardado con ID:', productoGuardado?.id);

      // Verificar que se guardó correctamente
      const verificacion = await queries.obtenerProductoPorCodigoBarras(codigoBarras.trim());
      console.log('🔍 Verificación:', verificacion);

      if (verificacion) {
        Alert.alert(
          '✅ Producto Guardado',
          `${verificacion.nombre}\nCódigo: ${verificacion.codigoBarras}\nPrecio: ${formatearMoneda(verificacion.precioVenta)}\nStock: ${verificacion.stock}\n\nYa puedes escanearlo en el punto de venta.`,
          [
            {
              text: 'Agregar Otro',
              onPress: () => {
                limpiarFormulario();
              },
            },
            {
              text: 'Volver',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Advertencia', 'El producto se guardó pero no se pudo verificar');
        limpiarFormulario();
      }
    } catch (error: any) {
      console.error('❌ Error al guardar producto:', error);
      console.error('Stack:', error.stack);

      if (error.message?.includes('UNIQUE')) {
        Alert.alert('Error', 'Ya existe un producto con ese código de barras');
      } else if (error.message?.includes('NOT NULL')) {
        Alert.alert('Error', `Falta un campo requerido: ${error.message}`);
      } else {
        Alert.alert('Error', `No se pudo guardar el producto:\n${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Input oculto para escáner bluetooth */}
      <RNTextInput
        ref={scannerInputRef}
        value={scannerBuffer}
        onChangeText={handleScannerInput}
        showSoftInputOnFocus={false}
        keyboardType="numeric"
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text.trim();
          if (code) handleBarcodeScanned(code);
        }}
        style={styles.hiddenInput}
      />

      <Card style={styles.card}>
        <Card.Title title="📦 Información Básica" titleStyle={styles.cardTitleBold} />
        <Card.Content>
          {/* Código de Barras con botones de escanear */}
          <View style={styles.fieldWithButton}>
            <TextInput
              label="Código de Barras *"
              value={codigoBarras}
              onChangeText={setCodigoBarras}
              mode="outlined"
              style={[styles.input, styles.inputFlex]}
              keyboardType="numeric"
              placeholder="7501000110049"
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
            <IconButton
              icon="barcode-scan"
              mode="contained"
              size={28}
              onPress={handleScanButton}
              style={styles.scanButton}
              containerColor="#2196f3"
              iconColor="#fff"
            />
          </View>

          <TextInput
            label="Nombre del Producto *"
            value={nombre}
            onChangeText={setNombre}
            mode="outlined"
            style={styles.input}
            placeholder="Coca-Cola 600ml"
          />

          <TextInput
            label="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
            placeholder="Refresco de cola 600ml"
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
            placeholder="Coca-Cola"
          />

          <TextInput
            label="Presentación"
            value={presentacion}
            onChangeText={setPresentacion}
            mode="outlined"
            style={styles.input}
            placeholder="600ml"
          />

          <TextInput
            label="SKU"
            value={sku}
            onChangeText={setSku}
            mode="outlined"
            style={styles.input}
            placeholder="CC-600ML"
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, styles.cardPrecios]}>
        <Card.Title title="💰 Precios" titleStyle={styles.cardTitleBold} />
        <Card.Content>
          {/* Precio de Venta DESTACADO */}
          <TextInput
            label="Precio de Venta (al público) *"
            value={precioVenta}
            onChangeText={setPrecioVenta}
            mode="outlined"
            keyboardType="decimal-pad"
            style={[styles.input, styles.precioVentaInput, styles.precioVentaText]}
            left={<TextInput.Affix text="$" />}
            placeholder="15.00"
          />

          <TextInput
            label="Precio de Compra (proveedor)"
            value={precioCompra}
            onChangeText={setPrecioCompra}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
            left={<TextInput.Affix text="$" />}
            placeholder="9.30"
          />

          {/* GANANCIA MUY VISIBLE */}
          {precioCompra && precioVenta && (
            <Card style={styles.gananciaCardGrande}>
              <Card.Content>
                <View style={styles.gananciaRow}>
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={40}
                    color="#4caf50"
                  />
                  <View style={styles.gananciaInfo}>
                    <Text variant="labelLarge" style={styles.gananciaLabel}>
                      💰 Ganancia por unidad
                    </Text>
                    <Text variant="displaySmall" style={[
                      styles.gananciaValorGrande,
                      (parseFloat(precioVenta) - parseFloat(precioCompra)) < 0 && styles.gananciaNegativaGrande
                    ]}>
                      {formatearMoneda(parseFloat(precioVenta) - parseFloat(precioCompra))}
                    </Text>
                    {parseFloat(precioCompra) > 0 && (
                      <Text variant="titleMedium" style={styles.gananciaPorcentajeGrande}>
                        {(((parseFloat(precioVenta) - parseFloat(precioCompra)) / parseFloat(precioCompra)) * 100).toFixed(1)}% de margen
                      </Text>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Calculadora Rápida */}
          <View style={styles.calculadoraQuick}>
            <Text variant="bodyMedium" style={styles.calculadoraLabel}>
              💡 Aplicar margen de ganancia:
            </Text>
            <View style={styles.margenButtons}>
              <Button mode="outlined" compact onPress={() => aplicarMargen(20)} style={styles.margenButton}>
                +20%
              </Button>
              <Button mode="outlined" compact onPress={() => aplicarMargen(30)} style={styles.margenButton}>
                +30%
              </Button>
              <Button mode="outlined" compact onPress={() => aplicarMargen(50)} style={styles.margenButton}>
                +50%
              </Button>
              <Button mode="outlined" compact onPress={() => aplicarMargen(100)} style={styles.margenButton}>
                +100%
              </Button>
            </View>
          </View>

          <TextInput
            label="Stock Inicial *"
            value={stock}
            onChangeText={setStock}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="50"
          />

          <TextInput
            label="Stock Mínimo"
            value={stockMinimo}
            onChangeText={setStockMinimo}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="10"
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
                Escanea el código de barras del producto
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
  card: {
    margin: 10,
  },
  input: {
    marginBottom: 15,
  },
  segmented: {
    marginTop: 10,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
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
  // Nuevos estilos para mejoras
  hiddenInput: {
    position: 'absolute',
    left: -9999,
    width: 1,
    height: 1,
  },
  cardTitleBold: {
    fontWeight: '700',
    fontSize: 18,
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
  cardPrecios: {
    borderWidth: 2,
    borderColor: '#2196f3',
    backgroundColor: '#f8f9fa',
  },
  precioVentaInput: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  precioVentaText: {
    fontSize: 20,
    fontWeight: '700',
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196f3',
  },
  gananciaCardGrande: {
    backgroundColor: '#e8f5e9',
    marginVertical: 16,
    borderWidth: 3,
    borderColor: '#4caf50',
    elevation: 4,
    borderRadius: 12,
  },
  gananciaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gananciaInfo: {
    flex: 1,
  },
  gananciaLabel: {
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
  },
  gananciaValorGrande: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2e7d32',
    marginTop: 4,
  },
  gananciaNegativaGrande: {
    color: '#d32f2f',
  },
  gananciaPorcentajeGrande: {
    fontSize: 16,
    fontWeight: '600',
    color: '#388e3c',
    marginTop: 4,
  },
  calculadoraQuick: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  calculadoraLabel: {
    fontWeight: '600',
    color: '#e65100',
    marginBottom: 8,
  },
  margenButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  margenButton: {
    flex: 1,
    minWidth: 70,
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
