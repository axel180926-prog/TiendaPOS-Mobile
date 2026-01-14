import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, TextInput, Button, Switch, Divider } from 'react-native-paper';
import * as queries from '@/lib/database/queries';

export default function ConfiguracionScreen() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Campos editables
  const [nombreTienda, setNombreTienda] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensajeTicket, setMensajeTicket] = useState('');
  const [aplicarIva, setAplicarIva] = useState(true);
  const [controlStock, setControlStock] = useState(true);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const data = await queries.obtenerConfiguracion();
      if (data) {
        setConfig(data);
        setNombreTienda(data.nombreTienda || '');
        setDireccion(data.direccion || '');
        setTelefono(data.telefono || '');
        setMensajeTicket(data.mensajeTicket || '');
        setAplicarIva(data.aplicarIva ?? true);
        setControlStock(data.controlStock ?? true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    try {
      setLoading(true);
      await queries.actualizarConfiguracion({
        nombreTienda,
        direccion,
        telefono,
        mensajeTicket,
        aplicarIva,
        controlStock,
      });
      Alert.alert('Éxito', 'Configuración guardada correctamente');
      cargarConfiguracion();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Title title="Información de la Tienda" />
          <Card.Content>
            <TextInput
              label="Nombre de la Tienda"
              value={nombreTienda}
              onChangeText={setNombreTienda}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Dirección"
              value={direccion}
              onChangeText={setDireccion}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />
            <TextInput
              label="Teléfono"
              value={telefono}
              onChangeText={setTelefono}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Configuración de Tickets" />
          <Card.Content>
            <TextInput
              label="Mensaje del Ticket"
              value={mensajeTicket}
              onChangeText={setMensajeTicket}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="¡Gracias por su compra!"
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Configuración del Sistema" />
          <Card.Content>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="titleSmall">Aplicar IVA</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Calcular automáticamente el IVA en las ventas
                </Text>
              </View>
              <Switch value={aplicarIva} onValueChange={setAplicarIva} />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="titleSmall">Control de Stock</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Descontar automáticamente del inventario al vender
                </Text>
              </View>
              <Switch value={controlStock} onValueChange={setControlStock} />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleGuardar}
              loading={loading}
              icon="content-save"
              style={styles.saveButton}
            >
              Guardar Configuración
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.infoSection}>
            <Text variant="labelLarge" style={styles.infoTitle}>
              Información del Sistema
            </Text>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium">Versión:</Text>
              <Text variant="bodyMedium">1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium">Plataforma:</Text>
              <Text variant="bodyMedium">React Native</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium">Base de Datos:</Text>
              <Text variant="bodyMedium">SQLite</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
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
  input: {
    marginBottom: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchInfo: {
    flex: 1,
    paddingRight: 10,
  },
  switchDescription: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 10,
  },
  saveButton: {
    marginTop: 10,
  },
  infoSection: {
    paddingTop: 10,
  },
  infoTitle: {
    marginBottom: 15,
    color: '#2c5f7c',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
});
