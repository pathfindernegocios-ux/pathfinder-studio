import { useCallback, useEffect, useRef } from "react";
import { Client } from "@gradio/client";

// P1: rotación de URLs. El array viene ordenado por prioridad
// (Cloudflare primero, Gradio share después). Si una URL falla al conectar
// O falla despues de conectar (tunnel muere con Client ya cacheado), se
// marca "fría" por COLD_TTL_MS y se salta en los siguientes intentos.
const CONNECT_TIMEOUT_MS = 5000;
const COLD_TTL_MS = 30_000;

interface ClientEntry {
  realClient: Client;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout connecting to ${label}`)), ms)
    ),
  ]);
}

export function useGradioClient(gradioUrls: string[] | null) {
  // Cache: url -> Client real (sin envolver). Se puebla en el primer connect exitoso.
  const cacheRef = useRef<Map<string, ClientEntry>>(new Map());
  // Frío: url -> timestamp de cuándo falló. Se salta hasta que expire el TTL.
  const coldRef = useRef<Map<string, number>>(new Map());

  const closeClient = (client: Client | null | undefined) => {
    if (!client) return;
    try {
      const maybePromise = (client as any).close?.();
      // El close() de gradio-client dispara una Promise internamente. Si el
      // stream SSE ya estaba abortado, esa Promise rechaza async y no la
      // atrapa el try/catch sincronico. Silenciar la rejection evita ruido.
      if (maybePromise && typeof maybePromise.catch === "function") {
        maybePromise.catch(() => {
          /* noop */
        });
      }
    } catch {
      /* noop */
    }
  };

  // Cierra el client real y marca la URL como fría. Se llama cuando
  // Client.connect falla o cuando un predict posterior falla (túnel muerto).
  const markUrlFailed = (url: string) => {
    const entry = cacheRef.current.get(url);
    if (entry) {
      closeClient(entry.realClient);
      cacheRef.current.delete(url);
    }
    coldRef.current.set(url, Date.now() + COLD_TTL_MS);
  };

  // Envuelve el Client en un Proxy que intercepta `predict`. Si el predict
  // falla, marca la URL como fría para forzar rotación en la próxima llamada.
  // El resto de métodos pasan directo al Client real (no usados hoy, pero
  // queda por si en el futuro se llama .close(), .view_api(), etc.).
  const wrapClient = (realClient: Client, url: string): Client => {
    return new Proxy(realClient, {
      get(target, prop, receiver) {
        if (prop === "predict") {
          return async (endpoint: string, args?: unknown[]) => {
            try {
              // @ts-ignore — firma genérica del Client
              return await (target as any).predict(endpoint, args);
            } catch (err) {
              markUrlFailed(url);
              throw err;
            }
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as Client;
  };

  const getClient = useCallback(async (): Promise<Client | null> => {
    const urls = gradioUrls ?? [];
    if (urls.length === 0) return null;

    const now = Date.now();

    // 1. Si alguna URL ya está cacheada y no está fría, devolverla envuelta.
    for (const url of urls) {
      const coldUntil = coldRef.current.get(url);
      if (coldUntil && coldUntil > now) continue;
      const cached = cacheRef.current.get(url);
      if (cached) {
        return wrapClient(cached.realClient, url);
      }
    }

    // 2. Intentar conectar a cada URL viva en orden de prioridad.
    for (const url of urls) {
      const coldUntil = coldRef.current.get(url);
      if (coldUntil && coldUntil > now) continue;

      const connectPromise = Client.connect(url).catch((err) => {
        markUrlFailed(url);
        throw err;
      });

      try {
        const realClient = await withTimeout(connectPromise, CONNECT_TIMEOUT_MS, url);
        cacheRef.current.set(url, { realClient });
        return wrapClient(realClient, url);
      } catch {
        // markUrlFailed ya se llamó en el .catch de arriba, o el timeout
        // disparó — en ese caso forzamos el cierre manualmente.
        markUrlFailed(url);
        continue;
      }
    }

    // 3. Todas frías o fallaron.
    return null;
  }, [gradioUrls]);

  // Cleanup al cambiar el array de URLs o al desmontar: cerrar clients viejos.
  useEffect(() => {
    const cache = cacheRef.current;
    const cold = coldRef.current;
    return () => {
      cache.forEach((entry) => closeClient(entry.realClient));
      cache.clear();
      cold.clear();
    };
  }, [gradioUrls]);

  return { getClient };
}
