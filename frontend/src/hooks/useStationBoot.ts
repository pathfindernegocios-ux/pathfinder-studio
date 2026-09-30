import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// Estados del ciclo de arranque de una estación (notebook de Kaggle)
export type BootState =
  | 'detecting'   // primer fetch todavía no llegó
  | 'idle'        // no hay fila en Supabase para este modelo
  | 'INSTALLING'
  | 'CONNECTING'
  | 'READY'
  | 'BUSY'
  | 'ERROR'
  | 'STALE';

export interface BootInfo {
  state: BootState;
  progress: number;            // 0.0 – 1.0
  stepMessage: string | null;  // mensaje narrativo del paso actual
  updatedAt: string | null;
  gradioUrl: string | null;
  isBooting: boolean;          // INSTALLING o CONNECTING (y sin stale)
  isReady: boolean;            // READY o BUSY
  isError: boolean;
  isStale: boolean;
  detecting: boolean;          // primer fetch pendiente
}

const POLL_MS = 5000;
const STALE_THRESHOLD_MS = 4 * 60 * 1000;

const DETECTING: BootInfo = {
  state: 'detecting',
  progress: 0,
  stepMessage: null,
  updatedAt: null,
  gradioUrl: null,
  isBooting: false,
  isReady: false,
  isError: false,
  isStale: false,
  detecting: true,
};

const IDLE: BootInfo = {
  state: 'idle',
  progress: 0,
  stepMessage: null,
  updatedAt: null,
  gradioUrl: null,
  isBooting: false,
  isReady: false,
  isError: false,
  isStale: false,
  detecting: false,
};

export function useStationBoot(
  stationId: string | null,
  modelId: string | null
): BootInfo {
  const [boot, setBoot] = useState<BootInfo>(DETECTING);
  const hasFetchedOnce = useRef(false);

  useEffect(() => {
    if (!stationId || !modelId) {
      setBoot(IDLE);
      return;
    }

    hasFetchedOnce.current = false;
    setBoot(DETECTING);

    let cancelled = false;

    const fetchBoot = async () => {
      try {
        const { data, error } = await supabase
          .from('runtimes')
          .select('state, progress, step_message, updated_at, gradio_url')
          .eq('station_id', stationId)
          .eq('model_id', modelId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        hasFetchedOnce.current = true;

        if (error || !data) {
          setBoot(IDLE);
          return;
        }

        const row = data as {
          state: string | null;
          progress: number | null;
          step_message: string | null;
          updated_at: string | null;
          gradio_url: string | null;
        };

        const state = (row.state || 'idle') as BootState;
        const progress = typeof row.progress === 'number' ? row.progress : 0;
        const updatedAt = row.updated_at;

        const ageMs = updatedAt ? Date.now() - new Date(updatedAt).getTime() : Infinity;
        const isStale =
          (state === 'INSTALLING' || state === 'CONNECTING') &&
          ageMs > STALE_THRESHOLD_MS;

        const info: BootInfo = {
          state: isStale ? 'STALE' : state,
          progress,
          stepMessage: row.step_message,
          updatedAt,
          gradioUrl: row.gradio_url,
          isBooting:
            (state === 'INSTALLING' || state === 'CONNECTING') && !isStale,
          isReady: state === 'READY' || state === 'BUSY',
          isError: state === 'ERROR',
          isStale,
          detecting: false,
        };

        if (!cancelled) setBoot(info);
      } catch {
        // Silencioso — el siguiente poll reintenta
        if (!cancelled && !hasFetchedOnce.current) {
          hasFetchedOnce.current = true;
          setBoot(IDLE);
        }
      }
    };

    fetchBoot();
    const interval = window.setInterval(fetchBoot, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [stationId, modelId]);

  return boot;
}
