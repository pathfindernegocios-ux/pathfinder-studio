// src/hooks/useIsMobile.ts
import { useState, useEffect } from 'react';

/**
 * Hook que devuelve `true` cuando el viewport es menor al breakpoint móvil
 * (768px por defecto). Se usa para activar el modo "drawer" del sidebar y
 * otros ajustes de layout específicos de móvil.
 *
 * En desktop/tablet devuelve `false` y los componentes mantienen su
 * comportamiento actual sin cambios.
 */
const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    return;
  }, []);

  return isMobile;
}
