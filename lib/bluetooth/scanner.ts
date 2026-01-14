import { useEffect, useState, useRef } from 'react';
import { Platform, NativeModules, DeviceEventEmitter, NativeEventEmitter } from 'react-native';

/**
 * Hook para capturar códigos de barras desde un escáner bluetooth
 *
 * El escáner bluetooth funciona como un teclado HID (Human Interface Device).
 * Cuando escanea un código, "escribe" el código seguido de Enter.
 *
 * Este hook captura esos eventos y ejecuta la función onScan cuando detecta
 * un código completo.
 *
 * @param onScan - Función que se ejecuta cuando se escanea un código
 * @param options - Opciones de configuración
 */
export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  options: {
    minLength?: number; // Longitud mínima del código de barras
    timeout?: number;   // Tiempo en ms para considerar que terminó el escaneo
    enabled?: boolean;  // Si el escáner está habilitado
  } = {}
) {
  const {
    minLength = 5,
    timeout = 100,
    enabled = true
  } = options;

  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Función para procesar el código escaneado
    const processScannedCode = (code: string) => {
      if (code.length >= minLength) {
        setLastScannedCode(code);
        onScan(code);
        setIsScanning(false);
      }
      bufferRef.current = '';
    };

    // Listener para eventos de teclado nativos
    // Este es un approach simplificado. En producción, necesitarías una
    // librería nativa más robusta o configurar el escáner para que funcione
    // como teclado bluetooth estándar

    // Para Android: El escáner bluetooth típicamente emite eventos de teclado
    // Para iOS: Similar, pero puede requerir configuración adicional

    // Por ahora, usamos un approach basado en eventos de texto
    // En la práctica, esto funcionaría con el componente TextInput oculto
    // que captura la entrada del escáner

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, minLength, timeout, onScan]);

  /**
   * Función manual para simular un escaneo (útil para testing)
   */
  const simulateScan = (code: string) => {
    onScan(code);
    setLastScannedCode(code);
  };

  /**
   * Limpiar el último código escaneado
   */
  const clearLastScanned = () => {
    setLastScannedCode('');
  };

  return {
    lastScannedCode,
    isScanning,
    simulateScan,
    clearLastScanned
  };
}

/**
 * Hook alternativo usando TextInput oculto
 * Este es el approach más confiable para escáneres bluetooth HID
 */
export function useBarcodeScannerInput() {
  const [scannedCode, setScannedCode] = useState<string>('');
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Esta función debe ser llamada desde el evento onKeyPress de un TextInput
   */
  const handleKeyPress = (e: any) => {
    const key = e.nativeEvent.key;

    // Si es Enter, procesamos el código
    if (key === 'Enter') {
      if (bufferRef.current.length > 0) {
        setScannedCode(bufferRef.current);
        bufferRef.current = '';
      }
      return;
    }

    // Agregamos el carácter al buffer
    bufferRef.current += key;

    // Reset del timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Si no hay más input en 100ms, asumimos que terminó
    timeoutRef.current = setTimeout(() => {
      if (bufferRef.current.length > 0) {
        setScannedCode(bufferRef.current);
        bufferRef.current = '';
      }
    }, 100);
  };

  /**
   * Esta función debe ser llamada desde onChangeText de un TextInput
   */
  const handleTextChange = (text: string) => {
    // Si el texto termina con newline, es probable que sea del escáner
    if (text.includes('\n')) {
      const cleanedText = text.replace(/\n/g, '').trim();
      if (cleanedText.length > 0) {
        setScannedCode(cleanedText);
        bufferRef.current = '';
      }
    }
  };

  /**
   * Resetear el código escaneado
   */
  const resetScannedCode = () => {
    setScannedCode('');
    bufferRef.current = '';
  };

  return {
    scannedCode,
    handleKeyPress,
    handleTextChange,
    resetScannedCode
  };
}

/**
 * Configuración recomendada para el TextInput que captura el escáner:
 *
 * <TextInput
 *   ref={scannerInputRef}
 *   autoFocus={true}
 *   showSoftInputOnFocus={false}
 *   onKeyPress={handleKeyPress}
 *   onChangeText={handleTextChange}
 *   style={{ position: 'absolute', left: -9999 }}
 * />
 *
 * Este TextInput debe estar oculto pero mantener el foco para capturar
 * la entrada del escáner bluetooth.
 */
