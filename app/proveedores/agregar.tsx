import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { db } from '@/lib/database';
import { proveedores } from '@/lib/database/schema';

export default function AgregarProveedorScreen() {
  const [loading, setLoading] = useState(false);

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [rfc, setRfc] = useState('');
  const [productosSuministra, setProductosSuministra] = useState('');
  const [diasEntrega, setDiasEntrega] = useState('7');
  const [formaPago, setFormaPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');

  const validarFormulario = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del proveedor es obligatorio');
      return false;
    }
    if (diasEntrega && parseInt(diasEntrega) < 0) {
      Alert.alert('Error', 'Los días de entrega deben ser 0 o mayores');
      return false;
    }
    return true;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    try {
      setLoading(true);

      const nuevoProveedor = {
        nombre: nombre.trim(),
        contacto: contacto.trim() || undefined,
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        direccion: direccion.trim() || undefined,
        rfc: rfc.trim() || undefined,
        productosSuministra: productosSuministra.trim() || undefined,
        diasEntrega: diasEntrega ? parseInt(diasEntrega) : 7,
        formaPago: formaPago || 'Efectivo',
        notas: notas.trim() || undefined,
      };

      await db.insert(proveedores).values(nuevoProveedor);

      Alert.alert('Éxito', 'Proveedor agregado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      Alert.alert('Error', 'No se pudo guardar el proveedor');
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
            label="Nombre del Proveedor *"
            value={nombre}
            onChangeText={setNombre}
            mode="outlined"
            style={styles.input}
            placeholder="Abarrotes Don José"
          />

          <TextInput
            label="Nombre de Contacto"
            value={contacto}
            onChangeText={setContacto}
            mode="outlined"
            style={styles.input}
            placeholder="José García"
          />

          <TextInput
            label="RFC"
            value={rfc}
            onChangeText={setRfc}
            mode="outlined"
            style={styles.input}
            autoCapitalize="characters"
            placeholder="XAXX010101000"
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Información de Contacto" />
        <Card.Content>
          <TextInput
            label="Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            placeholder="555-1234-5678"
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            placeholder="contacto@proveedor.com"
          />

          <TextInput
            label="Dirección"
            value={direccion}
            onChangeText={setDireccion}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="Calle, Número, Colonia, CP, Ciudad"
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Detalles Comerciales" />
        <Card.Content>
          <TextInput
            label="Productos que Suministra"
            value={productosSuministra}
            onChangeText={setProductosSuministra}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
            placeholder="Abarrotes, Bebidas, Botanas"
          />

          <TextInput
            label="Días de Entrega"
            value={diasEntrega}
            onChangeText={setDiasEntrega}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="7"
          />

          <TextInput
            label="Forma de Pago"
            value={formaPago}
            onChangeText={setFormaPago}
            mode="outlined"
            style={styles.input}
            placeholder="Efectivo, Transferencia, Crédito"
          />

          <TextInput
            label="Notas"
            value={notas}
            onChangeText={setNotas}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="Notas adicionales sobre el proveedor"
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
