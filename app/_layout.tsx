import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Drawer } from 'expo-router/drawer';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/components/useColorScheme';
import { initDatabase } from '@/lib/database';
import { cargarProductosIniciales } from '@/lib/utils/seedData';
import { DrawerContent } from '@/components/navigation/DrawerContent';
import { useConfigStore } from '@/lib/store/useConfigStore';
import { useIsDarkTheme } from '@/lib/theme/useTheme';
import { necesitaBackupAutomatico, crearBackupAutomatico } from '@/lib/utils/backup';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(drawer)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    async function setupDatabase() {
      try {
        console.log('🔧 Inicializando base de datos...');
        await initDatabase();
        await cargarProductosIniciales();

        // Cargar configuración inicial
        console.log('⚙️ Cargando configuración...');
        await useConfigStore.getState().cargarConfiguracion();

        // Verificar y crear backup automático si es necesario
        console.log('🔍 Verificando necesidad de backup automático...');
        const necesitaBackup = await necesitaBackupAutomatico(7);
        if (necesitaBackup) {
          console.log('💾 Creando backup automático...');
          const backupCreado = await crearBackupAutomatico();
          if (backupCreado) {
            console.log('✅ Backup automático creado exitosamente');
          } else {
            console.log('⚠️ No se pudo crear el backup automático');
          }
        } else {
          console.log('ℹ️ No es necesario crear backup automático en este momento');
        }

        setDbInitialized(true);
        console.log('✅ Base de datos y configuración listas');
      } catch (error) {
        console.error('❌ Error al inicializar:', error);
        setDbInitialized(true);
      }
    }

    setupDatabase();
  }, []);

  useEffect(() => {
    if (loaded && dbInitialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbInitialized]);

  if (!loaded || !dbInitialized) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const isDark = useIsDarkTheme();

  // Determinar el tema basado en la configuración del usuario
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;
  const paperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  // Colores dinámicos basados en el tema
  const headerBg = isDark ? '#1E1E1E' : '#2c5f7c';
  const drawerActiveTint = isDark ? '#42A5F5' : '#2c5f7c';
  const drawerInactiveTint = isDark ? '#B0B0B0' : '#666';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={navigationTheme}>
          <Drawer
            drawerContent={(props) => <DrawerContent {...props} />}
            screenOptions={{
              headerShown: true,
              headerStyle: {
                backgroundColor: headerBg,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              drawerActiveTintColor: drawerActiveTint,
              drawerInactiveTintColor: drawerInactiveTint,
            }}
          >
            <Drawer.Screen
              name="index"
              options={{
                drawerLabel: 'Punto de Venta',
                headerTitle: 'POS Tienda',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="shopping-cart" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="caja"
              options={{
                drawerLabel: 'Control de Caja',
                headerTitle: 'Control de Caja',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="money" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="productos"
              options={{
                drawerLabel: 'Productos',
                headerTitle: 'Gestión de Productos',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="cubes" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="inventario"
              options={{
                drawerLabel: 'Inventario',
                headerTitle: 'Control de Inventario',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="list-alt" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="catalogo"
              options={{
                drawerLabel: 'Catálogo',
                headerTitle: 'Catálogo de Productos',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="book" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="historial"
              options={{
                drawerLabel: 'Historial',
                headerTitle: 'Historial de Ventas',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="history" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="reportes"
              options={{
                drawerLabel: 'Reportes',
                headerTitle: 'Reportes y Estadísticas',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="bar-chart" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="configuracion"
              options={{
                drawerLabel: 'Configuración',
                headerTitle: 'Configuración',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="cog" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="productos/agregar"
              options={{
                drawerItemStyle: { display: 'none' },
                headerTitle: 'Agregar Producto',
              }}
            />
            <Drawer.Screen
              name="productos/editar/[id]"
              options={{
                drawerItemStyle: { display: 'none' },
                headerTitle: 'Editar Producto',
              }}
            />
            <Drawer.Screen
              name="proveedores/index"
              options={{
                drawerLabel: 'Proveedores',
                headerTitle: 'Gestión de Proveedores',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="truck" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="proveedores/agregar"
              options={{
                drawerItemStyle: { display: 'none' },
                headerTitle: 'Agregar Proveedor',
              }}
            />
            <Drawer.Screen
              name="proveedores/editar/[id]"
              options={{
                drawerItemStyle: { display: 'none' },
                headerTitle: 'Editar Proveedor',
              }}
            />
            <Drawer.Screen
              name="compras/index"
              options={{
                drawerLabel: 'Compras',
                headerTitle: 'Gestión de Compras',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="shopping-cart" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="compras/registrar"
              options={{
                drawerItemStyle: { display: 'none' },
                headerTitle: 'Registrar Compra',
              }}
            />
            <Drawer.Screen
              name="compras/detalle/[id]"
              options={{
                drawerItemStyle: { display: 'none' },
                headerTitle: 'Detalle de Compra',
              }}
            />
            <Drawer.Screen
              name="dashboard"
              options={{
                drawerLabel: 'Dashboard Ganancias',
                headerTitle: 'Dashboard de Ganancias',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="line-chart" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="+not-found"
              options={{
                drawerItemStyle: { display: 'none' },
              }}
            />
          </Drawer>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
