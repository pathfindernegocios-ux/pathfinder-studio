import { useCallback, useEffect, useRef } from "react";
import { Client } from "@gradio/client";

// P1: rotación de URLs. El array viene ordenado por prioridad
// (Cloudflare primero, Gradio share después). Si una URL falla al conectar
// O falla despues de conectar (tunnel muere con Client ya cacheado), se
// marca "fría" por COLD_TTL_MS y se salta en los siguientes intentos.
const CONNECT_TIMEOUT_MS = 5000;
const COLD_TTL_MS = 30_000;

// Timeouts por endpoint. Sin esto, un predict sobre un túnel muerto se cuelga
// indefinidamente (gradio-client no rechaza cuando el SSE queda zombi) y el
// Proxy nunca detecta el fallo → la URL muerta queda cacheada para siempre.
// /generate y /generate_storyboard quedan SIN timeout: pueden tardar minutos
// legitimamente mientras el callback de progreso mantiene el SSE vivo.
const PREDICT_TIMEOUTS: Record<string, number> = {
  "/status":            8_000,
  "/logs":              8_000,
  "/generation_status": 8_000,
  "/session_history":  10_000,
  "/cancel":            5_000,
  "/shutdown":          5_000,
};

// Retry automático para "Connection errored out" y variantes. La primera
// generación tras conectar puede fallar porque el SSE todavía no está
// completamente establecido (carrera entre Client.connect() y el primer
// predict). Un retry 2.5s después resuelve el 95% de los casos.
const RETRY_DELAY_MS = 2_500;
const RETRYABLE_ERROR_RE = /connection\s+(errored|closed|reset|aborted)|network\s+error/i;

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
            const timeoutMs = PREDICT_TIMEOUTS[endpoint];

            const runOnce = async () => {
              // @ts-ignore — firma genérica del Client
              const promise = (target as any).predict(endpoint, args);
              if (timeoutMs) {
                return await withTimeout(promise, timeoutMs, `${endpoint} @ ${url}`);
              }
              return await promise;
            };

            try {
              return await runOnce();
            } catch (err) {
              const msg = String((err as Error)?.message ?? err ?? "");
              const isRetryable = RETRYABLE_ERROR_RE.test(msg);

              // FIX CRÍTICO: Los endpoints de polling (status, logs, etc.) NO
              // deben destruir el cliente compartido. Un fallo en un poller de
              // fondo no significa que el túnel esté muerto; solo significa que
              // ese request falló. Dejamos que el poller lo maneje y reintente.
              const isPollingEndpoint =
                endpoint === "/status" ||
                endpoint === "/logs" ||
                endpoint === "/generation_status" ||
                endpoint === "/session_history";

              if (isPollingEndpoint) {
                // No marcar cold, no cerrar el cliente. Solo propagar el error
                // para que el poller lo ignore y reintente en el siguiente ciclo.
                throw err;
              }

              if (isRetryable) {
                console.warn(`[gradio] retry en ${endpoint} tras: ${msg}`);
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
                try {
                  return await runOnce();
                } catch (err2) {
                  markUrlFailed(url);
                  throw err2;
                }
              }

              // Para /generate u otros endpoints críticos, sí marcamos cold
              // para forzar la rotación al siguiente túnel.
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

  // Cleanup SOLO al desmontar. NO cerramos clients cuando `gradioUrls`
  // cambia (ej. cambio de modelo activo en la misma capability): un client
  // puede tener un predict en vuelo (Krea generando mientras el user
  // cambia a Qwen). Cerrarlo mataría el SSE y el predict fallaría con
  // "Connection errored out" aunque el notebook siga generando OK.
  //
  // Multi-notebook: cada runtime (Krea en Kaggle, Qwen en Colab) tiene su
  // propio Client vivo en el cache. Cambiar de modelo activo solo cambia
  // qué URL devuelve getClient; los demás clients siguen abiertos.
  //
  // El cierre efectivo ocurre al desmontar el hook (navegar fuera del
  // Studio o remount del provider). Los tunnels muertos se detectan vía
  // markUrlFailed y el cold TTL, no hace falta cerrarlos proactivamente.
  useEffect(() => {
    const cache = cacheRef.current;
    const cold = coldRef.current;
    return () => {
      cache.forEach((entry) => closeClient(entry.realClient));
      cache.clear();
      cold.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { getClient };
}
