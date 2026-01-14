import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Divider } from 'react-native-paper';

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>POS Tienda</Text>
          <Text style={styles.subtitle}>Sistema de Punto de Venta</Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <DrawerItemList {...props} />

      <Divider style={styles.divider} />

      <View style={styles.footer}>
        <Text style={styles.version}>Versión 1.0.0</Text>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#2c5f7c',
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  divider: {
    marginVertical: 10,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: '#999',
  },
});
