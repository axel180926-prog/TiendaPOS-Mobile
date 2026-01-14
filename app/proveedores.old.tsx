import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';

export default function ProveedoresScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Cover source={{ uri: 'https://via.placeholder.com/400x200/2c5f7c/ffffff?text=Proveedores' }} />
          <Card.Content style={styles.content}>
            <Text variant="headlineMedium" style={styles.title}>
              Gestión de Proveedores
            </Text>
            <Text variant="bodyLarge" style={styles.description}>
              Este módulo está en desarrollo. Aquí podrás gestionar:
            </Text>
            <View style={styles.features}>
              <Text variant="bodyMedium" style={styles.feature}>• Agregar y editar proveedores</Text>
              <Text variant="bodyMedium" style={styles.feature}>• Información de contacto</Text>
              <Text variant="bodyMedium" style={styles.feature}>• Productos que suministran</Text>
              <Text variant="bodyMedium" style={styles.feature}>• Historial de compras</Text>
              <Text variant="bodyMedium" style={styles.feature}>• Días de entrega y formas de pago</Text>
            </View>
            <Button mode="contained" style={styles.button} disabled>
              Próximamente
            </Button>
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
    margin: 20,
  },
  content: {
    paddingVertical: 20,
  },
  title: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#2c5f7c',
  },
  description: {
    marginBottom: 15,
    color: '#666',
  },
  features: {
    marginVertical: 10,
  },
  feature: {
    paddingVertical: 5,
    color: '#333',
  },
  button: {
    marginTop: 20,
  },
});
