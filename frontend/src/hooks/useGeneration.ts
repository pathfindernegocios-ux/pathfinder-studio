import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Client } from "@gradio/client";
import type { GenerationInfo, LogEntry, Status } from "../types";

interface UseGenerationParams {
  getClient: () => Promise<Client | null>;
  gradioUrl: string | null;

  imageStartFile: File | null;
  imageEndFile: File | null;
  audioFile: File | null;

  prompt: string;
  seed: number;
  duration: string;
  resolution: string;
  aspectRatio: string;
  guideScale: number;
  matchAudioDur: boolean;
  status: Status;
}

const GENERATION_POLL_MS = 2000;
const LOGS_POLL_MS = 2500;

export function useGeneration({
  getClient,
  gradioUrl,
  imageStartFile,
  imageEndFile,
  audioFile,
  prompt,
  seed,
  duration,
  resolution,
  aspectRatio,
  guideScale,
  matchAudioDur,
  status,
}: UseGenerationParams) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoRatio, setVideoRatio] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generationInfo, setGenerationInfo] = useState<GenerationInfo | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);

  const lastLogSeqRef = useRef<number>(0);
  const generationStartRef = useRef<number>(0);

  const [nowTick, setNowTick] = useState<number>(Date.now());

  useEffect(() => {
    if (!isLoading) return;

    const interval = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading || !gradioUrl) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const client = await getClient();
        if (!client || cancelled) return;

        const result = await client.predict("/generation_status", []);

        const raw = Array.isArray(result.data) ? result.data[0] : result.data;
        const info = raw as GenerationInfo | undefined;

        if (
          info?.started_at != null &&
          info.started_at + 1 < generationStartRef.current
        ) {
          return;
        }

        if (!cancelled) {
          setGenerationInfo(info ?? null);
        }
      } catch {
        // Mantener comportamiento actual.
      }
    };

    poll();

    const interval = window.setInterval(poll, GENERATION_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isLoading, gradioUrl, getClient]);

  useEffect(() => {
    if (!isLoading || !gradioUrl) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const client = await getClient();
        if (!client || cancelled) return;

        const result = await client.predict("/logs", [lastLogSeqRef.current]);

        const raw = Array.isArray(result.data) ? result.data[0] : result.data;
        const entries = raw as LogEntry[] | undefined;

        if (!entries?.length || cancelled) return;

        lastLogSeqRef.current = entries[entries.length - 1].seq;

        setLogs((prev) => [...prev, ...entries].slice(-400));
      } catch {
        // Mantener comportamiento actual.
      }
    };

    poll();

    const interval = window.setInterval(poll, LOGS_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isLoading, gradioUrl, getClient]);

  const handleGenerate = async () => {
    if (
      !imageStartFile ||
      !prompt ||
      !gradioUrl ||
      status !== "READY"
    ) {
      return;
    }

    const localStart = Date.now() / 1000;
    generationStartRef.current = localStart;

    setIsLoading(true);
    setErrorMsg(null);
    setVideoSrc(null);
    setVideoRatio(null);
    setStatusMsg(null);
    setLogs([]);
    lastLogSeqRef.current = 0;

    setGenerationInfo({
      status: "preparing",
      progress: 0,
      stage: "preparing",
      started_at: localStart,
    });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        setErrorMsg("No hay sesión activa. Inicia sesión.");
        return;
      }

      const client = await getClient();

      if (!client) {
        setErrorMsg("No se pudo conectar con el runtime.");
        return;
      }

      const result = await client.predict("/generate", [
        prompt,
        imageStartFile,
        imageEndFile || undefined,
        audioFile || undefined,
        seed,
        duration,
        resolution,
        aspectRatio,
        guideScale,
        matchAudioDur,
        token,
      ]);

      const data = result.data as unknown[];

      const videoData = data[0];
      const statusText = data[1] as string;

      let url: string | null = null;

      if (typeof videoData === "string") {
        url = videoData;
      } else if (
        videoData &&
        typeof videoData === "object"
      ) {
        const maybe = videoData as {
          url?: string;
          video?: { url?: string };
        };

        url = maybe.url ?? maybe.video?.url ?? null;
      }

      if (url) {
        setVideoSrc(url);
      } else {
        setErrorMsg("No se devolvió un video válido.");
      }

      if (statusText) {
        setStatusMsg(statusText);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Error al generar video."
      );
    } finally {
      setIsLoading(false);

      setGenerationInfo((prev) => (prev ? { ...prev } : prev));
    }
  };

  const handleCancel = async () => {
    if (!gradioUrl || isCancelling) return;

    setIsCancelling(true);

    try {
      const client = await getClient();

      if (!client) {
        setErrorMsg("No se pudo conectar con el runtime.");
        return;
      }

      const result = await client.predict("/cancel", []);

      const msg = Array.isArray(result.data)
        ? result.data[0]
        : result.data;

      if (typeof msg === "string") {
        setStatusMsg(msg);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "No se pudo enviar la cancelación."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const nowSec = nowTick / 1000;

  const progressFrac = Math.min(
    1,
    Math.max(0, generationInfo?.progress ?? 0)
  );

  const liveElapsedSec =
    isLoading && generationInfo?.started_at
      ? Math.max(0, nowSec - generationInfo.started_at)
      : null;

  const remainingSec =
    isLoading &&
    generationInfo?.started_at &&
    progressFrac > 0.03 &&
    progressFrac < 1
      ? Math.max(
          0,
          liveElapsedSec! / progressFrac - liveElapsedSec!
        )
      : null;

  const completedDurationSec =
    generationInfo?.status === "complete" &&
    generationInfo.started_at &&
    generationInfo.finished_at
      ? generationInfo.finished_at - generationInfo.started_at
      : null;

  const backendError =
    generationInfo?.status === "error" && generationInfo.error
      ? generationInfo.error
      : null;

  const canCancel =
    isLoading &&
    (generationInfo?.cancellable ?? true) &&
    generationInfo?.status !== "cancelled" &&
    generationInfo?.status !== "complete";

  return {
    videoSrc,
    setVideoSrc,
    videoRatio,
    setVideoRatio,
    statusMsg,
    errorMsg,
    setErrorMsg,
    isLoading,
    generationInfo,
    logs,
    isCancelling,
    handleGenerate,
    handleCancel,
    progressFrac,
    liveElapsedSec,
    remainingSec,
    completedDurationSec,
    backendError,
    canCancel,
  };
}