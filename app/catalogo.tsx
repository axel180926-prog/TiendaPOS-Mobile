import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
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
import { formatearMoneda } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

export default function CatalogoScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [loading, setLoading] = useState(false);

  // Modal de configuración rápida
  const [modalConfig, setModalConfig] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any>(null);
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stockInicial, setStockInicial] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await queries.obtenerProductos();
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

    // Filtro de categoría
    if (categoriaSeleccionada) {
      filtered = filtered.filter(p => p.categoria === categoriaSeleccionada);
    }

    // Filtro de estado
    if (filtroEstado === 'activos') {
      filtered = filtered.filter(p => p.activo === true || p.activo === 1);
    } else if (filtroEstado === 'inactivos') {
      filtered = filtered.filter(p => p.activo === false || p.activo === 0);
    }

    return filtered;
  };

  const contarProductosCategoria = (categoria: string) => {
    const total = productos.filter(p => p.categoria === categoria).length;
    const activos = productos.filter(p =>
      p.categoria === categoria && (p.activo === true || p.activo === 1)
    ).length;
    return { activos, total };
  };

  const calcularGanancia = (compra: number, venta: number) => {
    const ganancia = venta - compra;
    const porcentaje = compra > 0 ? ((ganancia / compra) * 100) : 0;
    return { ganancia, porcentaje };
  };

  const handleToggleActivo = async (producto: any) => {
    try {
      const nuevoEstado = !producto.activo;
      await queries.actualizarProducto(producto.id, {
        activo: nuevoEstado
      });

      Alert.alert(
        'Producto ' + (nuevoEstado ? 'Activado' : 'Desactivado'),
        `"${producto.nombre}" ahora está ${nuevoEstado ? 'disponible' : 'no disponible'} para venta`
      );

      cargarProductos();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado del producto');
    }
  };

  const handleAbrirConfiguracion = (producto: any) => {
    setProductoEditando(producto);
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

  const guardarCambios = async () => {
    if (!productoEditando) return;

    try {
      await queries.actualizarProducto(productoEditando.id, {
        precioCompra: parseFloat(precioCompra) || 0,
        precioVenta: parseFloat(precioVenta),
        stock: parseInt(stockInicial) || 0,
        activo: true // Activar automáticamente al configurar
      });

      Alert.alert('Éxito', 'Producto configurado correctamente');
      setModalConfig(false);
      cargarProductos();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const productosCategoria = obtenerProductosPorCategoria();

  return (
    <View style={styles.container}>
      {/* Header con instrucciones */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.headerTitle}>
            📦 Catálogo de Productos
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            Selecciona una categoría, configura precios y activa los productos que vendes
          </Text>
        </Card.Content>
      </Card>

      {/* Filtro de estado */}
      <View style={styles.filtroContainer}>
        <SegmentedButtons
          value={filtroEstado}
          onValueChange={(value) => setFiltroEstado(value as FiltroEstado)}
          buttons={[
            { value: 'todos', label: 'Todos' },
            { value: 'activos', label: 'Activos' },
            { value: 'inactivos', label: 'Inactivos' }
          ]}
        />
      </View>

      {/* Categorías */}
      <View style={styles.categoriasContainer}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Categorías
        </Text>
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
              const { activos, total } = contarProductosCategoria(cat);
              return (
                <Chip
                  key={cat}
                  selected={categoriaSeleccionada === cat}
                  onPress={() => setCategoriaSeleccionada(cat)}
                  style={styles.categoriaChip}
                >
                  {cat} ({activos}/{total})
                </Chip>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Lista de productos */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {productosCategoria.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {categoriaSeleccionada
                ? `No hay productos ${filtroEstado === 'activos' ? 'activos' : filtroEstado === 'inactivos' ? 'inactivos' : ''} en esta categoría`
                : 'No hay productos'}
            </Text>
          </View>
        ) : (
          productosCategoria.map((producto) => {
            const activo = producto.activo === true || producto.activo === 1;
            const compra = producto.precioCompra || 0;
            const venta = producto.precioVenta || 0;
            const { ganancia, porcentaje } = calcularGanancia(compra, venta);

            return (
              <Card key={producto.id} style={[styles.card, !activo && styles.cardInactivo]}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                      <View style={styles.nombreRow}>
                        <Text variant="titleMedium" style={styles.nombre}>
                          {producto.nombre}
                        </Text>
                        <Chip
                          mode="outlined"
                          style={[styles.estadoChip, activo ? styles.estadoActivo : styles.estadoInactivo]}
                          textStyle={activo ? styles.estadoActivoText : styles.estadoInactivoText}
                        >
                          {activo ? 'ACTIVO' : 'Inactivo'}
                        </Chip>
                      </View>

                      {producto.descripcion && (
                        <Text variant="bodySmall" style={styles.descripcion}>
                          {producto.descripcion}
                        </Text>
                      )}

                      <View style={styles.detallesRow}>
                        {producto.marca && (
                          <Text variant="bodySmall" style={styles.detalle}>
                            🏷️ {producto.marca}
                          </Text>
                        )}
                        {producto.presentacion && (
                          <Text variant="bodySmall" style={styles.detalle}>
                            📦 {producto.presentacion}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  {/* Información de precios */}
                  <View style={styles.preciosContainer}>
                    <View style={styles.precioItem}>
                      <Text variant="labelSmall" style={styles.precioLabel}>
                        Precio Proveedor
                      </Text>
                      <Text variant="bodyLarge" style={styles.precioCompraText}>
                        {formatearMoneda(compra)}
                      </Text>
                    </View>

                    <View style={styles.precioItem}>
                      <Text variant="labelSmall" style={styles.precioLabel}>
                        Precio Venta
                      </Text>
                      <Text variant="bodyLarge" style={styles.precioVentaText}>
                        {formatearMoneda(venta)}
                      </Text>
                    </View>

                    <View style={styles.precioItem}>
                      <Text variant="labelSmall" style={styles.precioLabel}>
                        Ganancia
                      </Text>
                      <Text
                        variant="bodyLarge"
                        style={[styles.gananciaText, ganancia < 0 && styles.gananciaNegativa]}
                      >
                        {formatearMoneda(ganancia)}
                      </Text>
                      {compra > 0 && (
                        <Text variant="bodySmall" style={styles.porcentajeText}>
                          ({porcentaje.toFixed(1)}%)
                        </Text>
                      )}
                    </View>

                    <View style={styles.precioItem}>
                      <Text variant="labelSmall" style={styles.precioLabel}>
                        Stock
                      </Text>
                      <Text variant="bodyLarge" style={styles.stockText}>
                        {producto.stock || 0} {producto.unidadMedida || 'pzas'}
                      </Text>
                    </View>
                  </View>

                  {/* Acciones */}
                  <View style={styles.actions}>
                    <Button
                      mode="outlined"
                      onPress={() => handleAbrirConfiguracion(producto)}
                      style={styles.actionButton}
                      icon="pencil"
                    >
                      Editar Precio
                    </Button>
                    <Button
                      mode={activo ? 'outlined' : 'contained'}
                      onPress={() => handleToggleActivo(producto)}
                      style={styles.actionButton}
                      buttonColor={activo ? undefined : '#4caf50'}
                      icon={activo ? 'close-circle' : 'check-circle'}
                    >
                      {activo ? 'Desactivar' : 'Activar'}
                    </Button>
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
          <Text variant="titleLarge" style={styles.modalTitle}>
            Configurar Producto
          </Text>

          {productoEditando && (
            <>
              <Text variant="bodyMedium" style={styles.modalSubtitle}>
                {productoEditando.nombre}
              </Text>

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
                  <TextInput.Affix text={productoEditando.unidadMedida || 'pzas'} />
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
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 10,
    backgroundColor: '#2c5f7c',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#fff',
    opacity: 0.9,
  },
  filtroContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  categoriasContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  categorias: {
    flexDirection: 'row',
    gap: 8,
  },
  categoriaChip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  cardInactivo: {
    opacity: 0.6,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardInfo: {
    flex: 1,
  },
  nombreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  nombre: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  estadoChip: {
    height: 24,
  },
  estadoActivo: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  estadoActivoText: {
    color: '#2e7d32',
    fontSize: 11,
  },
  estadoInactivo: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  estadoInactivoText: {
    color: '#c62828',
    fontSize: 11,
  },
  descripcion: {
    color: '#666',
    marginBottom: 4,
  },
  detallesRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  detalle: {
    color: '#666',
  },
  divider: {
    marginVertical: 12,
  },
  preciosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  precioItem: {
    flex: 1,
    minWidth: '45%',
  },
  precioLabel: {
    color: '#666',
    marginBottom: 4,
  },
  precioCompraText: {
    color: '#e65100',
    fontWeight: '600',
  },
  precioVentaText: {
    color: '#2c5f7c',
    fontWeight: '600',
  },
  gananciaText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  gananciaNegativa: {
    color: '#f44336',
  },
  porcentajeText: {
    color: '#666',
    fontSize: 11,
  },
  stockText: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#666',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  gananciaCard: {
    marginBottom: 15,
    backgroundColor: '#e8f5e9',
  },
  gananciaPreview: {
    alignItems: 'center',
  },
  gananciaValue: {
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  gananciaPorcentaje: {
    color: '#2e7d32',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    minWidth: 100,
  },
});
