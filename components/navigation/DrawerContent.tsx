import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Drawer, Text, Divider, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export function DrawerContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const router = useRouter();

  const menuItems = [
    {
      title: 'Punto de Venta',
      icon: 'cash-register',
      route: '/',
      group: 'ventas',
      color: '#4CAF50',
      gradient: ['#66BB6A', '#4CAF50']
    },
    {
      title: 'Caja',
      icon: 'cash-multiple',
      route: '/caja',
      group: 'ventas',
      color: '#4CAF50',
      gradient: ['#66BB6A', '#4CAF50']
    },
    {
      title: 'Historial de Ventas',
      icon: 'history',
      route: '/historial',
      group: 'ventas',
      color: '#4CAF50',
      gradient: ['#66BB6A', '#4CAF50']
    },
    {
      title: 'Productos',
      icon: 'package-variant',
      route: '/productos',
      group: 'inventario',
      color: '#2196F3',
      gradient: ['#42A5F5', '#2196F3']
    },
    {
      title: 'Inventario',
      icon: 'warehouse',
      route: '/inventario',
      group: 'inventario',
      color: '#2196F3',
      gradient: ['#42A5F5', '#2196F3']
    },
    {
      title: 'Proveedores',
      icon: 'truck-delivery',
      route: '/proveedores',
      group: 'compras',
      color: '#FF9800',
      gradient: ['#FFB74D', '#FF9800']
    },
    {
      title: 'Compras',
      icon: 'cart',
      route: '/compras',
      group: 'compras',
      color: '#FF9800',
      gradient: ['#FFB74D', '#FF9800']
    },
    {
      title: 'Dashboard Ganancias',
      icon: 'chart-line',
      route: '/dashboard',
      group: 'reportes',
      color: '#9C27B0',
      gradient: ['#AB47BC', '#9C27B0']
    },
    {
      title: 'Reportes',
      icon: 'chart-bar',
      route: '/reportes',
      group: 'reportes',
      color: '#9C27B0',
      gradient: ['#AB47BC', '#9C27B0']
    },
    {
      title: 'Configuración',
      icon: 'cog',
      route: '/configuracion',
      group: 'otros',
      color: '#607D8B',
      gradient: ['#78909C', '#607D8B']
    }
  ];

  const groupConfig = {
    ventas: {
      title: 'VENTAS',
      color: '#4CAF50',
      bgColor: '#E8F5E9'
    },
    inventario: {
      title: 'INVENTARIO',
      color: '#2196F3',
      bgColor: '#E3F2FD'
    },
    compras: {
      title: 'COMPRAS',
      color: '#FF9800',
      bgColor: '#FFF3E0'
    },
    reportes: {
      title: 'REPORTES',
      color: '#9C27B0',
      bgColor: '#F3E5F5'
    },
    otros: {
      title: 'CONFIGURACIÓN',
      color: '#607D8B',
      bgColor: '#ECEFF1'
    }
  };

  const renderMenuByGroup = () => {
    const groups: Record<string, typeof menuItems> = {};

    menuItems.forEach(item => {
      if (!groups[item.group]) {
        groups[item.group] = [];
      }
      groups[item.group].push(item);
    });

    return Object.entries(groups).map(([group, items]) => {
      const config = groupConfig[group as keyof typeof groupConfig];

      return (
        <View key={group} style={styles.groupContainer}>
          <View style={[styles.groupHeader, { backgroundColor: config.bgColor }]}>
            <View style={[styles.groupIndicator, { backgroundColor: config.color }]} />
            <Text style={[styles.groupTitle, { color: config.color }]} variant="labelMedium">
              {config.title}
            </Text>
          </View>

          {items.map(item => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={styles.menuItemContainer}
              activeOpacity={0.7}
            >
              <View style={styles.menuItem}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={24}
                    color={item.color}
                  />
                </View>
                <Text style={styles.menuItemText} variant="bodyMedium">
                  {item.title}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#999"
                />
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.groupSpacer} />
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#673AB7', '#512DA8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="store" size={56} color="#fff" />
        </View>
        <Text variant="headlineMedium" style={styles.headerText}>
          TiendaPOS
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtext}>
          Sistema de Punto de Venta
        </Text>
      </LinearGradient>

      {/* Contenido del menú */}
      <DrawerContentScrollView {...props} style={styles.scrollView}>
        <View style={styles.content}>
          {renderMenuByGroup()}
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    paddingTop: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 50,
    marginBottom: 12,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerSubtext: {
    color: '#fff',
    opacity: 0.95,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 20,
  },
  groupContainer: {
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 8,
  },
  groupIndicator: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginRight: 10,
  },
  groupTitle: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  menuItemContainer: {
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  groupSpacer: {
    height: 8,
  },
});
