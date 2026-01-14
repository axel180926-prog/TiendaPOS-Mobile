import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, TextInput, DataTable, FAB, Portal, Modal, Divider } from 'react-native-paper';
import { formatearMoneda, formatearFecha } from '@/lib/utils/formatters';
import * as queries from '@/lib/database/queries';

export default function CajaScreen() {
  const [cajaActual, setCajaActual] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal de apertura
  const [modalApertura, setModalApertura] = useState(false);
  const [montoInicial, setMontoInicial] = useState('');

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
      setLoading(true);
      const caja = await queries.obtenerCajaActual();
      setCajaActual(caja);

      const hist = await queries.obtenerHistorialCajas(10);
      setHistorial(hist);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaja = async () => {
    if (!montoInicial || parseFloat(montoInicial) <= 0) {
      Alert.alert('Error', 'Ingrese un monto inicial válido');
      return;
    }

    try {
      setLoading(true);
      await queries.abrirCaja(parseFloat(montoInicial));
      Alert.alert('Éxito', 'Caja abierta correctamente');
      setModalApertura(false);
      setMontoInicial('');
      cargarDatos();
    } catch (error) {
      console.error('Error al abrir caja:', error);
      Alert.alert('Error', 'No se pudo abrir la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!cajaActual) return;
    if (!montoFinal || parseFloat(montoFinal) < 0) {
      Alert.alert('Error', 'Ingrese un monto final válido');
      return;
    }

    try {
      setLoading(true);
      const resultado = await queries.cerrarCaja(
        cajaActual.id,
        parseFloat(montoFinal),
        notasCierre
      );

      const diferencia = resultado.diferencia || 0;
      const mensaje = diferencia === 0
        ? 'Caja cerrada correctamente. Cuadra perfecto.'
        : diferencia > 0
        ? `Caja cerrada. Sobrante: ${formatearMoneda(diferencia)}`
        : `Caja cerrada. Faltante: ${formatearMoneda(Math.abs(diferencia))}`;

      Alert.alert('Caja Cerrada', mensaje);
      setModalCierre(false);
      setMontoFinal('');
      setNotasCierre('');
      cargarDatos();
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      Alert.alert('Error', 'No se pudo cerrar la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarMovimiento = async () => {
    if (!cajaActual) return;
    if (!montoMovimiento || parseFloat(montoMovimiento) <= 0) {
      Alert.alert('Error', 'Ingrese un monto válido');
      return;
    }

    try {
      setLoading(true);
      await queries.registrarMovimientoCaja(
        cajaActual.id,
        tipoMovimiento,
        parseFloat(montoMovimiento),
        conceptoMovimiento
      );

      Alert.alert('Éxito', 'Movimiento registrado correctamente');
      setModalMovimiento(false);
      setMontoMovimiento('');
      setConceptoMovimiento('');
      cargarDatos();
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      Alert.alert('Error', 'No se pudo registrar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Estado actual */}
        <Card style={styles.card}>
          <Card.Title title="Estado de Caja" />
          <Card.Content>
            {cajaActual ? (
              <View>
                <View style={styles.row}>
                  <Text variant="labelLarge">Estado:</Text>
                  <Text variant="bodyLarge" style={styles.statusOpen}>ABIERTA</Text>
                </View>
                <View style={styles.row}>
                  <Text variant="labelLarge">Apertura:</Text>
                  <Text variant="bodyLarge">
                    {cajaActual.fechaApertura ? formatearFecha(new Date(cajaActual.fechaApertura)) : 'N/A'}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text variant="labelLarge">Monto Inicial:</Text>
                  <Text variant="bodyLarge">{formatearMoneda(cajaActual.montoInicial || 0)}</Text>
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
