import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import type { Client } from "@gradio/client";
import type { GenerationInfo, LogEntry } from "../types";
import { supabase } from "../lib/supabaseClient";

type RecoveryState = "checking" | "idle" | "active";

interface GenerateParams {
  imageStartFile: File;
  imageEndFile?: File | null;
  audioFile?: File | null;
  prompt: string;
  seed: number;
  duration: string;
  resolution: string;
  aspectRatio: string;
  guideScale: number;
  matchAudioDur: boolean;
}

interface GenerationContextValue {
  gradioUrl: string | null;
  isLoading: boolean;
  generationInfo: GenerationInfo | null;
  logs: LogEntry[];
  videoSrc: string | null;
  videoRatio: number | null;
  setVideoRatio: (r: number) => void;
  setVideoSrc: (src: string | null) => void;
  statusMsg: string | null;
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
  isCancelling: boolean;
  handleGenerate: (params: GenerateParams) => Promise<void>;
  handleCancel: () => Promise<void>;
  progressFrac: number;
  liveElapsedSec: number | null;
  remainingSec: number | null;
  completedDurationSec: number | null;
  backendError: string | null;
  canCancel: boolean;
  recoveryState: RecoveryState;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

const GENERATION_POLL_MS = 2000;
const LOGS_POLL_MS = 2500;

export function GenerationProvider({
  gradioUrl,
  getClient,
  children,
}: {
  gradioUrl: string | null;
  getClient: () => Promise<Client | null>;
  children: ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [generationInfo, setGenerationInfo] = useState<GenerationInfo | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoRatio, setVideoRatio] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");

  const lastLogSeqRef = useRef<number>(0);
  const generationStartRef = useRef<number>(0);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  useEffect(() => {
    if (!isLoading) return;
    const interval = window.setInterval(() => setNowTick(Date.now()), 1000);
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

          if (
            info?.status === "complete" ||
            info?.status === "error" ||
            info?.status === "cancelled"
          ) {
            setIsLoading(false);

            if (info.status === "complete") {
              const storedUrl = sessionStorage.getItem(`gen_video_${info.id}`);
              if (storedUrl) setVideoSrc(storedUrl);
            }
          }
        }
      } catch {
        // noop
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
        // noop
      }
    };

    poll();
    const interval = window.setInterval(poll, LOGS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isLoading, gradioUrl, getClient]);

  useEffect(() => {
    let cancelled = false;

    const recover = async () => {
      if (!gradioUrl) {
        setRecoveryState("idle");
        return;
      }

      try {
        const client = await getClient();
        if (!client || cancelled) return;

        const result = await client.predict("/generation_status", []);
        const raw = Array.isArray(result.data) ? result.data[0] : result.data;
        const info = raw as GenerationInfo | undefined;

        if (!cancelled) {
          if (info && info.status && info.status !== "idle") {
            setGenerationInfo(info);
            if (info.status === "preparing" || info.status === "running") {
              setIsLoading(true);
              generationStartRef.current = info.started_at ?? Date.now() / 1000;
              setRecoveryState("active");
            } else {
              setRecoveryState("idle");
              setIsLoading(false);
              if (info.status === "complete") {
                const storedUrl = sessionStorage.getItem(`gen_video_${info.id}`);
                if (storedUrl) setVideoSrc(storedUrl);
              }
            }
          } else {
            setRecoveryState("idle");
          }
        }
      } catch {
        if (!cancelled) setRecoveryState("idle");
      }
    };

    recover();
    return () => {
      cancelled = true;
    };
  }, [gradioUrl, getClient]);

  const handleGenerate = useCallback(
    async ({
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
    }: GenerateParams) => {
      if (!gradioUrl || !imageStartFile || !prompt.trim()) return;

      const localStart = Date.now() / 1000;
      generationStartRef.current = localStart;

      setIsLoading(true);
      setErrorMsg(null);
      setVideoSrc(null);
      setVideoRatio(null);
      setStatusMsg(null);
      setLogs([]);
      lastLogSeqRef.current = 0;
      setRecoveryState("active");

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
        } else if (videoData && typeof videoData === "object") {
          const maybe = videoData as { url?: string; video?: { url?: string } };
          url = maybe.url ?? maybe.video?.url ?? null;
        }

        if (url) {
          setVideoSrc(url);
          const gid = generationInfo?.id || "";
          sessionStorage.setItem(`gen_video_${gid}`, url);
        } else {
          setErrorMsg("No se devolvió un video válido.");
        }

        if (statusText) setStatusMsg(statusText);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error al generar video.");
      } finally {
        setIsLoading(false);
      }
    },
    [gradioUrl, getClient, generationInfo?.id]
  );

  const handleCancel = useCallback(async () => {
    if (!gradioUrl || isCancelling) return;

    setIsCancelling(true);
    try {
      const client = await getClient();
      if (!client) {
        setErrorMsg("No se pudo conectar con el runtime.");
        return;
      }

      const result = await client.predict("/cancel", []);
      const msg = Array.isArray(result.data) ? result.data[0] : result.data;
      if (typeof msg === "string") setStatusMsg(msg);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo enviar la cancelación.");
    } finally {
      setIsCancelling(false);
    }
  }, [gradioUrl, getClient, isCancelling]);

  const nowSec = nowTick / 1000;
  const progressFrac = Math.min(1, Math.max(0, generationInfo?.progress ?? 0));

  const liveElapsedSec =
    isLoading && generationInfo?.started_at
      ? Math.max(0, nowSec - generationInfo.started_at)
      : null;

  const remainingSec =
    isLoading && generationInfo?.started_at && progressFrac > 0.03 && progressFrac < 1
      ? Math.max(0, liveElapsedSec! / progressFrac - liveElapsedSec!)
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

  const value: GenerationContextValue = {
    gradioUrl,
    isLoading,
    generationInfo,
    logs,
    videoSrc,
    videoRatio,
    setVideoRatio,
    setVideoSrc,
    statusMsg,
    errorMsg,
    setErrorMsg,
    isCancelling,
    handleGenerate,
    handleCancel,
    progressFrac,
    liveElapsedSec,
    remainingSec,
    completedDurationSec,
    backendError,
    canCancel,
    recoveryState,
  };

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGenerationContext() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("useGenerationContext must be used within GenerationProvider");
  return ctx;
}
