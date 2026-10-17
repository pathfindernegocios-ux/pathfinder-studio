import { useEffect, useState, useMemo } from 'react';

export type BootState = 'detecting' | 'idle' | 'INSTALLING' | 'CONNECTING' | 'READY' | 'BUSY' | 'ERROR' | 'STALE';
export type ConnectionState = 'alive' | 'reconnecting' | 'offline' | 'unknown';

export interface BootInfo {
  state: BootState;
  progress: number;
  stepMessage: string | null;
  updatedAt: string | null;
  gradioUrl: string | null;
  lastHeartbeatAt: string | null;
  connectionState: ConnectionState;
  isBooting: boolean;
  isReady: boolean;
  isError: boolean;
  isStale: boolean;
  detecting: boolean;
}

const STALE_THRESHOLD_MS = 4 * 60 * 1000;
const ORPHAN_ERROR_THRESHOLD_MS = 30 * 60 * 1000;
const ORPHAN_BOOTING_THRESHOLD_MS = 25 * 60 * 1000;
const HEARTBEAT_ALIVE_MS = 60 * 1000;
const HEARTBEAT_RECONNECTING_MS = 120 * 1000;

const DETECTING: BootInfo = { state: 'detecting', progress: 0, stepMessage: null, updatedAt: null, gradioUrl: null, lastHeartbeatAt: null, connectionState: 'unknown', isBooting: false, isReady: false, isError: false, isStale: false, detecting: true };
const IDLE: BootInfo = { state: 'idle', progress: 0, stepMessage: null, updatedAt: null, gradioUrl: null, lastHeartbeatAt: null, connectionState: 'unknown', isBooting: false, isReady: false, isError: false, isStale: false, detecting: false };

export function useStationBoot(
  stationId: string | null,
  modelId: string | null,
  runtimesMap: Record<string, any>,
  loading: boolean
): BootInfo {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(t);
  }, []);

  return useMemo(() => {
    if (loading) return DETECTING;
    if (!stationId || !modelId) return IDLE;
    const row = runtimesMap[modelId];
    if (!row) return IDLE;

    const state = (row.state || 'idle') as BootState;
    const progress = Number(row.progress) || 0;
    const updatedAt = row.updated_at;
    const ageMs = updatedAt ? Date.now() - new Date(updatedAt).getTime() : Infinity;

    if ((state === 'ERROR' || state === 'STALE') && ageMs > ORPHAN_ERROR_THRESHOLD_MS) return IDLE;
    if ((state === 'INSTALLING' || state === 'CONNECTING') && ageMs > ORPHAN_BOOTING_THRESHOLD_MS) return IDLE;

    const isStale = (state === 'INSTALLING' || state === 'CONNECTING') && ageMs > STALE_THRESHOLD_MS;
    const lastHeartbeatAt = row.last_heartbeat_at;
    const hbAgeMs = lastHeartbeatAt ? Date.now() - new Date(lastHeartbeatAt).getTime() : Infinity;

    let connectionState: ConnectionState = 'unknown';
    if (lastHeartbeatAt) {
      if (hbAgeMs < HEARTBEAT_ALIVE_MS) connectionState = 'alive';
      else if (hbAgeMs < HEARTBEAT_RECONNECTING_MS) connectionState = 'reconnecting';
      else connectionState = 'offline';
    }

    return {
      state: isStale ? 'STALE' : state,
      progress,
      stepMessage: row.step_message,
      updatedAt,
      gradioUrl: row.gradio_url,
      lastHeartbeatAt,
      connectionState,
      isBooting: (state === 'INSTALLING' || state === 'CONNECTING') && !isStale,
      isReady: state === 'READY' || state === 'BUSY',
      isError: state === 'ERROR',
      isStale,
      detecting: false,
    };
  }, [stationId, modelId, runtimesMap, loading]);
}
