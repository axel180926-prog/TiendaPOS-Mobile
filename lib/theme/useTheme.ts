/**
 * Hook para usar el tema actual de la aplicación
 * Lee la configuración de la base de datos y aplica el tema correspondiente
 */

import { useMemo } from 'react';
import { useConfigStore } from '../store/useConfigStore';
import { lightTheme, darkTheme, Theme } from './colors';

export function useTheme(): Theme {
  const { configuracion } = useConfigStore();

  const theme = useMemo(() => {
    const temaActual = configuracion?.tema || 'claro';
    return temaActual === 'oscuro' ? darkTheme : lightTheme;
  }, [configuracion?.tema]);

  return theme;
}

export function useIsDarkTheme(): boolean {
  const { configuracion } = useConfigStore();
  return configuracion?.tema === 'oscuro';
}
