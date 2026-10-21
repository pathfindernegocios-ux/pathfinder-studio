import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useR2MediaPoller(
  genId: string | null,
  enabled: boolean,
  expectedCount: number = 1
) {
  const [r2Keys, setR2Keys] = useState<string[] | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    // Si no está habilitado, no hay ID, o ya tenemos todos los archivos, detenerse.
    if (!enabled || !genId || (r2Keys && r2Keys.length >= expectedCount)) return;
    
    let cancelled = false;
    let timeoutId: any;

    const checkDb = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const { data, error: dbErr } = await supabase
          .from('creations')
          .select('storage_key')
          .or(`id.eq.${genId},metadata->>parent_id.eq.${genId}`)
          .order('created_at', { ascending: true });

        if (!cancelled && !dbErr && Array.isArray(data)) {
          const keys = data.map(r => r.storage_key).filter(Boolean);
          if (keys.length > 0) {
            setR2Keys(keys);
            // Si ya alcanzamos el número esperado, terminamos el poller.
            if (keys.length >= expectedCount) return;
          }
        }
      } catch (e) {
        // Ignorar error de red temporal
      } finally {
        isFetchingRef.current = false;
        if (!cancelled && (!r2Keys || r2Keys.length < expectedCount)) {
          timeoutId = setTimeout(checkDb, 1000); // Reintentar en 1s
        }
      }
    };

    checkDb();
    return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId); };
  }, [genId, enabled, expectedCount, r2Keys]);

  return { r2Keys };
}
