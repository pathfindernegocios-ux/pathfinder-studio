// src/hooks/useStationStatus.ts
import { useState, useEffect, useCallback } from 'react';
import { Client } from '@gradio/client';
import { supabase } from '../lib/supabaseClient';

export type StationStatus = 'online' | 'offline';

interface RuntimeRow {
  model_id: string;
  gradio_url: string | null;
  state: string;
  model_type: string | null;
  created_at: string;
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
const POLL_MS = 30_000;
const TIMEOUT_MS = 10_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export function useStationStatus(stationId: string | null): UseStationStatusResult {
  const [statusMap, setStatusMap] = useState<Record<string, StationStatus>>({});
  const [modelTypeMap, setModelTypeMap] = useState<Record<string, 'image' | 'video' | 'audio'>>({});
  const [bootingIds, setBootingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select('model_id, gradio_url, state, model_type, created_at')
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
      for (const [modelId, row] of latestByModel.entries()) {
        if (row.state === 'INSTALLING' || row.state === 'CONNECTING') {
          nextBootingIds.push(modelId);
        }
      }

      // 3. Obtener JWT una sola vez
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const now = Date.now();
      const results: Record<string, StationStatus> = {};

      // 4. Determinar estado por cada modelo
      await Promise.all(
        Array.from(latestByModel.entries()).map(async ([modelId, row]) => {
          const ageMs = now - new Date(row.created_at).getTime();

          if (ageMs > MAX_AGE_MS || !row.gradio_url) {
            results[modelId] = 'offline';
            return;
          }
          if (!token) {
            results[modelId] = 'offline';
            return;
          }

          try {
            void 0;
            const client = await withTimeout(Client.connect(row.gradio_url), TIMEOUT_MS);
            void 0;
            const statusResult = await withTimeout(client.predict('/status', [token]), TIMEOUT_MS);
            const statusVal = Array.isArray(statusResult.data) ? statusResult.data[0] : statusResult.data;
            void 0;
            results[modelId] = (statusVal === 'READY' || statusVal === 'BUSY') ? 'online' : 'offline';
          } catch (e: any) {
            void 0;
            results[modelId] = 'offline';
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

  useEffect(() => {
    fetchAndCheck();
    const interval = window.setInterval(fetchAndCheck, POLL_MS);
    return () => window.clearInterval(interval);
  }, [fetchAndCheck]);

  return { statusMap, modelTypeMap, bootingIds, loading, refresh: fetchAndCheck };
}
