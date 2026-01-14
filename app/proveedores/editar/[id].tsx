import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '@/lib/database';
import { proveedores } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export default function EditarProveedorScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [rfc, setRfc] = useState('');
  const [productosSuministra, setProductosSuministra] = useState('');
  const [diasEntrega, setDiasEntrega] = useState('');
  const [formaPago, setFormaPago] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    cargarProveedor();
  }, [id]);

  const cargarProveedor = async () => {
    try {
      setCargando(true);
      const result = await db.select()
        .from(proveedores)
        .where(eq(proveedores.id, Number(id)));

      const proveedor = result[0];

      if (!proveedor) {
        Alert.alert('Error', 'Proveedor no encontrado');
        router.back();
        return;
      }

      setNombre(proveedor.nombre || '');
      setContacto(proveedor.contacto || '');
      setTelefono(proveedor.telefono || '');
      setEmail(proveedor.email || '');
      setDireccion(proveedor.direccion || '');
      setRfc(proveedor.rfc || '');
      setProductosSuministra(proveedor.productosSuministra || '');
      setDiasEntrega(proveedor.diasEntrega?.toString() || '');
      setFormaPago(proveedor.formaPago || '');
      setNotas(proveedor.notas || '');
    } catch (error) {
      console.error('Error al cargar proveedor:', error);
      Alert.alert('Error', 'No se pudo cargar el proveedor');
    } finally {
      setCargando(false);
    }
  };

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

      const datosActualizados = {
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
        updatedAt: new Date().toISOString(),
      };

      await db.update(proveedores)
        .set(datosActualizados)
        .where(eq(proveedores.id, Number(id)));

      Alert.alert('Éxito', 'Proveedor actualizado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      Alert.alert('Error', 'No se pudo actualizar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
          />

          <TextInput
            label="Nombre de Contacto"
            value={contacto}
            onChangeText={setContacto}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="RFC"
            value={rfc}
            onChangeText={setRfc}
            mode="outlined"
            style={styles.input}
            autoCapitalize="characters"
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
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Dirección"
            value={direccion}
            onChangeText={setDireccion}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
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
          />

          <TextInput
            label="Días de Entrega"
            value={diasEntrega}
            onChangeText={setDiasEntrega}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
