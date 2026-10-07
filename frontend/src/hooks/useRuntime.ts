import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { CapabilityId, Status } from "../types";
import { useGradioClient } from "./useGradioClient";

// Compara dos arrays de strings por contenido. Se usa para evitar que
// setGradioUrls dispare reconexiones cuando el array es equivalente.
function sameStringArray(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

interface ImageRuntime {
  model_id: string;
  gradio_url: string;
  gradio_urls: string[] | null;
}

interface UseRuntimeParams {
  stationId: string | null;
  capability?: CapabilityId;
  /** Runtime a consultar. Si se provee, filtra runtimes por `model_id`.
   *  Si es null/undefined, cae al runtime más reciente de la capability
   *  (comportamiento legacy, solo fallback). */
  modelId?: string | null;
}

export function useRuntime({ stationId, capability = "video", modelId = null }: UseRuntimeParams) {
  const [gradioUrl, setGradioUrl] = useState<string | null>(null);
  const [gradioUrls, setGradioUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("UNKNOWN");
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionUptime, setSessionUptime] = useState<string>("00:00:00");
  const [activeImageModelId, setActiveImageModelId] = useState<string | null>(null);
  const [imageModels, setImageModels] = useState<ImageRuntime[]>([]);

  useEffect(() => {
    if (!stationId) {
      setGradioUrl(null);
      setGradioUrls([]);
      setStatus("UNKNOWN");
      setSessionStartTime(null);
      setSessionUptime("00:00:00");
      setActiveImageModelId(null);
      setImageModels([]);
      return;
    }

    const modelType = capability === "image" ? "image" : capability === "audio" ? "audio" : "video";

    const fetchRuntime = async () => {
      if (modelType === "image") {
        // Obtener todos los runtimes de imagen
        const { data, error } = await supabase
          .from("runtimes")
          .select("gradio_url, gradio_urls, state, model_id, created_at")
          .eq("station_id", stationId)
          .eq("model_type", "image")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const rows = data as { gradio_url: string; gradio_urls: string[] | null; state: Status; model_id: string; created_at: string }[];

          // Dedup por model_id: la fila mas reciente gana.
          // Sin esto, si hay filas huerfanas de sesiones anteriores, el frontend
          // puede elegir una URL muerta con gradio_url viejo.
          const latestByModel = new Map<string, { gradio_url: string; gradio_urls: string[] | null; state: Status; model_id: string; created_at: string }>();
          for (const r of rows) {
            const prev = latestByModel.get(r.model_id);
            if (!prev || new Date(r.created_at).getTime() > new Date(prev.created_at).getTime()) {
              latestByModel.set(r.model_id, r);
            }
          }
          const deduped = Array.from(latestByModel.values());

          setImageModels(deduped.map((r) => ({ model_id: r.model_id, gradio_url: r.gradio_url, gradio_urls: r.gradio_urls })));

          setActiveImageModelId((prev) => {
            if (prev && deduped.some((r) => r.model_id === prev)) return prev;
            return deduped[0].model_id;
          });

          // No tocar gradioUrl ni status aquí; lo maneja el efecto siguiente
          // y el polling de /status. Así evitamos el parpadeo.
        } else {
          // Solo si no hay runtimes, limpiar el estado de conexion.
          // NO reseteamos activeImageModelId: la seleccion del modelo vive
          // en el FCM (el user eligio Krea, Qwen, etc.). Si la pisamos a null,
          // el pill del topbar desaparece (currentModelId=null en StudioPage)
          // y el user queda sin feedback visual de que su modelo no esta
          // arrancado. El pill debe poder mostrar "Estacion offline" cuando
          // no hay fila en runtimes para el modelo seleccionado.
          setImageModels([]);
          setGradioUrl(null);
          setGradioUrls([]);
          setStatus("UNKNOWN");
        }
      } else if (modelType === "audio") {
        // Audio: filtra por model_id si se provee (ej: 'tts-dual')
        let query = supabase
          .from("runtimes")
          .select("gradio_url, gradio_urls, state, model_id")
          .eq("station_id", stationId)
          .eq("model_type", "audio")
          .order("created_at", { ascending: false })
          .limit(1);

        if (modelId) {
          query = query.eq("model_id", modelId);
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data && data.gradio_url) {
          const nextUrls = (data.gradio_urls && data.gradio_urls.length > 0)
            ? data.gradio_urls
            : [data.gradio_url];
          setGradioUrl((prev) => (prev === data.gradio_url ? prev : data.gradio_url));
          setGradioUrls((prev) => sameStringArray(prev, nextUrls) ? prev : nextUrls);
        } else {
          setGradioUrl(null);
          setGradioUrls([]);
          setStatus("UNKNOWN");
        }

        setImageModels([]);
        setActiveImageModelId(null);
      } else {
        // Video: filtra por model_id si se provee (ltx-2.3, ltx-2.5-msr, wan-dual)
        let query = supabase
          .from("runtimes")
          .select("gradio_url, gradio_urls, state")
          .eq("station_id", stationId)
          .eq("model_type", "video")
          .order("created_at", { ascending: false })
          .limit(1);

        if (modelId) {
          query = query.eq("model_id", modelId);
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data && data.gradio_url) {
          const nextUrls = (data.gradio_urls && data.gradio_urls.length > 0)
            ? data.gradio_urls
            : [data.gradio_url];
          setGradioUrl((prev) => (prev === data.gradio_url ? prev : data.gradio_url));
          setGradioUrls((prev) => sameStringArray(prev, nextUrls) ? prev : nextUrls);
          // El estado lo actualizará /status; no usamos data.state
        } else {
          setGradioUrl(null);
          setGradioUrls([]);
          setStatus("UNKNOWN");
        }

        setImageModels([]);
        setActiveImageModelId(null);
      }
    };

    fetchRuntime();
    const interval = setInterval(fetchRuntime, 5000);
    return () => clearInterval(interval);
  }, [stationId, capability, modelId]);

  // Efecto para actualizar gradioUrl según el modelo activo de imagen
  useEffect(() => {
    if (capability !== "image" || !activeImageModelId || imageModels.length === 0) return;

    const selected = imageModels.find((m) => m.model_id === activeImageModelId);
    if (selected) {
      const nextUrls = (selected.gradio_urls && selected.gradio_urls.length > 0)
        ? selected.gradio_urls
        : [selected.gradio_url];
      setGradioUrl((prev) => (prev === selected.gradio_url ? prev : selected.gradio_url));
      setGradioUrls((prev) => sameStringArray(prev, nextUrls) ? prev : nextUrls);
      // No tocar status aquí
    } else {
      setGradioUrl(null);
      setGradioUrls([]);
      setStatus("UNKNOWN");
    }
  }, [activeImageModelId, imageModels, capability]);

  const { getClient } = useGradioClient(gradioUrls.length > 0 ? gradioUrls : null);

  useEffect(() => {
    if (!gradioUrl) return;

    let cancelled = false;
    const pollStatus = async () => {
      try {
        const client = await getClient();
        if (!client || cancelled) return;
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const result = await client.predict("/status", [token]);
        if (!cancelled) {
          const value = Array.isArray(result.data) ? result.data[0] : result.data;
          if (value === "UNAUTHORIZED") {
            setStatus("UNKNOWN");
          } else {
            setStatus((value as Status) ?? "UNKNOWN");
          }
        }
      } catch {
        // noop
      }
    };

    pollStatus();
    const intervalId = setInterval(pollStatus, 5000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [gradioUrl, getClient]);

  useEffect(() => {
    if (gradioUrl && status === "READY") {
      setSessionStartTime(Date.now());
    } else {
      setSessionStartTime(null);
      setSessionUptime("00:00:00");
    }
  }, [gradioUrl, status]);

  useEffect(() => {
    if (!sessionStartTime) return;
    const update = () => {
      const elapsed = Date.now() - sessionStartTime;
      const h = String(Math.floor(elapsed / 3600000)).padStart(2, "0");
      const m = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
      setSessionUptime(`${h}:${m}:${s}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  return {
    gradioUrl,
    gradioUrls,
    status,
    sessionUptime: sessionUptime,
    getClient,
    activeImageModelId,
    setActiveImageModelId,
    imageModels,
  };
}