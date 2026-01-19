import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, TextInput as RNTextInput } from 'react-native';
import { Searchbar, Card, Text, Button, FAB, IconButton, Chip, Portal, Modal, Badge, TextInput } from 'react-native-paper';

// Importación de expo-camera
import { CameraView, useCameraPermissions } from 'expo-camera';
import { formatearMoneda } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';
import { router } from 'expo-router';

type OrdenType = 'nombre' | 'precio' | 'stock' | 'reciente' | 'ganancia';
type FiltroStock = 'todos' | 'bajo' | 'sinStock';
type FiltroRentabilidad = 'todos' | 'rentable' | 'pocoRentable' | 'noRentable';

export default function ProductosScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [ordenamiento, setOrdenamiento] = useState<OrdenType>('nombre');
  const [filtroStock, setFiltroStock] = useState<FiltroStock>('todos');
  const [filtroRentabilidad, setFiltroRentabilidad] = useState<FiltroRentabilidad>('todos');
  const [filtrosVisible, setFiltrosVisible] = useState(false);

  // Estado para escáner de código de barras
  const [scannerBuffer, setScannerBuffer] = useState('');
  const scannerInputRef = useRef<RNTextInput>(null);

  // Scanner de cámara
  const [cameraScannerVisible, setCameraScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    filtrarProductos();
  }, [searchQuery, filterCategoria, productos, ordenamiento, filtroStock, filtroRentabilidad]);

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

  const filtrarProductos = () => {
    let filtered = [...productos];

    // Filtro de búsqueda mejorado - busca en múltiples campos
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        // Búsqueda exacta por código de barras (prioridad)
        if (p.codigoBarras?.toLowerCase() === query) {
          return true;
        }

        // Búsqueda en todos los campos de texto
        return (
          p.nombre?.toLowerCase().includes(query) ||
          p.codigoBarras?.toLowerCase().includes(query) ||
          p.categoria?.toLowerCase().includes(query) ||
          p.marca?.toLowerCase().includes(query) ||
          p.presentacion?.toLowerCase().includes(query) ||
          p.descripcion?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query)
        );
      });
    }

    // Filtro de categoría
    if (filterCategoria) {
      filtered = filtered.filter(p => p.categoria === filterCategoria);
    }

    // Filtro de stock
    if (filtroStock === 'bajo') {
      filtered = filtered.filter(p => (p.stock || 0) <= (p.stockMinimo || 5) && (p.stock || 0) > 0);
    } else if (filtroStock === 'sinStock') {
      filtered = filtered.filter(p => (p.stock || 0) === 0);
    }

    // Filtro de rentabilidad
    if (filtroRentabilidad !== 'todos') {
      filtered = filtered.filter(p => {
        const compra = p.precioCompra || 0;
        const venta = p.precioVenta || 0;
        const ganancia = venta - compra;
        const porcentaje = compra > 0 ? ((ganancia / compra) * 100) : 0;

        if (filtroRentabilidad === 'rentable') {
          return porcentaje >= 30; // Margen >= 30%
        } else if (filtroRentabilidad === 'pocoRentable') {
          return porcentaje >= 10 && porcentaje < 30; // Margen 10-30%
        } else if (filtroRentabilidad === 'noRentable') {
          return porcentaje < 10; // Margen < 10% o negativo
        }
        return true;
      });
    }

    // Ordenamiento
    switch (ordenamiento) {
      case 'nombre':
        filtered.sort((a, b) => a.nombre?.localeCompare(b.nombre));
        break;
      case 'precio':
        filtered.sort((a, b) => (b.precioVenta || 0) - (a.precioVenta || 0));
        break;
      case 'stock':
        filtered.sort((a, b) => (a.stock || 0) - (b.stock || 0));
        break;
      case 'ganancia':
        filtered.sort((a, b) => {
          const gananciaA = (a.precioVenta || 0) - (a.precioCompra || 0);
          const gananciaB = (b.precioVenta || 0) - (b.precioCompra || 0);
          return gananciaB - gananciaA; // Mayor a menor
        });
        break;
      case 'reciente':
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    setFilteredProductos(filtered);
  };

  const handleEliminarProducto = useCallback(async (id: number, nombre: string) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Está seguro de eliminar "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await queries.eliminarProducto(id);
              Alert.alert('Éxito', 'Producto eliminado');
              cargarProductos();
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  }, [cargarProductos]);

  const handleToggleActivo = useCallback(async (id: number, nombre: string, activoActual: boolean) => {
    const nuevoEstado = !activoActual;
    try {
      await queries.actualizarProducto(id, { activo: nuevoEstado });
      Alert.alert(
        'Producto ' + (nuevoEstado ? 'Activado' : 'Desactivado'),
        `"${nombre}" ahora está ${nuevoEstado ? 'disponible' : 'no disponible'} para venta`
      );
      cargarProductos();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado del producto');
    }
  }, [cargarProductos]);

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
    // NO cerrar la cámara, mantenerla abierta
    handleBarcodeScanned(data);

    // Resetear el flag después de 1.5 segundos para permitir siguiente escaneo
    setTimeout(() => setIsScanning(false), 1500);
  };

  // Manejar escaneo de código de barras
  const handleBarcodeScanned = async (codigo: string) => {
    try {
      const producto = await queries.obtenerProductoPorCodigoBarras(codigo);

      if (producto) {
        // Mostrar opciones: Ver o Editar
        Alert.alert(
          'Producto Encontrado',
          `${producto.nombre}\n${formatearMoneda(producto.precioVenta)}\nStock: ${producto.stock || 0}`,
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                setScannerBuffer('');
                scannerInputRef.current?.focus();
              }
            },
            {
              text: 'Editar',
              onPress: () => {
                setScannerBuffer('');
                router.push(`/productos/editar/${producto.id}`);
              }
            },
            {
              text: 'Ver Lista',
              onPress: () => {
                setScannerBuffer('');
                setSearchQuery(codigo);
                scannerInputRef.current?.focus();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Producto No Encontrado',
          `No existe un producto con el código: ${codigo}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setScannerBuffer('');
                scannerInputRef.current?.focus();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error al buscar producto:', error);
      Alert.alert('Error', 'No se pudo buscar el producto');
      setScannerBuffer('');
      scannerInputRef.current?.focus();
    }
  };

  // Manejar input del escáner
  const handleScannerInput = (text: string) => {
    setScannerBuffer(text);
  };

  // Optimización: Usar useCallback para evitar recrear la función en cada render
  const renderProducto = useCallback(({ item }: { item: any }) => {
    // Debug: Log marca y presentacion para diagnosticar
    if (item.nombre === 'LAUTREC') {
      console.log('DEBUG LAUTREC:', {
        nombre: item.nombre,
        marca: item.marca,
        presentacion: item.presentacion,
        marcaTipo: typeof item.marca,
        presentacionTipo: typeof item.presentacion,
        marcaTrim: item.marca?.trim(),
        presentacionTrim: item.presentacion?.trim()
      });
    }

    const stockBajo = (item.stock || 0) <= (item.stockMinimo || 5);
    const precioCompra = item.precioCompra || 0;
    const precioVenta = item.precioVenta || 0;
    const ganancia = precioVenta - precioCompra;
    const porcentajeGanancia = precioCompra > 0 ? ((ganancia / precioCompra) * 100) : 0;
    const activo = item.activo === true || item.activo === 1;

    return (
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {/* Header: Nombre + Categoría + Acciones */}
          <View style={styles.cardHeaderNew}>
            <View style={styles.headerLeft}>
              {item.categoria && (
                <Chip mode="outlined" style={styles.chipCategoria} textStyle={styles.chipCategoriaText}>
                  {item.categoria}
                </Chip>
              )}
              {!activo && (
                <Chip mode="flat" style={styles.chipInactivoNew} compact textStyle={styles.chipInactivoTextNew}>
                  Inactivo
                </Chip>
              )}
            </View>
            <View style={styles.cardActionsNew}>
              <IconButton
                icon={activo ? 'eye-off' : 'eye'}
                size={18}
                iconColor={activo ? '#999' : '#4caf50'}
                onPress={() => handleToggleActivo(item.id, item.nombre, activo)}
                style={styles.iconBtn}
              />
              <IconButton
                icon="pencil"
                size={18}
                iconColor="#2196f3"
                onPress={() => router.push(`/productos/editar/${item.id}`)}
                style={styles.iconBtn}
              />
              <IconButton
                icon="delete"
                size={18}
                iconColor="#f44336"
                onPress={() => handleEliminarProducto(item.id, item.nombre)}
                style={styles.iconBtn}
              />
            </View>
          </View>

          {/* Nombre del producto */}
          <Text variant="titleLarge" style={styles.nombreProducto} numberOfLines={2}>
            {item.nombre}
          </Text>

          {/* Código de barras + Marca + Presentación + Stock inline */}
          <View style={styles.codigoStockRow}>
            <View style={styles.codigoYDetalles}>
              <Text variant="bodySmall" style={styles.codigoBarras}>
                {item.codigoBarras}
              </Text>
              {(item.marca?.trim() || item.presentacion?.trim()) && (
                <View style={styles.detallesInline}>
                  {item.marca?.trim() && (
                    <Text variant="bodySmall" style={styles.detalleInlineText} numberOfLines={1}>
                      🏷️ {item.marca.trim()}
                    </Text>
                  )}
                  {item.presentacion?.trim() && (
                    <Text variant="bodySmall" style={styles.detalleInlineText} numberOfLines={1}>
                      📏 {item.presentacion.trim()}
                    </Text>
                  )}
                </View>
              )}
            </View>
            <Text
              variant="bodySmall"
              style={[styles.stockInline, stockBajo && styles.stockInlineBajo]}
            >
              📦 {item.stock || 0}
            </Text>
          </View>

          {/* Sección de Precios en una línea compacta */}
          <View style={styles.preciosInline}>
            <Text style={styles.precioInlineText}>
              💰 <Text style={styles.precioCompraInline}>{formatearMoneda(precioCompra)}</Text>
              {' → '}
              <Text style={styles.precioVentaInline}>{formatearMoneda(precioVenta)}</Text>
              {' | '}
              <Text style={[styles.gananciaInline, ganancia < 0 && styles.gananciaNegativaInline]}>
                +{formatearMoneda(ganancia)}
              </Text>
              {precioCompra > 0 && (
                <Text style={styles.porcentajeInline}> ({porcentajeGanancia.toFixed(1)}%)</Text>
              )}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }, [handleToggleActivo, handleEliminarProducto]);

  // Verificar si hay filtros activos
  const hayFiltrosActivos =
    ordenamiento !== 'nombre' ||
    filtroStock !== 'todos' ||
    filtroRentabilidad !== 'todos';

  const limpiarFiltros = () => {
    setOrdenamiento('nombre');
    setFiltroStock('todos');
    setFiltroRentabilidad('todos');
  };

  return (
    <View style={styles.container}>
      {/* TextInput oculto para capturar escáner de código de barras */}
      <RNTextInput
        ref={scannerInputRef}
        value={scannerBuffer}
        onChangeText={handleScannerInput}
        autoFocus={true}
        showSoftInputOnFocus={false}
        keyboardType="numeric"
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text.trim();
          if (code) handleBarcodeScanned(code);
        }}
        style={styles.hiddenInput}
      />

      {/* Barra de búsqueda con botón de filtros */}
      <View style={styles.searchbarContainer}>
        <Searchbar
          placeholder="Buscar productos o escanear..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbarInput}
          icon="barcode-scan"
          placeholderTextColor="#888"
        />
        <IconButton
          icon="camera"
          size={24}
          mode="contained"
          onPress={requestCameraPermission}
          style={styles.cameraButton}
        />
        <IconButton
          icon="tune"
          size={24}
          onPress={() => setFiltrosVisible(true)}
          style={styles.filterButton}
        />
        {hayFiltrosActivos && (
          <Badge style={styles.filterBadge} size={8} />
        )}
      </View>

      {/* Filtros de categoría */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categorias}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categories}
          renderItem={({ item }) => (
            <Chip
              selected={filterCategoria === item}
              onPress={() => setFilterCategoria(filterCategoria === item ? null : item)}
              style={styles.categoryChip}
              textStyle={styles.categoryChipText}
            >
              {item}
            </Chip>
          )}
        />
      </View>


      {/* Modal de filtros */}
      <Portal>
        <Modal
          visible={filtrosVisible}
          onDismiss={() => setFiltrosVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text variant="headlineSmall">Filtros</Text>
              <IconButton
                icon="close"
                onPress={() => setFiltrosVisible(false)}
              />
            </View>

            {/* Ordenar */}
            <View style={styles.filterSection}>
              <Text variant="titleMedium" style={styles.filterTitle}>Ordenar por:</Text>
              <View style={styles.filterOptions}>
                <Chip
                  selected={ordenamiento === 'nombre'}
                  onPress={() => setOrdenamiento('nombre')}
                  style={styles.filterChip}
                >
                  A-Z
                </Chip>
                <Chip
                  selected={ordenamiento === 'precio'}
                  onPress={() => setOrdenamiento('precio')}
                  style={styles.filterChip}
                >
                  Precio
                </Chip>
                <Chip
                  selected={ordenamiento === 'ganancia'}
                  onPress={() => setOrdenamiento('ganancia')}
                  style={styles.filterChip}
                >
                  Ganancia
                </Chip>
                <Chip
                  selected={ordenamiento === 'stock'}
                  onPress={() => setOrdenamiento('stock')}
                  style={styles.filterChip}
                >
                  Stock
                </Chip>
              </View>
            </View>

            {/* Stock */}
            <View style={styles.filterSection}>
              <Text variant="titleMedium" style={styles.filterTitle}>Nivel de Stock:</Text>
              <View style={styles.filterOptions}>
                <Chip
                  selected={filtroStock === 'todos'}
                  onPress={() => setFiltroStock('todos')}
                  style={styles.filterChip}
                >
                  Todos
                </Chip>
                <Chip
                  selected={filtroStock === 'bajo'}
                  onPress={() => setFiltroStock('bajo')}
                  style={styles.filterChip}
                >
                  Stock Bajo
                </Chip>
                <Chip
                  selected={filtroStock === 'sinStock'}
                  onPress={() => setFiltroStock('sinStock')}
                  style={styles.filterChip}
                >
                  Sin Stock
                </Chip>
              </View>
            </View>

            {/* Rentabilidad */}
            <View style={styles.filterSection}>
              <Text variant="titleMedium" style={styles.filterTitle}>Rentabilidad:</Text>
              <View style={styles.filterOptions}>
                <Chip
                  selected={filtroRentabilidad === 'todos'}
                  onPress={() => setFiltroRentabilidad('todos')}
                  style={styles.filterChip}
                >
                  Todos
                </Chip>
                <Chip
                  selected={filtroRentabilidad === 'rentable'}
                  onPress={() => setFiltroRentabilidad('rentable')}
                  style={styles.filterChip}
                >
                  Rentable (≥30%)
                </Chip>
                <Chip
                  selected={filtroRentabilidad === 'pocoRentable'}
                  onPress={() => setFiltroRentabilidad('pocoRentable')}
                  style={styles.filterChip}
                >
                  Medio (10-30%)
                </Chip>
                <Chip
                  selected={filtroRentabilidad === 'noRentable'}
                  onPress={() => setFiltroRentabilidad('noRentable')}
                  style={styles.filterChip}
                >
                  Bajo (&lt;10%)
                </Chip>
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={limpiarFiltros}
                style={styles.actionButton}
              >
                Limpiar
              </Button>
              <Button
                mode="contained"
                onPress={() => setFiltrosVisible(false)}
                style={styles.actionButton}
              >
                Aplicar
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Vista de cámara cuando está activa */}
      {cameraScannerVisible && (
        <View style={styles.cameraViewContainer}>
          <CameraView
            onBarcodeScanned={handleCameraScan}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
            }}
            style={styles.cameraView}
          />
          <View style={styles.cameraOverlayInline}>
            <Text variant="titleSmall" style={styles.cameraTitleInline}>
              Escanear
            </Text>
            <Button
              mode="contained"
              onPress={() => setCameraScannerVisible(false)}
              icon="close"
              compact
              buttonColor="rgba(0,0,0,0.7)"
            >
              Cerrar
            </Button>
          </View>
        </View>
      )}

      {/* Resumen */}
      <View style={styles.summary}>
        <Text variant="bodyMedium" style={styles.summaryText}>
          Mostrando {filteredProductos.length} de {productos.length} productos
        </Text>
        {filtroStock !== 'todos' && (
          <Text variant="bodySmall" style={styles.summaryNote}>
            {filtroStock === 'bajo' && '⚠️ Productos con stock bajo'}
            {filtroStock === 'sinStock' && '❌ Productos sin stock'}
          </Text>
        )}
        {filtroRentabilidad !== 'todos' && (
          <Text variant="bodySmall" style={styles.summaryNote}>
            {filtroRentabilidad === 'rentable' && '💰 Productos muy rentables (margen ≥30%)'}
            {filtroRentabilidad === 'pocoRentable' && '📊 Productos rentabilidad media (margen 10-30%)'}
            {filtroRentabilidad === 'noRentable' && '⚠️ Productos baja rentabilidad (margen <10%)'}
          </Text>
        )}
      </View>

      {/* Lista de productos */}
      <FlatList
        data={filteredProductos}
        renderItem={renderProducto}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={cargarProductos}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {searchQuery || filterCategoria
                ? 'No se encontraron productos'
                : 'No hay productos registrados'}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/productos/agregar')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8eff5',
  },
  hiddenInput: {
    position: 'absolute',
    left: -9999,
    width: 1,
    height: 1,
  },
  searchbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    position: 'relative',
    backgroundColor: '#2c5f7c',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  searchbarInput: {
    flex: 1,
    elevation: 0,
    backgroundColor: '#ffffff',
    fontSize: 14,
    borderRadius: 10,
    height: 44,
  },
  filterButton: {
    margin: 0,
    marginLeft: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#4caf50',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    backgroundColor: '#2c5f7c',
    paddingBottom: 12,
  },
  categories: {
    paddingVertical: 4,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    height: 38,
    paddingHorizontal: 6,
    borderRadius: 20,
    elevation: 2,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c5f7c',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 24,
    maxHeight: '80%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e8eff5',
  },
  filterSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitle: {
    marginBottom: 14,
    fontWeight: '800',
    fontSize: 17,
    color: '#1a1a1a',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    marginBottom: 4,
    borderRadius: 12,
    elevation: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    elevation: 2,
  },
  summary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#2c5f7c',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2c5f7c',
    letterSpacing: 0.3,
  },
  summaryNote: {
    color: '#555',
    marginTop: 6,
    fontStyle: 'italic',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderRadius: 16,
    borderLeftWidth: 6,
    borderLeftColor: '#4caf50',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
  },
  nombreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nombre: {
    fontWeight: 'bold',
    flex: 1,
  },
  codigo: {
    color: '#666',
    marginBottom: 4,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  chipInactivo: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  chipInactivoText: {
    color: '#c62828',
    fontSize: 11,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precioCompra: {
    color: '#e65100',
    fontWeight: '600',
  },
  precioVenta: {
    color: '#2c5f7c',
    fontWeight: '600',
  },
  ganancia: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  gananciaNegativa: {
    color: '#f44336',
  },
  porcentaje: {
    color: '#666',
    fontSize: 12,
  },
  stock: {
    fontWeight: '600',
  },
  stockBajo: {
    color: '#f44336',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2c5f7c',
    elevation: 8,
    shadowColor: '#2c5f7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  // Nuevos estilos mejorados
  cardContent: {
    padding: 12,
  },
  cardHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  chipCategoria: {
    height: 34,
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    paddingHorizontal: 14,
    borderRadius: 18,
    elevation: 1,
  },
  chipCategoriaText: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  chipInactivoNew: {
    height: 28,
    backgroundColor: '#ffebee',
    borderRadius: 14,
    elevation: 1,
  },
  chipInactivoTextNew: {
    fontSize: 11,
    color: '#c62828',
    fontWeight: '700',
  },
  cardActionsNew: {
    flexDirection: 'row',
    gap: 0,
    marginRight: -8,
  },
  iconBtn: {
    margin: 0,
  },
  nombreProducto: {
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 26,
    color: '#1a1a1a',
    fontSize: 20,
    letterSpacing: 0.2,
  },
  codigoStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  codigoYDetalles: {
    flex: 1,
    marginRight: 8,
  },
  codigoBarras: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detallesInline: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  detalleInlineText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  stockInline: {
    color: '#2c5f7c',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stockInlineBajo: {
    color: '#f44336',
  },
  preciosGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  precioCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  gananciaCard: {
    backgroundColor: '#f1f8f4',
  },
  precioLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#555',
    marginBottom: 6,
    letterSpacing: 1.2,
  },
  precioCompraValue: {
    color: '#e65100',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  precioVentaValue: {
    color: '#1976d2',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  gananciaValue: {
    color: '#2e7d32',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  gananciaNegativaValue: {
    color: '#d32f2f',
  },
  porcentajeNew: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  footerInfo: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e8eff5',
  },
  detallesAdicionales: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  detalleText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  cameraButton: {
    margin: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cameraViewContainer: {
    height: 150,
    backgroundColor: 'black',
    position: 'relative'
  },
  cameraView: {
    flex: 1
  },
  cameraOverlayInline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cameraTitleInline: {
    color: 'white',
    fontWeight: 'bold'
  },
  // Estilos para precios inline (más compactos)
  preciosInline: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  precioInlineText: {
    fontSize: 15,
    lineHeight: 22,
  },
  precioCompraInline: {
    color: '#e65100',
    fontWeight: '800',
    fontSize: 15,
  },
  precioVentaInline: {
    color: '#1976d2',
    fontWeight: '800',
    fontSize: 15,
  },
  gananciaInline: {
    color: '#2e7d32',
    fontWeight: '800',
    fontSize: 15,
  },
  gananciaNegativaInline: {
    color: '#d32f2f',
  },
  porcentajeInline: {
    color: '#4caf50',
    fontWeight: '700',
    fontSize: 13,
  },
});
