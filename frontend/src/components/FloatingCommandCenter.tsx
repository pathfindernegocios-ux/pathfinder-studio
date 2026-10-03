// src/components/FloatingCommandCenter.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGenerationContext } from '../context/GenerationContext';
import { useModels } from '../hooks/useModels';
import Callout from './Callout';
import { supabase } from '../lib/supabaseClient';
import { Video, Image as ImageIcon, Music, Paperclip, X, Mic, Mic2, Pencil } from 'lucide-react';
import PathfinderLogo from './PathfinderLogo';
import PathfinderSpinner from './PathfinderSpinner';
import AudioTrimmer from './AudioTrimmer';
import { useIsMobile } from '../hooks/useIsMobile';
import { useStationBoot } from '../hooks/useStationBoot';
import StoryboardStrip, { type StoryboardSceneLocal } from './StoryboardStrip';

type TabType = 'video' | 'image' | 'audio';

// Catálogo de modelos — fuente única de verdad en src/config/models.ts
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  AUDIO_MODELS,
  MODELS_BY_CAPABILITY,
  getRuntimeId,
  getOnlineCapability,
  getFirstOnlineModel,
} from '../config/models';

// Alias locales para minimizar el diff con el código existente
const STATIC_IMAGE_MODELS = IMAGE_MODELS;

const QWEN_TASKS = ['Crear', 'Editar y Refs', 'Inpaint'];
const QWEN_MODES = ['Turbo HQ', 'Turbo Fast'];
const QWEN_RESOLUTIONS = ['768px (fastest)', '1024px (recommended)'];
const QWEN_ASPECT_RATIOS = ['Match input', '1:1 Square', '16:9 Landscape', '9:16 Portrait', '4:3 Standard', '3:4 Portrait', '2:3 Poster'];
const QWEN_STYLES = ['None', 'Cinematic', 'Photographic', 'Anime', 'Cyberpunk', 'Fantasy'];
const STATIC_VIDEO_MODELS = VIDEO_MODELS;
const STATIC_AUDIO_MODELS = AUDIO_MODELS;

// Arrays de opciones simplificadas — LTX
const VIDEO_DURATIONS = [
  '2 Seconds (49 frames)',
  '3 Seconds (73 frames)',
  '5 Seconds (121 frames)',
  '8 Seconds (193 frames)',
  '10 Seconds (241 frames)',
  '15 Seconds (361 frames)',
  '20 Seconds (481 frames)',
  '25 Seconds (601 frames)',
  '30 Seconds (721 frames)',
];
const VIDEO_RESOLUTIONS = ['720p', '540p', '480p'];
const VIDEO_ASPECT_RATIOS = ['16:9 Landscape', '4:3 Standard', '1:1 Square', '3:4 Portrait', '9:16 Portrait'];

// Arrays de opciones — Wan 2.1
const WAN_DURATIONS = [
  '2s (33 frames)', '3s (49 frames)', '4s (65 frames)', '5s (81 frames)',
  '6s (97 frames)', '8s (129 frames)', '10s (161 frames)',
];
const WAN_RESOLUTIONS = ['360p', '480p', '540p', '720p'];
const WAN_ASPECTS = ['16:9 Landscape', '4:3 Standard', '1:1 Square', '3:4 Portrait', '9:16 Portrait'];
const WAN_SAMPLERS = ['UniPC (recomendado)', 'Euler', 'Euler a', 'DPM++ 2M', 'DPM++ 2M SDE', 'Heun', 'LMS'];

// ── LTX 2.5 MSR ──
const LTX25_DURATIONS = [
  '2 Seconds (49 frames - Fast)',
  '3 Seconds (73 frames - Standard)',
  '5 Seconds (121 frames - Long)',
  '6 Seconds (145 frames - MSR default)',
  '8 Seconds (193 frames)',
  '10 Seconds (241 frames)',
];
const LTX25_RESOLUTIONS = [
  'Fast Preview (384p - ~1-2 min)',
  'Balanced (480p - ~3-5 min)',
  'High Quality (704p - ~6-8 min)',
];
const LTX25_ASPECTS = ['16:9 Landscape', '4:3 Standard', '1:1 Square', '3:4 Portrait', '9:16 Portrait'];
const LTX25_PIPELINES = [
  'Single stage (fast - recommended for T4)',
  'Two stages (half-res + x2 spatial upscale - slower)',
];
const LTX25_MODES = [
  { label: 'Background + Up to 4 Subjects', value: 'KI' },
  { label: 'Up to 4 Subjects / Objects', value: 'I' },
];

// ── Disclaimer rotativo (IA puede cometer errores + tiempo variable) ──
const DISCLAIMER_MESSAGES = [
  'La IA puede cometer errores. Verifica el contenido antes de usarlo.',
  'El tiempo de generación puede variar según el modelo y la resolución.',
];

// ── Persistencia de selección (sobrevive refresh y navegación) ──
const STUDIO_SELECTION_KEY = 'pf_studio_selection_v1';

interface PersistedLoraItem {
  name: string;
  mult: string;
  enabled?: boolean;
}

interface PersistedStudioSelection {
  activeTab: 'video' | 'image' | 'audio';
  selectedVideoModelId: string;
  selectedImageModelId: string;
  selectedTtsModelId: string;
  wanLoras?: PersistedLoraItem[];
  ltx25Loras?: PersistedLoraItem[];
  videoLoras?: PersistedLoraItem[];
  /** Modo de generación: single-scene (default) o storyboard multi-escena */
  mode?: 'single' | 'storyboard';

  /** Draft de params por modelo — sobrevive refresh/navegación antes de generar. */
  params?: PersistedStudioParams;
}

interface PersistedStudioParams {
  video?: Partial<VideoParams>;
  wan?: Partial<WanParams>;
  ltx25?: Partial<Ltx25Params>;
  krea?: Partial<KreaParams>;
  flux?: Partial<FluxParams>;
  qwen?: Partial<QwenParams>;
  tts?: Partial<TtsParams>;
}

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

function loadPersistedStudioSelection(): PersistedStudioSelection | null {
  try {
    const raw = localStorage.getItem(STUDIO_SELECTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!['video', 'image', 'audio'].includes(parsed.activeTab)) return null;
    return parsed as PersistedStudioSelection;
  } catch {
    return null;
  }
}

/** Carga las LoRAs de Wan desde localStorage, normalizando el shape. */
function loadWanLoras(): { name: string; mult: string; enabled: boolean }[] {
  const persisted = loadPersistedStudioSelection()?.wanLoras;
  if (!Array.isArray(persisted)) return [];
  return persisted
    .filter((x) => x && typeof x.name === 'string' && typeof x.mult === 'string')
    .map((x) => ({ name: x.name, mult: x.mult, enabled: x.enabled !== false }));
}

/** Carga las LoRAs de LTX 2.3 desde localStorage, normalizando el shape. */
function loadVideoLoras(): { name: string; mult: string; enabled: boolean }[] {
  const persisted = loadPersistedStudioSelection()?.videoLoras;
  if (!Array.isArray(persisted)) return [];
  return persisted
    .filter((x) => x && typeof x.name === 'string' && typeof x.mult === 'string')
    .map((x) => ({ name: x.name, mult: x.mult, enabled: x.enabled !== false }));
}

/** Carga las LoRAs de LTX 2.5 MSR desde localStorage.
 *  Si no hay persistidas, devuelve el default: Product Commercial enabled. */
/** Carga el modo (single | storyboard) desde localStorage. Default: 'single'. */
function loadStoryboardMode(): 'single' | 'storyboard' {
  const persisted = loadPersistedStudioSelection()?.mode;
  return persisted === 'storyboard' ? 'storyboard' : 'single';
}

// ── Persistencia del draft de params por modelo ──
// Guarda solo primitivos (strings, numbers, booleans, null).
// Los File (refs, máscaras, audios) NO se persisten.

const VIDEO_PERSIST_KEYS: (keyof VideoParams)[] = [
  'duration', 'resolution', 'aspectRatio', 'guideScale', 'seed', 'matchAudioDur',
];
const WAN_PERSIST_KEYS: (keyof WanParams)[] = [
  'mode', 'duration', 'resolution', 'aspectRatio', 'steps', 'guideScale',
  'shift', 'sampler', 'seed', 'forcePreset',
];
const LTX25_PERSIST_KEYS: (keyof Ltx25Params)[] = [
  'mode', 'removeBg', 'duration', 'resolution', 'aspectRatio',
  'pipeline', 'audioCfg', 'steps', 'seed',
];
const KREA_PERSIST_KEYS: (keyof KreaParams)[] = [
  'negativePrompt', 'steps', 'resolution', 'aspectRatio', 'seed',
  'numImages', 'stylePreset',
];
const FLUX_PERSIST_KEYS: (keyof FluxParams)[] = [
  'negativePrompt', 'steps', 'resolution', 'aspectRatio', 'seed', 'numImages',
  'refModeLabel', 'modelModeLabel', 'fluxGuideScale', 'embeddedGuidance',
];
const QWEN_PERSIST_KEYS: (keyof QwenParams)[] = [
  'task', 'mode', 'stylePreset', 'transparent', 'negativePrompt',
  'resolution', 'aspectRatio', 'seed', 'numImages', 'strength',
];
const TTS_PERSIST_KEYS: (keyof TtsParams)[] = [
  'voiceMode', 'voiceInstruction', 'emotionInstruction', 'language', 'duration',
  'seed', 'steps', 'guideScale', 'speechSpeed', 'temperature', 'topP', 'topK',
  'textNormalization',
];

function pickPersistable<T extends object>(obj: T, keys: (keyof T)[]): Partial<T> {
  const out: Partial<T> = {};
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined) continue;
    if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    }
  }
  return out;
}

function hydrateParams<T extends object>(defaults: T, persisted?: Partial<T> | null): T {
  if (!persisted) return defaults;
  return { ...defaults, ...persisted };
}

const LTX25_DEFAULT_LORAS = [
  { name: 'LTX23_Product_Commercial_LoRA.safetensors', mult: '1.0', enabled: true },
];
function loadLtx25Loras(): { name: string; mult: string; enabled: boolean }[] {
  const persisted = loadPersistedStudioSelection()?.ltx25Loras;
  if (!Array.isArray(persisted) || persisted.length === 0) {
    return [...LTX25_DEFAULT_LORAS];
  }
  const normalized = persisted
    .filter((x) => x && typeof x.name === 'string' && typeof x.mult === 'string')
    .map((x) => ({ name: x.name, mult: x.mult, enabled: x.enabled ?? true }));
  return normalized.length > 0 ? normalized : [...LTX25_DEFAULT_LORAS];
}

const KREA_STYLES = ['None', 'Cinematic', 'Anime', 'Photorealistic', '3D Render'];
const KREA_RESOLUTIONS = ['1024px (Standard)', '1536px (High)', '2048px (2K Ultra)'];
const KREA_ASPECT_RATIOS = ['1:1 Square', '16:9 Landscape', '9:16 Portrait', '4:3 Standard', '3:4 Portrait'];

const FLUX_REF_MODES = [
  'Sujeto/Escenario + Personas u Objetos (KI)',
  'Solo Personas u Objetos (I)'
];

const FLUX_RESOLUTIONS = ['1024px (Estándar)', '1536px (Alta)'];
const FLUX_ASPECT_RATIOS = ['1:1 Cuadrado', '16:9 Paisaje', '9:16 Retrato', '4:5 Retrato'];

// ── TTS Dual — OmniVoice + Index TTS 2.5 ──
const TTS_OMNI_VOICE_MODES = [
  'Auto Voice (sin referencia)',
  'Voice Design (solo tags)',
  'Voice Cloning (1 referencia)',
  'Two-Speaker (2 referencias)',
];
const TTS_INDEX_VOICE_MODES = [
  'Voice Cloning (1 referencia)',
  'Voice + Emotion (2 referencias)',
];
const TTS_OMNI_LANGS = ['Auto', 'Spanish', 'English', 'Portuguese', 'French', 'German', 'Italian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Russian'];
const TTS_INDEX_LANGS = ['Spanish', 'English', 'Chinese', 'Chinese / English Mixed', 'Japanese', 'Arabic'];
const TTS_DURATIONS = ['Custom (auto)', '5 segundos', '10 segundos', '15 segundos', '25 segundos', '40 segundos', '60 segundos'];

const TTS_LANG_CODE_MAP_OMNI: Record<string, string> = {
  'Auto':       'auto',
  'Spanish':    'spanish',
  'English':    'english',
  'Portuguese': 'portuguese',
  'French':     'french',
  'German':     'german',
  'Italian':    'italian',
  'Japanese':   'japanese',
  'Korean':     'korean',
  'Chinese':    'chinese',
  'Arabic':     'arabic',
  'Hindi':      'hindi',
  'Russian':    'russian',
};

const TTS_LANG_CODE_MAP_INDEX: Record<string, string> = {
  'Spanish': 'ES',
  'English': 'EN',
  'Chinese': 'ZH',
  'Chinese / English Mixed': 'ZHEN',
  'Japanese': 'JA',
  'Arabic': 'AR',
};

// Interfaces para los parámetros
interface VideoParams {
  imageStartFile: File | null;
  imageEndFile: File | null;
  audioFile: File | null;
  duration: string;
  resolution: string;
  aspectRatio: string;
  guideScale: number;
  seed: number;
  matchAudioDur: boolean;
  loraItems: { name: string; mult: string; enabled: boolean }[];
}

interface WanParams {
  mode: 'i2v' | 't2v';
  imageStartFile: File | null;
  imageEndFile: File | null;
  duration: string;      // "5s (81 frames)"
  resolution: string;    // "480p"
  aspectRatio: string;   // "16:9 Landscape"
  steps: number;         // 4
  guideScale: number;    // 1.0
  shift: number;         // 5.0
  sampler: string;       // "UniPC (recomendado)"
  seed: number;          // -1
  forcePreset: boolean;  // false
  loraItems: { name: string; mult: string; enabled: boolean }[];
}

interface Ltx25Params {
  mode: 'KI' | 'I';
  removeBg: boolean;
  ref1: File | null;
  ref2: File | null;
  ref3: File | null;
  ref4: File | null;
  ref5: File | null;
  duration: string;
  resolution: string;
  aspectRatio: string;
  pipeline: string;
  audioCfg: number;
  steps: number;
  seed: number;
  loraItems: { name: string; mult: string; enabled: boolean }[];
}

interface KreaParams {
  negativePrompt: string;
  steps: number;
  resolution: string;
  aspectRatio: string;
  seed: number;
  numImages: number;
  stylePreset: string;
}

interface FluxParams {
  negativePrompt: string;
  steps: number;
  resolution: string;
  aspectRatio: string;
  seed: number;
  numImages: number;
  refFiles: File[];
  refModeLabel: string;
  maskFile: File | null;
  modelModeLabel: string;
  fluxGuideScale: number;
  embeddedGuidance: number;
}

interface QwenParams {
  task: 'Crear' | 'Editar y Refs' | 'Inpaint';
  mode: string;
  stylePreset: string;
  transparent: boolean;
  negativePrompt: string;
  resolution: string;
  aspectRatio: string;
  seed: number;
  numImages: number;
  refFiles: File[];
  editImageFile: File | null;
  editMaskFile: File | null;
  strength: number;
}

interface TtsParams {
  voiceMode: string;
  voiceInstruction: string;
  emotionInstruction: string;
  audioGuide: File | null;
  audioGuide2: File | null;
  language: string;
  duration: string;
  seed: number;
  steps: number;
  guideScale: number;
  speechSpeed: number;
  temperature: number;
  topP: number;
  topK: number;
  textNormalization: boolean;
}

// Componente auxiliar para menús desplegables inteligentes
const DropdownButton = ({ options, value, onChange, formatOption }: { 
  options: string[]; 
  value: string; 
  onChange: (val: string) => void; 
  formatOption?: (option: string) => string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const checkPosition = () => {
      if (buttonRef.current && isOpen) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUp(spaceBelow < 200);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', checkPosition, true);
    window.addEventListener('resize', checkPosition);
    
    if (isOpen) checkPosition();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', checkPosition, true);
      window.removeEventListener('resize', checkPosition);
    };
  }, [isOpen]);

  const displayValue = formatOption ? formatOption(value) : value;

  return (
    <div ref={buttonRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '5px 10px',
          background: 'var(--pf-bg-secondary)',
          border: '1px solid var(--pf-border-default)',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'var(--pf-font-ui)',
          color: 'var(--pf-text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          minWidth: '100px',
          whiteSpace: 'nowrap'
        }}
      >
        <span style={{ whiteSpace: 'nowrap' }}>{displayValue}</span>
        <span style={{ fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: openUp ? 'calc(100% + 4px)' : 'auto',
          top: openUp ? 'auto' : 'calc(100% + 4px)',
          left: 0,
          background: 'var(--pf-bg-elevated)',
          border: '1px solid var(--pf-border-default)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          minWidth: '140px',
          maxHeight: '200px',
          overflowY: 'auto',
          padding: '4px'
        }}>
          {options.map(option => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                fontFamily: 'var(--pf-font-ui)',
                cursor: 'pointer',
                borderRadius: '6px',
                color: value === option ? 'var(--pf-text-primary)' : 'var(--pf-text-secondary)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--pf-bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {formatOption ? formatOption(option) : option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para inputs numéricos compactos
const NumberInput = ({ label, value, onChange, min, max, step = 1 }: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  min: number; 
  max: number; 
  step?: number;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--pf-text-muted)', textTransform: 'uppercase' }}>{label}</span>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{
        width: '50px',
        padding: '4px 8px',
        background: 'var(--pf-bg-secondary)',
        border: '1px solid var(--pf-border-default)',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'var(--pf-font-ui)',
        color: 'var(--pf-text-primary)'
      }}
    />
  </div>
);

const FloatingCommandCenter: React.FC = () => {
  const isMobile = useIsMobile();
  const isFirstRenderRef = useRef(true);
  // Auto-select: corre la 1ra vez que ve stationStatusMap con datos, y también
  // cuando aparece un modelo NUEVO online.
  const hasAutoSelectedRef = useRef(false);
  const lastOnlineIdsRef = useRef<Set<string>>(new Set());
  // Anti-rebote para el auto-select durante boot: no cambiar de tab más de
  // una vez por cada runtimeId que arranca.
  const bootAutoSelectedRef = useRef<Set<string>>(new Set());

  // Índice del disclaimer: se elige al azar al montar. Cambia en cada refresh
  // (o al remontar el FCM cuando se navega a otra página y se vuelve a Studio).
  const [disclaimerIdx] = useState(() =>
    Math.floor(Math.random() * DISCLAIMER_MESSAGES.length)
  );
  const [activeTab, setActiveTab] = useState<TabType>(() => loadPersistedStudioSelection()?.activeTab || 'video');

  // Modo Single / Storyboard — solo aplica a la pestaña de Video. Persiste en localStorage.
  const [storyboardMode, setStoryboardMode] = useState<'single' | 'storyboard'>(() => loadStoryboardMode());

  // Escenas del storyboard (nivel local del FCM). Se sincroniza vía onScenesChange.
  const [storyboardScenes, setStoryboardScenes] = useState<StoryboardSceneLocal[]>([]);

  // PF_STORYBOARD_MODE_EFFECT — persiste el modo sin tocar el resto del objeto persistido.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STUDIO_SELECTION_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STUDIO_SELECTION_KEY, JSON.stringify({ ...parsed, mode: storyboardMode }));
    } catch {
      /* noop */
    }
  }, [storyboardMode]);
  // Prompt por capability: cada tab mantiene su propio texto. Al cambiar de
  // tab se restaura el prompt guardado de esa capability. Permite escribir
  // un prompt en Video, ir a Imagen y no perder ninguno de los dos.
  const [promptByCap, setPromptByCap] = useState<Record<TabType, string>>({
    video: '',
    image: '',
    audio: '',
  });
  const prompt = promptByCap[activeTab] ?? '';
  const setPrompt = React.useCallback((v: string) => {
    setPromptByCap(prev => ({ ...prev, [activeTab]: v }));
  }, [activeTab]);
  
  const objectUrlCacheRef = useRef<Map<File, string>>(new Map());

  const getObjectUrl = useCallback((file: File): string => {
    const cache = objectUrlCacheRef.current;
    let url = cache.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      cache.set(file, url);
    }
    return url;
  }, []);
  
  const { 
    handleGenerate,
    handleGenerateStoryboard,
    isLoading, 
    capability,
    setCapability, 
    activeImageModelId, 
    setActiveImageModelId,
    activeVideoModelId,
    setActiveVideoModelId,
    stationStatusMap,
    stationModelTypeMap,
    stationBootingIds,
    getClient,
    stationId,
  } = useGenerationContext();

  const [selectedImageModelId, setSelectedImageModelId] = useState<string>(() => loadPersistedStudioSelection()?.selectedImageModelId || 'krea-2-turbo');
  const [selectedVideoModelId, setSelectedVideoModelId] = useState<string>(() => loadPersistedStudioSelection()?.selectedVideoModelId || activeVideoModelId || 'ltx-2.3');
  const [selectedTtsModelId, setSelectedTtsModelId] = useState<string>(() => loadPersistedStudioSelection()?.selectedTtsModelId || 'omnivoice');
  const [expandedAudio, setExpandedAudio] = useState<'audioGuide' | 'audioGuide2' | null>(null);
  const [lightboxFile, setLightboxFile] = useState<File | null>(null);

  // Cerrar lightbox con Esc
  useEffect(() => {
    if (!lightboxFile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxFile(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxFile]);
  const [newLoraUrl, setNewLoraUrl] = useState('');
  const [loraAdding, setLoraAdding] = useState(false);

  const isVideoWan = selectedVideoModelId.startsWith('wan-');
  const isVideoLtx = selectedVideoModelId === 'ltx-2.3';
  const isVideoLtx25Msr = selectedVideoModelId === 'ltx-2.5-msr' || selectedVideoModelId === 'ltx-2.3-msr';
  // Validación del storyboard (solo aplica en modo storyboard + video + LTX).
  const storyboardValid = React.useMemo(() => {
    if (storyboardMode !== 'storyboard') return true;
    if (activeTab !== 'video') return true;
    if (!isVideoLtx) return true;
    if (storyboardScenes.length === 0) return false;
    if (storyboardScenes.some(s => !s.prompt.trim())) return false;
    if (storyboardScenes[0]?.mode === 'continue') return false;
    return true;
  }, [storyboardMode, activeTab, isVideoLtx, storyboardScenes]);


  // Estado de la estación activa (badge offline/online)
  const currentStationModelId = activeTab === 'image'
    ? (selectedImageModelId || activeImageModelId)
    : activeTab === 'video'
      ? (isVideoWan ? 'wan-dual' : isVideoLtx25Msr ? selectedVideoModelId : 'ltx-2.3')
      : activeTab === 'audio'
        ? 'tts-dual'
        : null;
  // Boot en vivo (Fase 2): oculta el banner naranja desde que se detecta la estación
  const boot = useStationBoot(stationId, currentStationModelId);

  // Callout de primera generación: aparece al primer click en Generar
  // después de que la estación pasó a READY en esta sesión de runtime.
  // Flag por stationId (cambia cuando Kaggle reinicia).
  const [firstGenCalloutVisible, setFirstGenCalloutVisible] = useState(false);
  const dismissFirstGenCallout = () => {
    if (stationId) {
      localStorage.setItem(`pf_first_gen_callout_seen_${stationId}`, '1');
    }
    setFirstGenCalloutVisible(false);
  };
  const isBootActive = boot.isBooting || boot.detecting;
  // boot.isReady sólo cuenta si el updated_at es fresco (<3 min). Igual que
  // StudioPage: una fila READY huérfana (notebook muerto) no debe marcar la
  // estación como lista.
  const bootAgeMs = boot.updatedAt ? Date.now() - new Date(boot.updatedAt).getTime() : Infinity;
  const isFreshBootReady = boot.isReady && bootAgeMs < 3 * 60 * 1000;
  const isStationReady = currentStationModelId
    ? (stationStatusMap[getRuntimeId(currentStationModelId)] === 'online' || isFreshBootReady)
    : false;
  const isStationOffline = currentStationModelId
    ? (!isBootActive && !isStationReady)
    : false;

  // Dismiss del banner naranja: se resetea al cambiar de capability/tab.
  const [bannerDismissed, setBannerDismissed] = useState(false);
  useEffect(() => {
    setBannerDismissed(false);
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === 'image') {
      if (activeImageModelId && STATIC_IMAGE_MODELS.some(m => m.id === activeImageModelId)) {
        setSelectedImageModelId(activeImageModelId);
      } else if (!activeImageModelId) {
        setSelectedImageModelId('krea-2-turbo');
      }
    }
  }, [activeTab, activeImageModelId]);

  const isFluxActive = selectedImageModelId.includes('flux');
  const isQwenActive = selectedImageModelId === 'qwen-image-2.1';

  const navigate = useNavigate();
  const { allModels: catalogModels, unlockedIds } = useModels();

  const currentUiModelIdForLock = activeTab === 'image'
    ? (selectedImageModelId || activeImageModelId)
    : activeTab === 'audio'
      ? selectedTtsModelId
      : selectedVideoModelId;
  const currentCatalogEntry = catalogModels.find(m => m.id === currentUiModelIdForLock);
  const isCurrentModelLocked = !!currentCatalogEntry
    && !currentCatalogEntry.is_free
    && !unlockedIds.has(currentCatalogEntry.id);
  const isTtsOmni = selectedTtsModelId === 'omnivoice';
  const ttsVoiceModeOptions = isTtsOmni ? TTS_OMNI_VOICE_MODES : TTS_INDEX_VOICE_MODES;
  const ttsLangOptions = isTtsOmni ? TTS_OMNI_LANGS : TTS_INDEX_LANGS;
  
  const [videoParams, setVideoParams] = useState<VideoParams>(() =>
    hydrateParams<VideoParams>({
      imageStartFile: null,
      imageEndFile: null,
      audioFile: null,
      duration: '5 Seconds (121 frames)',
      resolution: '480p',
      aspectRatio: '16:9 Landscape',
      guideScale: 1.0,
      seed: -1,
      matchAudioDur: false,
      loraItems: loadVideoLoras(),
    }, loadPersistedStudioSelection()?.params?.video)
  );

  const [wanParams, setWanParams] = useState<WanParams>(() =>
    hydrateParams<WanParams>({
      mode: 'i2v',
      imageStartFile: null,
      imageEndFile: null,
      duration: '5s (81 frames)',
      resolution: '480p',
      aspectRatio: '16:9 Landscape',
      steps: 4,
      guideScale: 1.0,
      shift: 5.0,
      sampler: 'UniPC (recomendado)',
      seed: -1,
      forcePreset: false,
      loraItems: loadWanLoras(),
    }, loadPersistedStudioSelection()?.params?.wan)
  );

  const [ltx25Params, setLtx25Params] = useState<Ltx25Params>(() =>
    hydrateParams<Ltx25Params>({
      mode: 'I',
      removeBg: false,
      ref1: null,
      ref2: null,
      ref3: null,
      ref4: null,
      ref5: null,
      duration: '3 Seconds (73 frames - Standard)',
      resolution: 'Balanced (480p - ~3-5 min)',
      aspectRatio: '16:9 Landscape',
      pipeline: 'Single stage (fast - recommended for T4)',
      audioCfg: 1.0,
      steps: 8,
      seed: -1,
      loraItems: loadLtx25Loras(),
    }, loadPersistedStudioSelection()?.params?.ltx25)
  );

  const [kreaParams, setKreaParams] = useState<KreaParams>(() =>
    hydrateParams<KreaParams>({
      negativePrompt: '',
      steps: 8,
      resolution: '1024px (Standard)',
      aspectRatio: '1:1 Square',
      seed: -1,
      numImages: 1,
      stylePreset: 'None',
    }, loadPersistedStudioSelection()?.params?.krea)
  );

  const [fluxParams, setFluxParams] = useState<FluxParams>(() =>
    hydrateParams<FluxParams>({
      negativePrompt: '',
      steps: 4,
      resolution: '1024px (Estándar)',
      aspectRatio: '1:1 Cuadrado',
      seed: -1,
      numImages: 1,
      refFiles: [],
      refModeLabel: 'Sujeto/Escenario + Personas u Objetos (KI)',
      maskFile: null,
      modelModeLabel: 'Masked Denoising : Inpainted area may reuse some content that has been masked',
      fluxGuideScale: 5,
      embeddedGuidance: 1,
    }, loadPersistedStudioSelection()?.params?.flux)
  );

  const [qwenParams, setQwenParams] = useState<QwenParams>(() =>
    hydrateParams<QwenParams>({
      task: 'Crear',
      mode: 'Turbo HQ',
      stylePreset: 'None',
      transparent: false,
      negativePrompt: '',
      resolution: '1024px (recommended)',
      aspectRatio: '1:1 Square',
      seed: -1,
      numImages: 1,
      refFiles: [],
      editImageFile: null,
      editMaskFile: null,
      strength: 1.0,
    }, loadPersistedStudioSelection()?.params?.qwen)
  );

  const qwenImageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qwenMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qwenPaintingRef = useRef<boolean>(false);
  const [qwenEditImageUrl, setQwenEditImageUrl] = useState<string | null>(null);

  const [ttsParams, setTtsParams] = useState<TtsParams>(() =>
    hydrateParams<TtsParams>({
      voiceMode: 'VD',
      voiceInstruction: 'female, young adult, moderate pitch',
      emotionInstruction: '',
      audioGuide: null,
      audioGuide2: null,
      language: 'Auto',
      duration: 'Custom (auto)',
      seed: -1,
      steps: 32,
      guideScale: 2.0,
      speechSpeed: 1.0,
      temperature: 0.8,
      topP: 0.8,
      topK: 30,
      textNormalization: true,
    }, loadPersistedStudioSelection()?.params?.tts)
  );

  // Limpieza de URLs huérfanas
  useEffect(() => {
    const activeFiles = new Set<File>([
      ...(videoParams.imageStartFile ? [videoParams.imageStartFile] : []),
      ...(videoParams.imageEndFile ? [videoParams.imageEndFile] : []),
      ...(videoParams.audioFile ? [videoParams.audioFile] : []),
      ...(wanParams.imageStartFile ? [wanParams.imageStartFile] : []),
      ...(wanParams.imageEndFile ? [wanParams.imageEndFile] : []),
      ...(ltx25Params.ref1 ? [ltx25Params.ref1] : []),
      ...(ltx25Params.ref2 ? [ltx25Params.ref2] : []),
      ...(ltx25Params.ref3 ? [ltx25Params.ref3] : []),
      ...(ltx25Params.ref4 ? [ltx25Params.ref4] : []),
      ...(ltx25Params.ref5 ? [ltx25Params.ref5] : []),
      ...fluxParams.refFiles,
      ...qwenParams.refFiles,
      ...(ttsParams.audioGuide ? [ttsParams.audioGuide] : []),
      ...(ttsParams.audioGuide2 ? [ttsParams.audioGuide2] : []),
    ]);
    const cache = objectUrlCacheRef.current;
    for (const [file, url] of cache.entries()) {
      if (!activeFiles.has(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    }
  }, [videoParams.imageStartFile, videoParams.imageEndFile, videoParams.audioFile, wanParams.imageStartFile, wanParams.imageEndFile, fluxParams.refFiles, ttsParams.audioGuide, ttsParams.audioGuide2]);

  useEffect(() => {
    return () => {
      objectUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlCacheRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      // En el primer render, FCM manda: sincronizamos el contexto con la
      // selección restaurada de localStorage.
      if (activeTab !== capability) {
        setCapability(activeTab);
      }
      return;
    }
    if (capability !== activeTab) {
      setActiveTab(capability);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capability]);

  useEffect(() => {
    const handleSetPrompt = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setPrompt(customEvent.detail);
      }
    };
    window.addEventListener('pathfinder-set-prompt', handleSetPrompt as EventListener);
    return () => window.removeEventListener('pathfinder-set-prompt', handleSetPrompt as EventListener);
  }, []);

  // ── Sync del contexto con la selección restaurada (una sola vez al montar) ──
  useEffect(() => {
    if (selectedVideoModelId) {
      const runtimeId = getRuntimeId(selectedVideoModelId);
      if (runtimeId !== activeVideoModelId) {
        setActiveVideoModelId(runtimeId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persistir la selección actual + draft de params ──
  // Read-modify-write: preserva `mode` (storyboard) y otras keys.
  // Sobrevive F5, cerrar pestaña, perder internet, cambiar de tab.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STUDIO_SELECTION_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STUDIO_SELECTION_KEY, JSON.stringify({
        ...prev,
        activeTab,
        selectedVideoModelId,
        selectedImageModelId,
        selectedTtsModelId,
        wanLoras: wanParams.loraItems,
        ltx25Loras: ltx25Params.loraItems,
        videoLoras: videoParams.loraItems,
        params: {
          video: pickPersistable(videoParams, VIDEO_PERSIST_KEYS),
          wan: pickPersistable(wanParams, WAN_PERSIST_KEYS),
          ltx25: pickPersistable(ltx25Params, LTX25_PERSIST_KEYS),
          krea: pickPersistable(kreaParams, KREA_PERSIST_KEYS),
          flux: pickPersistable(fluxParams, FLUX_PERSIST_KEYS),
          qwen: pickPersistable(qwenParams, QWEN_PERSIST_KEYS),
          tts: pickPersistable(ttsParams, TTS_PERSIST_KEYS),
        },
      }));
    } catch {
      // noop (localStorage puede fallar en modo privado)
    }
  }, [
    activeTab,
    selectedVideoModelId,
    selectedImageModelId,
    selectedTtsModelId,
    wanParams,
    ltx25Params,
    videoParams,
    kreaParams,
    fluxParams,
    qwenParams,
    ttsParams,
  ]);

  // ── AUTO-SELECT POR BOOT (Fase 2 extendida) ──
  // Se dispara en cuanto se detecta un notebook arrancando (INSTALLING o
  // CONNECTING) aunque todavía no esté online. Cambia el tab + el modelo
  // seleccionado según el `model_type` que el notebook reportó a Supabase.
  useEffect(() => {
    if (!stationBootingIds || stationBootingIds.length === 0) return;

    // Elegir el runtimeId que arranca: si hay varios, tomamos el primero
    // (el más probable es que sea uno solo a la vez).
    const targetRuntimeId = stationBootingIds.find(id => !bootAutoSelectedRef.current.has(id));
    if (!targetRuntimeId) return;

    const targetCap = stationModelTypeMap[targetRuntimeId];
    if (!targetCap) return;

    // Buscar el primer model de esa capability que use ese runtimeId
    const model = MODELS_BY_CAPABILITY[targetCap].find(
      m => m.runtimeId === targetRuntimeId && !m.comingSoon
    );
    if (!model) return;

    // Cambiar tab y seleccionar el modelo
    if (activeTab !== targetCap) {
      setActiveTab(targetCap);
      setCapability(targetCap);
    }

    if (targetCap === 'video') {
      setSelectedVideoModelId(model.id);
      setActiveVideoModelId(model.runtimeId);
      if (model.id === 'wan-i2v') setWanParams(prev => ({ ...prev, mode: 'i2v' }));
      else if (model.id === 'wan-t2v') setWanParams(prev => ({ ...prev, mode: 't2v' }));
    } else if (targetCap === 'image') {
      setSelectedImageModelId(model.id);
      if (setActiveImageModelId) setActiveImageModelId(model.id);
    } else if (targetCap === 'audio') {
      setSelectedTtsModelId(model.id);
      setTtsParams(prev => ({
        ...prev,
        voiceMode: model.id === 'omnivoice' ? 'VD' : 'A',
        language: model.id === 'omnivoice' ? 'Auto' : 'Spanish',
        steps: model.id === 'omnivoice' ? 32 : 25,
      }));
    }

    bootAutoSelectedRef.current.add(targetRuntimeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationBootingIds, stationModelTypeMap]);

  // ── AUTO-SELECT ──
  // Reglas:
  //   1. Primera vez que vemos stationStatusMap con datos → auto-select si el
  //      modelo actual está offline.
  //   2. Aparece un modelo NUEVO online (pasó de offline a online) → auto-select
  //      si el actual está offline. En este caso, prefiere ESE modelo nuevo
  //      (no el primero de la lista) — así al arrancar Flux después de Krea
  //      el FCM salta a Flux, no a Krea.
  //   3. Resto del tiempo → no forzamos, el usuario navega libremente.
  useEffect(() => {
    if (!stationStatusMap || Object.keys(stationStatusMap).length === 0) return;

    // Snapshot de los IDs online actuales
    const onlineIds = new Set<string>(
      Object.entries(stationStatusMap)
        .filter(([, s]) => s === 'online')
        .map(([id]) => id)
    );
    const prevOnlineIds = lastOnlineIdsRef.current;
    const newOnlineIds = [...onlineIds].filter((id) => !prevOnlineIds.has(id));
    const hasNewOnline = newOnlineIds.length > 0;
    const isFirstPoll = !hasAutoSelectedRef.current;
    lastOnlineIdsRef.current = onlineIds;

    // ¿El modelo actualmente seleccionado está online?
    let currentModelUiId: string | null = null;
    if (activeTab === 'image') currentModelUiId = selectedImageModelId || activeImageModelId;
    else if (activeTab === 'video') currentModelUiId = selectedVideoModelId;
    else if (activeTab === 'audio') currentModelUiId = selectedTtsModelId;

    const currentIsOnline = currentModelUiId
      ? stationStatusMap[getRuntimeId(currentModelUiId)] === 'online'
      : false;

    // Si el modelo actual está ARRANCANDO (INSTALLING/CONNECTING), el
    // auto-select por boot ya se encargó de seleccionarlo. No lo pisamos.
    const currentRuntimeIdForBoot = currentModelUiId ? getRuntimeId(currentModelUiId) : null;
    const isCurrentBooting = currentRuntimeIdForBoot
      ? stationBootingIds.includes(currentRuntimeIdForBoot)
      : false;
    if (isCurrentBooting) return;

    // ¿Debemos auto-seleccionar?
    const shouldAutoSelect =
      (isFirstPoll && !currentIsOnline) ||
      (hasNewOnline && !currentIsOnline);

    if (!shouldAutoSelect) return;

    // ── Elegir modelo target ──
    // Prioridad:
    //   1. Si hay modelos NUEVOS online → preferir ese (el que acaba de arrancar).
    //   2. Si no → el primero online dentro del tab actual.
    //   3. Si no → el primero online de la capability con prioridad (video > image > audio).
    let targetCap: 'video' | 'image' | 'audio' | null = null;
    let targetModel: { id: string; runtimeId: string } | null = null;

    if (hasNewOnline) {
      for (const runtimeId of newOnlineIds) {
        for (const cap of ['video', 'image', 'audio'] as const) {
          const model = MODELS_BY_CAPABILITY[cap].find(
            m => m.runtimeId === runtimeId && !m.comingSoon
          );
          if (model) {
            targetCap = cap;
            targetModel = { id: model.id, runtimeId: model.runtimeId };
            break;
          }
        }
        if (targetModel) break;
      }
    }

    if (!targetModel) {
      const currentTabHasOnline = MODELS_BY_CAPABILITY[activeTab].some(
        m => stationStatusMap[m.runtimeId] === 'online',
      );
      const cap = currentTabHasOnline ? activeTab : getOnlineCapability(stationStatusMap);
      if (!cap) return;
      const firstOnline = getFirstOnlineModel(cap, stationStatusMap);
      if (!firstOnline) return;
      targetCap = cap;
      targetModel = { id: firstOnline.id, runtimeId: firstOnline.runtimeId };
    }

    if (!targetCap || !targetModel) return;

    // Solo cambiamos de tab si hace falta
    if (targetCap !== activeTab) {
      setActiveTab(targetCap);
      setCapability(targetCap);
    }

    if (targetCap === 'video') {
      setSelectedVideoModelId(targetModel.id);
      setActiveVideoModelId(targetModel.runtimeId);
      if (targetModel.id === 'wan-i2v') setWanParams(prev => ({ ...prev, mode: 'i2v' }));
      else if (targetModel.id === 'wan-t2v') setWanParams(prev => ({ ...prev, mode: 't2v' }));
    } else if (targetCap === 'image') {
      setSelectedImageModelId(targetModel.id);
      if (setActiveImageModelId) setActiveImageModelId(targetModel.id);
    } else if (targetCap === 'audio') {
      setSelectedTtsModelId(targetModel.id);
      setTtsParams(prev => ({
        ...prev,
        voiceMode: targetModel!.id === 'omnivoice' ? 'VD' : 'A',
        language: targetModel!.id === 'omnivoice' ? 'Auto' : 'Spanish',
        steps: targetModel!.id === 'omnivoice' ? 32 : 25,
      }));
    }

    hasAutoSelectedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationStatusMap, stationBootingIds, activeTab, selectedVideoModelId, selectedImageModelId, selectedTtsModelId, activeImageModelId]);

  // FASE 3: escuchar pathfinder-load-config — repoblar prompt, params y refs
  useEffect(() => {
    const handleContinueVideo = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        videoB64: string;
        aspectRatio?: string;
        resolution?: string;
      };
      if (!detail?.videoB64) return;

      // Activar modo storyboard con 1 escena en continue
      setStoryboardMode('storyboard');
      setStoryboardScenes([{
        id: `scene-${Date.now()}`,
        mode: 'continue',
        durationSec: 5,
        prompt: '',
        startImage: null,
        endImage: null,
        audioFile: null,
        matchAudioDur: false,
        inheritStartFromPrev: true,
      }]);
      (window as any).__pf_initial_video = detail.videoB64;

      if (detail.resolution) {
        setVideoParams(p => ({ ...p, resolution: detail.resolution! }));
      }
      if (detail.aspectRatio) {
        const map: Record<string,string> = {
          '16:9': '16:9 Landscape',
          '9:16': '9:16 Portrait',
          '1:1':  '1:1 Square',
          '4:3':  '4:3 Standard',
          '3:4':  '3:4 Portrait',
        };
        const label = detail.aspectRatio.replace('/', ':');
        if (map[label]) setVideoParams(p => ({ ...p, aspectRatio: map[label] }));
      }
    };
    window.addEventListener('pathfinder-continue-video', handleContinueVideo as EventListener);
    return () => {
      window.removeEventListener('pathfinder-continue-video', handleContinueVideo as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleLoadConfig = async (e: Event) => {
      const custom = e as CustomEvent<{
        prompt: string;
        modelId: string;
        modelLabel: string;
        aspectRatio: string;
        params: Record<string, unknown>;
        refUrls: string[];
        startImageUrl?: string | null;
        endImageUrl?: string | null;
        audioUrl?: string | null;
      }>;
      const detail = custom.detail;
      if (!detail) return;

      if (typeof detail.prompt === 'string') {
        setPrompt(detail.prompt);
      }

      const isFlux = detail.modelId.includes('flux');
      const isKrea = detail.modelId.includes('krea');
      const isVideo = detail.modelId.includes('ltx');
      const isWan = detail.modelId.includes('wan');

      if (isVideo) {
        setActiveTab('video');
        setSelectedVideoModelId(detail.modelId);
        // Fix: también sincronizar el modelo activo en el contexto.
        // Sin esto, si el runtimeId del backend no coincide con el
        // selectedVideoModelId, useRuntime puede quedar apuntando al túnel
        // del modelo equivocado (bug observado al alternar entre devices).
        setActiveVideoModelId(getRuntimeId(detail.modelId));
      } else if (isWan) {
        setActiveTab('video');
        setSelectedVideoModelId(detail.modelId);
        setActiveVideoModelId(getRuntimeId(detail.modelId));
      } else if (isFlux || isKrea) {
        setActiveTab('image');
        setSelectedImageModelId(detail.modelId);
        if (setActiveImageModelId) setActiveImageModelId(detail.modelId);
      }

      const p = detail.params || {};
      const num = (v: unknown, fallback: number): number => {
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
      };
      const str = (v: unknown, fallback: string): string => {
        return typeof v === 'string' && v.length > 0 ? v : fallback;
      };
      const bool = (v: unknown, fallback: boolean): boolean => {
        return typeof v === 'boolean' ? v : fallback;
      };

      const cssRatio = detail.aspectRatio || "1/1";
      const [rwStr, rhStr] = cssRatio.split('/');
      const rw = parseInt(rwStr, 10);
      const rh = parseInt(rhStr, 10);

      const findAspect = (opts: string[]): string => {
        for (const opt of opts) {
          const m = opt.match(/(\d+):(\d+)/);
          if (m && parseInt(m[1], 10) === rw && parseInt(m[2], 10) === rh) {
            return opt;
          }
        }
        return opts[0];
      };

      if (isFlux) {
        const aspectOpt = findAspect(FLUX_ASPECT_RATIOS);
        const resOpt = str(p.resolution, fluxParams.resolution);
        setFluxParams(prev => ({
          ...prev,
          negativePrompt: str(p.negativePrompt, ''),
          steps: num(p.steps, prev.steps),
          resolution: resOpt,
          aspectRatio: aspectOpt,
          seed: num(p.seed, prev.seed),
          numImages: num(p.numImages, prev.numImages),
          refModeLabel: str(p.refModeLabel, prev.refModeLabel),
          modelModeLabel: str(p.modelModeLabel, prev.modelModeLabel),
          fluxGuideScale: num(p.fluxGuideScale, prev.fluxGuideScale),
          embeddedGuidance: num(p.embeddedGuidance, prev.embeddedGuidance),
        }));
      } else if (isKrea) {
        const aspectOpt = findAspect(KREA_ASPECT_RATIOS);
        const resOpt = str(p.resolution, kreaParams.resolution);
        setKreaParams(prev => ({
          ...prev,
          negativePrompt: str(p.negativePrompt, ''),
          steps: num(p.steps, prev.steps),
          resolution: resOpt,
          aspectRatio: aspectOpt,
          seed: num(p.seed, prev.seed),
          numImages: num(p.numImages, prev.numImages),
          stylePreset: str(p.stylePreset, prev.stylePreset),
        }));
      } else if (isWan) {
        const aspectOpt = findAspect(WAN_ASPECTS);
        setWanParams(prev => ({
          ...prev,
          duration: str(p.duration, prev.duration),
          resolution: str(p.resolution, prev.resolution),
          aspectRatio: aspectOpt,
          steps: num(p.steps, prev.steps),
          guideScale: num(p.guideScale, prev.guideScale),
          shift: num(p.shift, prev.shift),
          sampler: str(p.sampler, prev.sampler),
          seed: num(p.seed, prev.seed),
        }));
      } else if (isVideo) {
        const aspectOpt = findAspect(VIDEO_ASPECT_RATIOS);
        setVideoParams(prev => ({
          ...prev,
          duration: str(p.duration, prev.duration),
          resolution: str(p.resolution, prev.resolution),
          aspectRatio: aspectOpt,
          guideScale: num(p.guideScale, prev.guideScale),
          seed: num(p.seed, prev.seed),
          matchAudioDur: bool(p.matchAudioDur, prev.matchAudioDur),
        }));
      }

      // ── Restaurar LoRAs cuando el usuario hace Variación ──
      // El `params.extraLoras` viene del history_entry (estado local o backend).
      // El `params.loraMults` es un string separado por espacios con un mult
      // por LoRA, en el mismo orden que extraLoras.
      const extraLorasArr: string[] = Array.isArray(p.extraLoras)
        ? (p.extraLoras as string[]).filter((x): x is string => typeof x === 'string' && x.length > 0)
        : [];
      const loraMultsStr: string = typeof p.loraMults === 'string' ? p.loraMults : '';
      const loraMultsArr: string[] = loraMultsStr.split(/\s+/).filter(Boolean);

      void 0;

      if (isWan && extraLorasArr.length > 0) {
        setWanParams(prev => ({
          ...prev,
          loraItems: extraLorasArr.map((name, i) => ({
            name,
            mult: loraMultsArr[i] || '1.0',
            enabled: true,
          })),
        }));
        void 0;
      } else if (detail.modelId === 'ltx-2.3' && extraLorasArr.length > 0) {
        setVideoParams(prev => ({
          ...prev,
          loraItems: extraLorasArr.map((name, i) => ({
            name,
            mult: loraMultsArr[i] || '1.0',
            enabled: true,
          })),
        }));
      } else if (detail.modelId === 'ltx-2.5-msr' && extraLorasArr.length > 0) {
        // Para LTX 2.5 MSR, siempre reconstruimos la lista completa.
        // Si la extraLoras vacía ya la maneja el default (Product Commercial).
        setLtx25Params(prev => ({
          ...prev,
          loraItems: extraLorasArr.map((name, i) => ({
            name,
            mult: loraMultsArr[i] || '1.0',
            enabled: true,
          })),
        }));
      }

      // ── Reponer archivos de referencia al hacer Variación ──
      // Descarga cada URL del tunel y la convierte en File local.
      // Cubre LTX MSR (ref1..ref5), Flux (refFiles), Qwen (refFiles),
      // TTS (audioGuide/audioGuide2) y LTX 2.3 / Wan (start/end/audio).
      const _downloadAsFile = async (url: string, fallbackName: string): Promise<File | null> => {
        try {
          const ctrl = new AbortController();
          const killer = setTimeout(() => ctrl.abort(), 15000);
          const res = await fetch(url, { signal: ctrl.signal });
          clearTimeout(killer);
          if (!res.ok) return null;
          const blob = await res.blob();
          const ext = (blob.type.split('/')[1] || 'bin').split(';')[0];
          return new File([blob], `${fallbackName}.${ext}`, { type: blob.type || 'application/octet-stream' });
        } catch { return null; }
      };

      // 1) refUrls -> depende del modelo (LTX MSR, Flux, Qwen, TTS)
      if (Array.isArray(detail.refUrls) && detail.refUrls.length > 0) {
        try {
          const urls = detail.refUrls.slice(0, 5);
          const files: File[] = [];
          for (let i = 0; i < urls.length; i++) {
            const f = await _downloadAsFile(urls[i], `ref_${i + 1}`);
            if (f) files.push(f);
          }

          if (detail.modelId === 'ltx-2.3-msr' || detail.modelId === 'ltx-2.5-msr') {
            setLtx25Params(prev => ({
              ...prev,
              ref1: files[0] ?? prev.ref1,
              ref2: files[1] ?? prev.ref2,
              ref3: files[2] ?? prev.ref3,
              ref4: files[3] ?? prev.ref4,
              ref5: files[4] ?? prev.ref5,
            }));
          } else if (isFlux && files.length > 0) {
            handleFluxRefFilesChange(files);
          } else if (detail.modelId === 'qwen-image-2.1' && files.length > 0) {
            setQwenParams(prev => ({ ...prev, refFiles: files }));
          } else if (detail.modelId === 'tts-dual' && files.length > 0) {
            setTtsParams(prev => ({
              ...prev,
              audioGuide: files[0] ?? prev.audioGuide,
              audioGuide2: files[1] ?? prev.audioGuide2,
            }));
          }
        } catch (err) {
          void 0;
        }
      }

      // 2) startImageUrl / endImageUrl / audioUrl -> LTX 2.3 y Wan
      if (detail.modelId === 'ltx-2.3') {
        const [s, e, a] = await Promise.all([
          detail.startImageUrl ? _downloadAsFile(detail.startImageUrl, 'start') : Promise.resolve(null),
          detail.endImageUrl   ? _downloadAsFile(detail.endImageUrl,   'end')   : Promise.resolve(null),
          detail.audioUrl      ? _downloadAsFile(detail.audioUrl,      'audio') : Promise.resolve(null),
        ]);
        setVideoParams(prev => ({
          ...prev,
          imageStartFile: s ?? prev.imageStartFile,
          imageEndFile:   e ?? prev.imageEndFile,
          audioFile:      a ?? prev.audioFile,
        }));
      } else if (detail.modelId === 'wan-dual' || detail.modelId.startsWith('wan-')) {
        const [s, e] = await Promise.all([
          detail.startImageUrl ? _downloadAsFile(detail.startImageUrl, 'start') : Promise.resolve(null),
          detail.endImageUrl   ? _downloadAsFile(detail.endImageUrl,   'end')   : Promise.resolve(null),
        ]);
        setWanParams(prev => ({
          ...prev,
          imageStartFile: s ?? prev.imageStartFile,
          imageEndFile:   e ?? prev.imageEndFile,
        }));
      }
    };

    window.addEventListener('pathfinder-load-config', handleLoadConfig as EventListener);
    return () => window.removeEventListener('pathfinder-load-config', handleLoadConfig as EventListener);
  }, [fluxParams.resolution, kreaParams.resolution, setActiveImageModelId]);

  const handleVideoFileChange = (type: 'start' | 'end' | 'audio', file: File | null) => {
    setVideoParams(prev => ({ ...prev, [type === 'start' ? 'imageStartFile' : type === 'end' ? 'imageEndFile' : 'audioFile']: file }));
  };

  const handleWanFileChange = (type: 'start' | 'end', file: File | null) => {
    setWanParams(prev => ({ ...prev, [type === 'start' ? 'imageStartFile' : 'imageEndFile']: file }));
  };

  const handleLtx25RefChange = (idx: 1 | 2 | 3 | 4 | 5, file: File | null) => {
    setLtx25Params(prev => {
      const next = { ...prev };
      if (idx === 1) next.ref1 = file;
      if (idx === 2) next.ref2 = file;
      if (idx === 3) next.ref3 = file;
      if (idx === 4) next.ref4 = file;
      if (idx === 5) next.ref5 = file;
      return next;
    });
  };

  const renderLtx25RefChip = (idx: 1 | 2 | 3 | 4 | 5, label: string, file: File | null) => (
    <>
      {!file && (
        <label style={{ position: 'relative', cursor: 'pointer' }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleLtx25RefChange(idx, e.target.files?.[0] || null)}
            style={{ display: 'none' }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 10px',
            background: 'var(--pf-bg-secondary)',
            border: '1px dashed var(--pf-border-default)',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'var(--pf-font-ui)',
            color: 'var(--pf-text-secondary)',
          }}>
            <span>+ {label}</span>
          </div>
        </label>
      )}
      {file && renderFileThumbnail(file, `ltx25-ref${idx}`)}
    </>
  );

  const handleFluxRefFilesChange = (files: File[]) => {
    const validFiles = Array.from(files).filter(f => f instanceof File);
    if (validFiles.length === 0) {
      setFluxParams(prev => ({ ...prev, refFiles: [] }));
      return;
    }
    if (validFiles.length > 4) {
      alert("Máximo 4 imágenes de referencia permitidas.");
    }
    const slicedFiles = validFiles.slice(0, 4);
    setFluxParams(prev => {
      const newMode = slicedFiles.length > 0 && !prev.refModeLabel.includes('(I)') 
        ? 'Sujeto/Escenario + Personas u Objetos (KI)' 
        : prev.refModeLabel;
      return { ...prev, refFiles: slicedFiles, refModeLabel: newMode };
    });
  };

  const handleQwenRefFilesChange = (files: File[]) => {
    const validFiles = Array.from(files).filter(f => f instanceof File);
    if (validFiles.length > 10) {
      alert("Máximo 10 imágenes de referencia permitidas.");
    }
    setQwenParams(prev => ({ ...prev, refFiles: validFiles.slice(0, 10) }));
  };

  const handleQwenEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (qwenEditImageUrl) URL.revokeObjectURL(qwenEditImageUrl);
    setQwenEditImageUrl(URL.createObjectURL(file));
    setQwenParams(prev => ({ ...prev, editImageFile: file, editMaskFile: null }));
    e.target.value = '';
  };

  const handleQwenClearEditImage = () => {
    if (qwenEditImageUrl) URL.revokeObjectURL(qwenEditImageUrl);
    setQwenEditImageUrl(null);
    setQwenParams(prev => ({ ...prev, editImageFile: null, editMaskFile: null }));
  };

  // Dibuja la imagen en el canvas cuando ambos están listos (mount + url).
  useEffect(() => {
    if (qwenParams.task !== 'Inpaint' || !qwenEditImageUrl) return;
    const imgCanvas = qwenImageCanvasRef.current;
    const maskCanvas = qwenMaskCanvasRef.current;
    if (!imgCanvas) return;
    const img = new Image();
    img.onload = () => {
      imgCanvas.width = img.width;
      imgCanvas.height = img.height;
      const ctx = imgCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
      }
      if (maskCanvas) {
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        const mctx = maskCanvas.getContext('2d');
        if (mctx) mctx.clearRect(0, 0, img.width, img.height);
      }
    };
    img.src = qwenEditImageUrl;
  }, [qwenEditImageUrl, qwenParams.task]);

  const handleQwenClearMask = () => {
    const maskCanvas = qwenMaskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    setQwenParams(prev => ({ ...prev, editMaskFile: null }));
  };

  const qwenDrawAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = qwenMaskCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleQwenCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    qwenPaintingRef.current = true;
    qwenDrawAt(e);
  };
  const handleQwenCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (qwenPaintingRef.current) qwenDrawAt(e);
  };
  const handleQwenCanvasMouseUp = () => {
    if (!qwenPaintingRef.current) return;
    qwenPaintingRef.current = false;
    const canvas = qwenMaskCanvasRef.current;
    if (!canvas) return;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    const src = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
    if (!src) return;
    const dst = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    for (let i = 0; i < src.data.length; i += 4) {
      if (src.data[i + 3] > 30) {
        dst.data[i] = 255;
        dst.data[i + 1] = 255;
        dst.data[i + 2] = 255;
        dst.data[i + 3] = 255;
      }
    }
    maskCtx.putImageData(dst, 0, 0);
    maskCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'mask.png', { type: 'image/png' });
        setQwenParams(prev => ({ ...prev, editMaskFile: file }));
      }
    }, 'image/png');
  };

  const handleApplyTrim = (which: 'audioGuide' | 'audioGuide2', trimmedFile: File, _startSec: number, _endSec: number) => {
    setTtsParams(prev => ({ ...prev, [which]: trimmedFile }));
    setExpandedAudio(null);
  };

  const handleAddLora = async () => {
    const url = newLoraUrl.trim();
    if (!url) return;
    setLoraAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { alert('Sesión no válida'); return; }
      const client = await getClient();
      if (!client) { alert('Sin conexión al runtime'); return; }
      const result = await client.predict('/add_lora_url', [url, wanParams.mode, token]);
      const status = Array.isArray(result.data) ? result.data[0] : result.data;
      const isSuccess = typeof status === 'string' && (
        status.startsWith('✅') || status.startsWith('Descargado:')
      );
      if (isSuccess) {
        const name = status
          .replace(/^✅\s*Descargado:\s*/i, '')
          .replace(/^Descargado:\s*/i, '')
          .trim();
        setWanParams(prev => ({
          ...prev,
          loraItems: [...prev.loraItems, { name, mult: '1.0', enabled: true }],
        }));
        setNewLoraUrl('');
      } else {
        alert(status || 'Error al descargar la LoRA');
      }
    } catch (err) {
      void 0;
      alert('Error de conexión al agregar la LoRA.');
    } finally {
      setLoraAdding(false);
    }
  };

  const removeLoraItem = (idx: number) => {
    setWanParams(prev => ({
      ...prev,
      loraItems: prev.loraItems.filter((_, i) => i !== idx),
    }));
  };

  const updateLoraMult = (idx: number, mult: string) => {
    setWanParams(prev => ({
      ...prev,
      loraItems: prev.loraItems.map((it, i) => i === idx ? { ...it, mult } : it),
    }));
  };

  const toggleLoraEnabledWan = (idx: number) => {
    setWanParams(prev => ({
      ...prev,
      loraItems: prev.loraItems.map((it, i) => i === idx ? { ...it, enabled: !it.enabled } : it),
    }));
  };

  // ── LoRA handlers para LTX 2.3 ──
  const handleAddLoraLtx23 = async () => {
    const url = newLoraUrl.trim();
    if (!url) return;
    setLoraAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { alert('Sesión no válida'); return; }
      const client = await getClient();
      if (!client) { alert('Sin conexión al runtime'); return; }
      const result = await client.predict('/add_lora_url', [url, token]);
      const status = Array.isArray(result.data) ? result.data[0] : result.data;
      const isSuccess = typeof status === 'string' && (
        status.startsWith('✅') || status.startsWith('Descargado:')
      );
      if (isSuccess) {
        const name = status
          .replace(/^✅\s*Descargado:\s*/i, '')
          .replace(/^Descargado:\s*/i, '')
          .trim();
        setVideoParams(prev => ({
          ...prev,
          loraItems: [...prev.loraItems, { name, mult: '1.0', enabled: true }],
        }));
        setNewLoraUrl('');
      } else {
        alert(status || 'Error al descargar la LoRA');
      }
    } catch (err) {
      void 0;
      alert('Error de conexión al agregar la LoRA.');
    } finally {
      setLoraAdding(false);
    }
  };

  const removeLoraItemLtx23 = (idx: number) => {
    setVideoParams(prev => ({
      ...prev,
      loraItems: prev.loraItems.filter((_, i) => i !== idx),
    }));
  };

  const updateLoraMultLtx23 = (idx: number, mult: string) => {
    setVideoParams(prev => ({
      ...prev,
      loraItems: prev.loraItems.map((it, i) => i === idx ? { ...it, mult } : it),
    }));
  };

  const toggleLoraEnabledLtx23 = (idx: number) => {
    setVideoParams(prev => ({
      ...prev,
      loraItems: prev.loraItems.map((it, i) => i === idx ? { ...it, enabled: !it.enabled } : it),
    }));
  };

  // ── LoRA handlers para LTX 2.5 MSR ──
  const handleAddLoraLtx25 = async () => {
    const url = newLoraUrl.trim();
    if (!url) return;
    setLoraAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { alert('Sesión no válida'); return; }
      const client = await getClient();
      if (!client) { alert('Sin conexión al runtime'); return; }
      const result = await client.predict('/add_lora_url', [url, token]);
      const status = Array.isArray(result.data) ? result.data[0] : result.data;
      const isSuccess = typeof status === 'string' && (
        status.startsWith('✅') || status.startsWith('Descargado:')
      );
      if (isSuccess) {
        const name = status
          .replace(/^✅\s*Descargado:\s*/i, '')
          .replace(/^Descargado:\s*/i, '')
          .trim();
        setLtx25Params(prev => ({
          ...prev,
          loraItems: [...prev.loraItems, { name, mult: '1.0', enabled: true }],
        }));
        setNewLoraUrl('');
      } else {
        alert(status || 'Error al descargar la LoRA');
      }
    } catch (err) {
      void 0;
      alert('Error de conexión al agregar la LoRA.');
    } finally {
      setLoraAdding(false);
    }
  };

  const removeLoraItemLtx25 = (idx: number) => {
    if (idx === 0) return;
    setLtx25Params(prev => ({
      ...prev,
      loraItems: prev.loraItems.filter((_, i) => i !== idx),
    }));
  };

  const updateLoraMultLtx25 = (idx: number, mult: string) => {
    setLtx25Params(prev => ({
      ...prev,
      loraItems: prev.loraItems.map((it, i) => i === idx ? { ...it, mult } : it),
    }));
  };

  const toggleLoraEnabledLtx25 = (idx: number) => {
    setLtx25Params(prev => ({
      ...prev,
      loraItems: prev.loraItems.map((it, i) => i === idx ? { ...it, enabled: !it.enabled } : it),
    }));
  };

  const handleModelChange = (modelId: string, isComingSoon: boolean) => {
    if (isComingSoon) return;
    if (activeTab === 'image') {
      setSelectedImageModelId(modelId);
      if (setActiveImageModelId) setActiveImageModelId(modelId);
    } else if (activeTab === 'video') {
      setSelectedVideoModelId(modelId);
      // Mapear al runtimeId real vía config centralizado
      setActiveVideoModelId(getRuntimeId(modelId));
      // Ajustar modo de Wan según el modelo elegido
      if (modelId === 'wan-i2v') {
        setWanParams(prev => ({ ...prev, mode: 'i2v' }));
      } else if (modelId === 'wan-t2v') {
        setWanParams(prev => ({ ...prev, mode: 't2v' }));
      }
    } else if (activeTab === 'audio') {
      setSelectedTtsModelId(modelId);
      setTtsParams(prev => ({
        ...prev,
        voiceMode: modelId === 'omnivoice' ? 'VD' : 'A',
        language: modelId === 'omnivoice' ? 'Auto' : 'Spanish',
        steps: modelId === 'omnivoice' ? 32 : 25,
      }));
    }
  };

  const handleGenerateClick = useCallback(async () => {
    // Mostrar callout de primera generación si aplica (una vez por sesión de runtime)
    if (stationId && !localStorage.getItem(`pf_first_gen_callout_seen_${stationId}`)) {
      setFirstGenCalloutVisible(true);
    }
    if (!prompt.trim()) return;

    const ratioLabel =
      activeTab === 'video'
        ? (isVideoWan ? wanParams.aspectRatio : videoParams.aspectRatio)
        : activeTab === 'image'
          ? (isFluxActive ? fluxParams.aspectRatio : kreaParams.aspectRatio)
          : '1:1';
    
    const ratioToken = ratioLabel.split(' ')[0];
    const [ratioWRaw, ratioHRaw] = ratioToken.split(':');
    const ratioW = parseFloat(ratioWRaw);
    const ratioH = parseFloat(ratioHRaw);
    const aspectRatioCss = ratioW && ratioH ? `${ratioW}/${ratioH}` : '1/1';
    
    const modelLabel =
      activeTab === 'video'
        ? (STATIC_VIDEO_MODELS.find(m => m.id === selectedVideoModelId)?.name || 'Video')
        : activeTab === 'image'
          ? (STATIC_IMAGE_MODELS.find(m => m.id === selectedImageModelId)?.name || 'Imagen')
          : 'Audio';

    window.dispatchEvent(new CustomEvent('pathfinder-generation-meta', {
      detail: { prompt, mediaType: activeTab, aspectRatioCss, modelLabel }
    }));

    try {
      if (activeTab === 'video') {
        if (isVideoLtx) {
          if (storyboardMode === 'storyboard') {
            // Storyboard multi-escena.
            // Cada imagen/audio viaja dentro del JSON como data URI base64.
            // El notebook la decodifica con _resolve_image()/_resolve_audio_path().
            if (!storyboardValid) return;

            const scenesPayload = await Promise.all(
              storyboardScenes.map(async (s) => {
                let startB64: string | null = null;
                let endB64: string | null = null;
                let audioB64: string | null = null;
                try {
                  if (s.startImage) startB64 = await fileToDataUri(s.startImage);
                } catch (err) {
                  console.warn('[storyboard] start_image a base64 fallo:', err);
                }
                try {
                  if (s.endImage) endB64 = await fileToDataUri(s.endImage);
                } catch (err) {
                  console.warn('[storyboard] end_image a base64 fallo:', err);
                }
                try {
                  if (s.audioFile) audioB64 = await fileToDataUri(s.audioFile);
                } catch (err) {
                  console.warn('[storyboard] audio a base64 fallo:', err);
                }
                return {
                  mode: s.mode,
                  prompt: s.prompt,
                  duration_sec: s.durationSec,
                  inherit_start: s.mode === 'continue' ? true : (s.mode === 'cut' ? s.inheritStartFromPrev : false),
                  match_audio_dur: !!s.matchAudioDur,
                  start_image: startB64,
                  end_image: endB64,
                  audio_path: audioB64,
                  extra_loras: [],
                  lora_mults: '',
                };
              })
            );

            await handleGenerateStoryboard({
              global: {
                resolution_label: videoParams.resolution,
                aspect_label: videoParams.aspectRatio,
                guide_scale: videoParams.guideScale,
                seed: videoParams.seed,
                extra_loras: videoParams.loraItems.filter(x => x.enabled).map(x => x.name),
                lora_mults: videoParams.loraItems.filter(x => x.enabled).map(x => x.mult || '1.0').join(' '),
                initial_video: (window as any).__pf_initial_video ?? null,
              },
              scenes: scenesPayload,
            });
            return;
          }
          await handleGenerate({
            prompt,
            videoModelId: 'ltx-2.3',
            ...videoParams,
            extraLoras: videoParams.loraItems.filter(x => x.enabled).map(x => x.name),
            loraMults: videoParams.loraItems.filter(x => x.enabled).map(x => x.mult || '1.0').join(' '),
          });
        } else if (isVideoLtx25Msr) {
          // LTX 2.5 MSR o LTX 2.3 MSR (comparten UI, distinto runtimeId)
          await handleGenerate({
            prompt,
            videoModelId: selectedVideoModelId,
            msrMode: ltx25Params.mode,
            removeBg: ltx25Params.removeBg,
            msrRef1: ltx25Params.ref1,
            msrRef2: ltx25Params.ref2,
            msrRef3: ltx25Params.ref3,
            msrRef4: ltx25Params.ref4,
            msrRef5: ltx25Params.ref5,
            durationLabel: ltx25Params.duration,
            resolution: ltx25Params.resolution,
            aspectRatio: ltx25Params.aspectRatio,
            pipeline: ltx25Params.pipeline,
            audioCfg: ltx25Params.audioCfg,
            steps: ltx25Params.steps,
            seed: ltx25Params.seed,
            negativePrompt: '',
            extraLoras: ltx25Params.loraItems.filter(x => x.enabled).map(x => x.name),
            loraMults: ltx25Params.loraItems.filter(x => x.enabled).map(x => x.mult).join(' '),
          });
        } else {
          // Wan 2.1 I2V o T2V
          await handleGenerate({
            prompt,
            videoModelId: selectedVideoModelId,
            wanMode: wanParams.mode,
            imageStartFile: wanParams.imageStartFile,
            imageEndFile: wanParams.imageEndFile,
            durationLabel: wanParams.duration,
            resolution: wanParams.resolution,
            aspectRatio: wanParams.aspectRatio,
            steps: wanParams.steps,
            guideScale: wanParams.guideScale,
            wanShift: wanParams.shift,
            wanSampler: wanParams.sampler,
            wanForcePreset: wanParams.forcePreset,
            seed: wanParams.seed,
            negativePrompt: '',
            extraLoras: wanParams.loraItems.filter(x => x.enabled).map(x => x.name),
            loraMults: wanParams.loraItems.filter(x => x.enabled).map(x => x.mult).join(' '),
          });
        }
      } else if (activeTab === 'image') {
        if (isQwenActive) {
          await handleGenerate({
            prompt,
            negativePrompt: qwenParams.negativePrompt,
            resolution: qwenParams.resolution,
            aspectRatio: qwenParams.aspectRatio,
            seed: qwenParams.seed,
            numImages: qwenParams.numImages,
            qwenTask: qwenParams.task,
            qwenMode: qwenParams.mode,
            qwenStyle: qwenParams.stylePreset,
            qwenTransparent: qwenParams.transparent,
            qwenRefFiles: qwenParams.refFiles,
            qwenEditImage: qwenParams.editImageFile,
            qwenEditMask: qwenParams.editMaskFile,
            qwenStrength: qwenParams.strength,
          });
        } else if (isFluxActive) {
          await handleGenerate({ 
            prompt, 
            negativePrompt: fluxParams.negativePrompt,
            steps: fluxParams.steps,
            resolution: fluxParams.resolution,
            aspectRatio: fluxParams.aspectRatio,
            seed: fluxParams.seed,
            numImages: fluxParams.numImages,
            refFiles: fluxParams.refFiles,
            refModeLabel: fluxParams.refModeLabel,
            maskFile: null,
            modelModeLabel: fluxParams.modelModeLabel,
            fluxGuideScale: fluxParams.fluxGuideScale,
            embeddedGuidance: fluxParams.embeddedGuidance,
          });
        } else {
          await handleGenerate({ 
            prompt, 
            negativePrompt: kreaParams.negativePrompt,
            steps: kreaParams.steps,
            resolution: kreaParams.resolution,
            aspectRatio: kreaParams.aspectRatio,
            seed: kreaParams.seed,
            numImages: kreaParams.numImages,
            stylePreset: kreaParams.stylePreset,
          });
        }
      } else if (activeTab === 'audio') {
        const voiceModeMap: Record<string, string> = {
          'Auto Voice (sin referencia)': '',
          'Voice Design (solo tags)': 'VD',
          'Voice Cloning (1 referencia)': 'A',
          'Two-Speaker (2 referencias)': 'AB',
          'Voice + Emotion (2 referencias)': 'AB',
        };
        const voiceModeLetter = voiceModeMap[ttsParams.voiceMode] ?? '';

        await handleGenerate({
          prompt,
          audioMode: selectedTtsModelId as 'omnivoice' | 'index_tts25',
          voiceMode: voiceModeLetter,
          voiceInstruction: ttsParams.voiceInstruction,
          emotionInstruction: ttsParams.emotionInstruction,
          audioGuide: ttsParams.audioGuide,
          audioGuide2: ttsParams.audioGuide2,
          language: (selectedTtsModelId === 'omnivoice'
            ? TTS_LANG_CODE_MAP_OMNI[ttsParams.language]
            : TTS_LANG_CODE_MAP_INDEX[ttsParams.language])
            || (selectedTtsModelId === 'omnivoice' ? 'auto' : 'ES'),
          durationLabel: ttsParams.duration,
          ttsSteps: ttsParams.steps,
          ttsGuidance: ttsParams.guideScale,
          speechSpeed: ttsParams.speechSpeed,
          ttsTemperature: ttsParams.temperature,
          ttsTopP: ttsParams.topP,
          ttsTopK: ttsParams.topK,
          textNormalization: ttsParams.textNormalization,
          seed: ttsParams.seed,
        });
      }
    } catch (error) {
      void 0;
    }
  }, [prompt, activeTab, isFluxActive, isQwenActive, isVideoLtx, isVideoLtx25Msr, isVideoWan, videoParams, wanParams, ltx25Params, fluxParams, qwenParams, kreaParams, ttsParams, selectedVideoModelId, selectedImageModelId, selectedTtsModelId, handleGenerate, handleGenerateStoryboard, storyboardMode, storyboardScenes, storyboardValid, getClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateClick();
    }
  };

  const renderFileThumbnail = (file: File, type: string) => {
    const url = getObjectUrl(file);
    const isAudio = type.includes('audio');
    
    return (
      <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
        {isAudio ? (
          <div style={{ width: '100%', height: '100%', background: 'var(--pf-border-default)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pf-text-muted)' }}>
            <Music size={16} />
          </div>
        ) : (
          <img
            src={url}
            alt={file.name}
            onClick={() => setLightboxFile(file)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '6px',
              border: '1px solid var(--pf-border-default)',
              cursor: 'zoom-in',
            }}
          />
        )}
        <button
          onClick={() => {
            if (type === 'video-start') handleVideoFileChange('start', null);
            if (type === 'video-end') handleVideoFileChange('end', null);
            if (type === 'video-audio') handleVideoFileChange('audio', null);
            if (type === 'wan-start') handleWanFileChange('start', null);
            if (type === 'wan-end') handleWanFileChange('end', null);
            if (type === 'ref') handleFluxRefFilesChange([]);
            if (type === 'tts-audio-1') setTtsParams(prev => ({ ...prev, audioGuide: null }));
            if (type === 'tts-audio-2') setTtsParams(prev => ({ ...prev, audioGuide2: null }));
            if (type === 'ltx25-ref1') setLtx25Params(prev => ({ ...prev, ref1: null }));
            if (type === 'ltx25-ref2') setLtx25Params(prev => ({ ...prev, ref2: null }));
            if (type === 'ltx25-ref3') setLtx25Params(prev => ({ ...prev, ref3: null }));
            if (type === 'ltx25-ref4') setLtx25Params(prev => ({ ...prev, ref4: null }));
            if (type === 'ltx25-ref5') setLtx25Params(prev => ({ ...prev, ref5: null }));
            if (typeof type === 'string' && type.startsWith('qwenref-')) {
              const idx = parseInt(type.replace('qwenref-', ''), 10);
              setQwenParams(prev => ({ ...prev, refFiles: prev.refFiles.filter((_, i) => i !== idx) }));
            }
          }}
          style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#EF4444', color: 'white', border: 'none',
            fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <X size={10} />
        </button>
      </div>
    );
  };

  const renderModelSelector = () => {
    const models = activeTab === 'image'
      ? STATIC_IMAGE_MODELS
      : activeTab === 'audio'
        ? STATIC_AUDIO_MODELS
        : STATIC_VIDEO_MODELS;
    const selectedId = activeTab === 'image'
      ? selectedImageModelId
      : activeTab === 'audio'
        ? selectedTtsModelId
        : selectedVideoModelId;

    const buildLabel = (model: { id: string; name: string; runtimeId: string; comingSoon?: boolean }) => {
      if (model.comingSoon) return `${model.name} (Soon)`;
      const catalogEntry = catalogModels.find(m => m.id === model.id);
      const isLocked = !!catalogEntry && !catalogEntry.is_free && !unlockedIds.has(catalogEntry.id);
      if (isLocked) return `${model.name} · Pro`;
      if (stationStatusMap[model.runtimeId] === 'online') return `${model.name} · On`;
      return model.name;
    };

    const options = models.map(buildLabel);
    const selectedModel = models.find(m => m.id === selectedId) || models[0];
    const selectedLabel = selectedModel ? buildLabel(selectedModel) : '';

    return (
      <DropdownButton
        options={options}
        value={selectedLabel}
        onChange={(label: string) => {
          const target = models.find(m => buildLabel(m) === label);
          if (target) handleModelChange(target.id, !!target.comingSoon);
        }}
      />
    );
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        className="pf-glass-panel"
        style={{
          background: 'var(--pf-bg-elevated)',
          backdropFilter: 'none',
          border: '1px solid var(--pf-border-default)',
          borderRadius: '18px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          display: 'flex', flexDirection: 'column', overflow: 'visible', transition: 'all 0.3s ease',
        }}
      >
        <div style={{ padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['video', 'image', 'audio'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCapability(tab);
                }}
                style={{
                  padding: '5px 12px', borderRadius: '8px', border: 'none',
                  background: activeTab === tab ? 'var(--pf-text-primary)' : 'transparent',
                  color: activeTab === tab ? 'var(--pf-bg-elevated)' : 'var(--pf-text-secondary)',
                  fontFamily: 'var(--pf-font-ui)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {tab === 'video' ? <Video size={14} /> : tab === 'image' ? <ImageIcon size={14} /> : <Music size={14} />}
                {tab === 'video' ? 'Video' : tab === 'image' ? 'Imagen' : 'Audio'}
              </button>
            ))}

            {activeTab === 'video' && isVideoLtx && (
              <div
                role="tablist"
                aria-label="Modo de generación"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px',
                  marginLeft: '4px',
                  borderRadius: '8px',
                  background: 'var(--pf-bg-tertiary)',
                  border: '1px solid var(--pf-border-subtle)',
                }}
              >
                {(['single', 'storyboard'] as const).map((m) => {
                  const active = storyboardMode === m;
                  return (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStoryboardMode(m)}
                      title={m === 'single' ? 'Una sola escena' : 'Storyboard multi-escena (próximamente)'}
                      style={{
                        padding: '3px 9px',
                        borderRadius: '6px',
                        border: 'none',
                        background: active ? 'var(--pf-bg-elevated)' : 'transparent',
                        color: active ? 'var(--pf-text-primary)' : 'var(--pf-text-muted)',
                        fontFamily: 'var(--pf-font-ui)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        letterSpacing: '-0.01em',
                        boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      {m === 'single' ? 'Single' : 'Storyboard'}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {renderModelSelector()}
        </div>

        {isCurrentModelLocked && !bannerDismissed && (
          <div
            style={{
              margin: '0 14px 0',
              marginTop: '6px',
              padding: '8px 12px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: '8px',
              fontSize: '11px',
              fontFamily: 'var(--pf-font-ui)',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#F59E0B',
              flexShrink: 0,
            }} />
            <span style={{ flex: 1 }}>
              Este modelo es exclusivo del plan Creator. Desbloquéalo para generar con él.{" "}
              <Link to="/pricing" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Ver planes →</Link>
            </span>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Cerrar aviso"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px',
                marginLeft: 'auto',
                cursor: 'pointer',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {isStationOffline && currentStationModelId && !bannerDismissed && !isCurrentModelLocked && (
          <div
            style={{
              margin: '0 14px 0',
              marginTop: '6px',
              padding: '8px 12px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: '8px',
              fontSize: '11px',
              fontFamily: 'var(--pf-font-ui)',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#F59E0B',
              flexShrink: 0,
            }} />
            <span style={{ flex: 1 }}>
              Tu estación está offline. <Link to="/station" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Descarga tu notebook</Link> y ejecútalo en Kaggle antes de generar.{" "}
              <Link to="/how-it-works" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Ver guía paso a paso →</Link>
            </span>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Cerrar aviso"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px',
                marginLeft: 'auto',
                cursor: 'pointer',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                flexShrink: 0,
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div style={{ padding: '12px 14px' }}>
          {/* Bloque de chips de upload para Video LTX (Single) */}
          {activeTab === 'video' && isVideoLtx && storyboardMode === 'single' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <label style={{ position: 'relative', cursor: 'pointer' }}>
                <input type="file" accept="image/*" onChange={(e) => handleVideoFileChange('start', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: videoParams.imageStartFile ? 'var(--pf-bg-tertiary)' : 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                  <span>{videoParams.imageStartFile ? 'Start Loaded' : '+ Start'}</span>
                </div>
              </label>
              {videoParams.imageStartFile && renderFileThumbnail(videoParams.imageStartFile, 'video-start')}
              
              <label style={{ position: 'relative', cursor: 'pointer' }}>
                <input type="file" accept="image/*" onChange={(e) => handleVideoFileChange('end', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: videoParams.imageEndFile ? 'var(--pf-bg-tertiary)' : 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                  <span>{videoParams.imageEndFile ? 'End Loaded' : '+ End'}</span>
                </div>
              </label>
              {videoParams.imageEndFile && renderFileThumbnail(videoParams.imageEndFile, 'video-end')}
              
              <label style={{ position: 'relative', cursor: 'pointer' }}>
                <input type="file" accept="audio/*" onChange={(e) => handleVideoFileChange('audio', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: videoParams.audioFile ? 'var(--pf-bg-tertiary)' : 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                  <span>{videoParams.audioFile ? 'Audio Loaded' : '+ Audio'}</span>
                </div>
              </label>
              {videoParams.audioFile && renderFileThumbnail(videoParams.audioFile, 'video-audio')}
            </div>
          )}

          {/* Film strip de Storyboard (multi-escena) */}
          {activeTab === 'video' && isVideoLtx && storyboardMode === 'storyboard' && (
            <StoryboardStrip
              prompt={prompt}
              onPromptChange={setPrompt}
              onScenesChange={setStoryboardScenes}
            />
          )}

          {/* Bloque de chips de upload para Wan */}
          {activeTab === 'video' && isVideoWan && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {wanParams.mode === 'i2v' && (
                <>
                  <label style={{ position: 'relative', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" onChange={(e) => handleWanFileChange('start', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: wanParams.imageStartFile ? 'var(--pf-bg-tertiary)' : 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                      <span>{wanParams.imageStartFile ? 'Start Loaded' : '+ Start (requerido)'}</span>
                    </div>
                  </label>
                  {wanParams.imageStartFile && renderFileThumbnail(wanParams.imageStartFile, 'wan-start')}
                  
                  <label style={{ position: 'relative', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" onChange={(e) => handleWanFileChange('end', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: wanParams.imageEndFile ? 'var(--pf-bg-tertiary)' : 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                      <span>{wanParams.imageEndFile ? 'End Loaded' : '+ End (opcional)'}</span>
                    </div>
                  </label>
                  {wanParams.imageEndFile && renderFileThumbnail(wanParams.imageEndFile, 'wan-end')}
                </>
              )}
            </div>
          )}

          {/* Chips de refs para LTX 2.5 MSR */}
          {activeTab === 'video' && isVideoLtx25Msr && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <DropdownButton
                options={LTX25_MODES.map(m => m.label)}
                value={LTX25_MODES.find(m => m.value === ltx25Params.mode)?.label || LTX25_MODES[0].label}
                onChange={(v: string) => {
                  const newMode = (LTX25_MODES.find(m => m.label === v)?.value || 'KI') as 'KI' | 'I';
                  setLtx25Params(prev => ({ ...prev, mode: newMode }));
                }}
                formatOption={(opt) => {
                  if (opt.startsWith('Background')) return 'BG + Subjects';
                  if (opt.startsWith('Up to 4 Subjects / Objects')) return 'Subjects only';
                  return opt;
                }}
              />
              <label style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontFamily: 'var(--pf-font-ui)',
                color: 'var(--pf-text-secondary)', cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={ltx25Params.removeBg}
                  onChange={(e) => setLtx25Params(prev => ({ ...prev, removeBg: e.target.checked }))}
                  style={{ marginRight: '2px' }}
                />
                Quitar fondo
              </label>
              {ltx25Params.mode === 'KI' ? (
                <>
                  {renderLtx25RefChip(1, 'Ref 1 (background)', ltx25Params.ref1)}
                  {renderLtx25RefChip(2, 'Ref 2 (subject 1)', ltx25Params.ref2)}
                  {renderLtx25RefChip(3, 'Ref 3 (subject 2)', ltx25Params.ref3)}
                  {renderLtx25RefChip(4, 'Ref 4 (subject 3)', ltx25Params.ref4)}
                  {renderLtx25RefChip(5, 'Ref 5 (subject 4)', ltx25Params.ref5)}
                </>
              ) : (
                <>
                  {renderLtx25RefChip(1, 'Ref 1 (subject 1)', ltx25Params.ref1)}
                  {renderLtx25RefChip(2, 'Ref 2 (subject 2)', ltx25Params.ref2)}
                  {renderLtx25RefChip(3, 'Ref 3 (subject 3)', ltx25Params.ref3)}
                  {renderLtx25RefChip(4, 'Ref 4 (subject 4)', ltx25Params.ref4)}
                </>
              )}
            </div>
          )}

          {/* Bloque de chips para Imagen (Flux) */}
          {activeTab === 'image' && isFluxActive && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <label style={{ position: 'relative', cursor: 'pointer' }}>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFluxRefFilesChange(Array.from(e.target.files));
                    }
                  }} 
                  style={{ display: 'none' }} 
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: fluxParams.refFiles.length > 0 ? 'var(--pf-bg-tertiary)' : 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                  <Paperclip size={12} />
                  <span>{fluxParams.refFiles.length > 0 ? `${fluxParams.refFiles.length} Refs` : 'Referencias'}</span>
                </div>
              </label>
              {fluxParams.refFiles.slice(0, 4).map((f, idx) => (
                <div key={`${f.name}-${f.lastModified}-${idx}`} style={{ position: 'relative' }}>
                  {renderFileThumbnail(f, 'ref')}
                  <span style={{ position: 'absolute', bottom: '0', right: '0', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '8px', padding: '1px 3px', borderRadius: '4px' }}>{idx + 1}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bloque contextual Qwen (task + refs + inpaint canvas) */}
          {activeTab === 'image' && isQwenActive && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <DropdownButton
                options={QWEN_TASKS}
                value={qwenParams.task}
                onChange={(v: string) => setQwenParams(prev => ({ ...prev, task: v as QwenParams['task'] }))}
              />
              {(qwenParams.task === 'Crear' || qwenParams.task === 'Editar y Refs') && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: qwenParams.transparent ? 'var(--pf-bg-tertiary)' : 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={qwenParams.transparent} onChange={(e) => setQwenParams(prev => ({ ...prev, transparent: e.target.checked }))} />
                  Fondo transparente
                </label>
              )}
              {qwenParams.task === 'Editar y Refs' && (
                <>
                  <label style={{ position: 'relative', cursor: 'pointer' }}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) handleQwenRefFilesChange(Array.from(e.target.files));
                      }}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: qwenParams.refFiles.length > 0 ? 'var(--pf-bg-tertiary)' : 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                      <Paperclip size={12} />
                      <span>{qwenParams.refFiles.length > 0 ? `${qwenParams.refFiles.length} Refs` : 'Referencias (hasta 10)'}</span>
                    </div>
                  </label>
                  {qwenParams.refFiles.slice(0, 4).map((f, idx) => (
                    <div key={`${f.name}-${f.lastModified}-${idx}`} style={{ position: 'relative' }}>
                      {renderFileThumbnail(f, `qwenref-${idx}`)}
                      <span style={{ position: 'absolute', bottom: '0', right: '0', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '8px', padding: '1px 3px', borderRadius: '4px' }}>{idx + 1}</span>
                    </div>
                  ))}
                </>
              )}
              {qwenParams.task === 'Inpaint' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  {!qwenParams.editImageFile ? (
                    <label style={{ cursor: 'pointer', display: 'inline-flex' }}>
                      <input type="file" accept="image/*" onChange={handleQwenEditImageChange} style={{ display: 'none' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                        <Paperclip size={12} />
                        <span>Cargar imagen para Inpaint</span>
                      </div>
                    </label>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px 6px 10px', background: 'var(--pf-bg-tertiary)', border: '1px solid var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)', alignSelf: 'flex-start' }}>
                      <Paperclip size={12} />
                      <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qwenParams.editImageFile.name}</span>
                      <button
                        type="button"
                        onClick={handleQwenClearEditImage}
                        title="Quitar imagen"
                        style={{ marginLeft: '4px', width: '16px', height: '16px', borderRadius: '50%', background: '#EF4444', color: 'white', border: 'none', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                  {qwenParams.editImageFile && (
                    <>
                      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '420px', width: '100%' }}>
                        <canvas ref={qwenImageCanvasRef} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '8px' }} />
                        <canvas
                          ref={qwenMaskCanvasRef}
                          onMouseDown={handleQwenCanvasMouseDown}
                          onMouseMove={handleQwenCanvasMouseMove}
                          onMouseUp={handleQwenCanvasMouseUp}
                          onMouseLeave={handleQwenCanvasMouseUp}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair', borderRadius: '8px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleQwenClearMask}
                          style={{ padding: '5px 10px', background: 'var(--pf-bg-secondary)', border: '1px solid var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)', cursor: 'pointer' }}
                        >
                          Limpiar máscara
                        </button>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--pf-font-ui)', color: qwenParams.editMaskFile ? '#10B981' : 'var(--pf-text-muted)' }}>
                          {qwenParams.editMaskFile ? 'Máscara lista' : 'Pinta sobre la zona a cambiar'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>Intensidad</span>
                          <input
                            type="range"
                            min={0.3}
                            max={1.0}
                            step={0.05}
                            value={qwenParams.strength}
                            onChange={(e) => setQwenParams(prev => ({ ...prev, strength: parseFloat(e.target.value) }))}
                            style={{ width: '120px' }}
                          />
                          <span style={{ fontSize: '11px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-primary)', minWidth: '28px' }}>{qwenParams.strength.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bloque de chips para Audio */}
          {activeTab === 'audio' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {!ttsParams.audioGuide && (
                <label style={{ position: 'relative', cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setTtsParams(prev => ({ ...prev, audioGuide: e.target.files?.[0] || null }))}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                    <Mic size={12} />
                    <span>+ Audio 1</span>
                  </div>
                </label>
              )}
              {ttsParams.audioGuide && (
                <>
                  <button
                    type="button"
                    onClick={() => setExpandedAudio(expandedAudio === 'audioGuide' ? null : 'audioGuide')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 10px',
                      background: expandedAudio === 'audioGuide' ? 'var(--pf-text-primary)' : 'var(--pf-bg-tertiary)',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px', fontSize: '12px',
                      fontFamily: 'var(--pf-font-ui)',
                      color: expandedAudio === 'audioGuide' ? 'var(--pf-bg-elevated)' : 'var(--pf-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <Mic size={12} />
                    <span>Audio 1</span>
                    <Pencil size={10} />
                  </button>
                  {renderFileThumbnail(ttsParams.audioGuide, 'tts-audio-1')}
                </>
              )}

              {!ttsParams.audioGuide2 && (
                <label style={{ position: 'relative', cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setTtsParams(prev => ({ ...prev, audioGuide2: e.target.files?.[0] || null }))}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'var(--pf-bg-secondary)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                    <Mic2 size={12} />
                    <span>+ Audio 2</span>
                  </div>
                </label>
              )}
              {ttsParams.audioGuide2 && (
                <>
                  <button
                    type="button"
                    onClick={() => setExpandedAudio(expandedAudio === 'audioGuide2' ? null : 'audioGuide2')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 10px',
                      background: expandedAudio === 'audioGuide2' ? 'var(--pf-text-primary)' : 'var(--pf-bg-tertiary)',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px', fontSize: '12px',
                      fontFamily: 'var(--pf-font-ui)',
                      color: expandedAudio === 'audioGuide2' ? 'var(--pf-bg-elevated)' : 'var(--pf-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <Mic2 size={12} />
                    <span>Audio 2</span>
                    <Pencil size={10} />
                  </button>
                  {renderFileThumbnail(ttsParams.audioGuide2, 'tts-audio-2')}
                </>
              )}
            </div>
          )}

          {/* AudioTrimmer expandido */}
          {activeTab === 'audio' && expandedAudio && ttsParams[expandedAudio] && (
            <AudioTrimmer
              src={getObjectUrl(ttsParams[expandedAudio] as File)}
              fileName={(ttsParams[expandedAudio] as File).name}
              onApply={(trimmed, s, e) => handleApplyTrim(expandedAudio, trimmed, s, e)}
              onCancel={() => setExpandedAudio(null)}
            />
          )}

          {/* Reference Mode para Flux */}
          {activeTab === 'image' && isFluxActive && fluxParams.refFiles.length > 0 && (
            <div style={{ marginTop: '8px', marginBottom: '8px' }}>
               <DropdownButton 
                 options={FLUX_REF_MODES} 
                 value={fluxParams.refModeLabel} 
                 onChange={(v: string) => setFluxParams({...fluxParams, refModeLabel: v})} 
               />
            </div>
          )}

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeTab === 'video'
                  ? "Describe tu video..."
                  : activeTab === 'audio'
                    ? "Escribe el texto a narrar..."
                    : "Describe tu imagen..."
              }
              rows={1}
              style={{
                width: '100%', minHeight: '38px', maxHeight: '110px', background: 'transparent',
                border: 'none', outline: 'none', resize: 'vertical',
                fontFamily: 'var(--pf-font-display)', fontSize: '15px', color: 'var(--pf-text-primary)',
                lineHeight: 1.4, paddingRight: '140px',
              }}
              disabled={isLoading}
            />
            <button
              onClick={isCurrentModelLocked ? () => navigate('/pricing') : handleGenerateClick}
              disabled={isCurrentModelLocked ? false : (!prompt.trim() || isLoading || !storyboardValid)}
              className={isLoading && !isCurrentModelLocked ? 'pf-generating-btn' : ''}
              style={{
                position: 'absolute', right: '0', bottom: '0',
                background: isLoading
                  ? '#0A0A0A'
                  : (!prompt.trim() ? 'var(--pf-bg-tertiary)' : 'var(--pf-text-primary)'),
                color: isLoading
                  ? '#FFFFFF'
                  : (!prompt.trim() ? 'var(--pf-text-muted)' : 'var(--pf-text-inverse, #FFFFFF)'),
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '13px',
                fontWeight: 600,
                padding: '7px 18px',
                borderRadius: '99px',
                border: 'none',
                cursor: !prompt.trim() || isLoading || !storyboardValid ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: isLoading ? '118px' : 'auto',
                justifyContent: 'center',
              }}
            >
              {isLoading && !isCurrentModelLocked ? (
                <>
                  <PathfinderSpinner size={16} />
                  <span>Generando</span>
                  <span className="pf-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </>
              ) : isCurrentModelLocked ? (
                <>
                  <span>Desbloquear Creator</span>
                  <PathfinderLogo size={16} />
                </>
              ) : (
                <>
                  <span>{activeTab === 'audio' ? 'Generar Audio' : 'Generar'}</span>
                  <PathfinderSpinner size={16} paused />
                </>
              )}
            </button>
            {firstGenCalloutVisible && (
              <Callout
                title="La primera generación puede tardar un poco más mientras carga el modelo."
                body="Es normal — las siguientes van más rápido."
                align="right"
                onDismiss={dismissFirstGenCallout}
              />
            )}
          </div>

          {/* Voice / Emotion instruction (Audio) */}
          {activeTab === 'audio' && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{
                listStyle: 'none',
                fontSize: '12px',
                fontFamily: 'var(--pf-font-ui)',
                color: 'var(--pf-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                userSelect: 'none',
              }}>
                <span style={{ fontSize: '10px' }}>▸</span>
                {isTtsOmni ? 'Voice instruction' : 'Emotion instruction'}
                {((isTtsOmni ? ttsParams.voiceInstruction : ttsParams.emotionInstruction) || '').trim() !== '' && (
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--pf-text-muted)',
                    fontStyle: 'italic',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '240px',
                  }}>
                    — {(isTtsOmni ? ttsParams.voiceInstruction : ttsParams.emotionInstruction).slice(0, 60)}
                  </span>
                )}
              </summary>
              <input
                type="text"
                value={isTtsOmni ? ttsParams.voiceInstruction : ttsParams.emotionInstruction}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isTtsOmni) {
                    setTtsParams(prev => ({ ...prev, voiceInstruction: v }));
                  } else {
                    setTtsParams(prev => ({ ...prev, emotionInstruction: v }));
                  }
                }}
                placeholder={
                  isTtsOmni
                    ? 'female, young adult, moderate pitch'
                    : 'happy, angry, sad, afraid, disgusted, melancholic, surprised, calm'
                }
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--pf-bg-secondary)',
                  border: '1px solid var(--pf-border-default)',
                  borderRadius: '8px',
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '12px',
                  color: 'var(--pf-text-primary)',
                  lineHeight: 1.4,
                  outline: 'none',
                }}
                disabled={isLoading}
              />
            </details>
          )}

          {/* Negative prompt (Imagen) */}
          {activeTab === 'image' && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{
                listStyle: 'none',
                fontSize: '12px',
                fontFamily: 'var(--pf-font-ui)',
                color: 'var(--pf-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                userSelect: 'none',
              }}>
                <span style={{ fontSize: '10px' }}>▸</span>
                Negative prompt
                {((isQwenActive ? qwenParams.negativePrompt : isFluxActive ? fluxParams.negativePrompt : kreaParams.negativePrompt) || '').trim() !== '' && (
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--pf-text-muted)',
                    fontStyle: 'italic',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '240px',
                  }}>
                    — {(isQwenActive ? qwenParams.negativePrompt : isFluxActive ? fluxParams.negativePrompt : kreaParams.negativePrompt).slice(0, 60)}
                  </span>
                )}
              </summary>
              <textarea
                value={isQwenActive ? qwenParams.negativePrompt : isFluxActive ? fluxParams.negativePrompt : kreaParams.negativePrompt}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isQwenActive) {
                    setQwenParams(prev => ({ ...prev, negativePrompt: v }));
                  } else if (isFluxActive) {
                    setFluxParams(prev => ({ ...prev, negativePrompt: v }));
                  } else {
                    setKreaParams(prev => ({ ...prev, negativePrompt: v }));
                  }
                }}
                placeholder="Lo que NO quieres que aparezca: low quality, blurry, distorted, extra fingers..."
                rows={2}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  minHeight: '50px',
                  maxHeight: '100px',
                  padding: '8px 10px',
                  background: 'var(--pf-bg-secondary)',
                  border: '1px solid var(--pf-border-default)',
                  borderRadius: '8px',
                  resize: 'vertical',
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '12px',
                  color: 'var(--pf-text-primary)',
                  lineHeight: 1.4,
                  outline: 'none',
                }}
                disabled={isLoading}
              />
            </details>
          )}

          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--pf-border-subtle)' }}>
            {/* Video LTX — fila inferior */}
            {activeTab === 'video' && isVideoLtx && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <DropdownButton options={VIDEO_DURATIONS} value={videoParams.duration} onChange={(v: string) => setVideoParams({...videoParams, duration: v})} formatOption={(opt) => opt.split(' ')[0] + 's'} />
                <DropdownButton options={VIDEO_RESOLUTIONS} value={videoParams.resolution} onChange={(v: string) => setVideoParams({...videoParams, resolution: v})} />
                <DropdownButton options={VIDEO_ASPECT_RATIOS} value={videoParams.aspectRatio} onChange={(v: string) => setVideoParams({...videoParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <NumberInput label="Seed" value={videoParams.seed} onChange={(v: number) => setVideoParams({...videoParams, seed: v})} min={-1} max={2147483647} step={1} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                  <input type="checkbox" checked={videoParams.matchAudioDur} onChange={(e) => setVideoParams({...videoParams, matchAudioDur: e.target.checked})} style={{ marginRight: '4px' }} />
                  Match Audio
                </label>
                <div style={{ position: 'relative' }}>
                  <details style={{ display: 'inline-block' }}>
                    <summary style={{
                      listStyle: 'none',
                      background: 'var(--pf-bg-secondary)',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontFamily: 'var(--pf-font-ui)',
                      color: 'var(--pf-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      Avanzado ▼
                    </summary>
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: isMobile ? 'auto' : 0,
                      right: isMobile ? 0 : 'auto',
                      background: 'var(--pf-bg-elevated)',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      width: isMobile ? 'auto' : '280px',
                      maxWidth: 'calc(100vw - 24px)'
                    }}>
                      <div style={{ borderTop: '1px solid var(--pf-border-subtle)', paddingTop: '10px', marginTop: '4px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--pf-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          LoRAs adicionales
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={newLoraUrl}
                            onChange={(e) => setNewLoraUrl(e.target.value)}
                            placeholder="https://huggingface.co/..."
                            style={{
                              flex: 1,
                              minWidth: 0,
                              padding: '5px 7px',
                              background: 'var(--pf-bg-secondary)',
                              border: '1px solid var(--pf-border-default)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontFamily: 'var(--pf-font-ui)',
                              color: 'var(--pf-text-primary)',
                              outline: 'none',
                            }}
                            disabled={loraAdding || isLoading}
                          />
                          <button
                            type="button"
                            onClick={handleAddLoraLtx23}
                            disabled={loraAdding || !newLoraUrl.trim() || isLoading}
                            style={{
                              padding: '5px 9px',
                              background: (!newLoraUrl.trim() || loraAdding) ? 'var(--pf-bg-tertiary)' : 'var(--pf-text-primary)',
                              color: (!newLoraUrl.trim() || loraAdding) ? 'var(--pf-text-muted)' : 'var(--pf-bg-elevated)',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontFamily: 'var(--pf-font-ui)',
                              fontWeight: 600,
                              cursor: (!newLoraUrl.trim() || loraAdding) ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {loraAdding ? '...' : 'Add'}
                          </button>
                        </div>
                        {videoParams.loraItems.length === 0 ? (
                          <div style={{ fontSize: '10px', color: 'var(--pf-text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                            Sin LoRAs adicionales. Se aplicará solo el pipeline distilled.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {videoParams.loraItems.map((item, i) => {
                              const dimmed = !item.enabled;
                              return (
                              <div key={`${item.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: dimmed ? 0.45 : 1 }}>
                                <button
                                  type="button"
                                  onClick={() => toggleLoraEnabledLtx23(i)}
                                  disabled={isLoading}
                                  title={item.enabled ? 'Desactivar' : 'Activar'}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '3px',
                                    border: '1px solid var(--pf-border-default)',
                                    background: item.enabled ? 'var(--pf-text-primary)' : 'var(--pf-bg-secondary)',
                                    color: 'var(--pf-bg-elevated)',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    fontSize: '10px',
                                    lineHeight: 1,
                                    flexShrink: 0,
                                  }}
                                >
                                  {item.enabled ? '✓' : ''}
                                </button>
                                <span
                                  title={item.name}
                                  style={{
                                    flex: 1,
                                    fontSize: '10px',
                                    fontFamily: 'var(--pf-font-ui)',
                                    color: 'var(--pf-text-secondary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                    textDecoration: dimmed ? 'line-through' : 'none',
                                  }}
                                >
                                  {item.name}
                                </span>
                                <input
                                  type="number"
                                  value={item.mult}
                                  min={0}
                                  max={2}
                                  step={0.05}
                                  onChange={(e) => updateLoraMultLtx23(i, e.target.value)}
                                  style={{
                                    width: '42px',
                                    padding: '3px 5px',
                                    background: 'var(--pf-bg-secondary)',
                                    border: '1px solid var(--pf-border-default)',
                                    borderRadius: '5px',
                                    fontSize: '11px',
                                    fontFamily: 'var(--pf-font-ui)',
                                    color: 'var(--pf-text-primary)',
                                    textAlign: 'center',
                                    outline: 'none',
                                  }}
                                  disabled={isLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeLoraItemLtx23(i)}
                                  disabled={isLoading}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: '#EF4444',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '10px',
                                    lineHeight: 1,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            );
                            })}
                            <div style={{ fontSize: '9px', color: 'var(--pf-text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                              El orden importa: cada multiplicador aplica a su LoRA.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* Wan I2V/T2V — fila inferior */}
            {activeTab === 'video' && isVideoWan && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <DropdownButton options={WAN_DURATIONS} value={wanParams.duration} onChange={(v: string) => setWanParams({...wanParams, duration: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <DropdownButton options={WAN_RESOLUTIONS} value={wanParams.resolution} onChange={(v: string) => setWanParams({...wanParams, resolution: v})} />
                <DropdownButton options={WAN_ASPECTS} value={wanParams.aspectRatio} onChange={(v: string) => setWanParams({...wanParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <NumberInput label="Seed" value={wanParams.seed} onChange={(v: number) => setWanParams({...wanParams, seed: v})} min={-1} max={2147483647} step={1} />
                <div style={{ position: 'relative' }}>
                  <details style={{ display: 'inline-block' }}>
                    <summary style={{
                      listStyle: 'none',
                      background: 'var(--pf-bg-secondary)',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontFamily: 'var(--pf-font-ui)',
                      color: 'var(--pf-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      Avanzado ▼
                    </summary>
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: isMobile ? 'auto' : 0,
                      right: isMobile ? 0 : 'auto',
                      background: 'var(--pf-bg-elevated)',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      width: isMobile ? 'auto' : '280px',
                      maxWidth: 'calc(100vw - 24px)'
                    }}>
                      <div>
                        <NumberInput label="Steps" value={wanParams.steps} onChange={(v: number) => setWanParams({...wanParams, steps: v})} min={1} max={20} step={1} />
                      </div>
                      <div>
                        <NumberInput label="Guide" value={wanParams.guideScale} onChange={(v: number) => setWanParams({...wanParams, guideScale: v})} min={0.5} max={10} step={0.5} />
                      </div>
                      <div>
                        <NumberInput label="Shift" value={wanParams.shift} onChange={(v: number) => setWanParams({...wanParams, shift: v})} min={1} max={15} step={0.5} />
                      </div>
                      <div>
                        <DropdownButton options={WAN_SAMPLERS} value={wanParams.sampler} onChange={(v: string) => setWanParams({...wanParams, sampler: v})} />
                      </div>
                      <div style={{ borderTop: '1px solid var(--pf-border-subtle)', paddingTop: '10px', marginTop: '4px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--pf-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          LoRAs adicionales
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={newLoraUrl}
                            onChange={(e) => setNewLoraUrl(e.target.value)}
                            placeholder="https://huggingface.co/..."
                            style={{
                              flex: 1,
                              minWidth: 0,
                              padding: '5px 7px',
                              background: 'var(--pf-bg-secondary)',
                              border: '1px solid var(--pf-border-default)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontFamily: 'var(--pf-font-ui)',
                              color: 'var(--pf-text-primary)',
                              outline: 'none',
                            }}
                            disabled={loraAdding || isLoading}
                          />
                          <button
                            type="button"
                            onClick={handleAddLora}
                            disabled={loraAdding || !newLoraUrl.trim() || isLoading}
                            style={{
                              padding: '5px 9px',
                              background: (!newLoraUrl.trim() || loraAdding) ? 'var(--pf-bg-tertiary)' : 'var(--pf-text-primary)',
                              color: (!newLoraUrl.trim() || loraAdding) ? 'var(--pf-text-muted)' : 'var(--pf-bg-elevated)',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontFamily: 'var(--pf-font-ui)',
                              fontWeight: 600,
                              cursor: (!newLoraUrl.trim() || loraAdding) ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {loraAdding ? '...' : 'Add'}
                          </button>
                        </div>
                        {wanParams.loraItems.length === 0 ? (
                          <div style={{ fontSize: '10px', color: 'var(--pf-text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                            Sin LoRAs adicionales. Se aplicará solo la LoRA aceleradora del modo.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {wanParams.loraItems.map((item, i) => {
                              const dimmed = !item.enabled;
                              return (
                              <div key={`${item.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: dimmed ? 0.45 : 1 }}>
                                <button
                                  type="button"
                                  onClick={() => toggleLoraEnabledWan(i)}
                                  disabled={isLoading}
                                  title={item.enabled ? 'Desactivar' : 'Activar'}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '3px',
                                    border: '1px solid var(--pf-border-default)',
                                    background: item.enabled ? 'var(--pf-text-primary)' : 'var(--pf-bg-secondary)',
                                    color: 'var(--pf-bg-elevated)',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    fontSize: '10px',
                                    lineHeight: 1,
                                    flexShrink: 0,
                                  }}
                                >
                                  {item.enabled ? '✓' : ''}
                                </button>
                                <span
                                  title={item.name}
                                  style={{
                                    flex: 1,
                                    fontSize: '10px',
                                    fontFamily: 'var(--pf-font-ui)',
                                    color: 'var(--pf-text-secondary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                    textDecoration: dimmed ? 'line-through' : 'none',
                                  }}
                                >
                                  {item.name}
                                </span>
                                <input
                                  type="number"
                                  value={item.mult}
                                  min={0}
                                  max={2}
                                  step={0.05}
                                  onChange={(e) => updateLoraMult(i, e.target.value)}
                                  style={{
                                    width: '42px',
                                    padding: '3px 5px',
                                    background: 'var(--pf-bg-secondary)',
                                    border: '1px solid var(--pf-border-default)',
                                    borderRadius: '5px',
                                    fontSize: '11px',
                                    fontFamily: 'var(--pf-font-ui)',
                                    color: 'var(--pf-text-primary)',
                                    textAlign: 'center',
                                    outline: 'none',
                                  }}
                                  disabled={isLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeLoraItem(i)}
                                  disabled={isLoading}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: '#EF4444',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '10px',
                                    lineHeight: 1,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            );
                            })}
                            <div style={{ fontSize: '9px', color: 'var(--pf-text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                              El orden importa: cada multiplicador aplica a su LoRA.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* LTX 2.5 MSR — fila inferior */}
            {activeTab === 'video' && isVideoLtx25Msr && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <DropdownButton
                  options={LTX25_DURATIONS}
                  value={ltx25Params.duration}
                  onChange={(v: string) => setLtx25Params(prev => ({ ...prev, duration: v }))}
                  formatOption={(opt) => opt.split(' ')[0] + 's'}
                />
                <DropdownButton
                  options={LTX25_RESOLUTIONS}
                  value={ltx25Params.resolution}
                  onChange={(v: string) => setLtx25Params(prev => ({ ...prev, resolution: v }))}
                  formatOption={(opt) => {
                    const m = opt.match(/\((\d{3,4}p)/);
                    return m ? m[1] : opt;
                  }}
                />
                <DropdownButton
                  options={LTX25_ASPECTS}
                  value={ltx25Params.aspectRatio}
                  onChange={(v: string) => setLtx25Params(prev => ({ ...prev, aspectRatio: v }))}
                  formatOption={(opt) => opt.split(' ')[0]}
                />
                <NumberInput
                  label="Seed"
                  value={ltx25Params.seed}
                  onChange={(v: number) => setLtx25Params(prev => ({ ...prev, seed: v }))}
                  min={-1}
                  max={2147483647}
                  step={1}
                />
                <div style={{ position: 'relative' }}>
                  <details style={{ display: 'inline-block' }}>
                    <summary style={{
                      listStyle: 'none',
                      background: 'var(--pf-bg-secondary)',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontFamily: 'var(--pf-font-ui)',
                      color: 'var(--pf-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      Avanzado ▼
                    </summary>
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: isMobile ? 'auto' : 0,
                      right: isMobile ? 0 : 'auto',
                      background: 'var(--pf-bg-elevated)',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      width: isMobile ? 'auto' : '320px',
                      maxWidth: 'calc(100vw - 24px)'
                    }}>
                      <div>
                        <DropdownButton
                          options={LTX25_PIPELINES}
                          value={ltx25Params.pipeline}
                          onChange={(v: string) => setLtx25Params(prev => ({ ...prev, pipeline: v }))}
                          formatOption={(opt) => opt.startsWith('Single') ? 'Single' : 'Two-stage'}
                        />
                      </div>
                      <div>
                        <NumberInput
                          label="Steps"
                          value={ltx25Params.steps}
                          onChange={(v: number) => setLtx25Params(prev => ({ ...prev, steps: v }))}
                          min={4}
                          max={8}
                          step={1}
                        />
                      </div>
                      <div>
                        <NumberInput
                          label="Audio CFG"
                          value={ltx25Params.audioCfg}
                          onChange={(v: number) => setLtx25Params(prev => ({ ...prev, audioCfg: v }))}
                          min={1.0}
                          max={5.0}
                          step={0.5}
                        />
                      </div>
                      <div style={{ borderTop: '1px solid var(--pf-border-subtle)', paddingTop: '10px', marginTop: '4px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--pf-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          LoRAs
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={newLoraUrl}
                            onChange={(e) => setNewLoraUrl(e.target.value)}
                            placeholder="https://huggingface.co/..."
                            style={{
                              flex: 1,
                              minWidth: 0,
                              padding: '5px 7px',
                              background: 'var(--pf-bg-secondary)',
                              border: '1px solid var(--pf-border-default)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontFamily: 'var(--pf-font-ui)',
                              color: 'var(--pf-text-primary)',
                              outline: 'none',
                            }}
                            disabled={loraAdding || isLoading}
                          />
                          <button
                            type="button"
                            onClick={handleAddLoraLtx25}
                            disabled={loraAdding || !newLoraUrl.trim() || isLoading}
                            style={{
                              padding: '5px 9px',
                              background: (!newLoraUrl.trim() || loraAdding) ? 'var(--pf-bg-tertiary)' : 'var(--pf-text-primary)',
                              color: (!newLoraUrl.trim() || loraAdding) ? 'var(--pf-text-muted)' : 'var(--pf-bg-elevated)',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontFamily: 'var(--pf-font-ui)',
                              fontWeight: 600,
                              cursor: (!newLoraUrl.trim() || loraAdding) ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {loraAdding ? '...' : 'Add'}
                          </button>
                        </div>
                        {ltx25Params.loraItems.length === 0 ? (
                          <div style={{ fontSize: '10px', color: 'var(--pf-text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                            Sin LoRAs adicionales. Se aplicará solo MSR V1 (interna).
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {ltx25Params.loraItems.map((item, i) => {
                              const isProduct = i === 0 && item.name.toLowerCase().includes('product_commercial');
                              const dimmed = !item.enabled;
                              return (
                                <div key={`${item.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: dimmed ? 0.45 : 1 }}>
                                  {isProduct && (
                                    <button
                                      type="button"
                                      onClick={() => toggleLoraEnabledLtx25(i)}
                                      disabled={isLoading}
                                      title={item.enabled ? 'Desactivar' : 'Activar'}
                                      style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '3px',
                                        border: '1px solid var(--pf-border-default)',
                                        background: item.enabled ? 'var(--pf-text-primary)' : 'var(--pf-bg-secondary)',
                                        color: 'var(--pf-bg-elevated)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0,
                                        fontSize: '10px',
                                        lineHeight: 1,
                                      }}
                                    >
                                      {item.enabled ? '✓' : ''}
                                    </button>
                                  )}
                                  <span
                                    title={item.name}
                                    style={{
                                      flex: 1,
                                      fontSize: '10px',
                                      fontFamily: 'var(--pf-font-ui)',
                                      color: isProduct ? 'var(--pf-text-primary)' : 'var(--pf-text-secondary)',
                                      fontWeight: isProduct ? 600 : 400,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      minWidth: 0,
                                      textDecoration: dimmed ? 'line-through' : 'none',
                                    }}
                                  >
                                    {item.name}
                                  </span>
                                  <input
                                    type="number"
                                    value={item.mult}
                                    min={0}
                                    max={2}
                                    step={0.05}
                                    onChange={(e) => updateLoraMultLtx25(i, e.target.value)}
                                    disabled={isLoading || dimmed}
                                    style={{
                                      width: '42px',
                                      padding: '3px 5px',
                                      background: 'var(--pf-bg-secondary)',
                                      border: '1px solid var(--pf-border-default)',
                                      borderRadius: '5px',
                                      fontSize: '11px',
                                      fontFamily: 'var(--pf-font-ui)',
                                      color: 'var(--pf-text-primary)',
                                      textAlign: 'center',
                                      outline: 'none',
                                    }}
                                  />
                                  {isProduct ? (
                                    <span
                                      title="Product Commercial (precargada) — se puede activar/desactivar"
                                      style={{
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        color: 'var(--pf-text-muted)',
                                      }}
                                    >
                                      🔒
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => removeLoraItemLtx25(i)}
                                      disabled={isLoading}
                                      style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: '#EF4444',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '10px',
                                        lineHeight: 1,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0,
                                      }}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            <div style={{ fontSize: '9px', color: 'var(--pf-text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                              MSR V1 (interna) se aplica siempre. Product Commercial es editable y activable/desactivable.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* Imagen Krea */}
            {activeTab === 'image' && !isFluxActive && !isQwenActive && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <DropdownButton options={KREA_STYLES} value={kreaParams.stylePreset} onChange={(v: string) => setKreaParams({...kreaParams, stylePreset: v})} />
                <DropdownButton options={KREA_RESOLUTIONS} value={kreaParams.resolution} onChange={(v: string) => setKreaParams({...kreaParams, resolution: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <DropdownButton options={KREA_ASPECT_RATIOS} value={kreaParams.aspectRatio} onChange={(v: string) => setKreaParams({...kreaParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <NumberInput label="Steps" value={kreaParams.steps} onChange={(v: number) => setKreaParams({...kreaParams, steps: v})} min={1} max={50} />
                <NumberInput label="Imágenes" value={kreaParams.numImages} onChange={(v: number) => setKreaParams({...kreaParams, numImages: v})} min={1} max={4} />
              </div>
            )}

            {/* Imagen Flux */}
            {activeTab === 'image' && isFluxActive && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <DropdownButton options={FLUX_RESOLUTIONS} value={fluxParams.resolution} onChange={(v: string) => setFluxParams({...fluxParams, resolution: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <DropdownButton options={FLUX_ASPECT_RATIOS} value={fluxParams.aspectRatio} onChange={(v: string) => setFluxParams({...fluxParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <NumberInput label="Steps" value={fluxParams.steps} onChange={(v: number) => setFluxParams({...fluxParams, steps: v})} min={1} max={50} />
                <NumberInput label="Imágenes" value={fluxParams.numImages} onChange={(v: number) => setFluxParams({...fluxParams, numImages: v})} min={1} max={4} />
                
                <div style={{ position: 'relative' }}>
                   <details style={{ display: 'inline-block' }}>
                      <summary style={{
                        listStyle: 'none',
                        background: 'var(--pf-bg-secondary)',
                        border: '1px solid var(--pf-border-default)',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '12px',
                        fontFamily: 'var(--pf-font-ui)',
                        color: 'var(--pf-text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        Avanzado ▼
                      </summary>
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: isMobile ? 'auto' : 0,
                        right: isMobile ? 0 : 'auto',
                        background: 'var(--pf-bg-elevated)',
                        border: '1px solid var(--pf-border-default)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        width: isMobile ? 'auto' : '200px',
                        maxWidth: 'calc(100vw - 24px)'
                      }}>
                        <div>
                          <NumberInput label="Guide Scale" value={fluxParams.fluxGuideScale} onChange={(v: number) => setFluxParams({...fluxParams, fluxGuideScale: v})} min={0.5} max={10} step={0.5} />
                        </div>
                        <div>
                          <NumberInput label="Embedding" value={fluxParams.embeddedGuidance} onChange={(v: number) => setFluxParams({...fluxParams, embeddedGuidance: v})} min={0} max={5} step={0.5} />
                        </div>
                      </div>
                   </details>
                </div>
              </div>
            )}

            {/* Imagen Qwen */}
            {activeTab === 'image' && isQwenActive && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <DropdownButton options={QWEN_MODES} value={qwenParams.mode} onChange={(v: string) => setQwenParams({...qwenParams, mode: v})} />
                <DropdownButton options={QWEN_RESOLUTIONS} value={qwenParams.resolution} onChange={(v: string) => setQwenParams({...qwenParams, resolution: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <DropdownButton
                  options={qwenParams.task === 'Crear' ? QWEN_ASPECT_RATIOS.slice(1) : QWEN_ASPECT_RATIOS}
                  value={qwenParams.aspectRatio}
                  onChange={(v: string) => setQwenParams({...qwenParams, aspectRatio: v})}
                  formatOption={(opt) => opt === 'Match input' ? 'Match input' : opt.split(' ')[0]}
                />
                <NumberInput label="Seed" value={qwenParams.seed} onChange={(v: number) => setQwenParams({...qwenParams, seed: v})} min={-1} max={2147483647} step={1} />
                <NumberInput label="Imágenes" value={qwenParams.numImages} onChange={(v: number) => setQwenParams({...qwenParams, numImages: v})} min={1} max={4} />

                <div style={{ position: 'relative' }}>
                  <details style={{ display: 'inline-block' }}>
                    <summary style={{
                      listStyle: 'none',
                      background: 'var(--pf-bg-secondary)',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontFamily: 'var(--pf-font-ui)',
                      color: 'var(--pf-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      Avanzado ▼
                    </summary>
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: isMobile ? 'auto' : 0,
                      right: isMobile ? 0 : 'auto',
                      background: 'var(--pf-bg-elevated)',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      width: isMobile ? 'auto' : '200px',
                      maxWidth: 'calc(100vw - 24px)'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)', marginBottom: '6px' }}>Style</div>
                        <DropdownButton options={QWEN_STYLES} value={qwenParams.stylePreset} onChange={(v: string) => setQwenParams({...qwenParams, stylePreset: v})} />
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* Audio */}
            {activeTab === 'audio' && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <DropdownButton
                  options={ttsLangOptions}
                  value={ttsParams.language}
                  onChange={(v: string) => setTtsParams(prev => ({ ...prev, language: v }))}
                />
                <DropdownButton
                  options={TTS_DURATIONS}
                  value={ttsParams.duration}
                  onChange={(v: string) => setTtsParams(prev => ({ ...prev, duration: v }))}
                  formatOption={(opt) => opt === 'Custom (auto)' ? 'Auto' : opt.replace(' segundos', 's')}
                />
                <DropdownButton
                  options={ttsVoiceModeOptions}
                  value={ttsParams.voiceMode}
                  onChange={(v: string) => setTtsParams(prev => ({ ...prev, voiceMode: v }))}
                  formatOption={(opt) => {
                    if (opt.startsWith('Auto')) return 'Auto';
                    if (opt.startsWith('Voice Design')) return 'Design';
                    if (opt.startsWith('Voice Cloning')) return 'Cloning';
                    if (opt.startsWith('Two-Speaker')) return 'Dual';
                    if (opt.startsWith('Voice + Emotion')) return 'Emotion';
                    return opt;
                  }}
                />
                <NumberInput
                  label="Steps"
                  value={ttsParams.steps}
                  onChange={(v: number) => setTtsParams(prev => ({ ...prev, steps: v }))}
                  min={8}
                  max={64}
                />
                {isTtsOmni ? (
                  <NumberInput
                    label="Guide"
                    value={ttsParams.guideScale}
                    onChange={(v: number) => setTtsParams(prev => ({ ...prev, guideScale: v }))}
                    min={1.0}
                    max={5.0}
                    step={0.1}
                  />
                ) : (
                  <div style={{ position: 'relative' }}>
                    <details style={{ display: 'inline-block' }}>
                      <summary style={{
                        listStyle: 'none',
                        background: 'var(--pf-bg-secondary)',
                        border: '1px solid var(--pf-border-default)',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '12px',
                        fontFamily: 'var(--pf-font-ui)',
                        color: 'var(--pf-text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        Avanzado ▼
                      </summary>
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: isMobile ? 'auto' : 0,
                        right: isMobile ? 0 : 'auto',
                        background: 'var(--pf-bg-elevated)',
                        border: '1px solid var(--pf-border-default)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        width: isMobile ? 'auto' : '220px',
                        maxWidth: 'calc(100vw - 24px)'
                      }}>
                        <div>
                          <NumberInput
                            label="Speed"
                            value={ttsParams.speechSpeed}
                            onChange={(v: number) => setTtsParams(prev => ({ ...prev, speechSpeed: v }))}
                            min={0.5}
                            max={2.0}
                            step={0.05}
                          />
                        </div>
                        <div>
                          <NumberInput
                            label="Temp"
                            value={ttsParams.temperature}
                            onChange={(v: number) => setTtsParams(prev => ({ ...prev, temperature: v }))}
                            min={0.1}
                            max={1.5}
                            step={0.05}
                          />
                        </div>
                        <div>
                          <NumberInput
                            label="Top P"
                            value={ttsParams.topP}
                            onChange={(v: number) => setTtsParams(prev => ({ ...prev, topP: v }))}
                            min={0.5}
                            max={1.0}
                            step={0.05}
                          />
                        </div>
                        <div>
                          <NumberInput
                            label="Top K"
                            value={ttsParams.topK}
                            onChange={(v: number) => setTtsParams(prev => ({ ...prev, topK: v }))}
                            min={10}
                            max={100}
                            step={5}
                          />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={ttsParams.textNormalization}
                            onChange={(e) => setTtsParams(prev => ({ ...prev, textNormalization: e.target.checked }))}
                          />
                          Text Normalization
                        </label>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer — IA + tiempo variable (cambia al azar en cada montaje) */}
      <div
        style={{
          marginTop: '10px',
          textAlign: 'center',
          fontFamily: 'var(--pf-font-ui)',
          fontSize: '10px',
          color: 'var(--pf-text-muted)',
          opacity: 0.75,
          animation: 'fadeIn 0.5s ease-in-out',
          minHeight: '14px',
          padding: '0 12px',
          userSelect: 'none',
        }}
      >
        {DISCLAIMER_MESSAGES[disclaimerIdx]}
      </div>

      {/* Lightbox de imagen — click en overlay o Esc para cerrar */}
      {lightboxFile && (
        <div
          onClick={() => setLightboxFile(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={getObjectUrl(lightboxFile)}
            alt={lightboxFile.name}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
              cursor: 'default',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FloatingCommandCenter;
