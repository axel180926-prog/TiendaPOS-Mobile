import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import * as queries from '@/lib/database/queries';

export default function EditarProductoScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Campos del formulario
  const [codigoBarras, setCodigoBarras] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [sku, setSku] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Pieza');

  const unidades = [
    { value: 'Pieza', label: 'Pieza' },
    { value: 'Kg', label: 'Kg' },
    { value: 'Litro', label: 'Litro' },
  ];

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
      setPrecio(producto.precioVenta?.toString() || '');
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
    if (!precio || parseFloat(precio) <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return false;
    }
    if (!stock || parseInt(stock) < 0) {
      Alert.alert('Error', 'El stock debe ser 0 o mayor');
      return false;
    }
    return true;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    try {
      setLoading(true);

      const datosActualizados = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        categoria: categoria || undefined,
        marca: marca.trim() || undefined,
        presentacion: presentacion.trim() || undefined,
        sku: sku.trim() || undefined,
        precio: parseFloat(precio),
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
          <TextInput
            label="Código de Barras"
            value={codigoBarras}
            mode="outlined"
            style={styles.input}
            disabled
            editable={false}
          />

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

          <TextInput
            label="Categoría"
            value={categoria}
            onChangeText={setCategoria}
            mode="outlined"
            style={styles.input}
          />
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
            label="Precio de Venta *"
            value={precio}
            onChangeText={setPrecio}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
            left={<TextInput.Affix text="$" />}
          />

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
  spacer: {
    height: 20,
  },
});
