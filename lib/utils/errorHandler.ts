/**
 * Sistema Centralizado de Manejo de Errores
 * Proporciona funciones consistentes para mostrar y registrar errores
 */

import { Alert } from 'react-native';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorOptions {
  severity?: ErrorSeverity;
  showAlert?: boolean;
  logToConsole?: boolean;
  retryCallback?: () => void | Promise<void>;
  context?: string;
}

/**
 * Maneja errores de manera centralizada
 */
export function handleError(
  error: Error | string | unknown,
  options: ErrorOptions = {}
): void {
  const {
    severity = 'error',
    showAlert = true,
    logToConsole = true,
    retryCallback,
    context = 'Operación'
  } = options;

  // Convertir el error a mensaje legible
  const errorMessage = parseErrorMessage(error);
  const errorTitle = getErrorTitle(severity);

  // Registrar en consola
  if (logToConsole) {
    const logMessage = `[${severity.toUpperCase()}] ${context}: ${errorMessage}`;

    switch (severity) {
      case 'critical':
      case 'error':
        console.error(logMessage, error);
        break;
      case 'warning':
        console.warn(logMessage, error);
        break;
      case 'info':
        console.info(logMessage, error);
        break;
    }
  }

  // Mostrar alerta al usuario
  if (showAlert) {
    const buttons = retryCallback
      ? [
          { text: 'Cancelar', style: 'cancel' as const },
          { text: 'Reintentar', onPress: () => retryCallback() }
        ]
      : [{ text: 'OK' }];

    Alert.alert(errorTitle, errorMessage, buttons);
  }
}

/**
 * Parsea diferentes tipos de errores a un mensaje legible
 */
function parseErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    // Errores comunes de base de datos
    if (error.message.includes('UNIQUE')) {
      return 'Este registro ya existe en la base de datos. Verifica los datos e intenta nuevamente.';
    }

    if (error.message.includes('NOT NULL')) {
      const field = extractFieldName(error.message);
      return `El campo "${field}" es obligatorio y no puede estar vacío.`;
    }

    if (error.message.includes('FOREIGN KEY')) {
      return 'No se puede completar la operación porque está relacionada con otros registros.';
    }

    // Errores de red
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
    }

    // Errores de permisos
    if (error.message.includes('permission') || error.message.includes('denied')) {
      return 'No tienes permisos suficientes para realizar esta operación.';
    }

    // Error genérico con mensaje
    return error.message;
  }

  // Objeto con propiedad message
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.';
}

/**
 * Extrae el nombre del campo de un mensaje de error NOT NULL
 */
function extractFieldName(message: string): string {
  const match = message.match(/column\s+['"]*(\w+)['"]*\s+/i);
  return match ? match[1] : 'requerido';
}

/**
 * Retorna el título apropiado según la severidad
 */
function getErrorTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case 'critical':
      return '🚨 Error Crítico';
    case 'error':
      return '❌ Error';
    case 'warning':
      return '⚠️ Advertencia';
    case 'info':
      return 'ℹ️ Información';
  }
}

/**
 * Wrapper para ejecutar funciones async con manejo de errores
 */
export async function tryAsync<T>(
  operation: () => Promise<T>,
  options: ErrorOptions = {}
): Promise<{ success: boolean; data?: T; error?: unknown }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    handleError(error, options);
    return { success: false, error };
  }
}

/**
 * Tipos específicos de errores de validación
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Maneja errores de validación de forma específica
 */
export function handleValidationError(field: string, message: string): void {
  Alert.alert(
    '⚠️ Error de Validación',
    `${field}: ${message}`,
    [{ text: 'OK' }]
  );
}

/**
 * Maneja errores de duplicados
 */
export function handleDuplicateError(itemType: string, itemName?: string): void {
  const message = itemName
    ? `Ya existe un ${itemType} con el nombre "${itemName}".`
    : `Este ${itemType} ya existe en el sistema.`;

  Alert.alert(
    '⚠️ Registro Duplicado',
    message,
    [{ text: 'OK' }]
  );
}

/**
 * Muestra mensaje de éxito
 */
export function showSuccess(
  title: string,
  message: string,
  onDismiss?: () => void
): void {
  Alert.alert(
    `✅ ${title}`,
    message,
    [{ text: 'OK', onPress: onDismiss }]
  );
}

/**
 * Solicita confirmación al usuario antes de una acción
 */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmText: string = 'Confirmar',
  cancelText: string = 'Cancelar'
): void {
  Alert.alert(
    title,
    message,
    [
      { text: cancelText, style: 'cancel' },
      { text: confirmText, onPress: () => onConfirm(), style: 'destructive' }
    ]
  );
}

/**
 * Muestra advertencia con opción de continuar
 */
export async function warnAndContinue(
  title: string,
  message: string,
  continueText: string = 'Continuar',
  cancelText: string = 'Cancelar'
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      `⚠️ ${title}`,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        { text: continueText, onPress: () => resolve(true) }
      ]
    );
  });
}
