import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Card, Text, TextInput, Button, Switch, Divider, List, IconButton, SegmentedButtons } from 'react-native-paper';
import { useConfigStore } from '@/lib/store/useConfigStore';
import { useScannerConfigStore } from '@/lib/store/useScannerConfigStore';
import {
  crearBackupManual,
  listarBackups,
  compartirBackup,
  eliminarBackup,
  formatearTamaño,
  obtenerUltimoBackup
} from '@/lib/utils/backup';
import { recargarProductosForzado } from '@/lib/utils/seedData';

export default function ConfiguracionScreen() {
  const { configuracion, actualizarConfiguracion: actualizarConfig, cargarConfiguracion } = useConfigStore();
  const scannerConfig = useScannerConfigStore();
  const [loading, setLoading] = useState(false);

  // Campos editables
  const [nombreTienda, setNombreTienda] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensajeTicket, setMensajeTicket] = useState('');
  const [aplicarIva, setAplicarIva] = useState(true);
  const [controlStock, setControlStock] = useState(true);
  const [modoOscuro, setModoOscuro] = useState(false);
  const [imprimirTicketAutomatico, setImprimirTicketAutomatico] = useState(true);

  // Estados para backups
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [ultimoBackup, setUltimoBackup] = useState<{ fecha: Date } | null>(null);

  useEffect(() => {
    cargarDatos();
    cargarBackups();
  }, []);

  useEffect(() => {
    if (configuracion) {
      setNombreTienda(configuracion.nombreTienda || '');
      setDireccion(configuracion.direccion || '');
      setTelefono(configuracion.telefono || '');
      setMensajeTicket(configuracion.mensajeTicket || '');
      setAplicarIva(configuracion.aplicarIva ?? true);
      setControlStock(configuracion.controlStock ?? true);
      setModoOscuro(configuracion.tema === 'oscuro');
      setImprimirTicketAutomatico(configuracion.imprimirTicketAutomatico ?? true);
    }
  }, [configuracion]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      await cargarConfiguracion();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    try {
      setLoading(true);

      const datosConfig = {
        nombreTienda,
        direccion,
        telefono,
        mensajeTicket,
        aplicarIva,
        controlStock,
        imprimirTicketAutomatico,
        tema: modoOscuro ? 'oscuro' : 'claro',
      };

      console.log('💾 Guardando configuración:');
      console.log('  - Control Stock:', controlStock);
      console.log('  - Tema:', datosConfig.tema);

      await actualizarConfig(datosConfig);

      console.log('✅ Configuración guardada exitosamente');
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const cargarBackups = async () => {
    try {
      setLoadingBackups(true);
      const listaBackups = await listarBackups();
      setBackups(listaBackups);

      const ultimo = await obtenerUltimoBackup();
      setUltimoBackup(ultimo);
    } catch (error) {
      console.error('Error al cargar backups:', error);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCrearBackup = async () => {
    Alert.alert(
      '💾 Crear Backup',
      'Se creará una copia de seguridad de todos los datos de la aplicación. Podrás compartirla por WhatsApp, Email, Drive, etc.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear Backup',
          onPress: async () => {
            setLoading(true);
            const exito = await crearBackupManual();
            setLoading(false);

            if (exito) {
              Alert.alert(
                'Éxito',
                '✅ Backup creado correctamente.\n\nAsegúrate de guardar el archivo en un lugar seguro (Google Drive, Email, etc.).',
                [{ text: 'OK' }]
              );
              cargarBackups();
            }
          }
        }
      ]
    );
  };

  const handleCompartirBackup = async (ruta: string, nombre: string) => {
    setLoadingBackups(true);
    await compartirBackup(ruta);
    setLoadingBackups(false);
  };

  const handleEliminarBackup = async (ruta: string, nombre: string) => {
    Alert.alert(
      'Eliminar Backup',
      `¿Estás seguro de eliminar el backup "${nombre}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const exito = await eliminarBackup(ruta);
            if (exito) {
              Alert.alert('Éxito', 'Backup eliminado correctamente');
              cargarBackups();
            }
          }
        }
      ]
    );
  };

  const formatearFecha = (fecha: Date): string => {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${año} ${hora}:${min}`;
  };

  const handleResetearProductos = async () => {
    Alert.alert(
      '⚠️ Resetear Productos',
      '¿Estás seguro de que deseas eliminar TODOS los productos y recargarlos desde el archivo JSON?\n\nEsta acción eliminará:\n• Todos los productos actuales\n• Los cambios que hayas hecho manualmente\n\nSe recargarán 234 productos verificados desde el catálogo actualizado.\n\nEsta acción NO se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('🔄 Iniciando reseteo de productos...');
              await recargarProductosForzado();
              setLoading(false);
              Alert.alert(
                '✅ Éxito',
                'Los productos han sido reseteados correctamente.\n\n234 productos cargados desde el catálogo verificado.'
              );
            } catch (error) {
              setLoading(false);
              console.error('❌ Error al resetear productos:', error);
              Alert.alert('Error', 'No se pudieron resetear los productos. Intenta de nuevo.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Title title="Información de la Tienda" />
          <Card.Content>
            <TextInput
              label="Nombre de la Tienda"
              value={nombreTienda}
              onChangeText={setNombreTienda}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Dirección"
              value={direccion}
              onChangeText={setDireccion}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />
            <TextInput
              label="Teléfono"
              value={telefono}
              onChangeText={setTelefono}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Configuración de Tickets" />
          <Card.Content>
            <TextInput
              label="Mensaje del Ticket"
              value={mensajeTicket}
              onChangeText={setMensajeTicket}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="¡Gracias por su compra!"
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Apariencia" />
          <Card.Content>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="titleSmall">🌙 Modo Oscuro</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Activar tema oscuro en toda la aplicación
                </Text>
              </View>
              <Switch value={modoOscuro} onValueChange={setModoOscuro} />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Configuración del Sistema" />
          <Card.Content>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="titleSmall">Control de Stock</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Descontar automáticamente del inventario al vender
                </Text>
              </View>
              <Switch value={controlStock} onValueChange={setControlStock} />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="titleSmall">🖨️ Imprimir Ticket Automático</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Mostrar opciones de impresión después de cada venta
                </Text>
              </View>
              <Switch value={imprimirTicketAutomatico} onValueChange={setImprimirTicketAutomatico} />
            </View>
          </Card.Content>
        </Card>

        {/* Configuración del Escáner de Códigos */}
        <Card style={styles.card}>
          <Card.Title
            title="📷 Configuración del Escáner"
            subtitle="Personaliza cómo funciona el escáner de códigos de barras"
          />
          <Card.Content>
            {/* Feedback */}
            <Text variant="titleSmall" style={styles.sectionTitle}>Retroalimentación</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="bodyMedium">📳 Vibración</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Vibrar al escanear exitosamente
                </Text>
              </View>
              <Switch
                value={scannerConfig.vibracionHabilitada}
                onValueChange={scannerConfig.setVibracion}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="bodyMedium">✨ Flash Visual</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Mostrar flash verde al escanear
                </Text>
              </View>
              <Switch
                value={scannerConfig.flashVisualHabilitado}
                onValueChange={scannerConfig.setFlashVisual}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="bodyMedium">🔊 Sonido Beep</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Reproducir sonido al escanear exitosamente
                </Text>
              </View>
              <Switch
                value={scannerConfig.sonidoHabilitado}
                onValueChange={scannerConfig.setSonido}
              />
            </View>

            <Divider style={styles.divider} />

            {/* Display */}
            <Text variant="titleSmall" style={[styles.sectionTitle, {marginTop: 16}]}>Visualización</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="bodyMedium">🔢 Contador de Escaneos</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Mostrar cuántos productos has escaneado
                </Text>
              </View>
              <Switch
                value={scannerConfig.mostrarContador}
                onValueChange={scannerConfig.setMostrarContador}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="bodyMedium">📋 Historial de Códigos</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Ver últimos códigos escaneados
                </Text>
              </View>
              <Switch
                value={scannerConfig.mostrarHistorial}
                onValueChange={scannerConfig.setMostrarHistorial}
              />
            </View>

            {scannerConfig.mostrarHistorial && (
              <>
                <Text variant="bodySmall" style={styles.historialLabel}>
                  Tamaño del historial: {scannerConfig.historialTamano}
                </Text>
                <SegmentedButtons
                  value={scannerConfig.historialTamano.toString()}
                  onValueChange={(value) => scannerConfig.setHistorialTamano(parseInt(value))}
                  buttons={[
                    { value: '3', label: '3' },
                    { value: '5', label: '5' },
                    { value: '10', label: '10' },
                  ]}
                  style={styles.segmentedButtons}
                />
              </>
            )}

            <Divider style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="bodyMedium">🎯 Marco de Escaneo</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Mostrar guía visual en la cámara
                </Text>
              </View>
              <Switch
                value={scannerConfig.marcoEscaneoVisible}
                onValueChange={scannerConfig.setMarcoEscaneo}
              />
            </View>

            <Divider style={styles.divider} />

            {/* Features */}
            <Text variant="titleSmall" style={[styles.sectionTitle, {marginTop: 16}]}>Funcionalidades</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="bodyMedium">🔦 Linterna</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Activar linterna en ambientes oscuros
                </Text>
              </View>
              <Switch
                value={scannerConfig.linternaHabilitada}
                onValueChange={scannerConfig.setLinternaHabilitada}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="bodyMedium">⚡ Modo Rápido de Cantidad</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Opciones rápidas (+1, +2, +5, +10) para productos repetidos
                </Text>
              </View>
              <Switch
                value={scannerConfig.modoRapidoHabilitado}
                onValueChange={scannerConfig.setModoRapido}
              />
            </View>

            <Divider style={styles.divider} />

            {/* Reset */}
            <Button
              mode="outlined"
              onPress={() => {
                Alert.alert(
                  'Restaurar configuración',
                  '¿Restaurar todas las opciones del escáner a valores predeterminados?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Restaurar',
                      onPress: () => {
                        scannerConfig.resetToDefaults();
                        Alert.alert('Éxito', 'Configuración restaurada');
                      }
                    }
                  ]
                );
              }}
              style={{marginTop: 16}}
            >
              Restaurar Valores Predeterminados
            </Button>
          </Card.Content>
        </Card>

        {/* Sección de Backups */}
        <Card style={styles.card}>
          <Card.Title
            title="💾 Copias de Seguridad"
            subtitle="Protege tus datos creando backups regulares"
          />
          <Card.Content>
            {/* Último backup */}
            {ultimoBackup && (
              <View style={styles.ultimoBackupContainer}>
                <Text variant="bodySmall" style={styles.ultimoBackupLabel}>
                  📅 Último backup:
                </Text>
                <Text variant="bodyMedium" style={styles.ultimoBackupFecha}>
                  {formatearFecha(ultimoBackup.fecha)}
                </Text>
              </View>
            )}

            {/* Botón crear backup manual */}
            <Button
              mode="contained"
              onPress={handleCrearBackup}
              loading={loading}
              icon="backup-restore"
              style={styles.backupButton}
              buttonColor="#4caf50"
            >
              Crear Backup Ahora
            </Button>

            <Divider style={styles.divider} />

            {/* Lista de backups */}
            <Text variant="titleSmall" style={styles.backupsListTitle}>
              Backups Guardados ({backups.length})
            </Text>

            {loadingBackups ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2c5f7c" />
              </View>
            ) : backups.length === 0 ? (
              <View style={styles.noBackupsContainer}>
                <Text variant="bodySmall" style={styles.noBackupsText}>
                  No hay backups guardados aún.
                  {'\n'}
                  Crea tu primer backup para proteger tus datos.
                </Text>
              </View>
            ) : (
              backups.slice(0, 5).map((backup, index) => (
                <List.Item
                  key={index}
                  title={formatearFecha(backup.fecha)}
                  description={`${formatearTamaño(backup.tamaño)}`}
                  left={props => <List.Icon {...props} icon="file-document" color="#2c5f7c" />}
                  right={props => (
                    <View style={styles.backupActions}>
                      <IconButton
                        icon="share-variant"
                        size={20}
                        iconColor="#2196f3"
                        onPress={() => handleCompartirBackup(backup.ruta, backup.nombre)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#f44336"
                        onPress={() => handleEliminarBackup(backup.ruta, backup.nombre)}
                      />
                    </View>
                  )}
                  style={styles.backupItem}
                />
              ))
            )}

            {/* Información de backup */}
            <View style={styles.backupInfo}>
              <Text variant="bodySmall" style={styles.backupInfoText}>
                ℹ️ Los backups se guardan automáticamente cada 7 días.
                {'\n'}
                Se mantienen los últimos 10 backups automáticos.
                {'\n'}
                Puedes compartir backups por WhatsApp, Email o Drive.
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleGuardar}
              loading={loading}
              icon="content-save"
              style={styles.saveButton}
            >
              Guardar Configuración
            </Button>
          </Card.Content>
        </Card>

        {/* Sección de Mantenimiento */}
        <Card style={styles.card}>
          <Card.Title
            title="🔧 Mantenimiento de Base de Datos"
            subtitle="Operaciones avanzadas para administrar los datos"
          />
          <Card.Content>
            <View style={styles.dangerZone}>
              <Text variant="bodySmall" style={styles.dangerText}>
                ⚠️ Zona de peligro: estas acciones no se pueden deshacer
              </Text>
            </View>

            <Button
              mode="outlined"
              onPress={handleResetearProductos}
              loading={loading}
              icon="refresh"
              style={styles.dangerButton}
              textColor="#f44336"
            >
              Resetear Productos a Valores Iniciales
            </Button>

            <Text variant="bodySmall" style={styles.resetInfoText}>
              Esta opción eliminará TODOS los productos y los recargará desde el archivo JSON base (90 productos).
              Útil si necesitas restaurar el catálogo original.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.infoSection}>
            <Text variant="labelLarge" style={styles.infoTitle}>
              Información del Sistema
            </Text>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium">Versión:</Text>
              <Text variant="bodyMedium">1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium">Plataforma:</Text>
              <Text variant="bodyMedium">React Native</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium">Base de Datos:</Text>
              <Text variant="bodyMedium">SQLite</Text>
            </View>
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
    margin: 10,
  },
  input: {
    marginBottom: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchInfo: {
    flex: 1,
    paddingRight: 10,
  },
  switchDescription: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 10,
  },
  saveButton: {
    marginTop: 10,
  },
  infoSection: {
    paddingTop: 10,
  },
  infoTitle: {
    marginBottom: 15,
    color: '#2c5f7c',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoText: {
    color: '#1565c0',
    fontSize: 14,
    lineHeight: 20,
  },
  ultimoBackupContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ultimoBackupLabel: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  ultimoBackupFecha: {
    color: '#1b5e20',
    fontWeight: '700',
  },
  backupButton: {
    marginBottom: 15,
  },
  backupsListTitle: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noBackupsContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 10,
  },
  noBackupsText: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  backupItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backupInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  backupInfoText: {
    color: '#1565c0',
    lineHeight: 18,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 12,
    marginTop: 8,
  },
  historialLabel: {
    marginTop: 8,
    marginBottom: 8,
    color: '#666',
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  dangerZone: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  dangerText: {
    color: '#c62828',
    fontWeight: '600',
    textAlign: 'center',
  },
  dangerButton: {
    marginBottom: 10,
    borderColor: '#f44336',
  },
  resetInfoText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },
});
