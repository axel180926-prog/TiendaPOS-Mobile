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
          <Card.Title title="Estado de Caja" />
          <Card.Content>
            {cajaActiva ? (
              <View>
                <View style={styles.row}>
                  <Text variant="labelLarge">Estado:</Text>
                  <Text variant="bodyLarge" style={styles.statusOpen}>ABIERTA</Text>
                </View>
                <View style={styles.row}>
                  <Text variant="labelLarge">Apertura:</Text>
                  <Text variant="bodyLarge">
                    {cajaActiva.fechaApertura ? formatearFecha(new Date(cajaActiva.fechaApertura)) : 'N/A'}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text variant="labelLarge">Monto Inicial:</Text>
                  <Text variant="bodyLarge">{formatearMoneda(cajaActiva.montoInicial || 0)}</Text>
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
                    onPress={() => setModalCierre(true)}
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
          <Card.Title title="Historial de Cierres" />
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
                    {item.fechaCierre ? formatearFecha(new Date(item.fechaCierre)) : 'Abierta'}
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
        <Modal visible={modalCierre} onDismiss={() => setModalCierre(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.modalTitle}>Cerrar Caja</Text>
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
            <Button onPress={() => setModalCierre(false)} style={styles.modalButton}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleCerrarCaja} style={styles.modalButton} loading={loading}>
              Cerrar
            </Button>
          </View>
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusOpen: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  statusClosed: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#f44336',
  },
  noCaja: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
  },
  openButton: {
    marginTop: 10,
    backgroundColor: '#4caf50',
  },
  positive: {
    color: '#4caf50',
  },
  negative: {
    color: '#f44336',
  },
  neutral: {
    color: '#666',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 15,
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
  tipoButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  tipoButton: {
    flex: 1,
  },
});
