import { useState, useEffect } from 'react';
import { useCreations } from './useCreations';

// Caché global en memoria (persiste entre renders y desmontajes de componentes)
// Estructura: { [creationId]: { url: string, timestamp: number } }
const urlCache = new Map<string, { url: string; timestamp: number }>();

// Tiempo de vida de la caché: 4 minutos (240000 ms)
// Las URLs de R2 suelen durar 5 min, así que dejamos un margen de seguridad.
const CACHE_TTL_MS = 240000;

export const useSignedUrl = (creationId: string | null) => {
  const { getDownloadUrl } = useCreations();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Si no hay ID, limpiamos estado
    if (!creationId) {
      setUrl(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchUrl = async () => {
      // 1. Verificar Caché
      const cached = urlCache.get(creationId);
      const now = Date.now();

      if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
        // Caché válida encontrada
        if (isMounted) {
          setUrl(cached.url);
          setLoading(false);
        }
        return;
      }

      // 2. Si no hay caché o expiró, solicitar nueva URL
      if (isMounted) setLoading(true);
      
      try {
        const signedUrl = await getDownloadUrl(creationId);
        
        if (isMounted) {
          if (signedUrl) {
            // Guardar en caché global
            urlCache.set(creationId, { url: signedUrl, timestamp: now });
            setUrl(signedUrl);
            setError(false);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error(`[useSignedUrl] Error fetching URL for ${creationId}:`, err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUrl();

    // Cleanup para evitar memory leaks si el componente se desmonta rápido
    return () => {
      isMounted = false;
    };
  }, [creationId, getDownloadUrl]);

  return { url, loading, error };
};
