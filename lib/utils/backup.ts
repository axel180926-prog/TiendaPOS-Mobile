/**
 * Sistema de Backup y Restauración
 * Permite exportar e importar la base de datos completa
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { db } from '../database';
import * as schema from '../database/schema';
import * as queries from '../database/queries';

// Directorio para backups automáticos
const getBackupDir = () => `${FileSystem.documentDirectory}backups/`;
const BACKUP_DIR = getBackupDir();

/**
 * Inicializar directorio de backups
 */
export async function initBackupDirectory() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
      console.log('📁 Directorio de backups creado:', BACKUP_DIR);
    }
  } catch (error) {
    console.error('Error al crear directorio de backups:', error);
  }
}

/**
 * Generar nombre de archivo de backup
 */
function generarNombreBackup(): string {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const hora = String(fecha.getHours()).padStart(2, '0');
  const min = String(fecha.getMinutes()).padStart(2, '0');

  return `tiendapos_backup_${año}${mes}${dia}_${hora}${min}.json`;
}

/**
 * Obtener todos los datos de la base de datos
 */
async function obtenerTodosLosDatos() {
  try {
    console.log('📊 Extrayendo datos de la base de datos...');

    // Obtener todos los datos de todas las tablas
    const [
      productos,
      ventas,
      ventaItems,
      cajas,
      movimientosCaja,
      proveedores,
      productosProveedores,
      compras,
      compraItems,
      listaCompras,
      configuracion
    ] = await Promise.all([
      queries.obtenerProductos(),
      queries.obtenerVentas(10000), // Todas las ventas
      db.select().from(schema.ventaItems),
      queries.obtenerHistorialCajas(10000), // Todas las cajas
      db.select().from(schema.movimientosCaja),
      queries.obtenerProveedores(),
      db.select().from(schema.productosProveedores),
      queries.obtenerCompras(10000), // Todas las compras
      db.select().from(schema.compraItems),
      queries.obtenerListaCompras(),
      queries.obtenerConfiguracion()
    ]);

    return {
      version: '1.0',
      fecha: new Date().toISOString(),
      datos: {
        productos,
        ventas,
        ventaItems,
        cajas,
        movimientosCaja,
        proveedores,
        productosProveedores,
        compras,
        compraItems,
        listaCompras,
        configuracion
      },
      estadisticas: {
        totalProductos: productos.length,
        totalVentas: ventas.length,
        totalProveedores: proveedores.length,
        totalCompras: compras.length
      }
    };
  } catch (error) {
    console.error('Error al obtener datos:', error);
    throw error;
  }
}

/**
 * Crear backup manual - El usuario puede compartirlo
 */
export async function crearBackupManual(): Promise<boolean> {
  try {
    console.log('💾 Creando backup manual...');

    // Obtener todos los datos
    const datosBackup = await obtenerTodosLosDatos();

    // Generar nombre de archivo
    const nombreArchivo = generarNombreBackup();
    const rutaArchivo = `${FileSystem.cacheDirectory}${nombreArchivo}`;

    // Guardar datos en archivo JSON
    await FileSystem.writeAsStringAsync(
      rutaArchivo,
      JSON.stringify(datosBackup, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    console.log('✅ Backup creado:', rutaArchivo);

    // Verificar si se puede compartir
    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      // Compartir archivo (puede enviarse por WhatsApp, Email, Drive, etc.)
      await Sharing.shareAsync(rutaArchivo, {
        mimeType: 'application/json',
        dialogTitle: 'Guardar backup de TiendaPOS',
        UTI: 'public.json'
      });

      return true;
    } else {
      Alert.alert(
        'Backup Creado',
        `Archivo guardado en: ${rutaArchivo}\n\nPor favor, copia este archivo a un lugar seguro.`,
        [{ text: 'OK' }]
      );
      return true;
    }
  } catch (error) {
    console.error('Error al crear backup manual:', error);
    Alert.alert(
      'Error',
      'No se pudo crear el backup. Por favor intenta de nuevo.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

/**
 * Crear backup automático - Se guarda en el dispositivo
 */
export async function crearBackupAutomatico(): Promise<boolean> {
  try {
    console.log('🤖 Creando backup automático...');

    // Inicializar directorio
    await initBackupDirectory();

    // Obtener todos los datos
    const datosBackup = await obtenerTodosLosDatos();

    // Generar nombre de archivo
    const nombreArchivo = generarNombreBackup();
    const rutaArchivo = `${BACKUP_DIR}${nombreArchivo}`;

    // Guardar datos en archivo JSON
    await FileSystem.writeAsStringAsync(
      rutaArchivo,
      JSON.stringify(datosBackup, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    console.log('✅ Backup automático creado:', rutaArchivo);

    // Limpiar backups antiguos (mantener solo los últimos 10)
    await limpiarBackupsAntiguos();

    return true;
  } catch (error) {
    console.error('Error al crear backup automático:', error);
    return false;
  }
}

/**
 * Limpiar backups antiguos (mantener solo los últimos 10)
 */
async function limpiarBackupsAntiguos() {
  try {
    const archivos = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const backups = archivos
      .filter(f => f.startsWith('tiendapos_backup_') && f.endsWith('.json'))
      .sort()
      .reverse(); // Más recientes primero

    // Si hay más de 10 backups, eliminar los antiguos
    if (backups.length > 10) {
      const backupsAEliminar = backups.slice(10);

      for (const backup of backupsAEliminar) {
        await FileSystem.deleteAsync(`${BACKUP_DIR}${backup}`, { idempotent: true });
        console.log('🗑️ Backup antiguo eliminado:', backup);
      }
    }
  } catch (error) {
    console.error('Error al limpiar backups antiguos:', error);
  }
}

/**
 * Listar todos los backups disponibles
 */
export async function listarBackups(): Promise<Array<{ nombre: string; ruta: string; fecha: Date; tamaño: number }>> {
  try {
    await initBackupDirectory();

    const archivos = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const backups = archivos.filter(f => f.startsWith('tiendapos_backup_') && f.endsWith('.json'));

    const backupsConInfo = await Promise.all(
      backups.map(async (nombre) => {
        const ruta = `${BACKUP_DIR}${nombre}`;
        const info = await FileSystem.getInfoAsync(ruta);

        if (!info.exists) {
          return null;
        }

        return {
          nombre,
          ruta,
          fecha: new Date(info.modificationTime * 1000),
          tamaño: info.size || 0
        };
      })
    );

    // Filtrar nulls (archivos que no existen)
    const backupsValidos = backupsConInfo.filter((backup): backup is NonNullable<typeof backup> => backup !== null);

    // Ordenar por fecha, más recientes primero
    return backupsValidos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  } catch (error) {
    console.error('Error al listar backups:', error);
    return [];
  }
}

/**
 * Compartir un backup existente
 */
export async function compartirBackup(ruta: string): Promise<boolean> {
  try {
    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      await Sharing.shareAsync(ruta, {
        mimeType: 'application/json',
        dialogTitle: 'Compartir backup de TiendaPOS',
        UTI: 'public.json'
      });
      return true;
    } else {
      Alert.alert(
        'No Disponible',
        'La función de compartir no está disponible en este dispositivo.',
        [{ text: 'OK' }]
      );
      return false;
    }
  } catch (error) {
    console.error('Error al compartir backup:', error);
    Alert.alert('Error', 'No se pudo compartir el backup.');
    return false;
  }
}

/**
 * Eliminar un backup
 */
export async function eliminarBackup(ruta: string): Promise<boolean> {
  try {
    await FileSystem.deleteAsync(ruta, { idempotent: true });
    console.log('🗑️ Backup eliminado:', ruta);
    return true;
  } catch (error) {
    console.error('Error al eliminar backup:', error);
    return false;
  }
}

/**
 * Obtener información del último backup
 */
export async function obtenerUltimoBackup(): Promise<{ fecha: Date; ruta: string } | null> {
  try {
    const backups = await listarBackups();

    if (backups.length > 0) {
      return {
        fecha: backups[0].fecha,
        ruta: backups[0].ruta
      };
    }

    return null;
  } catch (error) {
    console.error('Error al obtener último backup:', error);
    return null;
  }
}

/**
 * Formatear tamaño de archivo
 */
export function formatearTamaño(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Verificar si es hora de hacer backup automático
 * Retorna true si han pasado más de X días desde el último backup
 */
export async function necesitaBackupAutomatico(diasIntervalo: number = 7): Promise<boolean> {
  try {
    const ultimoBackup = await obtenerUltimoBackup();

    if (!ultimoBackup) {
      return true; // No hay backups, hacer uno
    }

    const ahora = new Date();
    const diferenciaDias = Math.floor((ahora.getTime() - ultimoBackup.fecha.getTime()) / (1000 * 60 * 60 * 24));

    return diferenciaDias >= diasIntervalo;
  } catch (error) {
    console.error('Error al verificar necesidad de backup:', error);
    return false;
  }
}
