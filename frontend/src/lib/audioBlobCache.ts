// src/lib/audioBlobCache.ts
//
// Cache en memoria de blobs de audio.
// - Deduplica fetches en vuelo (un solo download por URL).
// - Reporta progreso 0-100 con Content-Length.
// - El AudioPlayer y los handleDownload comparten este cache.

const cache = new Map<string, Blob>();
const inflight = new Map<string, Promise<Blob>>();

export function getCachedAudio(url: string): Blob | undefined {
  return cache.get(url);
}

export function setCachedAudio(url: string, blob: Blob): void {
  cache.set(url, blob);
}

export interface FetchAudioOptions {
  timeoutMs?: number;
  onProgress?: (percent: number) => void;
}

/**
 * Descarga un audio. Deduplica con el cache y las promesas en vuelo.
 * Retorna el Blob (del cache si ya estaba, o espera el fetch en curso).
 */
export function fetchAudioBlob(
  url: string,
  optionsOrTimeout: number | FetchAudioOptions = 30000,
): Promise<Blob> {
  const opts: FetchAudioOptions = typeof optionsOrTimeout === 'number'
    ? { timeoutMs: optionsOrTimeout }
    : optionsOrTimeout;

  const cached = cache.get(url);
  if (cached) {
    opts.onProgress?.(100);
    return Promise.resolve(cached);
  }

  const inFlight = inflight.get(url);
  if (inFlight) {
    // Ya hay un fetch corriendo — comparte el progreso si tiene callback
    if (opts.onProgress) {
      // No podemos pasar el callback al fetch existente, pero avisamos al 100 cuando termine
      inFlight.then(() => opts.onProgress?.(100)).catch(() => {});
    }
    return inFlight;
  }

  const timeoutMs = opts.timeoutMs ?? 120000;
  const ctrl = new AbortController();
  const killer = setTimeout(() => ctrl.abort(), timeoutMs);

  const promise = (async (): Promise<Blob> => {
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const totalHeader = res.headers.get('Content-Length');
      const total = totalHeader ? parseInt(totalHeader, 10) : 0;

      // Si no hay content-length o es chico, descarga directa
      if (!total || !res.body) {
        const blob = await res.blob();
        cache.set(url, blob);
        opts.onProgress?.(100);
        return blob;
      }

      // Descarga con progreso via ReadableStream
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      let lastPct = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          const pct = Math.min(99, Math.floor((received / total) * 100));
          if (pct !== lastPct) {
            lastPct = pct;
            opts.onProgress?.(pct);
          }
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: res.headers.get('Content-Type') || 'audio/wav' });
      cache.set(url, blob);
      opts.onProgress?.(100);
      return blob;
    } finally {
      clearTimeout(killer);
      inflight.delete(url);
    }
  })();

  inflight.set(url, promise);
  return promise;
}
