import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Menu, List, IconButton, Text, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { db } from '@/lib/database';
import { compras, compraItems, proveedores, productos } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

type Proveedor = {
  id: number;
  nombre: string;
  formaPago: string | null;
};

type Producto = {
  id: number;
  nombre: string;
  codigoBarras: string | null;
  precio: number;
  stock: number;
};

type ItemCompra = {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export default function RegistrarCompraScreen() {
  const [loading, setLoading] = useState(false);
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>([]);
  const [productosList, setProductosList] = useState<Producto[]>([]);

  // Campos de la compra
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [folio, setFolio] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [formaPago, setFormaPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');

  // Items de la compra
  const [items, setItems] = useState<ItemCompra[]>([]);

  // Menu de proveedores
  const [menuProveedorVisible, setMenuProveedorVisible] = useState(false);

  // Agregar producto
  const [menuProductoVisible, setMenuProductoVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadProducto, setCantidadProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const provs = await db.select().from(proveedores).where(eq(proveedores.activo, true));
      const prods = await db.select().from(productos).where(eq(productos.activo, true));

      setProveedoresList(provs.map(p => ({
        id: p.id,
        nombre: p.nombre,
        formaPago: p.formaPago
      })));

      setProductosList(prods.map(p => ({
        id: p.id,
        nombre: p.nombre,
        codigoBarras: p.codigoBarras,
        precio: p.precioVenta,
        stock: p.stock || 0
      })));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const seleccionarProveedor = (proveedor: Proveedor) => {
    setProveedorId(proveedor.id);
    setProveedorNombre(proveedor.nombre);
    if (proveedor.formaPago) {
      setFormaPago(proveedor.formaPago);
    }
    setMenuProveedorVisible(false);
  };

  const seleccionarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setPrecioProducto(producto.precioVenta.toString());
    setCantidadProducto('1');
    setMenuProductoVisible(false);
  };

  const agregarProducto = () => {
    if (!productoSeleccionado) {
      Alert.alert('Error', 'Seleccione un producto');
      return;
    }

    if (!cantidadProducto || parseInt(cantidadProducto) <= 0) {
      Alert.alert('Error', 'La cantidad debe ser mayor a 0');
      return;
    }

    if (!precioProducto || parseFloat(precioProducto) <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    const cantidad = parseInt(cantidadProducto);
    const precio = parseFloat(precioProducto);
    const subtotal = cantidad * precio;

    // Verificar si el producto ya está en la lista
    const itemExistente = items.find(i => i.productoId === productoSeleccionado.id);
    if (itemExistente) {
      Alert.alert('Error', 'El producto ya está en la lista. Edite la cantidad desde la lista.');
      return;
    }

    const nuevoItem: ItemCompra = {
      productoId: productoSeleccionado.id,
      nombreProducto: productoSeleccionado.nombre,
      cantidad,
      precioUnitario: precio,
      subtotal
    };

    setItems([...items, nuevoItem]);
    setProductoSeleccionado(null);
    setCantidadProducto('');
    setPrecioProducto('');
  };

  const eliminarProducto = (productoId: number) => {
    setItems(items.filter(i => i.productoId !== productoId));
  };

  const calcularTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const validarFormulario = () => {
    if (!proveedorId) {
      Alert.alert('Error', 'Debe seleccionar un proveedor');
      return false;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Debe agregar al menos un producto');
      return false;
    }

    return true;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    try {
      setLoading(true);

      const total = calcularTotal();

      // Crear la compra
      const nuevaCompra = {
        proveedorId: proveedorId!,
        folio: folio.trim() || undefined,
        total,
        fechaEntrega: fechaEntrega || undefined,
        formaPago: formaPago || 'Efectivo',
        estado: 'pendiente',
        notas: notas.trim() || undefined,
      };

      const [compraCreada] = await db.insert(compras).values(nuevaCompra).returning();

      // Crear los items de la compra
      const itemsParaInsertar = items.map(item => ({
        compraId: compraCreada.id,
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      }));

      await db.insert(compraItems).values(itemsParaInsertar);

      Alert.alert('Éxito', 'Compra registrada correctamente', [
        {
          text: 'Ver Detalle',
          onPress: () => router.replace(`/compras/detalle/${compraCreada.id}`),
        },
        {
          text: 'Volver a Lista',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error al guardar compra:', error);
      Alert.alert('Error', 'No se pudo guardar la compra');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Información de la Compra" />
        <Card.Content>
          <Menu
            visible={menuProveedorVisible}
            onDismiss={() => setMenuProveedorVisible(false)}
            anchor={
              <TextInput
                label="Proveedor *"
                value={proveedorNombre}
                mode="outlined"
                style={styles.input}
                editable={false}
                right={<TextInput.Icon icon="menu-down" onPress={() => setMenuProveedorVisible(true)} />}
                onPressIn={() => setMenuProveedorVisible(true)}
              />
            }
          >
            <ScrollView style={styles.menuScroll}>
              {proveedoresList.map((prov) => (
                <Menu.Item
                  key={prov.id}
                  onPress={() => seleccionarProveedor(prov)}
                  title={prov.nombre}
                />
              ))}
            </ScrollView>
          </Menu>

          <TextInput
            label="Folio"
            value={folio}
            onChangeText={setFolio}
            mode="outlined"
            style={styles.input}
            placeholder="Opcional"
          />

          <TextInput
            label="Fecha de Entrega"
            value={fechaEntrega}
            onChangeText={setFechaEntrega}
            mode="outlined"
            style={styles.input}
            placeholder="YYYY-MM-DD (Opcional)"
          />

          <TextInput
            label="Forma de Pago"
            value={formaPago}
            onChangeText={setFormaPago}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Notas"
            value={notas}
            onChangeText={setNotas}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Productos"
          right={(props) => (
            <IconButton
              {...props}
              icon="plus"
              onPress={() => setMenuProductoVisible(true)}
            />
          )}
        />
        <Card.Content>
          {items.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No hay productos agregados
            </Text>
          ) : (
            items.map((item, index) => (
              <View key={item.productoId}>
                {index > 0 && <Divider style={styles.divider} />}
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text variant="bodyLarge">{item.nombreProducto}</Text>
                    <Text variant="bodySmall" style={styles.itemDetails}>
                      {item.cantidad} × {formatearMoneda(item.precioUnitario)} = {formatearMoneda(item.subtotal)}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => eliminarProducto(item.productoId)}
                  />
                </View>
              </View>
            ))
          )}

          {items.length > 0 && (
            <>
              <Divider style={styles.dividerBold} />
              <View style={styles.totalRow}>
                <Text variant="titleMedium">Total:</Text>
                <Text variant="titleLarge" style={styles.totalText}>
                  {formatearMoneda(calcularTotal())}
                </Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Modal de agregar producto */}
      <Menu
        visible={menuProductoVisible}
        onDismiss={() => setMenuProductoVisible(false)}
        anchor={<View />}
        style={styles.productMenu}
      >
        <ScrollView style={styles.productMenuScroll}>
          {productosList.map((prod) => (
            <Menu.Item
              key={prod.id}
              onPress={() => seleccionarProducto(prod)}
              title={prod.nombre}
              titleStyle={styles.productMenuItem}
            />
          ))}
        </ScrollView>
      </Menu>

      {productoSeleccionado && (
        <Card style={styles.card}>
          <Card.Title title="Agregar Producto" />
          <Card.Content>
            <TextInput
              label="Producto"
              value={productoSeleccionado.nombre}
              mode="outlined"
              editable={false}
              style={styles.input}
            />

            <TextInput
              label="Cantidad *"
              value={cantidadProducto}
              onChangeText={setCantidadProducto}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Precio Unitario *"
              value={precioProducto}
              onChangeText={setPrecioProducto}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
            />

            <Button
              mode="contained"
              onPress={agregarProducto}
              icon="plus"
              style={styles.addButton}
            >
              Agregar a la Compra
            </Button>
          </Card.Content>
        </Card>
      )}

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
  menuScroll: {
    maxHeight: 300,
  },
  productMenu: {
    marginTop: 100,
  },
  productMenuScroll: {
    maxHeight: 400,
  },
  productMenuItem: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemDetails: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  dividerBold: {
    marginVertical: 12,
    height: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  totalText: {
    fontWeight: 'bold',
    color: '#2c5f7c',
  },
  addButton: {
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
