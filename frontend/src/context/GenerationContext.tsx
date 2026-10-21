// src/context/GenerationContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Client } from '@gradio/client';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useGenerationStore } from '../stores/useGenerationStore';
import type { ReactNode } from "react";
import type { CapabilityId, Creation, GenerationInfo, LogEntry, Status } from "../types";
import { supabase } from "../lib/supabaseClient";
import * as sessionStore from "../lib/sessionStore";
import { rebaseMediaUrl } from "../lib/mediaUrl";
import { getChatLabel, getRuntimeId } from "../config/models";
import { useRuntime } from "../hooks/useRuntime";
import { useStationStatus } from "../hooks/useStationStatus";
import { fetchCreationsPage } from "../hooks/useCreations";
import { getTombstoneSet, isTombstoned } from '../lib/tombstones';

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
  /**
   * @deprecated Legacy: URLs del túnel (efímeras). Para items nuevos usar `r2Keys`.
   * Solo se mantiene como fallback para items generados antes de la migración a R2.
   */
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
  /** Keys de R2 para las imágenes/videos/audios generados. Fuente de verdad. */
  r2Keys?: string[];
  /**
   * Item legacy: generado antes de la migración a R2. No tiene r2Keys,
   * solo tiene mediaUrls (URLs efímeras del túnel). El render debe usar
   * el túnel como fallback o mostrar "Archivo temporal expirado".
   */
  legacy?: boolean;
  thumbKey?: string | null;
}

/**
 * Helper: ¿el item tiene media renderizable?
 * Prioriza r2Keys (fuente de verdad nueva). Fallback a mediaUrls (legacy).
 */
export function hasRenderableMedia(item: SessionItem): boolean {
  return getMediaCount(item) > 0;
}

/**
 * Helper: cantidad de archivos multimedia en el item.
 * r2Keys es la fuente de verdad para items nuevos.
 * mediaUrls es fallback para items legacy.
 */
export function getMediaCount(item: SessionItem): number {
  if (item.r2Keys && item.r2Keys.length > 0) return item.r2Keys.length;
  if (item.mediaUrls && item.mediaUrls.length > 0) return item.mediaUrls.length;
  return 0;
}

// Clasificación de items para eviction policy de IndexedDB.
// Tiers (menor = primer candidato a salir):
//   0 garbage   : error sin respaldo
//   1 ephemeral : temporary sin r2Keys
//   2 partial   : temporary con r2Keys (respaldo R2)
//   3 safe      : saved en Supabase + R2
//   4 never     : in-flight (isGenerating o saving)
function classifySessionItem(it: SessionItem): sessionStore.EvictionTier {
  if (it.isGenerating || it.status === 'saving') return 4;
  if (it.status === 'saved' || it.creationId) return 3;
  if (it.errorMessage) return 0;
  if (it.r2Keys && it.r2Keys.length > 0) return 2;
  return 1;
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
  qwenSteps?: number;
  qwenGuidance?: number;
  // ── Krea 2 Turbo — Prompt Enhancer ──
  enhanceMode?: 'off' | 'on' | 'text';
}

interface GenerationContextValue {
  isLoading: boolean;
  stationId: string | null;
  gradioUrl: string | null;
  capability: CapabilityId;
  setCapability: (c: CapabilityId) => void;
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
  stationRuntimesMap: Record<string, any>;
  getClient: () => Promise<any>;
  /** Devuelve la URL firmada de R2 si está cacheada, o el fallback del túnel. */
  getResolvedUrl: (item: SessionItem, idx: number) => string;
  /** true si hay más creaciones en Supabase; null si aún no verificado; false si agotado. */
  hasMoreSupabase: boolean | null;
  /** true mientras se está fetcheando la siguiente página de Supabase. */
  isLoadingMoreSupabase: boolean;
  /** Carga la siguiente página de creaciones (más antiguas) desde Supabase. */
  loadMoreFromSupabase: () => Promise<void>;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

const GENERATION_POLL_MS = 2000;
const LOGS_POLL_MS = 2500;


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

interface DeletedItemRecord {
  id: string;
  prompt?: string;
  /** Momento en que el user borro el item. */
  deletedAt?: number;
}

/** Un item del backend se considera eliminado si matchea por:
 *  - ID exacto (caso normal), o
 *  - mismo prompt Y createdAt ANTERIOR al momento del borrado
 *    (caso optimista msg-* vs gen-*: el item real aparece despues).
 *  Esta logica evita el falso positivo cuando el user borra un audio
 *  y genera otro con el mismo prompt — el nuevo tiene createdAt posterior
 *  al deletedAt y por lo tanto NO se filtra.
 */
function isItemDeleted(
  item: { id: string; prompt?: string; createdAt?: number },
  records: DeletedItemRecord[],
): boolean {
  // La eliminacion es estrictamente por ID exacto.
  // Se elimino el fallback por 'prompt + createdAt' porque causaba
  // que al borrar una generacion, se borraran todas las anteriores
  // que compartian el mismo prompt (variaciones).
  for (const rec of records) {
    if (rec.id === item.id) return true;
  }
  return false;
}

function loadDeletedItems(): DeletedItemRecord[] {
  try {
    const raw = localStorage.getItem(DELETED_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e: unknown): e is DeletedItemRecord => !!e && typeof e === 'object' && typeof (e as { id?: unknown }).id === 'string')
      .map((e) => ({
        id: e.id,
        prompt: typeof e.prompt === 'string' ? e.prompt : undefined,
        deletedAt: typeof e.deletedAt === 'number' ? e.deletedAt : undefined,
      }));
  } catch {
    return [];
  }
}

function persistDeletedItems(records: DeletedItemRecord[]) {
  try {
    const arr = records.slice(-DELETED_ITEMS_MAX);
    localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(arr));
  } catch {
    // noop
  }
}

function hashItem(it: SessionItem): string {
  // r2Keys es la fuente de verdad. mediaUrls es fallback legacy.
  const mediaSig = (it.r2Keys && it.r2Keys.length > 0)
    ? `r2:${it.r2Keys.join('|')}`
    : `tunnel:${it.mediaUrls.join('|')}`;
  return [it.status, it.isGenerating ? '1' : '0', mediaSig, it.errorMessage ?? '', it.creationId ?? '', it.modelId].join('||');
}

// Mapper de fila `creations` (Supabase) → SessionItem.
// Único caller: loadMoreFromSupabase, que filtra status='ready' y
// expires_at > now() en el server, así que status: 'saved' es correcto.
// Id: row.id (coincide con creationId). Deduplicación: creationId.
function mapCreationToSessionItem(row: Creation): SessionItem {
  const mediaType: 'image' | 'video' | 'audio' =
    row.media_type === 'video' ? 'video' :
    row.media_type === 'audio' ? 'audio' :
    'image';

  const createdAt = new Date(row.created_at).getTime();
  const meta = (row.metadata && typeof row.metadata === 'object')
    ? (row.metadata as Record<string, unknown>)
    : {};
  const parentId = (meta.parent_id as string) || row.id;

  const thumbKey = (meta.thumb_key as string) || null;

  return {
    thumbKey: thumbKey,
    id: parentId,
    prompt: row.prompt,
    mediaUrls: [],
    mediaType,
    modelId: row.model_id ?? row.model ?? "",
    modelLabel: row.model ?? row.model_id ?? "",
    aspectRatio: row.aspect_ratio ?? "1/1",
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    status: 'saved',
    isGenerating: false,
    creationId: row.id,
    params: {
      seed: row.seed ?? undefined,
      duration: row.duration ?? undefined,
      resolution: row.resolution ?? undefined,
      aspectRatio: row.aspect_ratio ?? undefined,
      guideScale: row.guide_scale ?? undefined,
      matchAudioDur: row.match_audio_dur ?? undefined,
      ...meta,
    },
    r2Keys: row.storage_key ? [row.storage_key] : undefined,
    legacy: !row.storage_key,
    elapsedSeconds: typeof meta.gen_elapsed_seconds === 'number'
      ? meta.gen_elapsed_seconds
      : undefined,
  };
}


export function GenerationProvider({
  stationId,
  sessionRevokedAt,
  children,
}: {
  stationId: string | null;
  sessionRevokedAt?: number | null;
  children: ReactNode;
}) {
  const [capability, setCapability] = useState<CapabilityId>("video");
  const [activeVideoModelId, setActiveVideoModelId] = useState<string>('ltx-2.3');

  // IDs de items borrados localmente. Filtra los hydrates/polls que traen el
  // /session_history del notebook (que no sabe del borrado). useRef para no
  // re-disparar los 6 useEffect.
  const deletedIdsRef = useRef<DeletedItemRecord[]>(loadDeletedItems());

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
    runtimesMap: stationRuntimesMap,
    loading: stationStatusLoading,
    refresh: refreshStationStatus,
  } = useStationStatus(stationId);

  // Ref sincronizado con setHistoryForCap para poder llamarlo desde dentro
  // del poll sin agregarlo a las deps del useEffect (evita loops).
  const setHistoryForCapRef = useRef<(cap: CapabilityId, updater: (prev: SessionItem[]) => SessionItem[]) => void>(() => {});

  // Historial por capability. Cada notebook (imagen / video / audio)
  // mantiene su propia slice. Cambiar de capability sólo cambia la vista,
  // no pisa items de las otras.
  const sessionHistoryByCapability = useHistoryStore(s => s.sessionHistoryByCapability);

  // Wrapper compatible con la firma original. Redirige a Zustand.
  const setSessionHistoryByCapability = useCallback(
    (updaterOrValue: Record<CapabilityId, SessionItem[]> | ((prev: Record<CapabilityId, SessionItem[]>) => Record<CapabilityId, SessionItem[]>)) => {
      const prev = useHistoryStore.getState().sessionHistoryByCapability;
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      for (const cap of ['image', 'video', 'audio'] as const) {
        if (next[cap] !== prev[cap]) {
          useHistoryStore.getState().setHistoryForCap(cap, next[cap]);
        }
      }
    },
    []
  );

  const [sessionHydrated, setSessionHydrated] = useState(false);
  const lastPersistedRef = useRef<Map<string, string>>(new Map());
  const pruneTimerRef = useRef<number | null>(null);
  // Paginación aislada por modelo. Cada modelo es su propio "hilo" de
  // conversación: tiene su propio cursor, su propio "hasMore" y su propio
  // "isLoading". Clave compuesta: `${capability}:${modelId}`.
  const [hasMoreSupabaseByModel, setHasMoreSupabaseByModel] = useState<Record<string, boolean | null>>({});
  const [isLoadingMoreSupabaseMap, setIsLoadingMoreSupabaseMap] = useState<Record<string, boolean>>({});
  const supabaseCursorRef = useRef<Record<string, string | null>>({});
  const loadMoreInFlightRef = useRef(false);

  // Limpieza de versiones anteriores (localStorage/sessionStorage).
  // Al migrar a IndexedDB, dejamos basura atrás que causaba skeletons fantasma.
  useEffect(() => {
    try {
      localStorage.removeItem("pf_deleted_items_v1"); // ID viejo
      // Limpiar liveCache viejo (si quedó algo)
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith("pf_live_") || k.startsWith("gen_video_")) {
          sessionStorage.removeItem(k);
        }
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Mount prune: libera items obsoletos ANTES de hidratar. Coherencia
      // estado <-> disco desde el arranque. pruneItems nunca lanza (catch interno).
      const pr = await sessionStore.pruneItems<SessionItem>({
        classify: classifySessionItem,
      });
      if (pr.deleted > 0) {
        console.info(`[GenerationContext] Mount prune: ${pr.deleted} evicted, ${pr.remaining} remaining`);
      }
      if (cancelled) return;
      const items = await sessionStore.getAllItems<SessionItem>();
      if (cancelled) return;
      if (items.length > 0) {
        // PILAR 4: filtrar items borrados antes de hidratar
        const tombstoneSet = getTombstoneSet();
        const filteredItems = items.filter(it => !tombstoneSet.has(it.id));
        const byCap: Record<CapabilityId, SessionItem[]> = { image: [], video: [], audio: [] };
        for (const it of filteredItems) {
          const cap: CapabilityId = it.mediaType === 'video' ? 'video' : it.mediaType === 'audio' ? 'audio' : 'image';
          byCap[cap].push(it);
        }
        for (const cap of ['image', 'video', 'audio'] as const) {
          byCap[cap].sort((a, b) => a.createdAt - b.createdAt);
        }
        setSessionHistoryByCapability(prev => {
          const hasAny = prev.image.length + prev.video.length + prev.audio.length > 0;
          if (hasAny) return prev;
          const m = new Map<string, string>();
          for (const it of filteredItems) m.set(it.id, hashItem(it));
          lastPersistedRef.current = m;
          return byCap;
        });
      }
      setSessionHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!sessionHydrated) return;
    const now = new Map<string, string>();
    const changed: SessionItem[] = [];
    for (const cap of ['image', 'video', 'audio'] as const) {
      for (const it of sessionHistoryByCapability[cap]) {
        const h = hashItem(it);
        now.set(it.id, h);
        if (lastPersistedRef.current.get(it.id) !== h) {
          changed.push(it);
        }
      }
    }
    const deleted: string[] = [];
    for (const id of lastPersistedRef.current.keys()) {
      if (!now.has(id)) deleted.push(id);
    }
    if (changed.length > 0) void sessionStore.putItems(changed);
    for (const id of deleted) void sessionStore.deleteItem(id);
    lastPersistedRef.current = now;

    // Write prune: debounced 5s tras el último cambio. Coherencia
    // disco <-> estado sin saturar IndexedDB en cada generación.
    if (changed.length > 0) {
      if (pruneTimerRef.current !== null) window.clearTimeout(pruneTimerRef.current);
      pruneTimerRef.current = window.setTimeout(() => {
        pruneTimerRef.current = null;
        void sessionStore.pruneItems<SessionItem>({
          classify: classifySessionItem,
        }).then((r) => {
          if (r.deleted > 0) {
            console.info(`[GenerationContext] Write prune: ${r.deleted} evicted, ${r.remaining} remaining`);
          }
        });
      }, 5000);
    }
  }, [sessionHydrated, sessionHistoryByCapability]);

  // Cleanup del timer de prune al desmontar.
  useEffect(() => {
    return () => {
      if (pruneTimerRef.current !== null) {
        window.clearTimeout(pruneTimerRef.current);
        pruneTimerRef.current = null;
      }
    };
  }, []);

  // Derivado: la slice de la capability activa. Todos los consumidores
  // (StudioPage, FCM) siguen leyendo `sessionHistory` como antes.
  // Deuda 4: recombinamos la base de las URLs de media con el gradioUrl
  // activo. Cuando el túnel rota (Cloudflare -> Gradio share o viceversa),
  // este useMemo se re-ejecuta y las URLs guardadas apuntan al túnel vivo.
  // Solo se toca el path /gradio_api/...; el resto se deja tal cual.
  // Multi-runtime: mapa modelId → gradioUrl propio. Cada runtime de image
  // vivo expone su túnel. Se usa para rebasear las URLs de cada item con
  // SU PROPIO host, no con el del modelo activo en la UI. Sin esto, cuando
  // Qwen termina mientras Krea está activo, las URLs de Qwen se reescriben
  // con el host de Krea y dan 404 (placeholder roto en StudioPage).
  const urlByModelId = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of imageModels) {
      const url = (r.gradio_urls && r.gradio_urls.length > 0)
        ? r.gradio_urls[0]
        : r.gradio_url;
      if (url && r.model_id) m.set(r.model_id, url);
    }
    return m;
  }, [imageModels]);

  const sessionHistory = useMemo(() => {
    const slice = sessionHistoryByCapability[capability];

    // Chat por modelo: cada modelo tiene su propia conversación. El
    // dropdown (Qwen / Krea / Flux) es el selector de "chat activo" — al
    // cambiar de modelo, ves SOLO los items de ese modelo. Es el patrón
    // de cualquier app con múltiples motores: cada motor es su propio
    // hilo de conversación.
    //
    // Filtro incondicional por modelo activo. Sin excepciones por
    // multi-runtime, sin atarlo a `imageModels.length` (dato volátil que
    // rompía la vista cuando un heartbeat se atrasaba). Si el item no
    // tiene modelId (legacy), se incluye para no perder historial viejo.
    const currentModelId = capability === 'image'
      ? activeImageModelId
      : capability === 'audio'
        ? 'tts-dual'
        : activeVideoModelId;

    // Filtro ESTRICTO: solo items de este modelo. Sin `|| !it.modelId` —
    // ese fallback hacía que items sin model_id (backend viejo o mal
    // configurado) aparecieran en TODOS los modelos, dando la sensación de
    // que uno "infiere" del otro. Ahora cada modelo ve SOLO lo suyo.
    const filtered = currentModelId
      ? slice.filter((it: SessionItem) => it.modelId === currentModelId)
      : slice;

    // Orden estricto por createdAt (más viejo arriba, más nuevo abajo).
    // Evita que los items de error o los que vienen del backend se mezclen.
    filtered.sort((a: SessionItem, b: SessionItem) => a.createdAt - b.createdAt);

    const urlForItem = (item: SessionItem): string | null => {
      if (capability === 'image' && item.modelId) {
        const own = urlByModelId.get(item.modelId);
        if (own) return own;
      }
      return gradioUrl;
    };

    return filtered.map((item: SessionItem) => {
      const url = urlForItem(item);
      if (!url) return item;
      return {
        ...item,
        mediaUrls: item.mediaUrls.map((u: string) => rebaseMediaUrl(u, url)),
        startImageUrl: item.startImageUrl
          ? rebaseMediaUrl(item.startImageUrl, url)
          : undefined,
        endImageUrl: item.endImageUrl
          ? rebaseMediaUrl(item.endImageUrl, url)
          : undefined,
        audioUrl: item.audioUrl ? rebaseMediaUrl(item.audioUrl, url) : undefined,
        sceneUrls: item.sceneUrls
          ? item.sceneUrls.map((u: string) => rebaseMediaUrl(u, url))
          : undefined,
        refUrls: item.refUrls
          ? item.refUrls.map((u: string) => rebaseMediaUrl(u, url))
          : undefined,
      };
    });
  }, [sessionHistoryByCapability, capability, gradioUrl, activeImageModelId, activeVideoModelId, imageModels, urlByModelId]);

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

  // isLoading se calcula con useMemo (abajo) a partir del historial.
  const generationInfo = useGenerationStore((s) => s.generationInfo);
  const setGenerationInfo = useGenerationStore((s) => s.setGenerationInfo);
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

  // Revocacion server-side detectada por useAuth (SIGNED_OUT involuntario).
  // Cuando llega, dispara el modal de sesion expirada sin depender del poll
  // de 30s. El poll queda como defensa en profundidad.
  useEffect(() => {
    if (sessionRevokedAt) setSessionExpired(true);
  }, [sessionRevokedAt]);

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
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // WATCHDOG DE ESTADO: Si el runtime se marca como 'offline' en el heartbeat
  // (Colab kill, OOM, límite de horas), matamos inmediatamente cualquier
  // generación en vuelo de ese modelo. El backend es la única fuente de verdad.
  useEffect(() => {
    setSessionHistoryByCapability(prev => {
      let changed = false;
      const next = { ...prev };
      
      for (const cap of ['image', 'video', 'audio'] as const) {
        next[cap] = prev[cap].map(it => {
          if (it.isGenerating) {
            const modelStatus = stationStatusMap[it.modelId];
            if (modelStatus === 'offline') {
              changed = true;
              return {
                ...it,
                status: 'temporary' as const,
                errorMessage: 'La estación se desconectó o el notebook se apagó.'
              };
            }
          }
          return it;
        });
      }
      return changed ? next : prev;
    });
  }, [stationStatusMap]);

  // Multi-notebook: isLoading refleja si el MODELO ACTIVO en la capability
  // activa tiene una generación corriendo. Si el user cambia de tab o de
  // modelo (dentro del mismo tab), y el nuevo modelo no tiene generaciones
  // activas, el botón Generar se desbloquea sin frenar al otro modelo.
  // Derivado síncrono: isLoading refleja la generación del modelo activo
  // en la capability activa. Calculado con useMemo para que cambie en el
  // mismo render que 'capability', sin lag de 1 frame.

  // isLoading se calcula a partir de Zustand (Pilar 2: aislamiento de re-renders)
  const pollClientCacheRef = useRef<Record<string, Client>>({});
  const getPollClient = async (url: string) => {
    if (pollClientCacheRef.current[url]) return pollClientCacheRef.current[url];
    try {
      const client = await Client.connect(url);
      pollClientCacheRef.current[url] = client;
      return client;
    } catch {
      return null;
    }
  };

  const isLoading = useMemo(() => {
    const activeRuntimeId = capability === 'image'
      ? activeImageModelId
      : capability === 'audio'
        ? 'tts-dual'
        : activeVideoModelId;
    return sessionHistoryByCapability[capability].some(
      (it: SessionItem) => it.isGenerating && (it.modelId === activeRuntimeId || !it.modelId)
    );
  }, [capability, activeImageModelId, activeVideoModelId, sessionHistoryByCapability]);

  useEffect(() => {
    if (!isLoading) return;
    // 3s en lugar de 1s: reduce 3x los re-renders del contexto durante la
    // generación. El timer visible no necesita precisión de 1s.
    const interval = window.setInterval(() => setNowTick(Date.now()), 3000);
    return () => window.clearInterval(interval);
  }, [isLoading]);

  // ── POLLER MULTI-MODELO (Pilar 5) ──
  // Itera sobre TODOS los items en generación, no solo el modelo activo.
  // Usa stationRuntimesMap para encontrar la URL de cada modelo.
  const generatingItems = useMemo(() => {
    const items: SessionItem[] = [];
    for (const cap of ['image', 'video', 'audio'] as const) {
      items.push(...sessionHistoryByCapability[cap].filter(it => it.isGenerating));
    }
    return items;
  }, [sessionHistoryByCapability]);

  const generatingKey = generatingItems.map(it => it.id).join(',');

  useEffect(() => {
    if (!generatingKey) return;
    let cancelled = false;

    const poll = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      for (const item of generatingItems) {
        if (cancelled) return;
        const modelId = item.modelId || '';
        const cap = item.mediaType;
        const modelKey = `${cap}:${modelId}`;
        
        const row = stationRuntimesMap[modelId];
        if (!row) continue;
        const urls = (row.gradio_urls && row.gradio_urls.length > 0) ? row.gradio_urls : (row.gradio_url ? [row.gradio_url] : []);
        if (urls.length === 0) continue;

        // Probar con la primera URL (ideal: iterar si falla, pero mantenemos simple)
        const client = await getPollClient(urls[0]);
        if (!client) continue;

        try {
          const result = await client.predict('/generation_status', [token]);
          const raw = Array.isArray(result.data) ? result.data[0] : result.data;
          const info = (raw && typeof raw === 'object' && Object.keys(raw as object).length > 0) ? raw as GenerationInfo : undefined;

          if (!cancelled && info) {
            useGenerationStore.getState().setGenerationInfoByModel(modelKey, info);

            // Hurricane-Proof: extraer r2_keys del poller y actualizar el item
            if (info.status === 'complete' && info.id) {
              let r2Keys = (info as any).r2_keys as string[] | undefined;
              try {
                const { data } = await supabase
                  .from('creations')
                  .select('storage_key')
                  .or(`id.eq.${info.id},metadata->>parent_id.eq.${info.id}`)
                  .order('created_at', { ascending: true });
                if (Array.isArray(data) && data.length > 0) {
                  const fromDb = data.map((r: any) => r.storage_key).filter((k: any): k is string => typeof k === 'string' && k.length > 0);
                  if (fromDb.length > 0) r2Keys = fromDb;
                }
              } catch {}

              setHistoryForCapRef.current(cap, prev => prev.map(it =>
                it.id === item.id ? { ...it, isGenerating: false, r2Keys: r2Keys && r2Keys.length > 0 ? r2Keys : it.r2Keys, status: 'temporary' } : it
              ));
            } else if (info.status === 'error' || info.status === 'cancelled') {
              setHistoryForCapRef.current(cap, prev => prev.map(it =>
                it.id === item.id ? { ...it, isGenerating: false, errorMessage: info.error || 'Generación fallida' } : it
              ));
            }
          }
        } catch {
          // Si el poll falla, no matamos el cliente ni el item. Solo esperamos al siguiente ciclo.
        }
      }
    };

    poll();
    const interval = window.setInterval(poll, GENERATION_POLL_MS);
    return () => { cancelled = true; window.clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatingKey, stationRuntimesMap]);



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
              // setIsLoading(true); // now derived
              generationStartRef.current = info.started_at ?? Date.now() / 1000;
              setRecoveryState("active");
            } else {
              setRecoveryState("idle");
              // setIsLoading(false); // now derived
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
    // 1. Borrar de IndexedDB para que no reviva al hacer F5
    void sessionStore.deleteItem(id);
    // El resto de la logica de tombstones y React state sigue abajo...
    setSessionHistoryByCapability(prev => {
      // Buscar el item en cualquier slice para extraer prompt + createdAt
      const found =
        prev.image.find(it => it.id === id) ||
        prev.video.find(it => it.id === id) ||
        prev.audio.find(it => it.id === id);

      if (found) {
        deletedIdsRef.current.push({
          id,
          prompt: found.prompt,
          deletedAt: Date.now(),
        });
      } else {
        deletedIdsRef.current.push({ id, deletedAt: Date.now() });
      }
      persistDeletedItems(deletedIdsRef.current);

      return {
        image: prev.image.filter(it => it.id !== id),
        video: prev.video.filter(it => it.id !== id),
        audio: prev.audio.filter(it => it.id !== id),
      };
    });
  }, []);

  const discardSessionItem = useCallback((id: string) => {
    removeSessionItem(id);
  }, [removeSessionItem]);

  const clearSessionHistory = useCallback(() => {
    setSessionHistory([]);
  }, []);

  // Toma un client explícito. Lo usan los 3 hydrates (uno por capability).
  const fetchSessionHistoryFor = useCallback(async (_client: any): Promise<SessionItem[]> => {
    // ARQUITECTURA INDUSTRIAL: El frontend es dueño del historial (IndexedDB + Supabase).
    // El backend solo reporta generaciones en curso. Ignoramos session_history.
    return [];
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
      void sessionStore.clearAll();
      lastPersistedRef.current = new Map();
    }
  }, [stationId]);

  // Hydrate por capability: cada slice se hidrata desde su propio notebook.
  // Cambiar de capability ya no pisa items de las otras.



  // ===== Polling per-capability =====
  // Cada slice mira SU notebook. Si un item se está generando en image,
  // su polling sigue corriendo aunque el usuario esté mirando video.
  // Corta solo cuando su slice deja de tener items isGenerating.
  // Cada polling preserva el skeleton local (isGenerating:true con id msg-*)
  // que todavía no aparece en el backend.
  // Image

  // Video

  // Audio

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

      // setIsLoading(true); // now derived
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

      const userItemId = crypto.randomUUID();
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
            userItemId,
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

            setHistoryForCap(cap, prev => prev.map(item => {
              if (item.id === userItemId) {
                return {
                  ...item,
                  mediaUrls: [tempUrl],
                  status: 'temporary' as const,
                };
              }
              return item;
            }));

            
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
            userItemId,
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

            setHistoryForCap(cap, prev => prev.map(item => {
              if (item.id === userItemId) {
                return {
                  ...item,
                  mediaUrls: [tempUrl],
                  status: 'temporary' as const,
                };
              }
              return item;
            }));

            
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
            userItemId,
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

            setHistoryForCap(cap, prev => prev.map(item => {
              if (item.id === userItemId) {
                return {
                  ...item,
                  mediaUrls: [tempUrl],
                  status: 'temporary' as const
                };
              }
              return item;
            }));

            
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
              userItemId,
              token,
              params.enhanceMode || 'off',
              params.qwenSteps ?? 40,
              params.qwenGuidance ?? 4.0,
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
              userItemId,
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
              userItemId,
              token,
              params.enhanceMode || 'off',
            ]);
            const data = result.data as unknown[];
            const images = parseImagesFromResult(data[0]);
            absoluteUrls = toAbsoluteUrls(images, gradioUrl);
          }

          if (absoluteUrls.length > 0) {
            setImageSrcs(absoluteUrls);
            // NO apagamos isGenerating aquí. Dejamos que el poller lo haga
            // cuando reciba las r2_keys confirmadas por el backend.
            
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
            userItemId,
            token,
          ]);

          const data = result.data as unknown[];
          const audioData = data[0];
          const statusText = data[1] as string;

          const audioPaths = parseAudioFromResult(audioData);
          const absoluteUrls = toAbsoluteUrls(audioPaths, gradioUrl);

          if (absoluteUrls.length > 0) {
            setHistoryForCap(cap, prev => prev.map(item => {
              if (item.id === userItemId) {
                return {
                  ...item,
                  mediaUrls: absoluteUrls,
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

            
            if (statusText) setStatusMsg(statusText);
          } else {
            setErrorMsg("No se devolvió un audio válido.");
          }
        }
      } catch (err) {
        // Los túneles (Cloudflare/Gradio) caen frecuentemente en generaciones
        // largas. El backend (notebook) sigue vivo y terminando el trabajo.
        // No marcamos error inmediato: dejamos que el poll de /session_history
        // o el orphan guard resuelvan el estado real.
        console.warn("[Túnel] client.predict falló, esperando al poll:", err);
        
        // Solo si el error es claramente de autenticación o de cliente, marcamos error.
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Unauthorized") || msg.includes("Session not found")) {
          setErrorMsg("La sesión expiró o no es válida.");
          setHistoryForCap(cap, prev => prev.map(item =>
            item.id === userItemId ? { ...item, isGenerating: false, errorMessage: "Sesión expirada." } : item
          ));
        }
        // En cualquier otro caso, el poll se encarga.
      } finally {
        // setIsLoading(false); // now derived
        const deadline = Date.now() + 3000;
        while (Date.now() < deadline) {
          try {
            const items = await fetchSessionHistory();
            const anyPreparing = items.some(it => it.isGenerating);
            if (items.length > 0 && !anyPreparing) {
              setHistoryForCap(cap, items);
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

      // setIsLoading(true); // now derived
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

        const payloadWithJwt = { ...payload, jwt_token: token, client_request_id: userItemId };
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
            if (item.id === userItemId) {
              return {
                ...item,
                mediaUrls: [tempUrl!],
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
        // setIsLoading(false); // now derived
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

  // ── Caché de URLs firmadas de R2 ──
  // Cuando un item tiene r2Keys, pedimos la URL firmada a la Edge Function
  // para servirlo desde R2 (rápido, seguro) en lugar del túnel (lento, frágil).
  // El fallback al túnel se mantiene para items viejos sin r2Keys.
  const [r2UrlCache, setR2UrlCache] = useState<Map<string, { url: string; ts: number }>>(new Map());
  const r2FetchInflightRef = useRef<Set<string>>(new Set());
  // r2FetchFailedRef eliminado: permitimos reintentos automáticos.

  useEffect(() => {
    const now = Date.now();
    const toFetch: string[] = [];
    const seen = new Set<string>();
    for (const cap of ['image', 'video', 'audio'] as const) {
      for (const item of sessionHistoryByCapability[cap]) {
        for (const key of item.r2Keys ?? []) {
          if (seen.has(key)) continue;
          seen.add(key);
          const cached = r2UrlCache.get(key);
          if (cached && now - cached.ts < 240_000) continue;
          if (r2FetchInflightRef.current.has(key)) continue;
          toFetch.push(key);
        }
      }
    }
    if (toFetch.length === 0) return;

    (async () => {
      const updates = new Map(r2UrlCache);
      const batch = toFetch.slice(0, 5);
      await Promise.all(batch.map(async (key) => {
        r2FetchInflightRef.current.add(key);
        try {
          const { data, error } = await supabase.functions.invoke('r2-sign-download', {
            body: { r2_key: key },
          });
          if (!error && data?.url) {
            updates.set(key, { url: data.url, ts: Date.now() });
          } else {
            // Reintentar en 2s forzando un re-render del efecto
            setTimeout(() => setR2UrlCache(prev => new Map(prev)), 2000);
          }
        } catch {
          setTimeout(() => setR2UrlCache(prev => new Map(prev)), 2000);
        } finally {
          r2FetchInflightRef.current.delete(key);
        }
      }));
      if (updates.size !== r2UrlCache.size) {
        setR2UrlCache(updates);
      }
    })();
  }, [sessionHistoryByCapability, r2UrlCache]);

  const getResolvedUrl = useCallback((item: SessionItem, idx: number): string => {
    const r2Key = item.r2Keys?.[idx];
    if (r2Key) {
      const cached = r2UrlCache.get(r2Key);
      if (cached) return cached.url;
    }
    // Si no hay R2, no hay archivo (sistema viejo erradicado)
    return '';
  }, [r2UrlCache]);

  // Carga la siguiente página de creaciones (más antiguas) desde Supabase.
  // Deduplica contra items locales por creationId. El cursor se inicializa
  // una vez desde el item local saved más antiguo (si existe) para evitar
  // re-fetchear lo que ya está en cache; luego avanza con nextCursor del server.
  // Inicializar hasMoreSupabase en el primer mount (undefined => fetch inicial)
  // Inicializar paginación por modelo al montar
  const currentModelIdForPag = capability === 'image'
    ? activeImageModelId
    : capability === 'audio'
      ? 'tts-dual'
      : activeVideoModelId;
  const currentModelKeyForPag = currentModelIdForPag ? `${capability}:${currentModelIdForPag}` : null;

  const loadMoreFromSupabase = useCallback(async () => {
    if (loadMoreInFlightRef.current) return;
    loadMoreInFlightRef.current = true;

    const cap = capability;
    const currentModelId = cap === 'image'
      ? activeImageModelId
      : cap === 'audio'
        ? 'tts-dual'
        : activeVideoModelId;

    if (!currentModelId) {
      loadMoreInFlightRef.current = false;
      return;
    }

    const modelKey = `${cap}:${currentModelId}`;
    setIsLoadingMoreSupabaseMap(prev => ({ ...prev, [modelKey]: true }));

    try {
      let cursor = supabaseCursorRef.current[modelKey];

      const page = await fetchCreationsPage({
        cursor: cursor ?? undefined,
        limit: 50,
        capability: cap,
        modelId: currentModelId,
      });

      // Agrupar las filas por parent_id para no crear burbujas duplicadas
      const groupedMap = new Map<string, SessionItem>();
      for (const row of page.items) {
        const item = mapCreationToSessionItem(row);
        if (!groupedMap.has(item.id)) {
          groupedMap.set(item.id, item);
        } else {
          const existing = groupedMap.get(item.id)!;
          if (row.storage_key && !existing.r2Keys?.includes(row.storage_key)) {
            existing.r2Keys = [...(existing.r2Keys || []), row.storage_key];
          }
        }
      }
      const newItems = Array.from(groupedMap.values());

      setSessionHistoryByCapability(prev => {
        // Deduplicar por id. Si el item ya existe en el estado local
        // (porque se generó en esta sesión), no lo insertamos de nuevo.
        const existingIds = new Set(prev[cap].map(it => it.id));
        // FILTRO CRÍTICO: Descartar los items que el usuario ya borró (tombstones)
        const filtered = newItems.filter(it => 
          !existingIds.has(it.id) && !isItemDeleted(it, deletedIdsRef.current)
        );
        if (filtered.length === 0) return prev;
        const merged = [...filtered, ...prev[cap]];
        merged.sort((a, b) => a.createdAt - b.createdAt);
        return { ...prev, [cap]: merged };
      });

      supabaseCursorRef.current[modelKey] = page.nextCursor;
      setHasMoreSupabaseByModel(prev => ({ ...prev, [modelKey]: page.hasMore }));
    } catch (err) {
      console.warn("[loadMoreFromSupabase] error:", err);
      setHasMoreSupabaseByModel(prev => ({ ...prev, [modelKey]: false }));
    } finally {
      setIsLoadingMoreSupabaseMap(prev => ({ ...prev, [modelKey]: false }));
      loadMoreInFlightRef.current = false;
    }
  }, [capability, activeImageModelId, activeVideoModelId, sessionHistoryByCapability]);

  useEffect(() => {
    if (!sessionHydrated || !currentModelKeyForPag) return;
    if (hasMoreSupabaseByModel[currentModelKeyForPag] !== undefined) return;
    void loadMoreFromSupabase();
  }, [sessionHydrated, currentModelKeyForPag, hasMoreSupabaseByModel, loadMoreFromSupabase]);

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
    stationStatusLoading, refreshStationStatus, stationRuntimesMap,
    getClient,
    getResolvedUrl,
    hasMoreSupabase: currentModelKeyForPag ? (hasMoreSupabaseByModel[currentModelKeyForPag] ?? null) : null,
    isLoadingMoreSupabase: currentModelKeyForPag ? (isLoadingMoreSupabaseMap[currentModelKeyForPag] ?? false) : false,
    loadMoreFromSupabase,
  };

  // ── SINCRONIZACIÓN AUTOMÁTICA ──
  // Si el usuario inicia sesión en un dispositivo nuevo (IndexedDB vacío),
  // disparamos automáticamente loadMoreFromSupabase para traer su historial
  // desde Supabase. Solo se ejecuta una vez por capability/modelo.
  const autoLoadedCapsRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!sessionHydrated) return;
    const currentModelId = capability === 'image'
      ? activeImageModelId
      : capability === 'audio'
        ? 'tts-dual'
        : activeVideoModelId;
    if (!currentModelId) return;
    
    const key = `${capability}:${currentModelId}`;
    if (autoLoadedCapsRef.current[key]) return;
    
    // FORZAR CARGA DESDE SUPABASE: No importa si IndexedDB ya tenía algo,
    // siempre pedimos la verdad absoluta a la base de datos la primera vez.
    autoLoadedCapsRef.current[key] = true;
    void loadMoreFromSupabase();
  }, [sessionHydrated, capability, activeImageModelId, activeVideoModelId, sessionHistoryByCapability, loadMoreFromSupabase]);

  // ── POLLER DIRECTO A SUPABASE (acelera la entrega de archivos) ──
  // Consulta `creations` cada 500ms para items en generación. En cuanto
  // aparecen las filas con `parent_id`, actualiza `r2Keys` en el item.
  // No espera al `complete` del túnel de Gradio. Funciona para TODOS los notebooks.
  const generatingIdsKey = (() => {
    const ids: string[] = [];
    for (const cap of ['image', 'video', 'audio'] as const) {
      for (const it of sessionHistoryByCapability[cap]) {
        if (it.isGenerating) ids.push(it.id);
      }
    }
    return ids.join(',');
  })();

  useEffect(() => {
    if (!generatingIdsKey) return;
    const ids = generatingIdsKey.split(',');
    let cancelled = false;

    const check = async () => {
      if (cancelled) return;
      for (const cap of ['image', 'video', 'audio'] as const) {
        const items = sessionHistoryByCapability[cap].filter((it: SessionItem) => ids.includes(it.id) && it.isGenerating);
        for (const item of items) {
          try {
            const { data, error } = await supabase
              .from('creations')
              .select('storage_key')
              .or(`id.eq.${item.id},metadata->>parent_id.eq.${item.id}`)
              .order('created_at', { ascending: true });
            if (cancelled) return;
            if (!error && Array.isArray(data) && data.length > 0) {
              const keys = data.map((r: any) => r.storage_key).filter(Boolean);
              if (keys.length > 0) {
                setHistoryForCapRef.current(cap, prev => prev.map(it =>
                  it.id === item.id ? { ...it, r2Keys: keys } : it
                ));
              }
            }
          } catch { /* ignorar red */ }
        }
      }
    };

    check();
    const interval = window.setInterval(check, 500);
    return () => { cancelled = true; window.clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatingIdsKey]);

  // ── CAPA 3: Supabase Realtime ──
  // Escucha INSERTs y DELETEs en `creations` del usuario actual vía WebSocket.
  // El backend inserta en Supabase → el frontend recibe la novedad en ~200ms sin polling.
  // Cubre cross-tab y cross-device. Es el mecanismo industrial.
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setAuthUserId(data.user.id);
    });
  }, []);
  useEffect(() => {
    if (!authUserId) return;
    let cancelled = false;

    const channel = supabase
      .channel(`creations-realtime-${authUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'creations', filter: `user_id=eq.${authUserId}` },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as any;
          if (!row || typeof row.id !== 'string') return;

          const cap = (row.media_type === 'video' ? 'video' : row.media_type === 'audio' ? 'audio' : 'image') as CapabilityId;
          
          // CLAVE: Agrupar por parent_id (el ID del lote) o por el id de la fila.
          // Esto evita que un lote de 3 imágenes cree 3 burbujas separadas en el chat.
          const parentId = row.metadata?.parent_id || row.id;

          // PILAR 4: si el item está tombstoned, ignorar el INSERT.
          if (isTombstoned(parentId) || isTombstoned(row.id)) return;

          setHistoryForCapRef.current(cap, prev => {
            // Buscar si ya existe la burbuja del lote (por parentId o por row.id)
            const existingIdx = prev.findIndex(it => it.id === parentId || it.id === row.id);
            
            if (existingIdx !== -1) {
              // Si ya existe, le agregamos la nueva llave a su array de r2Keys
              const existing = prev[existingIdx];
              const currentKeys = existing.r2Keys || [];
              // Evitar duplicados
              const newKeys = currentKeys.includes(row.storage_key) 
                ? currentKeys 
                : [...currentKeys, row.storage_key];
              
              const updated = [...prev];
              updated[existingIdx] = { 
                ...existing, 
                r2Keys: newKeys,
              };
              return updated;
            }

            // Si no existe, creamos la burbuja (esto pasa si la generación viene de otra pestaña)
            const newItem: SessionItem = {
              id: parentId, // Usamos el parentId para que futuras imágenes de este lote se agrupen aquí
              prompt: row.prompt || '',
              mediaUrls: [],
              mediaType: cap,
              modelId: row.model_id || '',
              modelLabel: row.model_id || '',
              aspectRatio: row.aspect_ratio || '1/1',
              createdAt: new Date(row.created_at).getTime(),
              status: 'temporary',
              isGenerating: false, // Si viene de otra pestaña, asumimos que ya terminó
              creationId: row.id,
              r2Keys: [row.storage_key],
            };
            const merged = [...prev, newItem];
            merged.sort((a, b) => a.createdAt - b.createdAt);
            return merged;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'creations', filter: `user_id=eq.${authUserId}` },
        (payload) => {
          if (cancelled) return;
          const row = payload.old as any;
          if (!row?.id) return;
          // PILAR 4: intentar borrar tanto por id de fila como por parent_id
          const parentId = row.metadata?.parent_id || null;
          for (const cap of ['image', 'video', 'audio'] as const) {
            setHistoryForCapRef.current(cap, prev => prev.filter(it => 
              it.id !== row.id && (!parentId || it.id !== parentId)
            ));
          }
          void sessionStore.deleteItem(row.id);
          if (parentId) void sessionStore.deleteItem(parentId);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUserId]);


  // ── PREFETCH INDUSTRIAL ──
  // En cuanto Realtime o el Poller detectan una nueva r2Key, pedimos la URL firmada
  // inmediatamente y la guardamos en caché. Así el usuario no ve "Firmando" al hacer scroll.
  useEffect(() => {
    const prefetchUrls = async () => {
      const allItems = [
        ...sessionHistoryByCapability.image,
        ...sessionHistoryByCapability.video,
        ...sessionHistoryByCapability.audio,
      ];
      
      const keysToFetch = new Set<string>();
      for (const item of allItems) {
        for (const key of item.r2Keys || []) {
          const cache = sessionStorage.getItem('pf_r2_url_cache_v1');
          const parsed = cache ? JSON.parse(cache) : {};
          if (!parsed[key]) {
            keysToFetch.add(key);
          }
        }
      }

      if (keysToFetch.size === 0) return;

      const cache = sessionStorage.getItem('pf_r2_url_cache_v1');
      const parsed = cache ? JSON.parse(cache) : {};
      let changed = false;

      for (const key of Array.from(keysToFetch).slice(0, 10)) {
        try {
          const { data, error } = await supabase.functions.invoke('r2-sign-download', {
            body: { r2_key: key }
          });
          if (!error && data?.url) {
            parsed[key] = { url: data.url, timestamp: Date.now() };
            changed = true;
          }
        } catch { /* ignorar */ }
      }

      if (changed) {
        sessionStorage.setItem('pf_r2_url_cache_v1', JSON.stringify(parsed));
        // Forzar un re-render de los componentes de imagen
        window.dispatchEvent(new Event('pf_r2_cache_updated'));
      }
    };

    prefetchUrls();
  }, [sessionHistoryByCapability]);

  return <GenerationContext.Provider value={value}>{children}</GenerationContext.Provider>;
}

export function useGenerationContext() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("useGenerationContext must be used within GenerationProvider");
  return ctx;
}
