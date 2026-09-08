// src/context/GenerationContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import type { CapabilityId, GenerationInfo, LogEntry, Status } from "../types";
import { supabase } from "../lib/supabaseClient";
import { useRuntime } from "../hooks/useRuntime";
import { useCreations } from "../hooks/useCreations";

type RecoveryState = "checking" | "idle" | "active";

interface ImageRuntime {
  model_id: string;
  gradio_url: string;
}

export interface SessionItem {
  id: string;
  type: 'user-prompt' | 'ai-response';
  prompt?: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'audio';
  modelId: string;
  createdAt: number;
  status: 'temporary' | 'saved' | 'saving';
  creationId?: string;
}

interface GenerateParams {
  prompt: string;
  seed: number;
  imageStartFile?: File | null;
  imageEndFile?: File | null;
  audioFile?: File | null;
  duration?: string;
  resolution?: string;
  aspectRatio?: string;
  guideScale?: number;
  matchAudioDur?: boolean;
  negativePrompt?: string;
  steps?: number;
  numImages?: number;
  stylePreset?: string;
  refFiles?: File[];
  refModeLabel?: string;
  maskFile?: File | null;
  modelModeLabel?: string;
  fluxGuideScale?: number;
  embeddedGuidance?: number;
}

interface GenerationContextValue {
  gradioUrl: string | null;
  capability: CapabilityId;
  setCapability: (c: CapabilityId) => void;
  isLoading: boolean;
  generationInfo: GenerationInfo | null;
  logs: LogEntry[];
  videoSrc: string | null;
  imageSrcs: string[] | null;
  videoRatio: number | null;
  setVideoRatio: (r: number) => void;
  setVideoSrc: (src: string | null) => void;
  setImageSrcs: (srcs: string[] | null) => void;
  statusMsg: string | null;
  setStatusMsg: (msg: string | null) => void;
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
  status: Status;
  sessionUptime: string;
  activeImageModelId: string | null;
  setActiveImageModelId: (id: string | null) => void;
  imageModels: ImageRuntime[];
  sessionHistory: SessionItem[];
  saveSessionItem: (itemId: string) => Promise<void>;
  discardSessionItem: (itemId: string) => void;
  clearSessionHistory: () => void;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

const GENERATION_POLL_MS = 2000;
const LOGS_POLL_MS = 2500;

export function GenerationProvider({
  stationId,
  children,
}: {
  stationId: string | null;
  children: ReactNode;
}) {
  const [capability, setCapability] = useState<CapabilityId>("video");
  const {
    gradioUrl,
    status,
    sessionUptime,
    getClient,
    activeImageModelId,
    setActiveImageModelId,
    imageModels,
  } = useRuntime({ stationId, capability });

  const { saveCreation } = useCreations();
  
  const [sessionHistory, setSessionHistory] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generationInfo, setGenerationInfo] = useState<GenerationInfo | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [imageSrcs, setImageSrcs] = useState<string[] | null>(null);
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

  // ===== Polling de estado =====
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
        
        if (info?.started_at != null && info.started_at + 1 < generationStartRef.current) return;
        
        if (!cancelled) {
          setGenerationInfo(info ?? null);
          if (info?.status === "complete" || info?.status === "error" || info?.status === "cancelled") {
            setIsLoading(false);
            if (info.status === "complete" && capability === "video") {
              const storedUrl = sessionStorage.getItem(`gen_video_${info.id}`);
              if (storedUrl) setVideoSrc(storedUrl);
            }
          }
        }
      } catch (err) {
        console.error("Error polling status:", err);
      }
    };
    poll();
    const interval = window.setInterval(poll, GENERATION_POLL_MS);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [isLoading, gradioUrl, getClient, capability]);

  // ===== Polling de logs =====
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
      } catch (err) {
        console.error("Error polling logs:", err);
      }
    };
    poll();
    const interval = window.setInterval(poll, LOGS_POLL_MS);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [isLoading, gradioUrl, getClient]);

  // ===== Recuperación =====
  useEffect(() => {
    let cancelled = false;
    const recover = async () => {
      if (!gradioUrl) { setRecoveryState("idle"); return; }
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
              if (info.status === "complete" && capability === "video") {
                const storedUrl = sessionStorage.getItem(`gen_video_${info.id}`);
                if (storedUrl) setVideoSrc(storedUrl);
              }
            }
          } else { setRecoveryState("idle"); }
        }
      } catch { if (!cancelled) setRecoveryState("idle"); }
    };
    recover();
    return () => { cancelled = true; };
  }, [gradioUrl, getClient, capability]);

  const parseImagesFromResult = (raw: unknown): string[] => {
    const images: string[] = [];
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (typeof item === "string") images.push(item);
        else if (item && typeof item === "object") {
          const maybe = (item as any).url || (item as any).image?.url || (item as any).path;
          if (typeof maybe === "string") images.push(maybe);
        }
      }
    }
    return images;
  };

  const toAbsoluteUrls = (urls: string[], baseUrl: string | null): string[] => {
    if (!baseUrl) return urls;
    const base = new URL(baseUrl).origin;
    return urls.map((url) => url.startsWith("http") ? url : `${base}${url.startsWith("/") ? "" : "/"}${url}`);
  };

  // ===== ACCIONES DE SESIÓN =====
  const saveSessionItem = useCallback(async (itemId: string) => {
    const item = sessionHistory.find(i => i.id === itemId);
    if (!item || item.status === 'saved') return;

    setSessionHistory(prev => prev.map(i => i.id === itemId ? { ...i, status: 'saving' } : i));

    try {
      const url = item.mediaUrls[0];
      if (!url) throw new Error("No media URL");

      const creation = await saveCreation({
        tempUrl: url,
        prompt: item.prompt || "",
        seed: 0,
        duration: item.mediaType === 'video' ? "5s" : "",
        resolution: "1080p",
        aspectRatio: "16:9",
        guideScale: 0,
        matchAudioDur: false,
        mediaType: item.mediaType,
        modelId: item.modelId,
      });

      if (creation) {
        setSessionHistory(prev => prev.map(i => i.id === itemId ? { ...i, status: 'saved', creationId: creation.id } : i));
      }
    } catch (e) {
      console.error("Error saving item:", e);
      setSessionHistory(prev => prev.map(i => i.id === itemId ? { ...i, status: 'temporary' } : i));
    }
  }, [sessionHistory, saveCreation]);

  const discardSessionItem = useCallback((itemId: string) => {
    setSessionHistory(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const clearSessionHistory = useCallback(() => {
    setSessionHistory([]);
  }, []);

  // ===== Generación principal =====
  const handleGenerate = useCallback(
    async (params: GenerateParams) => {
      if (!gradioUrl || !params.prompt.trim()) return;

      const localStart = Date.now() / 1000;
      generationStartRef.current = localStart;

      setIsLoading(true);
      setErrorMsg(null);
      setVideoSrc(null);
      setImageSrcs(null);
      setVideoRatio(null);
      setStatusMsg(null);
      setLogs([]);
      lastLogSeqRef.current = 0;
      setRecoveryState("active");

      const userItemId = `msg-${Date.now()}`;
      setSessionHistory(prev => [...prev, {
        id: userItemId,
        type: 'user-prompt',
        prompt: params.prompt,
        mediaUrls: [],
        mediaType: 'image',
        modelId: '',
        createdAt: Date.now(),
        status: 'temporary'
      }]);

      setGenerationInfo({
        status: "preparing",
        progress: 0,
        stage: "preparing",
        started_at: localStart,
        capability,
        modelId: activeImageModelId ?? undefined,
        prompt: params.prompt,
      });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { setErrorMsg("No hay sesión activa."); return; }

        const client = await getClient();
        if (!client) { setErrorMsg("No se pudo conectar con el runtime."); return; }

        if (capability === "video") {
          const result = await client.predict("/generate", [
            params.prompt, params.imageStartFile, params.imageEndFile || undefined,
            params.audioFile || undefined, params.seed, params.duration, params.resolution,
            params.aspectRatio, params.guideScale, params.matchAudioDur, token,
          ]);

          const data = result.data as unknown[];
          const videoData = data[0];
          const statusText = data[1] as string;

          let tempUrl: string | null = null;
          if (typeof videoData === "string") tempUrl = videoData;
          else if (videoData && typeof videoData === "object") {
            const maybe = videoData as { url?: string; video?: { url?: string } };
            tempUrl = maybe.url ?? maybe.video?.url ?? null;
          }

          if (tempUrl) {
            setVideoSrc(tempUrl);
            sessionStorage.setItem(`gen_video_${localStart}`, tempUrl);
            
            setSessionHistory(prev => [...prev, {
              id: `resp-${Date.now()}`,
              type: 'ai-response',
              prompt: params.prompt,
              mediaUrls: [tempUrl!],
              mediaType: 'video',
              modelId: 'ltx-2.3',
              createdAt: Date.now(),
              status: 'temporary'
            }]);

            setGenerationInfo(prev => ({ ...prev, status: "complete", progress: 1, stage: "complete", finished_at: Date.now() / 1000 }));
            if (statusText) setStatusMsg(statusText);
          } else {
            setErrorMsg("No se devolvió un video válido.");
          }
        } else if (capability === "image") {
          let absoluteUrls: string[] = [];
          
          if (activeImageModelId === "flux-2-klein-4b") {
            const fluxAspectMap: Record<string, string> = { 
              "1:1 Square": "1:1 Cuadrado", 
              "16:9 Landscape": "16:9 Horizontal", 
              "9:16 Portrait": "9:16 Vertical", 
              "4:3 Standard": "4:3 Estándar", 
              "3:4 Portrait": "3:4 Vertical",
              // Mapeo inverso por seguridad
              "1:1 Cuadrado": "1:1 Cuadrado",
              "16:9 Horizontal": "16:9 Horizontal",
              "9:16 Vertical": "9:16 Vertical",
              "4:3 Estándar": "4:3 Estándar",
              "3:4 Vertical": "3:4 Vertical",
            };
            const fluxResolutionMap: Record<string, string> = { 
              "1024px (Standard)": "1024px (Estándar)", 
              "1536px (High)": "1536px (Alta)", 
              "2048px (2K Ultra)": "2048px (2K Ultra)",
              // Mapeo inverso
              "1024px (Estándar)": "1024px (Estándar)",
              "1536px (Alta)": "1536px (Alta)",
            };

            const fluxAspect = fluxAspectMap[params.aspectRatio ?? ""] ?? "1:1 Cuadrado";
            const fluxResolution = fluxResolutionMap[params.resolution ?? ""] ?? "1024px (Estándar)";
            
            const validRefFiles = (params.refFiles || [])
              .filter((f): f is File => f instanceof File)
              .slice(0, 4);

            // CORRECCIÓN CRÍTICA: Forzar valor en español si es undefined/null
            // NUNCA enviar "None (Text-to-Image)"
            const safeRefModeLabel = params.refModeLabel && params.refModeLabel.trim() !== "" 
              ? params.refModeLabel 
              : "Ninguna (Texto → Imagen)";

            const safeModelMode = params.modelModeLabel || "Masked Denoising : Inpainted area may reuse some content that has been masked";

            const result = await client.predict("/generate", [
              params.prompt, 
              params.negativePrompt || "", 
              validRefFiles,
              safeRefModeLabel, // Aquí estaba el error
              null, 
              safeModelMode,
              fluxAspect, 
              fluxResolution, 
              params.steps ?? 4, 
              params.fluxGuideScale ?? 5.0,
              params.embeddedGuidance ?? 1.0, 
              params.seed, 
              params.numImages ?? 1, 
              token,
            ]);
            
            const data = result.data as unknown[];
            const images = parseImagesFromResult(data[0]);
            absoluteUrls = toAbsoluteUrls(images, gradioUrl);
            
          } else {
            // Krea
            const result = await client.predict("/generate", [
              params.prompt, 
              params.negativePrompt || "", 
              params.steps || 8,
              params.aspectRatio || "1:1 Square", 
              params.resolution || "1024px (Standard)",
              params.seed, 
              params.numImages || 1, 
              token,
            ]);
            const data = result.data as unknown[];
            const images = parseImagesFromResult(data[0]);
            absoluteUrls = toAbsoluteUrls(images, gradioUrl);
          }

          if (absoluteUrls.length > 0) {
            setImageSrcs(absoluteUrls);
            setSessionHistory(prev => [...prev, {
              id: `resp-${Date.now()}`,
              type: 'ai-response',
              prompt: params.prompt,
              mediaUrls: absoluteUrls,
              mediaType: 'image',
              modelId: activeImageModelId || 'krea-2-turbo',
              createdAt: Date.now(),
              status: 'temporary'
            }]);
            setGenerationInfo(prev => ({ ...prev, status: "complete", progress: 1, stage: "complete", finished_at: Date.now() / 1000 }));
          } else {
            setErrorMsg("No se devolvieron imágenes.");
          }
        }
      } catch (err) {
        console.error("Error crítico en generación:", err);
        setErrorMsg(err instanceof Error ? err.message : "Error al generar.");
        setGenerationInfo(prev => ({ ...prev, status: "error", finished_at: Date.now() / 1000 }));
      } finally {
        setIsLoading(false);
      }
    },
    [gradioUrl, getClient, capability, activeImageModelId]
  );

  const handleCancel = useCallback(async () => {
    if (!gradioUrl || isCancelling) return;
    setIsCancelling(true);
    try {
      const client = await getClient();
      if (!client) return;
      const result = await client.predict("/cancel", []);
      const msg = Array.isArray(result.data) ? result.data[0] : result.data;
      if (typeof msg === "string") setStatusMsg(msg);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo cancelar.");
    } finally {
      setIsCancelling(false);
    }
  }, [gradioUrl, getClient, isCancelling]);

  const nowSec = nowTick / 1000;
  const progressFrac = Math.min(1, Math.max(0, generationInfo?.progress ?? 0));
  const liveElapsedSec = isLoading && generationInfo?.started_at ? Math.max(0, nowSec - generationInfo.started_at) : null;
  const remainingSec = isLoading && generationInfo?.started_at && progressFrac > 0.03 && progressFrac < 1 ? Math.max(0, liveElapsedSec! / progressFrac - liveElapsedSec!) : null;
  const completedDurationSec = generationInfo?.status === "complete" && generationInfo.started_at && generationInfo.finished_at ? generationInfo.finished_at - generationInfo.started_at : null;
  const backendError = generationInfo?.status === "error" && generationInfo.error ? generationInfo.error : null;
  const canCancel = isLoading && (generationInfo?.cancellable ?? true) && generationInfo?.status !== "cancelled" && generationInfo?.status !== "complete";

  const value: GenerationContextValue = {
    gradioUrl, capability, setCapability, isLoading, generationInfo, logs,
    videoSrc, imageSrcs, videoRatio, setVideoRatio, setVideoSrc, setImageSrcs,
    statusMsg, setStatusMsg, errorMsg, setErrorMsg, isCancelling,
    handleGenerate, handleCancel, progressFrac, liveElapsedSec, remainingSec,
    completedDurationSec, backendError, canCancel, recoveryState, status,
    sessionUptime, activeImageModelId, setActiveImageModelId, imageModels,
    sessionHistory, saveSessionItem, discardSessionItem, clearSessionHistory
  };

  return <GenerationContext.Provider value={value}>{children}</GenerationContext.Provider>;
}

export function useGenerationContext() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("useGenerationContext must be used within GenerationProvider");
  return ctx;
}