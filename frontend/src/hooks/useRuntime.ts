import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { CapabilityId, Status } from "../types";
import { useGradioClient } from "./useGradioClient";

interface UseRuntimeParams {
  stationId: string | null;
  capability?: CapabilityId;
}

export function useRuntime({ stationId, capability = "video" }: UseRuntimeParams) {
  const [gradioUrl, setGradioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("UNKNOWN");
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionUptime, setSessionUptime] = useState<string>("00:00:00");

  useEffect(() => {
    if (!stationId) {
      setGradioUrl(null);
      setStatus("UNKNOWN");
      setSessionStartTime(null);
      setSessionUptime("00:00:00");
      return;
    }

    const modelType = capability === "image" ? "image" : "video";

    const fetchRuntime = async () => {
      const { data, error } = await supabase
        .from("runtimes")
        .select("gradio_url, state, model_type")
        .eq("station_id", stationId)
        .eq("model_type", modelType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setGradioUrl(data.gradio_url);
        setStatus((data.state as Status) ?? "UNKNOWN");
      } else {
        setGradioUrl(null);
        setStatus("UNKNOWN");
      }
    };

    fetchRuntime();
    const interval = setInterval(fetchRuntime, 5000);
    return () => clearInterval(interval);
  }, [stationId, capability]);

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
    sessionUptime,
    getClient,
  };
}
