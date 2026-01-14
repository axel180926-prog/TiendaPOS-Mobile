import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import * as queries from '@/lib/database/queries';

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

export default function AgregarProductoScreen() {
  const [loading, setLoading] = useState(false);

  // Campos del formulario
  const [codigoBarras, setCodigoBarras] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Abarrotes');
  const [marca, setMarca] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [sku, setSku] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [unidadMedida, setUnidadMedida] = useState('Pieza');

  const unidades = [
    { value: 'Pieza', label: 'Pieza' },
    { value: 'Kg', label: 'Kg' },
    { value: 'Litro', label: 'Litro' },
  ];

  const validarFormulario = () => {
    if (!codigoBarras.trim()) {
      Alert.alert('Error', 'El código de barras es obligatorio');
      return false;
    }
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

      const nuevoProducto = {
        codigoBarras: codigoBarras.trim(),
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

      await queries.crearProducto(nuevoProducto);

      Alert.alert('Éxito', 'Producto agregado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      if (error.message?.includes('UNIQUE')) {
        Alert.alert('Error', 'Ya existe un producto con ese código de barras');
      } else {
        Alert.alert('Error', 'No se pudo guardar el producto');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Información Básica" />
        <Card.Content>
          <TextInput
            label="Código de Barras *"
            value={codigoBarras}
            onChangeText={setCodigoBarras}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            placeholder="7501000110049"
          />

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

          <TextInput
            label="Categoría"
            value={categoria}
            onChangeText={setCategoria}
            mode="outlined"
            style={styles.input}
            right={<TextInput.Icon icon="chevron-down" />}
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
            placeholder="15.00"
          />

          <TextInput
            label="Stock Actual *"
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
