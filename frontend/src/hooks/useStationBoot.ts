import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { readLiveCache, writeLiveCache } from '../lib/liveCache';

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

// Tick del interval (el "reloj" que decide cada cuánto mirar el estado).
// El intervalo mínimo real se calcula en cada tick según el estado actual.
const TICK_MS = 5000;
// Intervalos por estado (ms).
const POLL_INTERVAL: Record<string, number> = {
  INSTALLING: 5000,
  CONNECTING: 5000,
  READY: 15000,
  BUSY: 15000,
  ERROR: 30000,
  STALE: 30000,
  idle: 30000,
  detecting: 5000,
};
const STALE_THRESHOLD_MS = 4 * 60 * 1000;
// Si una fila con state ERROR/STALE no se actualizó en este tiempo,
// se considera huérfana (el notebook murió sin limpiar su fila).
// El frontend la ignora y muestra IDLE en lugar del error viejo.
const ORPHAN_ERROR_THRESHOLD_MS = 30 * 60 * 1000;
// Fila huérfana de boot: INSTALLING/CONNECTING sin updates en >25 min.
// El notebook murió a mitad del arranque sin limpiar su fila. Sin este filtro,
// el auto-select de boot elige el modelo fantasma y pisa al modelo activo.
const ORPHAN_BOOTING_THRESHOLD_MS = 25 * 60 * 1000;

const LIVE_CACHE_KEY = 'station_boot';
const LIVE_CACHE_TTL_MS = 5 * 60 * 1000;
type StationBootCache = Record<string, BootInfo>;

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
  const _bootCacheKey = (stationId && modelId) ? `${stationId}:${modelId}` : null;
  const _bootCached = _bootCacheKey
    ? readLiveCache<StationBootCache>(LIVE_CACHE_KEY, LIVE_CACHE_TTL_MS)?.[_bootCacheKey] ?? null
    : null;
  const [boot, setBoot] = useState<BootInfo>(() => _bootCached ?? DETECTING);
  const hasFetchedOnce = useRef(false);
  const bootStateRef = useRef<BootState>('detecting');
  const lastFetchRef = useRef<number>(0);

  // Mantener el ref sincronizado con el último estado conocido
  useEffect(() => {
    bootStateRef.current = boot.state;
  }, [boot.state]);

  // Persistir a cache por (stationId, modelId) para hidratar al próximo mount.
  useEffect(() => {
    if (!_bootCacheKey) return;
    if (boot.detecting) return; // no persistir el estado transitorio
    const existing = readLiveCache<StationBootCache>(LIVE_CACHE_KEY, LIVE_CACHE_TTL_MS) ?? {};
    existing[_bootCacheKey] = boot;
    writeLiveCache<StationBootCache>(LIVE_CACHE_KEY, existing);
  }, [boot, _bootCacheKey]);

  useEffect(() => {
    if (!stationId || !modelId) {
      setBoot(IDLE);
      return;
    }

    hasFetchedOnce.current = false;
    setBoot(DETECTING);

    let cancelled = false;

    const fetchBoot = async () => {
      // Skip interno: si el último fetch fue hace menos que el intervalo
      // mínimo para el estado actual, no hagas la query.
      const now = Date.now();
      const minInterval = POLL_INTERVAL[bootStateRef.current] ?? 5000;
      if (now - lastFetchRef.current < minInterval - 500) return;
      lastFetchRef.current = now;

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

        // Fila huérfana: state ERROR/STALE sin updates en >30 min.
        // El notebook murió sin limpiar su fila. Tratar como si no existiera.
        if ((state === 'ERROR' || state === 'STALE') && ageMs > ORPHAN_ERROR_THRESHOLD_MS) {
          if (!cancelled) setBoot(IDLE);
          return;
        }

        if ((state === 'INSTALLING' || state === 'CONNECTING') && ageMs > ORPHAN_BOOTING_THRESHOLD_MS) {
          if (!cancelled) setBoot(IDLE);
          return;
        }

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

    lastFetchRef.current = 0; // forzar primer fetch
    fetchBoot();
    const interval = window.setInterval(fetchBoot, TICK_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [stationId, modelId]);

  return boot;
}
