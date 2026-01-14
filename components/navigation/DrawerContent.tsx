import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Drawer, Text, Divider, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function DrawerContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const router = useRouter();

  const menuItems = [
    {
      title: 'Punto de Venta',
      icon: 'cash-register',
      route: '/',
      group: 'ventas'
    },
    {
      title: 'Caja',
      icon: 'cash-multiple',
      route: '/caja',
      group: 'ventas'
    },
    {
      title: 'Historial de Ventas',
      icon: 'history',
      route: '/historial',
      group: 'ventas'
    },
    {
      title: 'Productos',
      icon: 'package-variant',
      route: '/productos',
      group: 'inventario'
    },
    {
      title: 'Inventario',
      icon: 'warehouse',
      route: '/inventario',
      group: 'inventario'
    },
    {
      title: 'Catálogo',
      icon: 'book-open-variant',
      route: '/catalogo',
      group: 'inventario'
    },
    {
      title: 'Proveedores',
      icon: 'truck-delivery',
      route: '/proveedores',
      group: 'compras'
    },
    {
      title: 'Compras',
      icon: 'cart',
      route: '/compras',
      group: 'compras'
    },
    {
      title: 'Reportes',
      icon: 'chart-bar',
      route: '/reportes',
      group: 'reportes'
    },
    {
      title: 'Configuración',
      icon: 'cog',
      route: '/configuracion',
      group: 'otros'
    }
  ];

  const groupTitles = {
    ventas: 'VENTAS',
    inventario: 'INVENTARIO',
    compras: 'COMPRAS',
    reportes: 'REPORTES',
    otros: 'OTROS'
  };

  const renderMenuByGroup = () => {
    const groups: Record<string, typeof menuItems> = {};

    menuItems.forEach(item => {
      if (!groups[item.group]) {
        groups[item.group] = [];
      }
      groups[item.group].push(item);
    });

    return Object.entries(groups).map(([group, items]) => (
      <View key={group}>
        <Text style={styles.groupTitle} variant="labelSmall">
          {groupTitles[group as keyof typeof groupTitles]}
        </Text>
        {items.map(item => (
          <Drawer.Item
            key={item.route}
            label={item.title}
            icon={({ size, color }) => (
              <MaterialCommunityIcons
                name={item.icon as any}
                size={size}
                color={color}
              />
            )}
            onPress={() => {
              router.push(item.route as any);
            }}
            style={styles.drawerItem}
          />
        ))}
        <Divider style={styles.divider} />
      </View>
    ));
  };

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <MaterialCommunityIcons name="store" size={48} color="#fff" />
        <Text variant="headlineSmall" style={styles.headerText}>
          TiendaPOS
        </Text>
        <Text variant="bodySmall" style={styles.headerSubtext}>
          Sistema de Punto de Venta
        </Text>
      </View>

      <View style={styles.content}>
        {renderMenuByGroup()}
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
    paddingTop: 40,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
  },
  headerSubtext: {
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  groupTitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontWeight: 'bold',
    opacity: 0.6,
  },
  drawerItem: {
    marginHorizontal: 8,
    borderRadius: 8,
  },
  divider: {
    marginVertical: 8,
  },
});
