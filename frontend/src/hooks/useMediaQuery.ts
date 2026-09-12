// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar cambios en media queries.
 * Devuelve un booleano que se actualiza automáticamente cuando el viewport cambia.
 * 
 * @param query - La media query a evaluar (ej: '(max-width: 640px)')
 * @returns boolean - true si la query coincide, false en caso contrario
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 640px)');
 * const isDesktop = useMediaQuery('(min-width: 1025px)');
 */
export const useMediaQuery = (query: string): boolean => {
  // Estado inicial: verificamos inmediatamente si hay window disponible (SSR safe)
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // Si no hay window (SSR), no hacemos nada
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);

    // Handler que actualiza el estado cuando cambia el viewport
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Escuchamos cambios en tiempo real
    mediaQueryList.addEventListener('change', handleChange);

    // Cleanup: removemos el listener al desmontar el componente
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};