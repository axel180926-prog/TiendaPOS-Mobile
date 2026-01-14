import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Drawer } from 'expo-router/drawer';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/components/useColorScheme';
import { initDatabase } from '@/lib/database';
import { cargarProductosIniciales } from '@/lib/utils/seedData';
import { DrawerContent } from '@/components/navigation/DrawerContent';

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
        setDbInitialized(true);
        console.log('✅ Base de datos lista');
      } catch (error) {
        console.error('❌ Error al inicializar base de datos:', error);
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
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Drawer
            drawerContent={(props) => <DrawerContent {...props} />}
            screenOptions={{
              headerShown: true,
              headerStyle: {
                backgroundColor: '#2c5f7c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              drawerActiveTintColor: '#2c5f7c',
              drawerInactiveTintColor: '#666',
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
              name="proveedores"
              options={{
                drawerLabel: 'Proveedores',
                headerTitle: 'Gestión de Proveedores',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="truck" size={size} color={color} />
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
                drawerItemStyle: { display: 'none' },
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
              name="proveedores.old"
              options={{
                drawerItemStyle: { display: 'none' },
              }}
            />
            <Drawer.Screen
              name="compras"
              options={{
                drawerLabel: 'Compras',
                headerTitle: 'Gestión de Compras',
                drawerIcon: ({ color, size }) => (
                  <FontAwesome name="shopping-bag" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="compras/index"
              options={{
                drawerItemStyle: { display: 'none' },
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
