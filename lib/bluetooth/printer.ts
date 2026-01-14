import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ProductoTicket {
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface TicketData {
  nombreTienda: string;
  direccion: string;
  telefono: string;
  rfc?: string;
  folio: string;
  fecha: Date;
  productos: ProductoTicket[];
  subtotal: number;
  iva: number;
  total: number;
  formaPago: string;
  montoRecibido?: number;
  cambio?: number;
  mensajeFinal?: string;
}

/**
 * Genera el HTML del ticket de venta
 */
function generarHTMLTicket(data: TicketData): string {
  const fechaFormateada = format(data.fecha, "dd/MM/yyyy HH:mm:ss", { locale: es });

  const productosHTML = data.productos.map(p => `
    <tr>
      <td style="text-align: left; padding: 4px 0;">${p.nombre}</td>
    </tr>
    <tr>
      <td style="text-align: left; padding: 0 0 8px 10px; font-size: 11px;">
        ${p.cantidad} x $${p.precioVenta.toFixed(2)} = $${p.subtotal.toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        @page {
          margin: 10mm;
          size: 80mm auto;
        }

        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          max-width: 80mm;
        }

        .ticket {
          width: 100%;
        }

        .center {
          text-align: center;
        }

        .bold {
          font-weight: bold;
        }

        .separator {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        .totals {
          margin-top: 10px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }

        .final-total {
          font-size: 14px;
          font-weight: bold;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <!-- Encabezado -->
        <div class="center bold" style="font-size: 14px; margin-bottom: 5px;">
          ${data.nombreTienda}
        </div>
        <div class="center" style="font-size: 11px;">
          ${data.direccion}
        </div>
        <div class="center" style="font-size: 11px;">
          Tel: ${data.telefono}
        </div>
        ${data.rfc ? `<div class="center" style="font-size: 11px;">RFC: ${data.rfc}</div>` : ''}

        <div class="separator"></div>

        <!-- Información de la venta -->
        <div style="font-size: 11px;">
          <div>Folio: ${data.folio}</div>
          <div>Fecha: ${fechaFormateada}</div>
        </div>

        <div class="separator"></div>

        <!-- Productos -->
        <table>
          <tbody>
            ${productosHTML}
          </tbody>
        </table>

        <div class="separator"></div>

        <!-- Totales -->
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${data.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>IVA (16%):</span>
            <span>$${data.iva.toFixed(2)}</span>
          </div>
          <div class="total-row final-total">
            <span>TOTAL:</span>
            <span>$${data.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="separator"></div>

        <!-- Forma de pago -->
        <div style="font-size: 11px;">
          <div class="bold">Forma de pago: ${data.formaPago.toUpperCase()}</div>
          ${data.formaPago === 'efectivo' && data.montoRecibido ? `
            <div>Recibido: $${data.montoRecibido.toFixed(2)}</div>
            <div>Cambio: $${(data.cambio || 0).toFixed(2)}</div>
          ` : ''}
        </div>

        <div class="separator"></div>

        <!-- Mensaje final -->
        <div class="center" style="font-size: 11px; margin-top: 10px;">
          ${data.mensajeFinal || '¡Gracias por su compra!'}
        </div>
        <div class="center" style="font-size: 10px; margin-top: 5px;">
          Vuelva pronto
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Imprime un ticket de venta
 *
 * NOTA: En Expo Go, esto generará un PDF que se puede compartir.
 * En una app compilada (bare workflow) con impresora térmica bluetooth,
 * necesitarás usar react-native-bluetooth-escpos-printer o similar.
 *
 * @param data - Datos del ticket
 * @param options - Opciones de impresión
 */
export async function imprimirTicket(
  data: TicketData,
  options: {
    compartir?: boolean; // Si se debe compartir el PDF en lugar de imprimir
    imprimir?: boolean;  // Si se debe enviar a la impresora
  } = { compartir: false, imprimir: true }
): Promise<{ success: boolean; error?: string; uri?: string }> {
  try {
    const html = generarHTMLTicket(data);

    // Generar PDF
    const { uri } = await Print.printToFileAsync({ html });

    // Si se debe compartir
    if (options.compartir) {
      await shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Ticket ${data.folio}`
      });
    }

    // Si se debe imprimir (abre el diálogo de impresión del sistema)
    if (options.imprimir) {
      await Print.printAsync({ html });
    }

    return { success: true, uri };
  } catch (error) {
    console.error('Error al imprimir ticket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Previsualizar un ticket sin imprimir
 */
export async function previsualizarTicket(data: TicketData): Promise<string> {
  const html = generarHTMLTicket(data);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Configuración para impresoras térmicas bluetooth (para bare workflow)
 *
 * Cuando se compile la app y se use con una impresora térmica real,
 * deberás reemplazar la implementación de imprimirTicket con algo como:
 *
 * import {
 *   BluetoothManager,
 *   BluetoothEscposPrinter
 * } from 'react-native-bluetooth-escpos-printer';
 *
 * export async function imprimirTicketTermica(data: TicketData) {
 *   // Conectar a la impresora
 *   await BluetoothManager.connect(printerAddress);
 *
 *   // Configurar impresión
 *   await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
 *   await BluetoothEscposPrinter.printText(data.nombreTienda + "\n", {
 *     encoding: 'GBK',
 *     codepage: 0,
 *     widthtimes: 1,
 *     heigthtimes: 1,
 *     fonttype: 1
 *   });
 *
 *   // ... continuar con el resto del ticket
 *
 *   // Cortar papel
 *   await BluetoothEscposPrinter.cutPartial();
 *
 *   // Abrir cajón (si está conectado)
 *   await BluetoothEscposPrinter.openCashBox();
 * }
 */

/**
 * Función para abrir el cajón de dinero (requiere bare workflow y hardware)
 *
 * La mayoría de cajones se abren con un comando ESC/POS enviado a la impresora
 */
export async function abrirCajon(): Promise<boolean> {
  try {
    // Comando ESC/POS para abrir cajón: ESC p m t1 t2
    // En React Native con impresora térmica, sería algo como:
    // await BluetoothEscposPrinter.openCashBox();

    console.log('Abriendo cajón de dinero...');
    // Por ahora, solo registramos la acción
    return true;
  } catch (error) {
    console.error('Error al abrir cajón:', error);
    return false;
  }
}

/**
 * Tipos de impresoras soportadas
 */
export enum TipoImpresora {
  PDF = 'pdf',           // Generación de PDF (Expo Go)
  TERMICA = 'termica',   // Impresora térmica bluetooth (bare workflow)
  SISTEMA = 'sistema'    // Impresora del sistema
}

/**
 * Configuración de impresora
 */
export interface ConfiguracionImpresora {
  tipo: TipoImpresora;
  nombre?: string;
  direccionBluetooth?: string;
  anchoPapel?: 58 | 80; // mm
}
