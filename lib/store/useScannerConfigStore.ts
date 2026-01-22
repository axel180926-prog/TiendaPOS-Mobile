import { create } from 'zustand';

interface ScannerConfig {
  // Feedback
  vibracionHabilitada: boolean;
  sonidoHabilitado: boolean;
  flashVisualHabilitado: boolean;

  // Display
  mostrarContador: boolean;
  mostrarHistorial: boolean;
  historialTamano: number;

  // Camera
  linternaHabilitada: boolean;
  marcoEscaneoVisible: boolean;

  // Modo rápido
  modoRapidoHabilitado: boolean;

  // Brightness
  ajusteBrilloAutomatico: boolean;

  // Actions
  setVibracion: (enabled: boolean) => void;
  setSonido: (enabled: boolean) => void;
  setFlashVisual: (enabled: boolean) => void;
  setMostrarContador: (enabled: boolean) => void;
  setMostrarHistorial: (enabled: boolean) => void;
  setHistorialTamano: (size: number) => void;
  setLinternaHabilitada: (enabled: boolean) => void;
  setMarcoEscaneo: (enabled: boolean) => void;
  setModoRapido: (enabled: boolean) => void;
  setAjusteBrillo: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const defaultConfig = {
  vibracionHabilitada: true,
  sonidoHabilitado: true,
  flashVisualHabilitado: true,
  mostrarContador: true,
  mostrarHistorial: true,
  historialTamano: 5,
  linternaHabilitada: true,
  marcoEscaneoVisible: true,
  modoRapidoHabilitado: true,
  ajusteBrilloAutomatico: false,
};

export const useScannerConfigStore = create<ScannerConfig>((set) => ({
  ...defaultConfig,

  setVibracion: (enabled) => set({ vibracionHabilitada: enabled }),
  setSonido: (enabled) => set({ sonidoHabilitado: enabled }),
  setFlashVisual: (enabled) => set({ flashVisualHabilitado: enabled }),
  setMostrarContador: (enabled) => set({ mostrarContador: enabled }),
  setMostrarHistorial: (enabled) => set({ mostrarHistorial: enabled }),
  setHistorialTamano: (size) => set({ historialTamano: size }),
  setLinternaHabilitada: (enabled) => set({ linternaHabilitada: enabled }),
  setMarcoEscaneo: (enabled) => set({ marcoEscaneoVisible: enabled }),
  setModoRapido: (enabled) => set({ modoRapidoHabilitado: enabled }),
  setAjusteBrillo: (enabled) => set({ ajusteBrilloAutomatico: enabled }),
  resetToDefaults: () => set(defaultConfig),
}));
