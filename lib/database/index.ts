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

      // Migración completa: eliminar campo 'precio' viejo y usar solo 'precio_venta'
      const hasPrecio = tableInfo.some((col: any) => col.name === 'precio');
      const hasPrecioVenta = tableInfo.some((col: any) => col.name === 'precio_venta');

      if (hasPrecio && !hasPrecioVenta) {
        console.log('📝 Migrando de "precio" a "precio_venta"...');
        // Crear tabla temporal con estructura nueva
        await expo.execAsync(`
          CREATE TABLE productos_new (
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
          )
        `);

        // Copiar datos de tabla vieja a nueva
        await expo.execAsync(`
          INSERT INTO productos_new (
            id, codigo_barras, nombre, precio_compra, precio_venta, stock, stock_minimo,
            categoria, marca, presentacion, descripcion, sku, unidad_medida, activo, created_at
          )
          SELECT
            id, codigo_barras, nombre,
            COALESCE(precio_compra, 0),
            precio,
            COALESCE(stock, 0),
            COALESCE(stock_minimo, 5),
            categoria, marca, presentacion, descripcion, sku,
            COALESCE(unidad_medida, 'Pieza'),
            COALESCE(activo, 1),
            COALESCE(created_at, CURRENT_TIMESTAMP)
          FROM productos
        `);

        // Eliminar tabla vieja
        await expo.execAsync('DROP TABLE productos');

        // Renombrar tabla nueva
        await expo.execAsync('ALTER TABLE productos_new RENAME TO productos');

        console.log('✅ Migración completada: tabla productos actualizada');
      } else if (!hasPrecioVenta) {
        console.log('📝 Agregando columna precio_venta...');
        await expo.execAsync('ALTER TABLE productos ADD COLUMN precio_venta REAL NOT NULL DEFAULT 0');
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

    // ============================================
    // INICIALIZACIÓN AUTOMÁTICA DE CONFIGURACIÓN
    // ============================================
    console.log('⚙️ Verificando configuración inicial...');

    const configResult = await expo.getAllAsync('SELECT * FROM configuracion WHERE id = 1 LIMIT 1');
    if (configResult.length === 0) {
      console.log('📝 Creando configuración por defecto...');
      await expo.runAsync(`
        INSERT INTO configuracion (
          id,
          nombre_tienda,
          direccion,
          telefono,
          email,
          rfc,
          mensaje_ticket,
          tema,
          tamano_fuente,
          iva_tasa,
          aplicar_iva,
          permitir_descuentos,
          descuento_maximo,
          control_stock,
          alerta_stock_bajo,
          monto_inicial_requerido,
          monto_inicial_minimo
        )
        VALUES (
          1,
          'Mi Tiendita',
          'Calle Principal #123, Col. Centro',
          '555-1234',
          'contacto@mitiendita.com',
          '',
          '¡Gracias por su compra! Vuelva pronto',
          'claro',
          'mediano',
          16,
          1,
          1,
          50,
          1,
          1,
          1,
          500
        )
      `);
      console.log('✅ Configuración inicial creada');
    } else {
      console.log('✅ Configuración ya existe');
    }

    // ============================================
    // ÍNDICES PARA OPTIMIZACIÓN DE RENDIMIENTO
    // ============================================
    console.log('🔍 Creando índices para optimización...');

    try {
      // Índices para productos (búsquedas frecuentes)
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria)');

      // Índices para ventas (consultas de reportes)
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_ventas_caja_id ON ventas(caja_id)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_ventas_metodo_pago ON ventas(metodo_pago)');

      // Índices para venta_items (joins frecuentes)
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id ON venta_items(venta_id)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_venta_items_producto_id ON venta_items(producto_id)');

      // Índices para cajas
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_cajas_estado ON cajas(estado)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_cajas_fecha_apertura ON cajas(fecha_apertura)');

      // Índices para movimientos de caja
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_movimientos_caja_caja_id ON movimientos_caja(caja_id)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_movimientos_caja_fecha ON movimientos_caja(fecha)');

      // Índices para compras
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_compras_proveedor_id ON compras(proveedor_id)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_compras_estado ON compras(estado)');

      // Índices para compra_items
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_compra_items_compra_id ON compra_items(compra_id)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_compra_items_producto_id ON compra_items(producto_id)');

      // Índices para proveedores
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo)');

      // Índices para productos_proveedores
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_productos_proveedores_producto_id ON productos_proveedores(producto_id)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_productos_proveedores_proveedor_id ON productos_proveedores(proveedor_id)');

      // Índices para lista_compras
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_lista_compras_estado ON lista_compras(estado)');
      await expo.execAsync('CREATE INDEX IF NOT EXISTS idx_lista_compras_producto_id ON lista_compras(producto_id)');

      console.log('✅ Índices creados correctamente');
    } catch (indexError) {
      console.log('⚠️ Advertencia al crear índices:', indexError);
      // No lanzar error, los índices son opcionales
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
