// src/context/GenerationContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import type { CapabilityId, GenerationInfo, LogEntry, Status } from "../types";
import { supabase } from "../lib/supabaseClient";
import { useRuntime } from "../hooks/useRuntime";
import { useStationStatus } from "../hooks/useStationStatus";

type RecoveryState = "checking" | "idle" | "active";

interface ImageRuntime {
  model_id: string;
  gradio_url: string;
}

export interface SessionItem {
  id: string;
  prompt: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'audio';
  modelId: string;
  modelLabel: string;
  aspectRatio: string;
  createdAt: number;
  status: 'temporary' | 'saved' | 'saving';
  isGenerating: boolean;
  creationId?: string;
  /** Parámetros de generación usados (para Variación) */
  params?: Record<string, unknown>;
  /** URLs de las imágenes de referencia persistidas (para Variación) */
  refUrls?: string[];
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
  appendSessionItem: (item: SessionItem) => void;
  updateSessionItem: (id: string, patch: Partial<SessionItem>) => void;
  removeSessionItem: (id: string) => void;
  discardSessionItem: (id: string) => void;
  clearSessionHistory: () => void;
  stationStatusMap: Record<string, 'online' | 'offline'>;
  stationStatusLoading: boolean;
  refreshStationStatus: () => Promise<void>;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

const GENERATION_POLL_MS = 2000;
const LOGS_POLL_MS = 2500;

function mapBackendParams(raw: any): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  // Fix: null/undefined seed → -1 (aleatorio), no 0
  const normalizeSeed = (v: unknown): number => {
    if (v === null || v === undefined) return -1;
    const n = Number(v);
    return Number.isFinite(n) ? n : -1;
  };
  return {
    negativePrompt: r.negative_prompt,
    steps: r.steps,
    resolution: r.resolution,
    seed: normalizeSeed(r.seed),
    numImages: r.num_images,
    guideScale: r.guide_scale,
    embeddedGuidance: r.embedded_guidance,
    refModeLabel: r.ref_mode,
    modelModeLabel: r.model_mode,
    fluxGuideScale: r.guide_scale,  // alias: mismo valor que guideScale en Flux
    stylePreset: r.style_preset,
    duration: r.duration,
    matchAudioDur: r.match_audio_dur,
  };
}

// Estilos de Krea — se aplican concatenando un sufijo al prompt.
// Krea 2 Turbo no acepta style_preset como input del /generate, así que
// resolvemos el estilo a nivel de prompt engineering.
const KREA_STYLE_SUFFIXES: Record<string, string> = {
  "None": "",
  "Cinematic": ", cinematic shot, dramatic lighting, 35mm film still, color graded, shallow depth of field, filmic grain, highly detailed",
  "Anime": ", anime style, cel shaded, vibrant saturated colors, detailed lineart, anime key visual, studio quality illustration",
  "Photorealistic": ", photorealistic, hyperdetailed, shot on Canon EOS R5 with 85mm f/1.4 lens, natural lighting, sharp focus, 8k uhd, raw photo",
  "3D Render": ", 3d render, octane render, physically based rendering, subsurface scattering, cinematic volumetric lighting, ultra detailed",
};

function applyStylePreset(prompt: string, stylePreset?: string): string {
  if (!stylePreset) return prompt;
  const suffix = KREA_STYLE_SUFFIXES[stylePreset] ?? "";
  if (!suffix) return prompt;
  return `${prompt.trim()}${suffix}`;
}

function mapBackendItem(raw: any): SessionItem {
  const status = raw.status as string;
  const isGenerating = status === "preparing" || status === "running";
  const startedAtSec = typeof raw.started_at === "number" ? raw.started_at : Date.now() / 1000;
  return {
    id: String(raw.id ?? ""),
    prompt: String(raw.prompt ?? ""),
    mediaUrls: Array.isArray(raw.output_urls) ? raw.output_urls : [],
    mediaType: raw.capability === "video" ? "video" : raw.capability === "audio" ? "audio" : "image",
    modelId: String(raw.model_id ?? ""),
    modelLabel: String(raw.model_label ?? ""),
    aspectRatio: String(raw.aspect_ratio ?? "1/1"),
    createdAt: Math.round(startedAtSec * 1000),
    status: "temporary",
    isGenerating,
    params: mapBackendParams(raw.parameters),
    refUrls: Array.isArray(raw.ref_urls) ? raw.ref_urls.map(String) : undefined,
  };
}

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

  const {
    statusMap: stationStatusMap,
    loading: stationStatusLoading,
    refresh: refreshStationStatus,
  } = useStationStatus(stationId);

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

  useEffect(() => {
    if (!isLoading || !gradioUrl) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const client = await getClient();
        if (!client || cancelled) return;
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const result = await client.predict("/generation_status", [token]);
        const raw = Array.isArray(result.data) ? result.data[0] : result.data;
        // El backend devuelve {} si el JWT no es válido — tratarlo como null
        const info = (raw && typeof raw === "object" && Object.keys(raw as object).length > 0)
          ? raw as GenerationInfo
          : undefined;

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

  useEffect(() => {
    if (!isLoading || !gradioUrl) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const client = await getClient();
        if (!client || cancelled) return;
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const result = await client.predict("/logs", [token, lastLogSeqRef.current]);
        const raw = Array.isArray(result.data) ? result.data[0] : result.data;
        const entries = Array.isArray(raw) ? (raw as LogEntry[]) : undefined;
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

  useEffect(() => {
    let cancelled = false;
    const recover = async () => {
      if (!gradioUrl) { setRecoveryState("idle"); return; }
      try {
        const client = await getClient();
        if (!client || cancelled) return;
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { if (!cancelled) setRecoveryState("idle"); return; }
        const result = await client.predict("/generation_status", [token]);
        const raw = Array.isArray(result.data) ? result.data[0] : result.data;
        const info = (raw && typeof raw === "object" && Object.keys(raw as object).length > 0)
          ? raw as GenerationInfo
          : undefined;
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

  // ===== B.4: Auto-detección de capability activa al montar (una vez por stationId) =====
  // Refs para evitar re-ejecutar el efecto cuando cambian capability o imageModels
  const capabilityRef = useRef<CapabilityId>(capability);
  const imageModelsRef = useRef<ImageRuntime[]>(imageModels);
  useEffect(() => { capabilityRef.current = capability; }, [capability]);
  useEffect(() => { imageModelsRef.current = imageModels; }, [imageModels]);

  useEffect(() => {
    if (!stationId) return;
    let cancelled = false;

    const detectCapability = async () => {
      try {
        const { data, error } = await supabase
          .from("runtimes")
          .select("model_type")
          .eq("station_id", stationId)
          .eq("state", "READY");

        if (cancelled) return;

        const currentCapability = capabilityRef.current;

        if (error || !Array.isArray(data) || data.length === 0) {
          const models = imageModelsRef.current;
          if (Array.isArray(models) && models.length > 0 && currentCapability !== "image") {
            setCapability("image");
          }
          return;
        }

        const available = new Set<string>(
          data.map((row: { model_type?: string }) => String(row.model_type ?? ""))
        );

        if (available.has(currentCapability)) return;

        const priority: CapabilityId[] = ["video", "image", "audio"];
        const next = priority.find((c) => available.has(c));
        if (next && next !== currentCapability) {
          setCapability(next);
        }
      } catch (err) {
        console.error("Error detectando capability:", err);
        const models = imageModelsRef.current;
        if (Array.isArray(models) && models.length > 0 && capabilityRef.current !== "image") {
          setCapability("image");
        }
      }
    };

    detectCapability();
    return () => { cancelled = true; };
  }, [stationId]);

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

  const appendSessionItem = useCallback((item: SessionItem) => {
    setSessionHistory(prev => [...prev, item]);
  }, []);

  const updateSessionItem = useCallback((id: string, patch: Partial<SessionItem>) => {
    setSessionHistory(prev => prev.map(item =>
      item.id === id ? { ...item, ...patch } : item
    ));
  }, []);

  const removeSessionItem = useCallback((id: string) => {
    setSessionHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const discardSessionItem = useCallback((id: string) => {
    removeSessionItem(id);
  }, [removeSessionItem]);

  const clearSessionHistory = useCallback(() => {
    setSessionHistory([]);
  }, []);

  const fetchSessionHistory = useCallback(async (): Promise<SessionItem[]> => {
    try {
      const client = await getClient();
      if (!client) return [];
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return [];
      const result = await client.predict("/session_history", [token]);
      const raw = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((it: any) => it && (it.status === "complete" || it.status === "preparing" || it.status === "running"))
        .map(mapBackendItem);
    } catch (err) {
      console.error("Error fetching session_history:", err);
      return [];
    }
  }, [getClient]);

  useEffect(() => {
    if (!stationId) {
      setSessionHistory([]);
      return;
    }
    if (!gradioUrl) return;
    let cancelled = false;
    const hydrate = async () => {
      const items = await fetchSessionHistory();
      if (cancelled) return;
      setSessionHistory(items);
    };
    hydrate();
    return () => { cancelled = true; };
  }, [gradioUrl, stationId, fetchSessionHistory]);

  // ===== FIX 2: polling continuo mientras haya items isGenerating =====
  // Mientras el chat tenga items en estado "generando", hace polling a
  // /session_history cada 2s hasta que TODOS se resuelvan. Corta solo.
  // Inmune al timing de isLoading → resuelve el caso "F5 mid-generation".
  const hasGeneratingItems = sessionHistory.some(it => it.isGenerating);
  useEffect(() => {
    if (!hasGeneratingItems || !gradioUrl) return;
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        try {
          const items = await fetchSessionHistory();
          if (cancelled) return;
          if (items.length > 0) {
            const stillGenerating = items.some(it => it.isGenerating);
            // MERGE en lugar de REPLACE: preservar items locales con
            // isGenerating:true que aún no aparecen en el backend.
            // Esto evita que el primer poll (que puede llegar antes de que
            // el backend cree el history_entry) borre el skeleton local.
            setSessionHistory(prev => {
              const backendIds = new Set(items.map(b => b.id));
              const backendGeneratingPrompts = new Set(
                items.filter(b => b.isGenerating).map(b => b.prompt)
              );
              const localOrphans = prev.filter(p =>
                p.isGenerating &&
                p.id.startsWith('msg-') &&
                !backendIds.has(p.id) &&
                !backendGeneratingPrompts.has(p.prompt)
              );
              if (localOrphans.length === 0) return items;
              // Orphans van al final (son los más recientes)
              return [...items, ...localOrphans];
            });
            if (!stillGenerating) return;
          }
        } catch { /* noop */ }
        await new Promise(r => setTimeout(r, 2000));
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [hasGeneratingItems, gradioUrl, fetchSessionHistory]);

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

      const rawAspect = params.aspectRatio ?? "";
      const _m = rawAspect.match(/(\d+)\s*:\s*(\d+)/);
      const aspectRatioCss = _m ? `${_m[1]}/${_m[2]}` : "1/1";

      const userItemId = `msg-${Date.now()}`;
      setSessionHistory(prev => [...prev, {
        id: userItemId,
        prompt: params.prompt,
        mediaUrls: [],
        mediaType: capability === 'video' ? 'video' : capability === 'audio' ? 'audio' : 'image',
        modelId: activeImageModelId || '',
        modelLabel: activeImageModelId === 'flux-2-klein-4b' ? 'Flux 2' : activeImageModelId === 'krea-2-turbo' ? 'Krea' : 'LTX 2.3',
        aspectRatio: aspectRatioCss,
        createdAt: Date.now(),
        status: 'temporary',
        isGenerating: true,
        params: {
          negativePrompt: params.negativePrompt,
          steps: params.steps,
          resolution: params.resolution,
          aspectRatio: params.aspectRatio,
          seed: params.seed,
          numImages: params.numImages,
          stylePreset: params.stylePreset,
          refModeLabel: params.refModeLabel,
          modelModeLabel: params.modelModeLabel,
          fluxGuideScale: params.fluxGuideScale,
          embeddedGuidance: params.embeddedGuidance,
          duration: params.duration,
          guideScale: params.guideScale,
          matchAudioDur: params.matchAudioDur,
        },
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

            setSessionHistory(prev => prev.map(item => {
              if (item.isGenerating) {
                return {
                  ...item,
                  mediaUrls: [tempUrl],
                  isGenerating: false,
                  status: 'temporary' as const
                };
              }
              return item;
            }));

            setGenerationInfo(prev => ({ ...prev, status: "complete", progress: 1, stage: "complete", finished_at: Date.now() / 1000 }));
            if (statusText) setStatusMsg(statusText);
          } else {
            setErrorMsg("No se devolvió un video válido.");
          }
        } else if (capability === "image") {
          let absoluteUrls: string[] = [];

          if (activeImageModelId === "flux-2-klein-4b") {
            const fluxAspectMap: Record<string, string> = {
              // Labels exactos del UI (FLUX_ASPECT_RATIOS)
              "1:1 Cuadrado": "1:1 Cuadrado",
              "16:9 Paisaje": "16:9 Horizontal",
              "9:16 Retrato": "9:16 Vertical",
              "4:5 Retrato": "3:4 Vertical",
              // Labels canónicos del backend (por robustez)
              "16:9 Horizontal": "16:9 Horizontal",
              "9:16 Vertical": "9:16 Vertical",
              "4:3 Estándar": "4:3 Estándar",
              "3:4 Vertical": "3:4 Vertical",
              // Labels en inglés (por compatibilidad con variantes)
              "1:1 Square": "1:1 Cuadrado",
              "16:9 Landscape": "16:9 Horizontal",
              "9:16 Portrait": "9:16 Vertical",
              "4:3 Standard": "4:3 Estándar",
              "3:4 Portrait": "3:4 Vertical",
            };
            const fluxResolutionMap: Record<string, string> = {
              "1024px (Standard)": "1024px (Estándar)",
              "1536px (High)": "1536px (Alta)",
              "2048px (2K Ultra)": "2048px (2K Ultra)",
              "1024px (Estándar)": "1024px (Estándar)",
              "1536px (Alta)": "1536px (Alta)",
            };

            const fluxAspect = fluxAspectMap[params.aspectRatio ?? ""] ?? "1:1 Cuadrado";
            const fluxResolution = fluxResolutionMap[params.resolution ?? ""] ?? "1024px (Estándar)";

            const validRefFiles = (params.refFiles || [])
              .filter((f): f is File => f instanceof File)
              .slice(0, 4);

            const safeRefModeLabel = params.refModeLabel && params.refModeLabel.trim() !== ""
              ? params.refModeLabel
              : "Ninguna (Texto → Imagen)";

            const safeModelMode = params.modelModeLabel || "Masked Denoising : Inpainted area may reuse some content that has been masked";

            const result = await client.predict("/generate", [
              params.prompt,
              params.negativePrompt || "",
              validRefFiles,
              safeRefModeLabel,
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
            // Aplicar style preset concatenando un sufijo al prompt
            const styledPrompt = applyStylePreset(params.prompt, params.stylePreset);

            const result = await client.predict("/generate", [
              styledPrompt,
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
            setSessionHistory(prev => prev.map(item => {
              if (item.isGenerating) {
                return {
                  ...item,
                  mediaUrls: absoluteUrls,
                  isGenerating: false,
                  status: 'temporary' as const
                };
              }
              return item;
            }));
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
        const deadline = Date.now() + 3000;
        while (Date.now() < deadline) {
          try {
            const items = await fetchSessionHistory();
            const anyPreparing = items.some(it => it.isGenerating);
            if (items.length > 0 && !anyPreparing) {
              setSessionHistory(items);
              break;
            }
          } catch {}
          await new Promise(r => setTimeout(r, 300));
        }
      }
    },
    [gradioUrl, getClient, capability, activeImageModelId, fetchSessionHistory]
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
    sessionHistory, appendSessionItem, updateSessionItem, removeSessionItem, discardSessionItem, clearSessionHistory,
    stationStatusMap, stationStatusLoading, refreshStationStatus
  };

  return <GenerationContext.Provider value={value}>{children}</GenerationContext.Provider>;
}

export function useGenerationContext() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("useGenerationContext must be used within GenerationProvider");
  return ctx;
}
