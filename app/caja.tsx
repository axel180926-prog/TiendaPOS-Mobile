import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, TextInput, DataTable, Portal, Modal, Divider, Snackbar } from 'react-native-paper';
import { formatearMoneda, formatearFecha } from '@/lib/utils/formatters';
import { useCajaStore } from '@/lib/store/useCajaStore';
import * as queries from '@/lib/database/queries';

export default function CajaScreen() {
  const {
    cajaActiva,
    movimientos,
    loading,
    error,
    cargarCajaActiva,
    abrirNuevaCaja,
    cerrarCajaActiva,
    registrarMovimiento,
    limpiarError,
  } = useCajaStore();

  const [historial, setHistorial] = useState<any[]>([]);

  // Modal de apertura
  const [modalApertura, setModalApertura] = useState(false);
  const [montoInicial, setMontoInicial] = useState('500');

  // Modal de cierre
  const [modalCierre, setModalCierre] = useState(false);
  const [montoFinal, setMontoFinal] = useState('');
  const [notasCierre, setNotasCierre] = useState('');
  const [resumenCaja, setResumenCaja] = useState<any>(null);

  // Modal de movimiento
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<'ingreso' | 'egreso' | 'retiro'>('ingreso');
  const [montoMovimiento, setMontoMovimiento] = useState('');
  const [conceptoMovimiento, setConceptoMovimiento] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      await cargarCajaActiva();
      const hist = await queries.obtenerHistorialCajas(10);
      setHistorial(hist);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleAbrirCaja = async () => {
    const monto = parseFloat(montoInicial);
    if (!montoInicial || monto < 500) {
      Alert.alert('Error', 'El monto inicial debe ser al menos $500');
      return;
    }

    const exito = await abrirNuevaCaja(monto);
    if (exito) {
      Alert.alert('Éxito', 'Caja abierta correctamente');
      setModalApertura(false);
      setMontoInicial('500');
      cargarDatos();
    }
  };

  const handleAbrirModalCierre = async () => {
    if (!cajaActiva) return;

    try {
      // Obtener resumen completo con movimientos y ventas
      const resumen = await queries.obtenerResumenCompletoCaja(cajaActiva.id);
      setResumenCaja(resumen);
      setModalCierre(true);
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      Alert.alert('Error', 'No se pudo cargar el resumen de caja');
    }
  };

  const handleCerrarCaja = async () => {
    if (!cajaActiva) return;
    const monto = parseFloat(montoFinal);
    if (!montoFinal || monto < 0) {
      Alert.alert('Error', 'Ingrese un monto final válido');
      return;
    }

    const resultado = await queries.cerrarCaja(
      cajaActiva.id,
      monto,
      notasCierre
    );

    const diferencia = resultado.diferencia || 0;
    const mensaje = diferencia === 0
      ? 'Caja cerrada correctamente. Cuadra perfecto.'
      : diferencia > 0
      ? `Caja cerrada. Sobrante: ${formatearMoneda(diferencia)}`
      : `Caja cerrada. Faltante: ${formatearMoneda(Math.abs(diferencia))}`;

    Alert.alert('Caja Cerrada', mensaje);

    await cerrarCajaActiva(monto, notasCierre);
    setModalCierre(false);
    setMontoFinal('');
    setNotasCierre('');
    setResumenCaja(null);
    cargarDatos();
  };

  const handleRegistrarMovimiento = async () => {
    const monto = parseFloat(montoMovimiento);
    if (!montoMovimiento || monto <= 0) {
      Alert.alert('Error', 'Ingrese un monto válido');
      return;
    }

    await registrarMovimiento(tipoMovimiento, monto, conceptoMovimiento);
    Alert.alert('Éxito', 'Movimiento registrado correctamente');
    setModalMovimiento(false);
    setMontoMovimiento('');
    setConceptoMovimiento('');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Estado actual */}
        <Card style={styles.card}>
          <Card.Title
            title="Estado de Caja"
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            {cajaActiva ? (
              <View>
                <View style={styles.row}>
                  <Text variant="titleMedium" style={styles.labelText}>Estado:</Text>
                  <Text variant="bodyLarge" style={styles.statusOpen}>ABIERTA</Text>
                </View>
                <View style={styles.row}>
                  <Text variant="titleMedium" style={styles.labelText}>Apertura:</Text>
                  <Text variant="titleMedium" style={styles.valueText}>
                    {formatearFecha(cajaActiva.fechaApertura).split(' ')[0]}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text variant="titleMedium" style={styles.labelText}>Monto Inicial:</Text>
                  <Text variant="titleLarge" style={styles.moneyHighlight}>{formatearMoneda(cajaActiva.montoInicial || 0)}</Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.buttonRow}>
                  <Button
                    mode="contained"
                    onPress={() => setModalMovimiento(true)}
                    style={styles.button}
                    icon="plus-circle"
                  >
                    Movimiento
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleAbrirModalCierre}
                    style={[styles.button, styles.closeButton]}
                    icon="lock"
                  >
                    Cerrar Caja
                  </Button>
                </View>
              </View>
            ) : (
              <View>
                <Text variant="bodyLarge" style={styles.noCaja}>
                  No hay caja abierta
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setModalApertura(true)}
                  style={styles.openButton}
                  icon="lock-open"
                >
                  Abrir Caja
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Historial */}
        <Card style={styles.card}>
          <Card.Title
            title="Historial de Cierres"
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Fecha</DataTable.Title>
                <DataTable.Title numeric>Inicial</DataTable.Title>
                <DataTable.Title numeric>Final</DataTable.Title>
                <DataTable.Title numeric>Dif.</DataTable.Title>
              </DataTable.Header>

              {historial.map((item) => (
                <DataTable.Row key={item.id}>
                  <DataTable.Cell>
                    {item.fechaCierre ? formatearFecha(item.fechaCierre) : 'Abierta'}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {formatearMoneda(item.montoInicial || 0)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {item.montoFinal ? formatearMoneda(item.montoFinal) : '-'}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {item.diferencia !== null && item.diferencia !== undefined ? (
                      <Text style={item.diferencia === 0 ? styles.neutral : item.diferencia > 0 ? styles.positive : styles.negative}>
                        {formatearMoneda(item.diferencia)}
                      </Text>
                    ) : '-'}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Modal de Apertura */}
      <Portal>
        <Modal visible={modalApertura} onDismiss={() => setModalApertura(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.modalTitle}>Abrir Caja</Text>
          <TextInput
            label="Monto Inicial"
            value={montoInicial}
            onChangeText={setMontoInicial}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Affix text="$" />}
          />
          <View style={styles.modalButtons}>
            <Button onPress={() => setModalApertura(false)} style={styles.modalButton}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleAbrirCaja} style={styles.modalButton} loading={loading}>
              Abrir
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Modal de Cierre */}
      <Portal>
        <Modal visible={modalCierre} onDismiss={() => { setModalCierre(false); setResumenCaja(null); }} contentContainerStyle={styles.modal}>
          <ScrollView>
            <Text variant="titleLarge" style={styles.modalTitle}>Cerrar Caja</Text>

            {/* Resumen de Ventas y Movimientos */}
            {resumenCaja && (
              <View style={styles.resumenContainer}>
                <Text variant="titleMedium" style={styles.resumenTitle}>Resumen del Día</Text>

                <View style={styles.resumenRow}>
                  <Text variant="bodyMedium">Monto Inicial:</Text>
                  <Text variant="bodyMedium" style={styles.moneyText}>
                    {formatearMoneda(resumenCaja.caja.montoInicial)}
                  </Text>
                </View>

                <Divider style={styles.divider} />

                <Text variant="labelLarge" style={styles.sectionLabel}>Ventas</Text>
                <View style={styles.resumenRow}>
                  <Text variant="bodySmall">Efectivo:</Text>
                  <Text variant="bodySmall" style={styles.positiveText}>
                    +{formatearMoneda(resumenCaja.ventas.totalEfectivo)}
                  </Text>
                </View>
                <View style={styles.resumenRow}>
                  <Text variant="bodySmall">Tarjeta:</Text>
                  <Text variant="bodySmall">{formatearMoneda(resumenCaja.ventas.totalTarjeta)}</Text>
                </View>
                <View style={styles.resumenRow}>
                  <Text variant="bodySmall">Transferencia:</Text>
                  <Text variant="bodySmall">{formatearMoneda(resumenCaja.ventas.totalTransferencia)}</Text>
                </View>

                <Divider style={styles.divider} />

                <Text variant="labelLarge" style={styles.sectionLabel}>Movimientos de Caja</Text>
                <View style={styles.resumenRow}>
                  <Text variant="bodySmall">Depósitos:</Text>
                  <Text variant="bodySmall" style={styles.positiveText}>
                    +{formatearMoneda(resumenCaja.movimientos.totalDepositos)}
                  </Text>
                </View>
                <View style={styles.resumenRow}>
                  <Text variant="bodySmall">Retiros:</Text>
                  <Text variant="bodySmall" style={styles.negativeText}>
                    -{formatearMoneda(resumenCaja.movimientos.totalRetiros)}
                  </Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.resumenRow}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Monto Esperado:</Text>
                  <Text variant="titleMedium" style={[styles.moneyText, { fontWeight: 'bold' }]}>
                    {formatearMoneda(resumenCaja.montoEsperado)}
                  </Text>
                </View>
              </View>
            )}

            <TextInput
              label="Monto Final en Caja"
              value={montoFinal}
              onChangeText={setMontoFinal}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
            />
            <TextInput
              label="Notas (opcional)"
              value={notasCierre}
              onChangeText={setNotasCierre}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <Button onPress={() => { setModalCierre(false); setResumenCaja(null); }} style={styles.modalButton}>
                Cancelar
              </Button>
              <Button mode="contained" onPress={handleCerrarCaja} style={styles.modalButton} loading={loading}>
                Cerrar
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal de Movimiento */}
      <Portal>
        <Modal visible={modalMovimiento} onDismiss={() => setModalMovimiento(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.modalTitle}>Registrar Movimiento</Text>

          <View style={styles.tipoButtons}>
            <Button
              mode={tipoMovimiento === 'ingreso' ? 'contained' : 'outlined'}
              onPress={() => setTipoMovimiento('ingreso')}
              style={styles.tipoButton}
            >
              Ingreso
            </Button>
            <Button
              mode={tipoMovimiento === 'egreso' ? 'contained' : 'outlined'}
              onPress={() => setTipoMovimiento('egreso')}
              style={styles.tipoButton}
            >
              Egreso
            </Button>
            <Button
              mode={tipoMovimiento === 'retiro' ? 'contained' : 'outlined'}
              onPress={() => setTipoMovimiento('retiro')}
              style={styles.tipoButton}
            >
              Retiro
            </Button>
          </View>

          <TextInput
            label="Monto"
            value={montoMovimiento}
            onChangeText={setMontoMovimiento}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Affix text="$" />}
          />
          <TextInput
            label="Concepto"
            value={conceptoMovimiento}
            onChangeText={setConceptoMovimiento}
            mode="outlined"
            style={styles.input}
          />

          <View style={styles.modalButtons}>
            <Button onPress={() => setModalMovimiento(false)} style={styles.modalButton}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleRegistrarMovimiento} style={styles.modalButton} loading={loading}>
              Registrar
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Snackbar de error */}
      <Snackbar
        visible={!!error}
        onDismiss={limpiarError}
        duration={4000}
        action={{
          label: 'Cerrar',
          onPress: limpiarError,
        }}
      >
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8eff5',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  labelText: {
    fontWeight: '700',
    color: '#555',
    fontSize: 16,
  },
  valueText: {
    fontWeight: '700',
    color: '#1a1a1a',
    fontSize: 16,
  },
  moneyHighlight: {
    fontWeight: '900',
    color: '#2c5f7c',
    fontSize: 22,
    letterSpacing: 0.3,
  },
  statusOpen: {
    color: '#4caf50',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(76, 175, 80, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusClosed: {
    color: '#f44336',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  divider: {
    marginVertical: 20,
    height: 2,
    backgroundColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    elevation: 3,
  },
  closeButton: {
    backgroundColor: '#e53935',
    elevation: 4,
  },
  noCaja: {
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 8,
    color: '#666',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
  },
  openButton: {
    marginTop: 12,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  positive: {
    color: '#4caf50',
    fontWeight: '800',
    fontSize: 15,
  },
  negative: {
    color: '#f44336',
    fontWeight: '800',
    fontSize: 15,
  },
  neutral: {
    color: '#666',
    fontWeight: '700',
    fontSize: 15,
  },
  modal: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalTitle: {
    marginBottom: 24,
    fontWeight: '900',
    fontSize: 24,
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  input: {
    marginBottom: 16,
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
  tipoButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tipoButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
  },
  resumenContainer: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  resumenTitle: {
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 20,
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sectionLabel: {
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
    color: '#2c5f7c',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  moneyText: {
    color: '#2c5f7c',
    fontWeight: '800',
    fontSize: 16,
  },
  positiveText: {
    color: '#2e7d32',
    fontWeight: '800',
    fontSize: 16,
  },
  negativeText: {
    color: '#c62828',
    fontWeight: '800',
    fontSize: 16,
  },
});
