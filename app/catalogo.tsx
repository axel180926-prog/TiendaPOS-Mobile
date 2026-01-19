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
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de configuración rápida
  const [modalConfig, setModalConfig] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any>(null);
  const [codigoBarras, setCodigoBarras] = useState('');
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

    // Búsqueda por nombre
    if (searchQuery.length > 0) {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

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

  const obtenerEstadoStock = (stock: number, minimo: number = 10) => {
    if (stock === 0) return { tipo: 'agotado', color: '#d32f2f', texto: '🔴 AGOTADO', colorTexto: '#fff' };
    if (stock <= minimo) return { tipo: 'bajo', color: '#ff9800', texto: '⚠️ BAJO', colorTexto: '#fff' };
    return { tipo: 'ok', color: '#4caf50', texto: '✓ OK', colorTexto: '#fff' };
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

  const guardarCambios = async () => {
    if (!productoEditando) return;

    try {
      const datosActualizar: any = {
        precioCompra: parseFloat(precioCompra) || 0,
        precioVenta: parseFloat(precioVenta),
        stock: parseInt(stockInicial) || 0,
        activo: true // Activar automáticamente al configurar
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

      {/* Campo de búsqueda */}
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
      </View>

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

            const estadoStock = obtenerEstadoStock(producto.stock || 0, producto.stockMinimo);

            return (
              <Card
                key={producto.id}
                style={[
                  styles.cardModerna,
                  !activo && styles.cardInactivo,
                  estadoStock.tipo === 'agotado' && styles.cardAgotado
                ]}
                elevation={activo ? 3 : 1}
              >
                <Card.Content style={styles.cardContent}>
                  {/* Header: Nombre + Estado */}
                  <View style={styles.headerRow}>
                    <Text style={styles.nombreProducto}>
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
                        { color: estadoStock.color }
                      ]}>
                        {producto.stock || 0}
                      </Text>
                      <Text style={styles.unidadCompacta}>
                        {producto.unidadMedida || 'pzas'}
                      </Text>
                    </View>

                    <View style={styles.accionesCompactas}>
                      <IconButton
                        icon="pencil"
                        mode="contained"
                        size={18}
                        onPress={() => handleAbrirConfiguracion(producto)}
                        containerColor="#2196f3"
                        iconColor="#fff"
                        style={styles.iconButtonCompacto}
                      />
                      <IconButton
                        icon={activo ? 'close-circle' : 'check-circle'}
                        mode="contained"
                        size={18}
                        onPress={() => handleToggleActivo(producto)}
                        containerColor={activo ? '#f44336' : '#4caf50'}
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

                <TextInput
                  label="Código de Barras"
                  value={codigoBarras}
                  onChangeText={setCodigoBarras}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="barcode" />}
                  right={
                    <TextInput.Icon
                      icon="information"
                      onPress={() => Alert.alert('Info', 'Código de barras único del producto para escaneo rápido')}
                    />
                  }
                  placeholder="Escribe o escanea el código"
                />

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
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    elevation: 2,
    borderRadius: 12,
  },
  filtroContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoriasContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
});
