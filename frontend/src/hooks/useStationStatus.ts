// src/hooks/useStationStatus.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@gradio/client';
import { supabase } from '../lib/supabaseClient';
import { readLiveCache, writeLiveCache } from '../lib/liveCache';

export type StationStatus = 'online' | 'offline';

interface RuntimeRow {
  model_id: string;
  gradio_url: string | null;
  gradio_urls: string[] | null;
  state: string;
  model_type: string | null;
  created_at: string;
  updated_at: string;
  last_heartbeat_at: string | null;
}

interface UseStationStatusResult {
  statusMap: Record<string, StationStatus>;
  /** Capability declarada por el notebook al registrarse en `runtimes`. */
  modelTypeMap: Record<string, 'image' | 'video' | 'audio'>;
  /** runtimeIds cuyo `state` es INSTALLING o CONNECTING (boot en curso). */
  bootingIds: string[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const LIVE_CACHE_KEY = 'station_status';
const LIVE_CACHE_TTL_MS = 5 * 60 * 1000;

interface StationStatusCache {
  statusMap: Record<string, StationStatus>;
  modelTypeMap: Record<string, 'image' | 'video' | 'audio'>;
  bootingIds: string[];
}
// Mismo umbral que useStationBoot: evita alimentar bootingIds con filas
// INSTALLING/CONNECTING muertas.
const ORPHAN_BOOTING_THRESHOLD_MS = 25 * 60 * 1000;
const POLL_MS_DESKTOP = 30_000;
const POLL_MS_MOBILE = 60_000;
const POLL_MS =
  typeof window !== 'undefined' && window.innerWidth < 768
    ? POLL_MS_MOBILE
    : POLL_MS_DESKTOP;
const TIMEOUT_MS = 10_000;
// Mismo TTL que useGradioClient: si una URL falla, se salta por 30s para
// no reintentar en cada poll (que es cada 30-60s).
const COLD_TTL_MS = 30_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export function useStationStatus(stationId: string | null): UseStationStatusResult {
  const _cached = readLiveCache<StationStatusCache>(LIVE_CACHE_KEY, LIVE_CACHE_TTL_MS);
  const [statusMap, setStatusMap] = useState<Record<string, StationStatus>>(() => _cached?.statusMap ?? {});
  const [modelTypeMap, setModelTypeMap] = useState<Record<string, 'image' | 'video' | 'audio'>>(() => _cached?.modelTypeMap ?? {});
  const [bootingIds, setBootingIds] = useState<string[]>(() => _cached?.bootingIds ?? []);
  const [loading, setLoading] = useState<boolean>(() => _cached === null);

  // Ref con el último statusMap: se usa DENTRO de fetchAndCheck para preservar
  // el estado previo en caso de timeout de /status. NO va en las deps del
  // useCallback (crearía un loop: fetchAndCheck -> setStatusMap -> nueva
  // referencia de fetchAndCheck -> useEffect -> fetchAndCheck -> ...).
  const statusMapRef = useRef<Record<string, StationStatus>>(statusMap);
  useEffect(() => {
    statusMapRef.current = statusMap;
  }, [statusMap]);

  // Deuda 3: URLs frías. Map url -> timestamp de expiración del frío.
  // Evita reintentar contra la misma URL muerta en cada poll.
  const coldRef = useRef<Map<string, number>>(new Map());

  const fetchAndCheck = useCallback(async () => {
    if (!stationId) {
      setStatusMap({});
      setModelTypeMap({});
      setBootingIds([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Traer todas las filas de runtimes del usuario
      const { data, error } = await supabase
        .from('runtimes')
        .select('model_id, gradio_url, gradio_urls, state, model_type, created_at, updated_at, last_heartbeat_at')
        .eq('station_id', stationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!Array.isArray(data) || data.length === 0) {
        setStatusMap({});
        setModelTypeMap({});
        setBootingIds([]);
        setLoading(false);
        return;
      }

      // 2. Deduplicar: por cada model_id, tomar la fila más reciente (explícito por created_at)
      const latestByModel = new Map<string, RuntimeRow>();
      for (const row of data as RuntimeRow[]) {
        if (!row.model_id) continue;
        const existing = latestByModel.get(row.model_id);
        if (!existing || new Date(row.created_at).getTime() > new Date(existing.created_at).getTime()) {
          latestByModel.set(row.model_id, row);
        }
      }
      // 2.b Construir modelTypeMap (uno por model_id, no por fila)
      const nextModelTypeMap: Record<string, 'image' | 'video' | 'audio'> = {};
      for (const [modelId, row] of latestByModel.entries()) {
        const t = row.model_type;
        if (t === 'image' || t === 'video' || t === 'audio') {
          nextModelTypeMap[modelId] = t;
        }
      }

      // 2.c Construir bootingIds: model_ids cuyo último state es INSTALLING/CONNECTING
      const nextBootingIds: string[] = [];
      const nowForBoot = Date.now();
      for (const [modelId, row] of latestByModel.entries()) {
        if (row.state === 'INSTALLING' || row.state === 'CONNECTING') {
          const bootAgeMs = nowForBoot - new Date(row.updated_at).getTime();
          if (bootAgeMs < ORPHAN_BOOTING_THRESHOLD_MS) {
            nextBootingIds.push(modelId);
          }
        }
      }

      // 3. Obtener JWT una sola vez
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const now = Date.now();
      const prevStatusMap = statusMapRef.current;
      const results: Record<string, StationStatus> = {};

      // 4. Determinar estado por cada modelo
      await Promise.all(
        Array.from(latestByModel.entries()).map(async ([modelId, row]) => {
          const ageMs = now - new Date(row.created_at).getTime();

          // Deuda 3: usar el array gradio_urls si existe; fallback a gradio_url
          // para filas viejas. Permite que el poll de status siga funcionando
          // cuando Cloudflare cae y solo Gradio share responde.
          const urls = (row.gradio_urls && row.gradio_urls.length > 0)
            ? row.gradio_urls
            : (row.gradio_url ? [row.gradio_url] : []);

          if (ageMs > MAX_AGE_MS || urls.length === 0) {
            results[modelId] = 'offline';
            return;
          }
          if (!token) {
            results[modelId] = 'offline';
            return;
          }

          // Bug B: el heartbeat es la fuente de verdad. Si el ultimo latido
          // es viejo (>90s), el notebook esta muerto sin importar lo que
          // diga /status o el estado previo. Marcar offline directo, sin
          // intentar conectar. Sin esto, un predict que falla por timeout
          // preservaba el estado previo INDEFINIDAMENTE y un notebook
          // muerto podia quedar 'online' para siempre en el sidebar.
          const hbAt = row.last_heartbeat_at;
          const hbAgeMs = hbAt ? Date.now() - new Date(hbAt).getTime() : Infinity;
          if (hbAgeMs > 90_000) {
            results[modelId] = 'offline';
            return;
          }

          const nowMs = Date.now();
          let gotResponse = false;

          for (const url of urls) {
            const coldUntil = coldRef.current.get(url);
            if (coldUntil && coldUntil > nowMs) continue;

            try {
              const client = await withTimeout(Client.connect(url), TIMEOUT_MS);
              const statusResult = await withTimeout(client.predict('/status', [token]), TIMEOUT_MS);
              const statusVal = Array.isArray(statusResult.data) ? statusResult.data[0] : statusResult.data;
              results[modelId] = (statusVal === 'READY' || statusVal === 'BUSY') ? 'online' : 'offline';
              gotResponse = true;
              break;
            } catch {
              // Marcar esta URL como fría y probar la siguiente.
              coldRef.current.set(url, Date.now() + COLD_TTL_MS);
            }
          }

          if (!gotResponse) {
            // Ninguna URL respondió. Preservar el estado previo para no
            // marcar offline sin motivo (puede ser timeout transitorio).
            results[modelId] = prevStatusMap[modelId] ?? 'offline';
          }
        })
      );

      setStatusMap(results);
      setModelTypeMap(nextModelTypeMap);
      setBootingIds(nextBootingIds);
      setLoading(false);
    } catch (err) {
      void 0;
      setLoading(false);
    }
  }, [stationId]);

  // Persistir el estado cada vez que cambie, para hidratar al próximo mount.
  useEffect(() => {
    if (Object.keys(statusMap).length === 0 && Object.keys(modelTypeMap).length === 0) {
      // Todavía no llegó el primer fetch real. No pisar el cache.
      return;
    }
    writeLiveCache<StationStatusCache>(LIVE_CACHE_KEY, { statusMap, modelTypeMap, bootingIds });
  }, [statusMap, modelTypeMap, bootingIds]);

  useEffect(() => {
    fetchAndCheck();
    const interval = window.setInterval(fetchAndCheck, POLL_MS);
    return () => window.clearInterval(interval);
  }, [fetchAndCheck]);

  return { statusMap, modelTypeMap, bootingIds, loading, refresh: fetchAndCheck };
}
