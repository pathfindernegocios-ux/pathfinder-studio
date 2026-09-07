import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { CapabilityId, Status } from "../types";
import { useGradioClient } from "./useGradioClient";

interface ImageRuntime {
  model_id: string;
  gradio_url: string;
}

interface UseRuntimeParams {
  stationId: string | null;
  capability?: CapabilityId;
}

export function useRuntime({ stationId, capability = "video" }: UseRuntimeParams) {
  const [gradioUrl, setGradioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("UNKNOWN");
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionUptime, setSessionUptime] = useState<string>("00:00:00");
  const [activeImageModelId, setActiveImageModelId] = useState<string | null>(null);
  const [imageModels, setImageModels] = useState<ImageRuntime[]>([]);

  useEffect(() => {
    if (!stationId) {
      setGradioUrl(null);
      setStatus("UNKNOWN");
      setSessionStartTime(null);
      setSessionUptime("00:00:00");
      setActiveImageModelId(null);
      setImageModels([]);
      return;
    }

    const modelType = capability === "image" ? "image" : "video";

    const fetchRuntime = async () => {
      if (modelType === "image") {
        // Obtener todos los runtimes de imagen
        const { data, error } = await supabase
          .from("runtimes")
          .select("gradio_url, state, model_id")
          .eq("station_id", stationId)
          .eq("model_type", "image")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const runtimes = data as { gradio_url: string; state: Status; model_id: string }[];

          setImageModels(runtimes.map((r) => ({ model_id: r.model_id, gradio_url: r.gradio_url })));

          setActiveImageModelId((prev) => {
            if (prev && runtimes.some((r) => r.model_id === prev)) return prev;
            return runtimes[0].model_id;
          });

          // No tocar gradioUrl ni status aquí; lo maneja el efecto siguiente
          // y el polling de /status. Así evitamos el parpadeo.
        } else {
          // Solo si no hay runtimes, limpiar
          setImageModels([]);
          setActiveImageModelId(null);
          setGradioUrl(null);
          setStatus("UNKNOWN");
        }
      } else {
        // Video: comportamiento original, pero sin forzar estado desde Supabase
        const { data, error } = await supabase
          .from("runtimes")
          .select("gradio_url, state")
          .eq("station_id", stationId)
          .eq("model_type", "video")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data && data.gradio_url) {
          setGradioUrl((prev) => (prev === data.gradio_url ? prev : data.gradio_url));
          // El estado lo actualizará /status; no usamos data.state
        } else {
          setGradioUrl(null);
          setStatus("UNKNOWN");
        }

        setImageModels([]);
        setActiveImageModelId(null);
      }
    };

    fetchRuntime();
    const interval = setInterval(fetchRuntime, 5000);
    return () => clearInterval(interval);
  }, [stationId, capability]);

  // Efecto para actualizar gradioUrl según el modelo activo de imagen
  useEffect(() => {
    if (capability !== "image" || !activeImageModelId || imageModels.length === 0) return;

    const selected = imageModels.find((m) => m.model_id === activeImageModelId);
    if (selected) {
      setGradioUrl((prev) => (prev === selected.gradio_url ? prev : selected.gradio_url));
      // No tocar status aquí
    } else {
      setGradioUrl(null);
      setStatus("UNKNOWN");
    }
  }, [activeImageModelId, imageModels, capability]);

  const { getClient } = useGradioClient(gradioUrl);

  useEffect(() => {
    if (!gradioUrl) return;

    let cancelled = false;
    const pollStatus = async () => {
      try {
        const client = await getClient();
        if (!client || cancelled) return;
        const result = await client.predict("/status", []);
        if (!cancelled) {
          const value = Array.isArray(result.data) ? result.data[0] : result.data;
          setStatus((value as Status) ?? "UNKNOWN");
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
    status,
    sessionUptime: sessionUptime,
    getClient,
    activeImageModelId,
    setActiveImageModelId,
    imageModels,
  };
}