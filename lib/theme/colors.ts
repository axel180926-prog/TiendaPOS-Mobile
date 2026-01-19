/**
 * Sistema de Temas - Modo Claro y Oscuro
 * Colores consistentes para toda la aplicación
 */

export const lightTheme = {
  // Colores principales
  primary: '#2c5f7c',
  primaryLight: '#42A5F5',
  primaryDark: '#1a3d52',

  // Colores secundarios
  secondary: '#4CAF50',
  secondaryLight: '#81C784',
  secondaryDark: '#2e7d32',

  // Fondos
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceVariant: '#f5f5f5',

  // Textos
  text: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#ffffff',

  // Bordes
  border: '#e0e0e0',
  borderLight: '#f0f0f0',

  // Estados
  error: '#d32f2f',
  errorLight: '#ffebee',
  warning: '#ff9800',
  warningLight: '#fff3e0',
  success: '#4caf50',
  successLight: '#e8f5e9',
  info: '#2196f3',
  infoLight: '#e3f2fd',

  // Componentes específicos
  card: '#ffffff',
  cardElevated: '#ffffff',
  input: '#ffffff',
  inputBorder: '#e0e0e0',

  // Módulos por color
  ventas: '#4CAF50',
  ventasGradient: ['#66BB6A', '#4CAF50'],
  inventario: '#2196F3',
  inventarioGradient: ['#42A5F5', '#2196F3'],
  compras: '#FF9800',
  comprasGradient: ['#FFB74D', '#FF9800'],
  reportes: '#9C27B0',
  reportesGradient: ['#AB47BC', '#9C27B0'],
  otros: '#607D8B',
  otrosGradient: ['#78909C', '#607D8B'],
};

export const darkTheme = {
  // Colores principales
  primary: '#42A5F5',
  primaryLight: '#64B5F6',
  primaryDark: '#1976D2',

  // Colores secundarios
  secondary: '#66BB6A',
  secondaryLight: '#81C784',
  secondaryDark: '#43A047',

  // Fondos
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',

  // Textos
  text: '#E0E0E0',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textInverse: '#1a1a1a',

  // Bordes
  border: '#3C3C3C',
  borderLight: '#2C2C2C',

  // Estados
  error: '#EF5350',
  errorLight: '#3C1F1F',
  warning: '#FFB74D',
  warningLight: '#3C2F1F',
  success: '#66BB6A',
  successLight: '#1F3C20',
  info: '#42A5F5',
  infoLight: '#1F2F3C',

  // Componentes específicos
  card: '#1E1E1E',
  cardElevated: '#2C2C2C',
  input: '#2C2C2C',
  inputBorder: '#3C3C3C',

  // Módulos por color (más brillantes para modo oscuro)
  ventas: '#66BB6A',
  ventasGradient: ['#81C784', '#66BB6A'],
  inventario: '#42A5F5',
  inventarioGradient: ['#64B5F6', '#42A5F5'],
  compras: '#FFB74D',
  comprasGradient: ['#FFCC80', '#FFB74D'],
  reportes: '#BA68C8',
  reportesGradient: ['#CE93D8', '#BA68C8'],
  otros: '#78909C',
  otrosGradient: ['#90A4AE', '#78909C'],
};

export type Theme = typeof lightTheme;
