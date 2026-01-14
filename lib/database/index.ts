import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// Abrir la base de datos
const expo = SQLite.openDatabaseSync('tiendapos.db');

// Crear instancia de Drizzle
export const db = drizzle(expo, { schema });

// Función para inicializar la base de datos
export async function initDatabase() {
  try {
    console.log('🔧 Inicializando base de datos...');

    // ============================================
    // TABLA: PRODUCTOS
    // ============================================
    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_barras TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        precio_compra REAL DEFAULT 0,
        precio_venta REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 5,
        categoria TEXT,
        marca TEXT,
        presentacion TEXT,
        descripcion TEXT,
        sku TEXT,
        unidad_medida TEXT DEFAULT 'Pieza',
        activo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ============================================
    // MIGRACIONES: Agregar columnas faltantes
    // ============================================
    try {
      // Verificar qué columnas existen
      const tableInfo = await expo.getAllAsync(`PRAGMA table_info(productos)`);
      const hasColumnas = {
        precio_compra: tableInfo.some((col: any) => col.name === 'precio_compra'),
        precio_venta: tableInfo.some((col: any) => col.name === 'precio_venta'),
        marca: tableInfo.some((col: any) => col.name === 'marca'),
        presentacion: tableInfo.some((col: any) => col.name === 'presentacion'),
        sku: tableInfo.some((col: any) => col.name === 'sku'),
        activo: tableInfo.some((col: any) => col.name === 'activo'),
      };

      console.log('🔍 Columnas existentes en productos:', tableInfo.map((col: any) => col.name).join(', '));

      // Agregar precio_compra si no existe
      if (!hasColumnas.precio_compra) {
        console.log('📝 Agregando columna precio_compra...');
        await expo.execAsync('ALTER TABLE productos ADD COLUMN precio_compra REAL DEFAULT 0');
      }

      // Agregar precio_venta si no existe (renombrar desde precio si existe)
      if (!hasColumnas.precio_venta) {
        const hasPrecio = tableInfo.some((col: any) => col.name === 'precio');
        if (hasPrecio) {
          console.log('📝 Renombrando columna precio a precio_venta...');
          // SQLite no soporta RENAME COLUMN directamente en versiones antiguas
          // Necesitamos copiar los datos
          await expo.execAsync('ALTER TABLE productos ADD COLUMN precio_venta REAL DEFAULT 0');
          await expo.execAsync('UPDATE productos SET precio_venta = precio WHERE precio IS NOT NULL');
        } else {
          console.log('📝 Agregando columna precio_venta...');
          await expo.execAsync('ALTER TABLE productos ADD COLUMN precio_venta REAL DEFAULT 0');
        }
      }

      // Agregar marca si no existe
      if (!hasColumnas.marca) {
        console.log('📝 Agregando columna marca...');
        await expo.execAsync('ALTER TABLE productos ADD COLUMN marca TEXT');
      }

      // Agregar presentacion si no existe
      if (!hasColumnas.presentacion) {
        console.log('📝 Agregando columna presentacion...');
        await expo.execAsync('ALTER TABLE productos ADD COLUMN presentacion TEXT');
      }

      // Agregar sku si no existe
      if (!hasColumnas.sku) {
        console.log('📝 Agregando columna sku...');
        await expo.execAsync('ALTER TABLE productos ADD COLUMN sku TEXT');
      }

      // Agregar activo si no existe
      if (!hasColumnas.activo) {
        console.log('📝 Agregando columna activo...');
        await expo.execAsync('ALTER TABLE productos ADD COLUMN activo INTEGER DEFAULT 1');
      }

      console.log('✅ Migraciones completadas');
    } catch (migrationError) {
      console.log('⚠️ Error en migraciones:', migrationError);
      // No lanzar error, continuar con la inicialización
    }

    // ============================================
    // TABLA: VENTAS
    // ============================================
    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP,
        metodo_pago TEXT,
        caja_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (caja_id) REFERENCES cajas(id)
      );
    `);

    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS venta_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      );
    `);

    // ============================================
    // TABLA: CAJAS
    // ============================================
    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS cajas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_apertura TEXT DEFAULT CURRENT_TIMESTAMP,
        fecha_cierre TEXT,
        monto_inicial REAL NOT NULL,
        monto_final REAL,
        monto_esperado REAL,
        diferencia REAL,
        estado TEXT DEFAULT 'abierta',
        notas TEXT
      );
    `);

    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS movimientos_caja (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        caja_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        monto REAL NOT NULL,
        concepto TEXT,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (caja_id) REFERENCES cajas(id)
      );
    `);

    // ============================================
    // TABLA: PROVEEDORES
    // ============================================
    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        contacto TEXT,
        telefono TEXT,
        email TEXT,
        direccion TEXT,
        rfc TEXT,
        productos_suministra TEXT,
        dias_entrega INTEGER DEFAULT 7,
        forma_pago TEXT DEFAULT 'Efectivo',
        notas TEXT,
        activo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS productos_proveedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        proveedor_id INTEGER NOT NULL,
        precio_proveedor REAL,
        tiempo_entrega_dias INTEGER DEFAULT 7,
        producto_estrella INTEGER DEFAULT 0,
        notas TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(id),
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
      );
    `);

    // ============================================
    // TABLA: COMPRAS
    // ============================================
    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS compras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proveedor_id INTEGER NOT NULL,
        folio TEXT,
        total REAL NOT NULL,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP,
        fecha_entrega TEXT,
        forma_pago TEXT DEFAULT 'Efectivo',
        estado TEXT DEFAULT 'pendiente',
        notas TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
      );
    `);

    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS compra_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        compra_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (compra_id) REFERENCES compras(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      );
    `);

    // ============================================
    // TABLA: LISTA DE COMPRAS
    // ============================================
    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS lista_compras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        cantidad_sugerida INTEGER NOT NULL,
        cantidad_comprar INTEGER,
        prioridad TEXT DEFAULT 'media',
        estado TEXT DEFAULT 'pendiente',
        notas TEXT,
        fecha_agregado TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      );
    `);

    // ============================================
    // TABLA: CONFIGURACIÓN
    // ============================================
    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        nombre_tienda TEXT DEFAULT 'MI TIENDA',
        direccion TEXT,
        telefono TEXT,
        email TEXT,
        rfc TEXT,
        mensaje_ticket TEXT DEFAULT '¡Gracias por su compra!',
        logo_base64 TEXT,

        tema TEXT DEFAULT 'claro',
        tamano_fuente TEXT DEFAULT 'mediano',

        iva_tasa REAL DEFAULT 16,
        aplicar_iva INTEGER DEFAULT 1,
        permitir_descuentos INTEGER DEFAULT 1,
        descuento_maximo REAL DEFAULT 50,
        control_stock INTEGER DEFAULT 1,
        alerta_stock_bajo INTEGER DEFAULT 1,

        monto_inicial_requerido INTEGER DEFAULT 1,
        monto_inicial_minimo REAL DEFAULT 500,

        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insertar configuración por defecto si no existe
    const configResult = await expo.getAllAsync('SELECT * FROM configuracion WHERE id = 1 LIMIT 1');
    if (configResult.length === 0) {
      await expo.runAsync(`
        INSERT INTO configuracion (id, nombre_tienda, direccion, telefono, mensaje_ticket)
        VALUES (1, 'Mi Tiendita', 'Calle Principal #123', '555-1234', '¡Gracias por su compra! Vuelva pronto')
      `);
    }

    console.log('✅ Base de datos inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
}

// Función para limpiar la base de datos (útil para desarrollo)
export async function clearDatabase() {
  try {
    console.log('🗑️ Limpiando base de datos...');

    // Eliminar en orden inverso debido a las foreign keys
    await expo.execAsync('DROP TABLE IF EXISTS compra_items;');
    await expo.execAsync('DROP TABLE IF EXISTS compras;');
    await expo.execAsync('DROP TABLE IF EXISTS venta_items;');
    await expo.execAsync('DROP TABLE IF EXISTS ventas;');
    await expo.execAsync('DROP TABLE IF EXISTS productos_proveedores;');
    await expo.execAsync('DROP TABLE IF EXISTS lista_compras;');
    await expo.execAsync('DROP TABLE IF EXISTS movimientos_caja;');
    await expo.execAsync('DROP TABLE IF EXISTS cajas;');
    await expo.execAsync('DROP TABLE IF EXISTS productos;');
    await expo.execAsync('DROP TABLE IF EXISTS proveedores;');
    await expo.execAsync('DROP TABLE IF EXISTS configuracion;');

    console.log('✅ Base de datos limpiada');
    await initDatabase();
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    throw error;
  }
}

// Función para obtener información de la base de datos
export async function getDatabaseInfo() {
  try {
    const tables = await expo.getAllAsync(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    console.log('📊 Tablas en la base de datos:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.name}`);
    });

    return tables;
  } catch (error) {
    console.error('Error al obtener información de BD:', error);
    return [];
  }
}

export { schema };
