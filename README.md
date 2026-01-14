# POS Tienda - Sistema de Punto de Venta Móvil

Sistema completo de punto de venta (POS) desarrollado con React Native y Expo para tiendas de abarrotes mexicanas.

## Características Principales

### ✅ Módulos Completamente Funcionales

- **Punto de Venta (POS)** - Venta rápida con escaneo de códigos de barras
- **Control de Caja** - Apertura, cierre y movimientos de caja
- **Productos** - Gestión completa del catálogo con filtros
- **Inventario** - Control de stock y alertas de stock bajo
- **Proveedores** - Gestión completa de proveedores
- **Compras** - Registro de compras y actualización de inventario
- **Historial** - Registro completo de todas las ventas
- **Reportes** - Estadísticas y productos más vendidos
- **Configuración** - Personalización del sistema

### 🎯 Funcionalidades Destacadas

- ✅ Escaneo de códigos de barras Bluetooth (HID)
- ✅ Múltiples formas de pago (Efectivo, Tarjeta, Transferencia)
- ✅ Impresión de tickets en PDF
- ✅ Base de datos SQLite local (offline-first)
- ✅ 40 productos mexicanos pre-cargados
- ✅ Control automático de inventario
- ✅ Sistema de cajas con corte diario
- ✅ Reportes de ventas en tiempo real
- ✅ Navegación con Drawer (menú lateral)
- ✅ Interfaz profesional con React Native Paper

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar la aplicación
npx expo start
```

### Opciones para ejecutar:
- Presiona `a` para abrir en Android
- Presiona `i` para abrir en iOS
- Escanea el código QR con Expo Go

## Estructura del Proyecto

```
TiendaPOS-Mobile/
├── app/                    # Pantallas de la aplicación
│   ├── index.tsx          # Punto de Venta (POS)
│   ├── caja.tsx           # Control de Caja
│   ├── productos.tsx      # Gestión de Productos
│   ├── inventario.tsx     # Control de Inventario
│   ├── historial.tsx      # Historial de Ventas
│   ├── reportes.tsx       # Reportes y Estadísticas
│   ├── configuracion.tsx  # Configuración
│   ├── proveedores/       # Módulo de Proveedores
│   │   ├── index.tsx      # Lista de proveedores
│   │   ├── agregar.tsx    # Agregar proveedor
│   │   └── editar/[id].tsx # Editar proveedor
│   ├── compras/           # Módulo de Compras
│   │   ├── index.tsx      # Lista de compras
│   │   ├── registrar.tsx  # Registrar compra
│   │   └── detalle/[id].tsx # Detalle de compra
│   └── _layout.tsx        # Navegación Drawer
│
├── lib/
│   ├── database/          # Base de datos SQLite
│   │   ├── schema.ts      # Esquema de 11 tablas
│   │   ├── index.ts       # Inicialización
│   │   └── queries.ts     # Consultas y operaciones
│   │
│   ├── store/             # Zustand stores
│   │   ├── useCartStore.ts
│   │   ├── useProductStore.ts
│   │   └── useConfigStore.ts
│   │
│   ├── bluetooth/         # Integración de hardware
│   │   ├── scanner.ts     # Escáner de códigos
│   │   └── printer.ts     # Impresión de tickets
│   │
│   └── utils/             # Utilidades
│       ├── formatters.ts  # Formateadores de moneda, fechas
│       └── seedData.ts    # Datos iniciales
│
├── components/            # Componentes reutilizables
│   └── navigation/
│       └── CustomDrawerContent.tsx
│
└── assets/
    └── productos/
        └── productos-mexico.json  # 40 productos pre-cargados
```

## Base de Datos

### 11 Tablas Principales

1. **productos** - Catálogo completo con marca, SKU, presentación
2. **ventas** - Registro de ventas
3. **venta_items** - Detalles de cada venta (líneas)
4. **cajas** - Control de apertura/cierre de caja
5. **movimientos_caja** - Ingresos, egresos, retiros
6. **proveedores** - Gestión de proveedores
7. **productos_proveedores** - Relación productos-proveedores
8. **compras** - Registro de compras a proveedores
9. **compra_items** - Detalles de cada compra
10. **lista_compras** - Lista de productos a reordenar
11. **configuracion** - Configuración del sistema

## Uso del Sistema

### Flujo de Trabajo Diario

1. **Abrir Caja** (módulo Caja)
   - Ingresar monto inicial en efectivo
   - Sistema registra apertura con fecha/hora

2. **Realizar Ventas** (módulo POS)
   - Escanear productos o buscar manualmente
   - Ajustar cantidades
   - Seleccionar forma de pago
   - Imprimir ticket

3. **Registrar Movimientos** (módulo Caja)
   - Ingresos adicionales
   - Egresos (gastos)
   - Retiros de efectivo

4. **Cerrar Caja** (módulo Caja)
   - Contar efectivo físico
   - Sistema compara con ventas esperadas
   - Genera reporte de diferencias

5. **Ver Reportes** (módulo Reportes)
   - Total de ventas del día
   - Productos más vendidos
   - Estadísticas generales

### Módulo: Punto de Venta

- **Búsqueda rápida**: Escribe el nombre del producto
- **Escaneo**: Usa un lector Bluetooth como teclado HID
- **Carrito**: Visualiza todos los productos agregados
- **Formas de pago**:
  - Efectivo (con cálculo de cambio)
  - Tarjeta
  - Transferencia
- **Ticket**: Generación automática en PDF

### Módulo: Control de Caja

- **Apertura**: Registra monto inicial obligatorio
- **Movimientos**:
  - Ingresos (ventas con efectivo se registran automáticamente)
  - Egresos (compras, gastos)
  - Retiros (sacar efectivo)
- **Cierre**: Validación de efectivo vs ventas
- **Historial**: Todos los cierres anteriores

### Módulo: Productos

- **Lista completa**: Todos los productos activos
- **Filtros**: Por categoría
- **Búsqueda**: Por nombre o código
- **Información**: Stock, precio, categoría, marca
- **Alertas**: Productos con stock bajo marcados

### Módulo: Inventario

- **Vista general**: Stock actual de todos los productos
- **Filtros**:
  - Todos
  - Stock bajo
  - Agotados
- **Valor total**: Cálculo automático del valor del inventario
- **Alertas visuales**: Productos que necesitan reorden

## Productos Pre-cargados

40 productos mexicanos organizados por categoría:

**Bebidas (10):** Coca-Cola, Sprite, Fanta, Jumex, Del Valle, Agua Ciel
**Botanas (8):** Sabritas, Cheetos, Doritos, Ruffles, Crujitos
**Abarrotes (10):** Maseca, Arroz, Frijoles, Atún, Aceite, Mayonesa
**Panadería (2):** Pan Bimbo blanco e integral
**Galletas (2):** Marías, Emperador
**Dulces (3):** Gansito, Pingüinos, Submarinos
**Sopas (2):** Nissin (res y pollo)
**Limpieza (5):** Zote, Cloralex, Salvo, Papel higiénico
**Lácteos (1):** Huevos

Cada producto incluye código de barras real, precio, stock y categoría.

## Códigos de Barras para Pruebas

- `7501000110049` - Coca-Cola 600ml
- `7501055300013` - Sabritas Original 40g
- `7501005102728` - Salsa Valentina 370ml
- `7501030400053` - Cheetos Flamin Hot 62g
- `7501055300037` - Doritos Nacho 62g

## Tecnologías

### Frontend
- **React Native** 0.81.5
- **Expo** ~54.0
- **TypeScript** ~5.9
- **React Navigation** 7.1 (Drawer)
- **React Native Paper** 5.14

### Base de Datos
- **SQLite** (expo-sqlite ~16.0)
- **Drizzle ORM** 0.45

### Estado
- **Zustand** 5.0
- **React Hook Form** 7.71
- **Zod** 4.3

### Hardware
- **expo-barcode-scanner** ~13.0
- **expo-print** ~15.0
- **expo-sharing** ~14.0

## Desarrollo

### Comandos Útiles

```bash
# Iniciar en modo desarrollo
npm start

# Limpiar caché
npm start -- --clear

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

### Escáneres Bluetooth Recomendados

- Tera HW0002
- Eyoyo Mini
- Inateck BCST-70
- Cualquier escáner HID (teclado)

### Impresoras Térmicas

Actualmente genera PDFs. Para impresión térmica real:
1. Build nativo con `npx expo prebuild`
2. Integrar librería ESC/POS
3. Configurar Bluetooth

## Estado del Proyecto

### ✅ Completado (98%)

- Sistema POS funcional
- Base de datos completa (11 tablas)
- Navegación con Drawer
- 9 módulos implementados
- Control de caja completo
- Gestión de inventario
- Reportes básicos
- 40 productos pre-cargados
- Integración con hardware Bluetooth
- **Formularios CRUD de productos** ✨
- **Agregar/editar productos completo** ✨
- **Módulo de Proveedores completo** ✨
- **Gestión completa de proveedores** ✨
- **Módulo de Compras completo** ✨ NUEVO
- **Ciclo completo de inventario** ✨ NUEVO

### 🚧 En Desarrollo (2%)

- Gráficas de ventas
- Exportación de reportes

## Próximas Funcionalidades

1. **Reportes Avanzados**
   - Gráficas de ventas por período
   - Análisis de tendencias
   - Comparativas

2. **Sincronización**
   - Backup en la nube
   - Sincronización multi-dispositivo

3. **Reportes Avanzados de Compras**
   - Compras por período
   - Compras por proveedor
   - Análisis de costos
   - Tendencias de precios

## Licencia

MIT

## Contacto

Para soporte o consultas sobre el proyecto.

---

**Versión:** 1.0.0
**Actualizado:** Enero 2026
