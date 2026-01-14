import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un número como moneda mexicana
 */
export function formatearMoneda(cantidad: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(cantidad);
}

/**
 * Formatea un número sin símbolo de moneda
 */
export function formatearNumero(cantidad: number, decimales: number = 2): string {
  return cantidad.toFixed(decimales);
}

/**
 * Formatea una fecha en formato corto (dd/MM/yyyy)
 */
export function formatearFechaCorta(fecha: Date | string): string {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return format(fechaObj, 'dd/MM/yyyy', { locale: es });
}

/**
 * Formatea una fecha con hora (dd/MM/yyyy HH:mm)
 */
export function formatearFechaHora(fecha: Date | string): string {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return format(fechaObj, 'dd/MM/yyyy HH:mm', { locale: es });
}

/**
 * Formatea una fecha de forma relativa (hace 5 minutos, ayer, etc.)
 */
export function formatearFechaRelativa(fecha: Date | string): string {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const ahora = new Date();
  const diferencia = ahora.getTime() - fechaObj.getTime();

  const minutos = Math.floor(diferencia / 60000);
  const horas = Math.floor(diferencia / 3600000);
  const dias = Math.floor(diferencia / 86400000);

  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  if (dias < 7) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;

  return formatearFechaCorta(fechaObj);
}

/**
 * Genera un folio único para una venta
 */
export function generarFolio(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `V-${timestamp}-${random}`;
}

/**
 * Formatea un código de barras para visualización
 */
export function formatearCodigoBarras(codigo: string): string {
  if (codigo.length === 13) {
    // EAN-13: XXX-XXXX-XXXX-X
    return `${codigo.slice(0, 3)}-${codigo.slice(3, 7)}-${codigo.slice(7, 12)}-${codigo.slice(12)}`;
  }
  if (codigo.length === 12) {
    // UPC-A: XXX-XXX-XXX-XXX
    return `${codigo.slice(0, 3)}-${codigo.slice(3, 6)}-${codigo.slice(6, 9)}-${codigo.slice(9)}`;
  }
  return codigo;
}

/**
 * Calcula el porcentaje de ganancia
 */
export function calcularPorcentajeGanancia(precioCompra: number, precioVenta: number): number {
  if (precioCompra === 0) return 0;
  return ((precioVenta - precioCompra) / precioCompra) * 100;
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncarTexto(texto: string, longitudMaxima: number): string {
  if (texto.length <= longitudMaxima) return texto;
  return texto.substring(0, longitudMaxima - 3) + '...';
}

/**
 * Formatea un número de teléfono mexicano
 */
export function formatearTelefono(telefono: string): string {
  // Remover caracteres no numéricos
  const numeros = telefono.replace(/\D/g, '');

  if (numeros.length === 10) {
    // Formato: (XXX) XXX-XXXX
    return `(${numeros.slice(0, 3)}) ${numeros.slice(3, 6)}-${numeros.slice(6)}`;
  }

  return telefono;
}

/**
 * Valida si una cadena es un código de barras válido
 */
export function esCodigoBarrasValido(codigo: string): boolean {
  // Debe ser numérico y tener entre 8 y 13 dígitos
  const regex = /^\d{8,13}$/;
  return regex.test(codigo);
}
