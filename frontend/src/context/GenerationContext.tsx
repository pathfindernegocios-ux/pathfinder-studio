// src/context/GenerationContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ReactNode } from "react";
import type { CapabilityId, GenerationInfo, LogEntry, Status } from "../types";
import { supabase } from "../lib/supabaseClient";
import { readLiveCache, writeLiveCache } from "../lib/liveCache";
import { rebaseMediaUrl } from "../lib/mediaUrl";
import { getChatLabel, getRuntimeId } from "../config/models";
import { useRuntime } from "../hooks/useRuntime";
import { useStationStatus } from "../hooks/useStationStatus";

type RecoveryState = "checking" | "idle" | "active";

interface ImageRuntime {
  model_id: string;
  gradio_url: string;
}

export interface StoryboardSceneMeta {
  index: number;
  mode: 'first' | 'cut' | 'continue';
  durationSec: number;
  prompt: string;
}

export interface StoryboardMeta {
  totalScenes: number;
  /** Escena actual 1-based. Solo válido durante la generación. */
  currentScene: number;
  scenes: StoryboardSceneMeta[];
}

export interface StoryboardScenePayload {
  mode: 'first' | 'cut' | 'continue';
  prompt: string;
  duration_sec: number;
  /** Solo aplica cuando mode='cut'. En 'continue' siempre true, en 'first' siempre false. */
  inherit_start?: boolean;
  /** Si true, el notebook recalcula num_frames desde la duración del audio. */
  match_audio_dur?: boolean;
  /** Path en /tmp/gradio/... devuelto por client.upload_files(). Null = sin imagen. */
  start_image?: string | null;
  /** Path en /tmp/gradio/... devuelto por client.upload_files(). Null = sin imagen. */
  end_image?: string | null;
}

export interface StoryboardPayload {
  global: {
    resolution_label: string;
    aspect_label: string;
    guide_scale: number;
    seed: number;
    extra_loras: string[];
    lora_mults: string;
    /** Data URI base64 de un video existente (para "Continuar" desde single-scene). */
    initial_video?: string | null;
  };
  scenes: StoryboardScenePayload[];
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
  /** URL del start frame persistido (para Variación en LTX 2.3 / Wan i2v). */
  startImageUrl?: string;
  /** URL del end frame persistido (para Variación en LTX 2.3 / Wan). */
  endImageUrl?: string;
  /** URL del audio guia persistido (para Variación en LTX 2.3 / TTS). */
  audioUrl?: string;
  /** URLs de cada escena completada (para mostrarlas mientras corre el storyboard). */
  sceneUrls?: string[];
  /** Metadata de storyboard. Solo presente si la generación fue multi-escena. */
  storyboardMeta?: StoryboardMeta;
  /** Tiempo total de generación en segundos. Solo presente cuando el item ya terminó. */
  elapsedSeconds?: number;
  /** Mensaje de error si la generación falló. Solo presente cuando el backend reportó status error/failed. */
  errorMessage?: string;
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
  // ── Audio (TTS Dual) ──
  audioMode?: 'omnivoice' | 'index_tts25';
  voiceMode?: string;              // "" | "VD" | "A" | "AB"
  voiceInstruction?: string;       // OmniVoice: tags de voz
  emotionInstruction?: string;     // Index TTS: lista de emociones
  audioGuide?: File | null;
  audioGuide2?: File | null;
  language?: string;
  durationLabel?: string;          // "Custom (auto)" | "5 segundos" | ...
  ttsSteps?: number;
  ttsGuidance?: number;
  speechSpeed?: number;
  ttsTemperature?: number;
  ttsTopP?: number;
  ttsTopK?: number;
  textNormalization?: boolean;
  // ── Wan 2.1 Dual ──
  videoModelId?: string;
  wanMode?: 'i2v' | 't2v';
  wanShift?: number;
  wanSampler?: string;
  wanForcePreset?: boolean;
  extraLoras?: string[];
  loraMults?: string;
  // ── LTX 2.5 MSR ──
  msrMode?: 'KI' | 'I';
  removeBg?: boolean;
  msrRef1?: File | string | null;
  msrRef2?: File | string | null;
  msrRef3?: File | string | null;
  msrRef4?: File | string | null;
  msrRef5?: File | string | null;
  pipeline?: string;
  audioCfg?: number;
  // ── Qwen Image 2.1 ──
  qwenTask?: 'Crear' | 'Editar y Refs' | 'Inpaint';
  qwenMode?: string;
  qwenStyle?: string;
  qwenTransparent?: boolean;
  qwenRefFiles?: File[];
  qwenEditImage?: File | null;
  qwenEditMask?: File | null;
  qwenStrength?: number;
}

interface GenerationContextValue {
  stationId: string | null;
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
  handleGenerateStoryboard: (payload: StoryboardPayload) => Promise<void>;
  handleCancel: () => Promise<void>;
  progressFrac: number;
  liveElapsedSec: number | null;
  remainingSec: number | null;
  completedDurationSec: number | null;
  backendError: string | null;
  canCancel: boolean;
  recoveryState: RecoveryState;
  // P4-b: true cuando recover() detecto que el JWT fue rechazado por el
  // backend y el refresh token tambien murio (4xx). El SessionExpiredBridge
  // monta un modal bloqueante con countdown y dispara el re-login.
  sessionExpired: boolean;
  /** Resetea el flag. Se llama desde el bridge despues del countdown,
   *  antes de hacer signOut + navigate, para que el modal no se muestre
   *  en la pantalla de /auth. */
  resetSessionExpired: () => void;
  status: Status;
  sessionUptime: string;
  activeImageModelId: string | null;
  activeVideoModelId: string;
  setActiveImageModelId: (id: string | null) => void;
  setActiveVideoModelId: (id: string) => void;
  imageModels: ImageRuntime[];
  sessionHistory: SessionItem[];
  appendSessionItem: (item: SessionItem) => void;
  updateSessionItem: (id: string, patch: Partial<SessionItem>) => void;
  removeSessionItem: (id: string) => void;
  discardSessionItem: (id: string) => void;
  clearSessionHistory: () => void;
  stationStatusMap: Record<string, 'online' | 'offline'>;
  stationModelTypeMap: Record<string, 'image' | 'video' | 'audio'>;
  stationBootingIds: string[];
  stationStatusLoading: boolean;
  refreshStationStatus: () => Promise<void>;
  getClient: () => Promise<any>;
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
    // ── TTS Dual ──
    audioMode: r.mode,
    voiceMode: r.voice_mode,
    language: r.language,
    durationLabel: r.duration,
    // ── Wan 2.1 Dual ──
    wanMode: r.mode,
    wanShift: r.shift,
    wanSampler: r.sampler,
    // ── LoRAs (Wan + LTX 2.5 MSR) ──
    extraLoras: r.extra_loras,
    loraMults: r.lora_mults,
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
  // Estilos exclusivos de Qwen Image 2.1
  "Photographic": ", professional photography, 35mm lens, f/2.8, depth of field, natural lighting, photorealistic, highly detailed",
  "Cyberpunk": ", cyberpunk aesthetic, glowing neon lights, futuristic city, volumetric smoke, high contrast",
  "Fantasy": ", mythical fantasy scene, glowing magical particles, ethereal light, digital painting, masterpiece",
};

function applyStylePreset(prompt: string, stylePreset?: string): string {
  if (!stylePreset) return prompt;
  const suffix = KREA_STYLE_SUFFIXES[stylePreset] ?? "";
  if (!suffix) return prompt;
  return `${prompt.trim()}${suffix}`;
}

// -- Persistencia de IDs borrados --
// Cuando el user borra un item, el notebook sigue devolviendolo en /session_history.
// Guardamos los IDs borrados en localStorage para filtrarlos en cada hydrate/poll.
const DELETED_ITEMS_KEY = 'pf_deleted_items_v1';
const DELETED_ITEMS_MAX = 200;

function loadDeletedItems(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_ITEMS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed
        .filter((e: unknown): e is { id: string } => !!e && typeof e === 'object' && typeof (e as { id?: unknown }).id === 'string')
        .map((e) => e.id)
    );
  } catch {
    return new Set();
  }
}

function persistDeletedItems(ids: Set<string>) {
  try {
    const arr = Array.from(ids).slice(-DELETED_ITEMS_MAX).map((id) => ({ id, t: Date.now() }));
    localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(arr));
  } catch {
    // noop
  }
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
    errorMessage: (() => {
      if (status !== 'error' && status !== 'failed') return undefined;
      const fromErrorMessage = typeof raw.error_message === 'string' && raw.error_message.trim() ? raw.error_message.trim() : null;
      const fromError = typeof raw.error === 'string' && raw.error.trim() ? raw.error.trim() : null;
      return fromErrorMessage ?? fromError ?? 'No se pudo completar la generación.';
    })(),
    params: mapBackendParams(raw.parameters),
    refUrls: Array.isArray(raw.ref_urls) ? raw.ref_urls.map(String) : undefined,
    startImageUrl: typeof raw.start_image_url === 'string' && raw.start_image_url ? String(raw.start_image_url) : undefined,
    endImageUrl: typeof raw.end_image_url === 'string' && raw.end_image_url ? String(raw.end_image_url) : undefined,
    audioUrl: typeof raw.audio_url === 'string' && raw.audio_url ? String(raw.audio_url) : undefined,
    sceneUrls: Array.isArray(raw.scene_urls) ? raw.scene_urls.map(String) : undefined,
    elapsedSeconds: (() => {
      const meta = (raw.metadata && typeof raw.metadata === 'object') ? raw.metadata : {};
      const fromMeta = typeof meta.gen_elapsed_seconds === 'number' ? meta.gen_elapsed_seconds : null;
      const fromTimestamps = (typeof raw.finished_at === 'number' && typeof raw.started_at === 'number' && raw.finished_at > raw.started_at)
        ? raw.finished_at - raw.started_at
        : null;
      const val = fromMeta ?? fromTimestamps;
      return (typeof val === 'number' && val > 0) ? val : undefined;
    })(),
    storyboardMeta: raw.storyboard_meta ? {
      totalScenes: Number(raw.storyboard_meta.total_scenes ?? 0),
      currentScene: Number(raw.storyboard_meta.current_scene ?? 1),
      scenes: Array.isArray(raw.storyboard_meta.scenes)
        ? raw.storyboard_meta.scenes.map((s: any, i: number) => ({
            index: Number(s.index ?? i),
            mode: (s.mode === 'first' || s.mode === 'cut' || s.mode === 'continue') ? s.mode : 'cut',
            durationSec: Number(s.duration_sec ?? 5),
            prompt: String(s.prompt ?? ''),
          }))
        : [],
    } : undefined,
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
  const [activeVideoModelId, setActiveVideoModelId] = useState<string>('ltx-2.3');

  // IDs de items borrados localmente. Filtra los hydrates/polls que traen el
  // /session_history del notebook (que no sabe del borrado). useRef para no
  // re-disparar los 6 useEffect.
  const deletedIdsRef = useRef<Set<string>>(loadDeletedItems());

  // 3 runtimes en paralelo — uno por capability/notebook.
  // Cada uno tiene su propio túnel Gradio, su propio getClient y su propio
  // polling de status. Los 3 viven simultáneamente aunque sólo uno esté
  // "activo" en la UI.
  const imageRuntime = useRuntime({ stationId, capability: 'image', modelId: null });
  const videoRuntime = useRuntime({ stationId, capability: 'video', modelId: getRuntimeId(activeVideoModelId) });
  const audioRuntime = useRuntime({ stationId, capability: 'audio', modelId: 'tts-dual' });

  // Slice activa: los consumidores (handleGenerate, StudioPage, etc.) siguen
  // leyendo gradioUrl/status/getClient como si fuera una sola sesión.
  const activeRuntime =
    capability === 'image' ? imageRuntime :
    capability === 'audio' ? audioRuntime :
    videoRuntime;

  const gradioUrl = activeRuntime.gradioUrl;
  const status = activeRuntime.status;
  const sessionUptime = activeRuntime.sessionUptime;
  const getClient = activeRuntime.getClient;

  // Sólo el runtime de image expone estos campos (imageModels + activeImageModelId).
  const {
    activeImageModelId,
    setActiveImageModelId,
    imageModels,
  } = imageRuntime;


  const {
    statusMap: stationStatusMap,
    modelTypeMap: stationModelTypeMap,
    bootingIds: stationBootingIds,
    loading: stationStatusLoading,
    refresh: refreshStationStatus,
  } = useStationStatus(stationId);

  // Ref sincronizado con setHistoryForCap para poder llamarlo desde dentro
  // del poll sin agregarlo a las deps del useEffect (evita loops).
  const setHistoryForCapRef = useRef<(cap: CapabilityId, updater: (prev: SessionItem[]) => SessionItem[]) => void>(() => {});

  // Historial por capability. Cada notebook (imagen / video / audio)
  // mantiene su propia slice. Cambiar de capability sólo cambia la vista,
  // no pisa items de las otras.
  const [sessionHistoryByCapability, setSessionHistoryByCapability] = useState<Record<CapabilityId, SessionItem[]>>(() => {
    const cached = readLiveCache<Record<CapabilityId, SessionItem[]>>('studio_history', 5 * 60 * 1000);
    if (cached) {
      return {
        image: (cached.image || []).slice(-5),
        video: (cached.video || []).slice(-5),
        audio: (cached.audio || []).slice(-5),
      };
    }
    return { image: [], video: [], audio: [] };
  });

  // Persistir slice completo (truncado a 5 por cap) para hidratar en F5.
  useEffect(() => {
    // Truncar 5 por MODELO (no 5 por capability) para no perder items
    // de un modelo cuando otro modelo agrega items al mismo slice.
    const truncateByModel = (items: SessionItem[]): SessionItem[] => {
      const byModel = new Map<string, SessionItem[]>();
      for (const it of items) {
        const key = it.modelId || '__unknown__';
        const arr = byModel.get(key) ?? [];
        arr.push(it);
        byModel.set(key, arr);
      }
      const out: SessionItem[] = [];
      for (const arr of byModel.values()) {
        out.push(...arr.slice(-5));
      }
      // Reordenar por createdAt ascendente (mismo orden que antes)
      out.sort((a, b) => a.createdAt - b.createdAt);
      return out;
    };

    const truncated: Record<CapabilityId, SessionItem[]> = {
      image: truncateByModel(sessionHistoryByCapability.image),
      video: truncateByModel(sessionHistoryByCapability.video),
      audio: truncateByModel(sessionHistoryByCapability.audio),
    };
    if (truncated.image.length || truncated.video.length || truncated.audio.length) {
      writeLiveCache('studio_history', truncated);
    }
  }, [sessionHistoryByCapability]);

  // Aislamiento visual: el slice de historial es por capability (image/
  // video/audio). Krea y Qwen son ambos 'image' y comparten el array.
  // Para que no se mezclen en la vista, filtramos por el modelId activo.
  // La persistencia no cambia: el array sigue guardando todo.
  const activeModelId = capability === 'image'
    ? activeImageModelId
    : capability === 'audio'
      ? 'tts-dual'
      : activeVideoModelId;

  // Derivado: la slice de la capability activa. Todos los consumidores
  // (StudioPage, FCM) siguen leyendo `sessionHistory` como antes.
  // Deuda 4: recombinamos la base de las URLs de media con el gradioUrl
  // activo. Cuando el túnel rota (Cloudflare -> Gradio share o viceversa),
  // este useMemo se re-ejecuta y las URLs guardadas apuntan al túnel vivo.
  // Solo se toca el path /gradio_api/...; el resto se deja tal cual.
  const sessionHistory = useMemo(() => {
    const slice = sessionHistoryByCapability[capability];
    // Filtrar por el modelo activo. Los items sin modelId se incluyen
    // (compat con items viejos que no tenian el campo).
    const filtered = activeModelId
      ? slice.filter(it => it.modelId === activeModelId || !it.modelId)
      : slice;
    if (!gradioUrl) return filtered;
    return filtered.map((item) => ({
      ...item,
      mediaUrls: item.mediaUrls.map((u) => rebaseMediaUrl(u, gradioUrl)),
      startImageUrl: item.startImageUrl
        ? rebaseMediaUrl(item.startImageUrl, gradioUrl)
        : undefined,
      endImageUrl: item.endImageUrl
        ? rebaseMediaUrl(item.endImageUrl, gradioUrl)
        : undefined,
      audioUrl: item.audioUrl ? rebaseMediaUrl(item.audioUrl, gradioUrl) : undefined,
      sceneUrls: item.sceneUrls
        ? item.sceneUrls.map((u) => rebaseMediaUrl(u, gradioUrl))
        : undefined,
      refUrls: item.refUrls
        ? item.refUrls.map((u) => rebaseMediaUrl(u, gradioUrl))
        : undefined,
    }));
  }, [sessionHistoryByCapability, capability, gradioUrl, activeModelId]);

  // Wrapper compatible con la API previa: acepta valor directo o updater,
  // y escribe siempre sobre la slice de la capability activa. Esto permite
  // que los ~15 usos internos de `setSessionHistory` sigan funcionando.
  const setSessionHistory = useCallback(
    (updaterOrValue: SessionItem[] | ((prev: SessionItem[]) => SessionItem[])) => {
      setSessionHistoryByCapability(prev => {
        const slice = prev[capability];
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(slice) : updaterOrValue;
        return { ...prev, [capability]: next };
      });
    },
    [capability]
  );

  // Helper análogo pero con capability explícita. Lo usan los hydrates para
  // escribir sobre la slice correcta sin depender de la capability activa.
  const setHistoryForCap = useCallback(
    (cap: CapabilityId, updaterOrValue: SessionItem[] | ((prev: SessionItem[]) => SessionItem[])) => {
      setSessionHistoryByCapability(prev => {
        const slice = prev[cap];
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(slice) : updaterOrValue;
        return { ...prev, [cap]: next };
      });
    },
    []
  );
  useEffect(() => {
    setHistoryForCapRef.current = setHistoryForCap;
  }, [setHistoryForCap]);
  // Refs para usar dentro de los polls sin agregarlos a las deps.
  const activeImageModelIdRef = useRef<string | null>(null);
  const activeVideoModelIdRef = useRef<string>('ltx-2.3');
  useEffect(() => { activeImageModelIdRef.current = activeImageModelId; }, [activeImageModelId]);
  useEffect(() => { activeVideoModelIdRef.current = activeVideoModelId; }, [activeVideoModelId]);

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
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const resetSessionExpired = useCallback(() => setSessionExpired(false), []);

  // P4-b: poll cada 30s. Llama a supabase.auth.getUser() (que consulta al
  // servidor). Si responde 401/403, la sesion fue revocada del lado servidor
  // y disparamos el modal. Sin este poll, el frontend solo detectaba la
  // revocacion al montar recover() o al hacer F5.
  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (
          error &&
          typeof error.status === "number" &&
          error.status >= 400 &&
          error.status < 500
        ) {
          setSessionExpired(true);
        }
      } catch {
        // Red o timeout: no es revocacion. El proximo poll reintenta.
      }
    };
    const interval = window.setInterval(checkSession, 30_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  const lastLogSeqRef = useRef<number>(0);
  const generationStartRef = useRef<number>(0);
  // Detección de generación huérfana: si el server deja de responder o
  // reporta idle durante N polls consecutivos mientras localmente hay un
  // item isGenerating, se marca como error. Cubre el caso "server muerto
  // o reiniciado a mitad de generación".
  const pollIdleCountRef = useRef<number>(0);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  useEffect(() => {
    if (!isLoading) return;
    // 3s en lugar de 1s: reduce 3x los re-renders del contexto durante la
    // generación. El timer visible no necesita precisión de 1s.
    const interval = window.setInterval(() => setNowTick(Date.now()), 3000);
    return () => window.clearInterval(interval);
  }, [isLoading]);

  // Multi-notebook: isLoading refleja si el MODELO ACTIVO en la capability
  // activa tiene una generación corriendo. Si el user cambia de tab o de
  // modelo (dentro del mismo tab), y el nuevo modelo no tiene generaciones
  // activas, el botón Generar se desbloquea sin frenar al otro modelo.
  useEffect(() => {
    const activeRuntimeId = capability === 'image'
      ? activeImageModelId
      : capability === 'audio'
        ? 'tts-dual'
        : activeVideoModelId;

    const activeModelIsGenerating = sessionHistoryByCapability[capability].some(
      it => it.isGenerating && (it.modelId === activeRuntimeId || !it.modelId)
    );
    setIsLoading(activeModelIsGenerating);
  }, [capability, activeImageModelId, activeVideoModelId, sessionHistoryByCapability]);

  useEffect(() => {
    if (!isLoading || !gradioUrl) return;
    let cancelled = false;
    const ORPHAN_POLL_THRESHOLD = 3;

    const markOrphan = () => {
      const errMsg = "La generación se interrumpió. El servidor dejó de responder.";
      setHistoryForCapRef.current(capability, prev => prev.map(it =>
        it.isGenerating
          ? { ...it, isGenerating: false, status: 'temporary' as const, errorMessage: errMsg }
          : it
      ));
      setErrorMsg(errMsg);
      setIsLoading(false);
      pollIdleCountRef.current = 0;
    };

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

        const isActive = info?.status === "preparing" || info?.status === "running";
        if (isActive) pollIdleCountRef.current = 0;

        const isIdleOrMissing = !info || info.status === "idle";
        if (isIdleOrMissing && !cancelled) {
          pollIdleCountRef.current += 1;
          if (pollIdleCountRef.current >= ORPHAN_POLL_THRESHOLD) {
            markOrphan();
            return;
          }
        }

        if (!cancelled) {
          setGenerationInfo(info ?? null);
          if (info?.status === "complete" || info?.status === "error" || info?.status === "cancelled") {
            pollIdleCountRef.current = 0;
            setIsLoading(false);
            if (info.status === "complete" && capability === "video") {
              const storedUrl = sessionStorage.getItem(`gen_video_${info.id}`);
              if (storedUrl) setVideoSrc(storedUrl);
            }
          }
        }
      } catch (err) {
        if (cancelled) return;
        pollIdleCountRef.current += 1;
        if (pollIdleCountRef.current >= ORPHAN_POLL_THRESHOLD) markOrphan();
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
        void 0;
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

        const fetchInfo = async (jwt: string) => {
          const result = await client.predict("/generation_status", [jwt]);
          const raw = Array.isArray(result.data) ? result.data[0] : result.data;
          return (raw && typeof raw === "object" && Object.keys(raw as object).length > 0)
            ? raw as GenerationInfo
            : undefined;
        };

        const applyInfo = (info: GenerationInfo | undefined) => {
          if (cancelled) return;
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
          } else {
            setRecoveryState("idle");
          }
        };

        let info = await fetchInfo(token);

        // El backend devuelve {} cuando verify_jwt falla (Supabase responde
        // 403 session_not_found). En ese caso intentar refresh antes de
        // asumir "idle": el JWT local puede estar bien pero la sesión
        // revocada del lado servidor.
        if (!info && !cancelled) {
          const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
          if (cancelled) return;

          // Distinguir error de red/servidor de error de auth.
          // AuthRetryableFetchError (status 0 o >= 500) significa que no
          // pudimos validar el refresh token contra Supabase. NO desloguear:
          // la sesión puede seguir siendo válida y el próximo poll reintenta.
          const isNetworkOrServerError = refreshErr != null && (
            refreshErr.status === 0 ||
            (typeof refreshErr.status === "number" && refreshErr.status >= 500)
          );

          if (isNetworkOrServerError) {
            setRecoveryState("idle");
            return;
          }

          if (refreshErr || !refreshData.session) {
            // El refresh token murió (4xx). P4-b: NO hacer signOut directo.
            // Marcamos sessionExpired y el SessionExpiredBridge monta un
            // modal bloqueante con countdown (patrón Meshery/Backstage),
            // que al llegar a 0 hace signOut + redirect a /auth. Así el
            // user ve qué pasó y no lo pateamos en silencio.
            setRecoveryState("idle");
            setSessionExpired(true);
            return;
          }
          info = await fetchInfo(refreshData.session.access_token);
          if (cancelled) return;
        }

        applyInfo(info);
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
        void 0;
        const models = imageModelsRef.current;
        if (Array.isArray(models) && models.length > 0 && capabilityRef.current !== "image") {
          setCapability("image");
        }
      }
    };

    detectCapability();
    return () => { cancelled = true; };
  }, [stationId]);

  const parseAudioFromResult = (raw: unknown): string[] => {
    const audios: string[] = [];
    if (typeof raw === "string") {
      audios.push(raw);
    } else if (raw && typeof raw === "object") {
      const obj = raw as any;
      const maybe = obj.url || obj.path || obj.name || obj.audio?.url || obj.audio?.path;
      if (typeof maybe === "string") audios.push(maybe);
    } else if (Array.isArray(raw)) {
      for (const item of raw) {
        if (typeof item === "string") audios.push(item);
        else if (item && typeof item === "object") {
          const maybe = (item as any).url || (item as any).path || (item as any).name;
          if (typeof maybe === "string") audios.push(maybe);
        }
      }
    }
    return audios;
  };

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
    const targetCap: CapabilityId = item.mediaType;
    setSessionHistoryByCapability(prev => ({
      ...prev,
      [targetCap]: [...prev[targetCap], item],
    }));
  }, []);

  const updateSessionItem = useCallback((id: string, patch: Partial<SessionItem>) => {
    setSessionHistoryByCapability(prev => {
      for (const cap of ['image', 'video', 'audio'] as const) {
        if (prev[cap].some(it => it.id === id)) {
          return {
            ...prev,
            [cap]: prev[cap].map(it => it.id === id ? { ...it, ...patch } : it),
          };
        }
      }
      return prev;
    });
  }, []);

  const removeSessionItem = useCallback((id: string) => {
    // Trackear el ID para que el proximo hydrate/poll del notebook no lo resucite.
    deletedIdsRef.current.add(id);
    persistDeletedItems(deletedIdsRef.current);
    setSessionHistoryByCapability(prev => ({
      image: prev.image.filter(it => it.id !== id),
      video: prev.video.filter(it => it.id !== id),
      audio: prev.audio.filter(it => it.id !== id),
    }));
  }, []);

  const discardSessionItem = useCallback((id: string) => {
    removeSessionItem(id);
  }, [removeSessionItem]);

  const clearSessionHistory = useCallback(() => {
    setSessionHistory([]);
  }, []);

  // Toma un client explícito. Lo usan los 3 hydrates (uno por capability).
  const fetchSessionHistoryFor = useCallback(async (client: any): Promise<SessionItem[]> => {
    try {
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
      void 0;
      return [];
    }
  }, []);

  // Compat: el código existente (polling, refetch en handleGenerate) sigue
  // llamando `fetchSessionHistory()` sin args y usa el client activo.
  const fetchSessionHistory = useCallback(async (): Promise<SessionItem[]> => {
    const client = await getClient();
    return fetchSessionHistoryFor(client);
  }, [getClient, fetchSessionHistoryFor]);

  // Limpieza al perder stationId
  useEffect(() => {
    if (!stationId) {
      setSessionHistoryByCapability({ image: [], video: [], audio: [] });
    }
  }, [stationId]);

  // Hydrate por capability: cada slice se hidrata desde su propio notebook.
  // Cambiar de capability ya no pisa items de las otras.
  useEffect(() => {
    if (!stationId || !imageRuntime.gradioUrl) return;
    let cancelled = false;
    (async () => {
      const client = await imageRuntime.getClient();
      const items = await fetchSessionHistoryFor(client);
      if (cancelled) return;
      setHistoryForCap('image', prev => {
        if (items.length === 0 && prev.length > 0) return prev;
        if (items.length < prev.length && prev.every(it => !it.isGenerating)) return prev;
        // Preservar items de OTROS modelos que ya estaban en el slice.
        // El backend del notebook activo solo conoce SUS items. Si
        // reemplazaramos, perderiamos el historial del otro modelo.
        const backendIds = new Set(items.map(it => it.id));
        const otherModels = prev.filter(
          it => it.modelId && it.modelId !== activeImageModelId && !backendIds.has(it.id)
        );
        return [...items, ...otherModels].filter(it => !deletedIdsRef.current.has(it.id));
      });
    })();
    return () => { cancelled = true; };
  }, [imageRuntime.gradioUrl, stationId, fetchSessionHistoryFor, setHistoryForCap]);

  useEffect(() => {
    if (!stationId || !videoRuntime.gradioUrl) return;
    let cancelled = false;
    (async () => {
      const client = await videoRuntime.getClient();
      const items = await fetchSessionHistoryFor(client);
      if (cancelled) return;
      setHistoryForCap('video', prev => {
        if (items.length === 0 && prev.length > 0) return prev;
        if (items.length < prev.length && prev.every(it => !it.isGenerating)) return prev;
        const backendIds = new Set(items.map(it => it.id));
        const otherModels = prev.filter(
          it => it.modelId && it.modelId !== activeVideoModelId && !backendIds.has(it.id)
        );
        return [...items, ...otherModels].filter(it => !deletedIdsRef.current.has(it.id));
      });
    })();
    return () => { cancelled = true; };
  }, [videoRuntime.gradioUrl, stationId, fetchSessionHistoryFor, setHistoryForCap]);

  useEffect(() => {
    if (!stationId || !audioRuntime.gradioUrl) return;
    let cancelled = false;
    (async () => {
      const client = await audioRuntime.getClient();
      const items = await fetchSessionHistoryFor(client);
      if (cancelled) return;
      setHistoryForCap('audio', prev => {
        if (items.length === 0 && prev.length > 0) return prev;
        if (items.length < prev.length && prev.every(it => !it.isGenerating)) return prev;
        const backendIds = new Set(items.map(it => it.id));
        const otherModels = prev.filter(
          it => it.modelId && it.modelId !== 'tts-dual' && !backendIds.has(it.id)
        );
        return [...items, ...otherModels].filter(it => !deletedIdsRef.current.has(it.id));
      });
    })();
    return () => { cancelled = true; };
  }, [audioRuntime.gradioUrl, stationId, fetchSessionHistoryFor, setHistoryForCap]);

  // ===== Polling per-capability =====
  // Cada slice mira SU notebook. Si un item se está generando en image,
  // su polling sigue corriendo aunque el usuario esté mirando video.
  // Corta solo cuando su slice deja de tener items isGenerating.
  // Cada polling preserva el skeleton local (isGenerating:true con id msg-*)
  // que todavía no aparece en el backend.
  const mergeWithOrphans = (items: SessionItem[], prev: SessionItem[], activeModel: string | null) => {
    const backendIds = new Set(items.map(b => b.id));
    const backendGeneratingPrompts = new Set(
      items.filter(b => b.isGenerating).map(b => b.prompt)
    );
    // Preservar items de OTROS modelos que ya estaban en el slice.
    const otherModels = activeModel
      ? prev.filter(it => it.modelId && it.modelId !== activeModel && !backendIds.has(it.id))
      : [];
    const localOrphans = prev.filter(p =>
      p.isGenerating &&
      p.id.startsWith('msg-') &&
      !backendIds.has(p.id) &&
      !backendGeneratingPrompts.has(p.prompt) &&
      (!activeModel || !p.modelId || p.modelId === activeModel)
    );
    if (localOrphans.length === 0 && otherModels.length === 0) return items;
    return [...items, ...localOrphans, ...otherModels];
  };

  const hasGeneratingImage = sessionHistoryByCapability.image.some(it => it.isGenerating);
  const hasGeneratingVideo = sessionHistoryByCapability.video.some(it => it.isGenerating);
  const hasGeneratingAudio = sessionHistoryByCapability.audio.some(it => it.isGenerating);

  // Image
  useEffect(() => {
    if (!hasGeneratingImage || !imageRuntime.gradioUrl) return;
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        try {
          const client = await imageRuntime.getClient();
          const items = await fetchSessionHistoryFor(client);
          if (cancelled) return;
          if (items.length > 0) {
            const stillGenerating = items.some(it => it.isGenerating);
            setHistoryForCap('image', prev => mergeWithOrphans(items.filter(it => !deletedIdsRef.current.has(it.id)), prev, activeImageModelIdRef.current));
            if (!stillGenerating) return;
          }
        } catch { /* noop */ }
        await new Promise(r => setTimeout(r, 2000));
      }
    };
    poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGeneratingImage, imageRuntime.gradioUrl, fetchSessionHistoryFor, setHistoryForCap]);

  // Video
  useEffect(() => {
    if (!hasGeneratingVideo || !videoRuntime.gradioUrl) return;
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        try {
          const client = await videoRuntime.getClient();
          const items = await fetchSessionHistoryFor(client);
          if (cancelled) return;
          if (items.length > 0) {
            const stillGenerating = items.some(it => it.isGenerating);
            setHistoryForCap('video', prev => mergeWithOrphans(items.filter(it => !deletedIdsRef.current.has(it.id)), prev, activeVideoModelIdRef.current));
            if (!stillGenerating) return;
          }
        } catch { /* noop */ }
        await new Promise(r => setTimeout(r, 2000));
      }
    };
    poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGeneratingVideo, videoRuntime.gradioUrl, fetchSessionHistoryFor, setHistoryForCap]);

  // Audio
  useEffect(() => {
    if (!hasGeneratingAudio || !audioRuntime.gradioUrl) return;
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        try {
          const client = await audioRuntime.getClient();
          const items = await fetchSessionHistoryFor(client);
          if (cancelled) return;
          if (items.length > 0) {
            const stillGenerating = items.some(it => it.isGenerating);
            setHistoryForCap('audio', prev => mergeWithOrphans(items.filter(it => !deletedIdsRef.current.has(it.id)), prev, 'tts-dual'));
            if (!stillGenerating) return;
          }
        } catch { /* noop */ }
        await new Promise(r => setTimeout(r, 2000));
      }
    };
    poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGeneratingAudio, audioRuntime.gradioUrl, fetchSessionHistoryFor, setHistoryForCap]);

  const handleGenerate = useCallback(
    async (params: GenerateParams) => {
      if (!params.prompt.trim()) return;
      if (!gradioUrl) {
        setErrorMsg("La estación aún no está conectada. Esperá unos segundos y volvé a intentar.");
        return;
      }

      // Multi-notebook: capturar la capability al momento del click. Todos los
      // updates del historial se hacen sobre ESTA capability, no sobre la que
      // esté activa cuando la generación termine.
      const cap: CapabilityId = capability;

      const localStart = Date.now() / 1000;
      generationStartRef.current = localStart;
      pollIdleCountRef.current = 0;

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
      setHistoryForCap(cap, prev => [...prev, {
        id: userItemId,
        prompt: params.prompt,
        mediaUrls: [],
        mediaType: capability === 'video' ? 'video' : capability === 'audio' ? 'audio' : 'image',
        modelId: (() => {
          if (capability === 'audio') return 'tts-dual';
          if (capability === 'video') return getRuntimeId(params.videoModelId || activeVideoModelId);
          return activeImageModelId || '';
        })(),
        modelLabel: (() => {
          if (capability === 'audio') {
            return params.audioMode === 'index_tts25' ? 'Index TTS 2.5' : 'OmniVoice';
          }
          if (capability === 'video') {
            return getChatLabel(params.videoModelId || activeVideoModelId, params.wanMode);
          }
          return activeImageModelId === 'flux-2-klein-4b' ? 'Flux 2'
               : activeImageModelId === 'krea-2-turbo' ? 'Krea 2'
               : 'Imagen';
        })(),
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
          // ── LoRAs (Wan / LTX 2.5 MSR) — para que Variación las restaure ──
          extraLoras: params.extraLoras,
          loraMults: params.loraMults,
        },
      }]);

      setGenerationInfo({
        status: "preparing",
        progress: 0,
        stage: "preparing",
        started_at: localStart,
        capability,
        modelId: capability === 'video'
          ? getRuntimeId(params.videoModelId || activeVideoModelId)
          : (activeImageModelId ?? undefined),
        prompt: params.prompt,
      });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { setErrorMsg("No hay sesión activa."); return; }

        const client = await getClient();
        if (!client) { setErrorMsg("No se pudo conectar con el runtime."); return; }

        if (capability === "video" && (params.videoModelId === 'ltx-2.5-msr' || params.videoModelId === 'ltx-2.3-msr')) {
          // ── LTX 2.5 MSR (Multi-Subject Reference) ──
          const result = await client.predict("/generate", [
            params.prompt,
            params.msrMode || 'KI',
            params.removeBg ?? true,
            params.msrRef1 || null,
            params.msrRef2 || null,
            params.msrRef3 || null,
            params.msrRef4 || null,
            params.msrRef5 || null,
            params.seed ?? -1,
            params.durationLabel || "3 Seconds (73 frames - Standard)",
            params.resolution || "Fast Preview (384p - ~1-2 min)",
            params.aspectRatio || "16:9 Landscape",
            params.pipeline || "Single stage (fast - recommended for T4)",
            params.audioCfg ?? 1.0,
            params.steps ?? 8,
            params.extraLoras || [],
            params.loraMults || "",
            token,
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

            setHistoryForCap(cap, prev => prev.map(item => {
              if (item.isGenerating) {
                return {
                  ...item,
                  mediaUrls: [tempUrl],
                  isGenerating: false,
                  status: 'temporary' as const,
                };
              }
              return item;
            }));

            setGenerationInfo(prev => ({ ...prev, status: "complete", progress: 1, stage: "complete", finished_at: Date.now() / 1000 }));
            if (statusText) setStatusMsg(statusText);
          } else {
            setErrorMsg("No se devolvió un video válido.");
          }
        } else if (capability === "video" && params.videoModelId && params.videoModelId.startsWith('wan-')) {
          // ── Wan 2.1 I2V / T2V ──
          const wanMode = params.wanMode || 'i2v';

          const result = await client.predict("/generate", [
            wanMode,
            params.prompt,
            params.negativePrompt || "",
            params.imageStartFile || null,
            params.imageEndFile || null,
            params.wanForcePreset ?? false,
            params.seed ?? -1,
            params.durationLabel || "5s (81 frames)",
            params.resolution || "480p",
            params.aspectRatio || "16:9 Landscape",
            params.steps ?? 4,
            params.guideScale ?? 1.0,
            params.wanShift ?? 5.0,
            params.wanSampler || "UniPC (recomendado)",
            1, 1.0, 1.0, 900,
            1.0, 3.5, 0.5,
            0, 9, 10, 90,
            0, -1, 0,
            1.0, 0.0, 1.0, false,
            0, 0.0, 0.999,
            0, 0,
            params.extraLoras || [],
            params.loraMults || "",
            token,
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

            setHistoryForCap(cap, prev => prev.map(item => {
              if (item.isGenerating) {
                return {
                  ...item,
                  mediaUrls: [tempUrl],
                  isGenerating: false,
                  status: 'temporary' as const,
                };
              }
              return item;
            }));

            setGenerationInfo(prev => ({ ...prev, status: "complete", progress: 1, stage: "complete", finished_at: Date.now() / 1000 }));
            if (statusText) setStatusMsg(statusText);
          } else {
            setErrorMsg("No se devolvió un video válido.");
          }
        } else if (capability === "video") {
          const result = await client.predict("/generate", [
            params.prompt, params.imageStartFile, params.imageEndFile || undefined,
            params.audioFile || undefined, params.seed, params.duration, params.resolution,
            params.aspectRatio, params.guideScale, params.matchAudioDur,
            params.extraLoras || [], params.loraMults || "",
            token,
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

            setHistoryForCap(cap, prev => prev.map(item => {
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

          if (activeImageModelId === "qwen-image-2.1") {
            const styledPrompt = applyStylePreset(params.prompt, params.qwenStyle);

            const validRefFiles = (params.qwenRefFiles || [])
              .filter((f): f is File => f instanceof File)
              .slice(0, 10);

            const result = await client.predict("/generate", [
              styledPrompt,
              params.negativePrompt || "",
              params.qwenTask || "Crear",
              params.qwenMode || "Turbo HQ",
              params.qwenTransparent ?? false,
              params.resolution || "1024px (recommended)",
              params.aspectRatio || "1:1 Square",
              params.seed,
              params.numImages || 1,
              validRefFiles.length > 0 ? validRefFiles : null,
              params.qwenEditImage || null,
              params.qwenEditMask || null,
              params.qwenStrength ?? 1.0,
              token,
            ]);

            const data = result.data as unknown[];
            const images = parseImagesFromResult(data[0]);
            absoluteUrls = toAbsoluteUrls(images, gradioUrl);

          } else if (activeImageModelId === "flux-2-klein-4b") {
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
            setHistoryForCap(cap, prev => prev.map(item => {
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
        } else if (capability === "audio") {
          const mode = params.audioMode || 'omnivoice';

          const result = await client.predict("/generate", [
            mode,
            params.prompt,
            params.voiceMode || "",
            params.voiceInstruction || "",
            params.audioGuide || null,
            params.audioGuide2 || null,
            params.ttsSteps ?? 32,
            params.ttsGuidance ?? 2.0,
            params.voiceMode || "A",
            params.emotionInstruction || "",
            params.audioGuide || null,
            params.audioGuide2 || null,
            params.ttsSteps ?? 25,
            params.speechSpeed ?? 1.0,
            params.ttsTemperature ?? 0.8,
            params.ttsTopP ?? 0.8,
            params.ttsTopK ?? 30,
            params.textNormalization ?? true,
            params.language || "spanish",
            params.durationLabel || "Custom (auto)",
            params.seed,
            token,
          ]);

          const data = result.data as unknown[];
          const audioData = data[0];
          const statusText = data[1] as string;

          const audioPaths = parseAudioFromResult(audioData);
          const absoluteUrls = toAbsoluteUrls(audioPaths, gradioUrl);

          if (absoluteUrls.length > 0) {
            setHistoryForCap(cap, prev => prev.map(item => {
              if (item.isGenerating) {
                return {
                  ...item,
                  mediaUrls: absoluteUrls,
                  isGenerating: false,
                  status: 'temporary' as const,
                  params: {
                    ...item.params,
                    audioMode: mode,
                    voiceMode: params.voiceMode,
                    voiceInstruction: params.voiceInstruction,
                    emotionInstruction: params.emotionInstruction,
                    language: params.language,
                    durationLabel: params.durationLabel,
                    ttsSteps: params.ttsSteps,
                    ttsGuidance: params.ttsGuidance,
                    speechSpeed: params.speechSpeed,
                    ttsTemperature: params.ttsTemperature,
                    ttsTopP: params.ttsTopP,
                    ttsTopK: params.ttsTopK,
                    textNormalization: params.textNormalization,
                  },
                };
              }
              return item;
            }));

            setGenerationInfo(prev => ({ ...prev, status: "complete", progress: 1, stage: "complete", finished_at: Date.now() / 1000 }));
            if (statusText) setStatusMsg(statusText);
          } else {
            setErrorMsg("No se devolvió un audio válido.");
          }
        }
      } catch (err) {
        void 0;
        const errMsg = err instanceof Error ? err.message : "Error al generar.";
        setErrorMsg(errMsg);
        // Marcar el item local como error para liberar el boton Generar y no
        // dejarlo pegado en "Detener" cuando client.predict falla.
        setHistoryForCap(cap, prev => prev.map(item =>
          item.id === userItemId
            ? { ...item, isGenerating: false, status: 'temporary' as const, errorMessage: errMsg }
            : item
        ));
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

  const handleGenerateStoryboard = useCallback(
    async (payload: StoryboardPayload) => {
      if (!gradioUrl) return;

      const localStart = Date.now() / 1000;
      generationStartRef.current = localStart;
      pollIdleCountRef.current = 0;

      setIsLoading(true);
      setErrorMsg(null);
      setVideoSrc(null);
      setLogs([]);
      lastLogSeqRef.current = 0;
      setRecoveryState("active");

      const userItemId = `msg-sb-${Date.now()}`;
      const ratioToken = (payload.global.aspect_label || '16:9 Landscape').split(' ')[0];
      const aspectRatioCss = ratioToken.replace(':', '/');

      setHistoryForCap('video', prev => [...prev, {
        id: userItemId,
        prompt: `Storyboard — ${payload.scenes.length} escenas`,
        mediaUrls: [],
        mediaType: 'video',
        modelId: 'ltx-2.3',
        modelLabel: 'LTX 2.3 v1.1 — Storyboard',
        aspectRatio: aspectRatioCss,
        createdAt: Date.now(),
        status: 'temporary',
        isGenerating: true,
        params: { storyboard: payload },
        storyboardMeta: {
          totalScenes: payload.scenes.length,
          currentScene: 1,
          scenes: payload.scenes.map((s, i) => ({
            index: i,
            mode: s.mode,
            durationSec: s.duration_sec,
            prompt: s.prompt,
          })),
        },
      }]);

      setGenerationInfo({
        status: 'preparing',
        progress: 0,
        stage: 'preparing',
        started_at: localStart,
        capability: 'video',
        modelId: 'ltx-2.3',
        prompt: `Storyboard · ${payload.scenes.length} escenas`,
      });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { setErrorMsg('No hay sesión activa.'); return; }

        const client = await getClient();
        if (!client) { setErrorMsg('No se pudo conectar con el runtime.'); return; }

        const payloadWithJwt = { ...payload, jwt_token: token };
        const result = await client.predict('/generate_storyboard', [JSON.stringify(payloadWithJwt)]);

        const data = result.data as unknown[];
        const videoData = data[0];
        const statusText = data[1] as string;

        let tempUrl: string | null = null;
        if (typeof videoData === 'string') tempUrl = videoData;
        else if (videoData && typeof videoData === 'object') {
          const maybe = videoData as { url?: string; video?: { url?: string } };
          tempUrl = maybe.url ?? maybe.video?.url ?? null;
        }

        if (tempUrl) {
          setVideoSrc(tempUrl);
          sessionStorage.setItem(`gen_video_${localStart}`, tempUrl);
          setHistoryForCap('video', prev => prev.map(item => {
            if (item.isGenerating) {
              return {
                ...item,
                mediaUrls: [tempUrl!],
                isGenerating: false,
                status: 'temporary' as const,
              };
            }
            return item;
          }));
          setGenerationInfo(prev => ({
            ...prev,
            status: 'complete',
            progress: 1,
            stage: 'complete',
            finished_at: Date.now() / 1000,
          }));
          if (statusText) setStatusMsg(statusText);
        } else {
          setErrorMsg('No se devolvió un video válido.');
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Error al generar storyboard.');
        setGenerationInfo(prev => ({
          ...prev,
          status: 'error',
          finished_at: Date.now() / 1000,
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [gradioUrl, getClient]
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
    stationId,
    gradioUrl, capability, setCapability, isLoading, generationInfo, logs,
    videoSrc, imageSrcs, videoRatio, setVideoRatio, setVideoSrc, setImageSrcs,
    statusMsg, setStatusMsg, errorMsg, setErrorMsg, isCancelling,
    handleGenerate, handleGenerateStoryboard, handleCancel, progressFrac, liveElapsedSec, remainingSec,
    completedDurationSec, backendError, canCancel, recoveryState, sessionExpired, resetSessionExpired, status,
    sessionUptime, activeImageModelId, setActiveImageModelId, imageModels,
    activeVideoModelId, setActiveVideoModelId,
    sessionHistory, appendSessionItem, updateSessionItem, removeSessionItem, discardSessionItem, clearSessionHistory,
    stationStatusMap, stationModelTypeMap, stationBootingIds,
    stationStatusLoading, refreshStationStatus,
    getClient,
  };

  return <GenerationContext.Provider value={value}>{children}</GenerationContext.Provider>;
}

export function useGenerationContext() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("useGenerationContext must be used within GenerationProvider");
  return ctx;
}
