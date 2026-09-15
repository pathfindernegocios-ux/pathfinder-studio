// src/hooks/useStationStatus.ts
import { useState, useEffect, useCallback } from 'react';
import { Client } from '@gradio/client';
import { supabase } from '../lib/supabaseClient';

export type StationStatus = 'online' | 'offline';

interface RuntimeRow {
  model_id: string;
  gradio_url: string;
  state: string;
  created_at: string;
}

interface UseStationStatusResult {
  statusMap: Record<string, StationStatus>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const POLL_MS = 30_000;
const TIMEOUT_MS = 3_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export function useStationStatus(stationId: string | null): UseStationStatusResult {
  const [statusMap, setStatusMap] = useState<Record<string, StationStatus>>({});
  const [loading, setLoading] = useState(true);

  const fetchAndCheck = useCallback(async () => {
    if (!stationId) {
      setStatusMap({});
      setLoading(false);
      return;
    }

    try {
      // 1. Traer todas las filas de runtimes del usuario
      const { data, error } = await supabase
        .from('runtimes')
        .select('model_id, gradio_url, state, created_at')
        .eq('station_id', stationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!Array.isArray(data) || data.length === 0) {
        setStatusMap({});
        setLoading(false);
        return;
      }

      // 2. Deduplicar: por cada model_id, tomar la fila más reciente
      const latestByModel = new Map<string, RuntimeRow>();
      for (const row of data as RuntimeRow[]) {
        if (row.model_id && !latestByModel.has(row.model_id)) {
          latestByModel.set(row.model_id, row);
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
            const client = await withTimeout(Client.connect(row.gradio_url), TIMEOUT_MS);
            const statusResult = await withTimeout(client.predict('/status', [token]), TIMEOUT_MS);
            const statusVal = Array.isArray(statusResult.data) ? statusResult.data[0] : statusResult.data;
            results[modelId] = (statusVal === 'READY' || statusVal === 'BUSY') ? 'online' : 'offline';
          } catch {
            results[modelId] = 'offline';
          }
        })
      );

      setStatusMap(results);
      setLoading(false);
    } catch (err) {
      console.error('[useStationStatus]', err);
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    fetchAndCheck();
    const interval = window.setInterval(fetchAndCheck, POLL_MS);
    return () => window.clearInterval(interval);
  }, [fetchAndCheck]);

  return { statusMap, loading, refresh: fetchAndCheck };
}
