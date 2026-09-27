// src/components/FloatingCommandCenter.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGenerationContext } from '../context/GenerationContext';
import { supabase } from '../lib/supabaseClient';
import { Video, Image as ImageIcon, Music, Paperclip, Sparkles, X, Loader2, Mic, Mic2, Pencil } from 'lucide-react';
import AudioTrimmer from './AudioTrimmer';
import { useIsMobile } from '../hooks/useIsMobile';

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
const VIDEO_RESOLUTIONS = ['1080p', '720p', '540p', '480p'];
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
  'Cinema 1080p (1088p - High Detail)',
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
}

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
function loadWanLoras(): { name: string; mult: string }[] {
  const persisted = loadPersistedStudioSelection()?.wanLoras;
  if (!Array.isArray(persisted)) return [];
  return persisted
    .filter((x) => x && typeof x.name === 'string' && typeof x.mult === 'string')
    .map((x) => ({ name: x.name, mult: x.mult }));
}

/** Carga las LoRAs de LTX 2.5 MSR desde localStorage.
 *  Si no hay persistidas, devuelve el default: Product Commercial enabled. */
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
  loraItems: { name: string; mult: string }[];
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
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px', display: 'inline-block' }}>{displayValue}</span>
        <span style={{ fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: openUp ? 'calc(100% + 4px)' : 'auto',
          top: openUp ? 'auto' : 'calc(100% + 4px)',
          left: 0,
          background: 'white',
          border: '1px solid var(--pf-border-default)',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
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

  // Índice del disclaimer: se elige al azar al montar. Cambia en cada refresh
  // (o al remontar el FCM cuando se navega a otra página y se vuelve a Studio).
  const [disclaimerIdx] = useState(() =>
    Math.floor(Math.random() * DISCLAIMER_MESSAGES.length)
  );
  const [activeTab, setActiveTab] = useState<TabType>(() => loadPersistedStudioSelection()?.activeTab || 'video');
  const [prompt, setPrompt] = useState('');
  
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
    isLoading, 
    capability,
    setCapability, 
    activeImageModelId, 
    setActiveImageModelId,
    activeVideoModelId,
    setActiveVideoModelId,
    stationStatusMap,
    getClient,
  } = useGenerationContext();

  const [selectedImageModelId, setSelectedImageModelId] = useState<string>(() => loadPersistedStudioSelection()?.selectedImageModelId || 'krea-2-turbo');
  const [selectedVideoModelId, setSelectedVideoModelId] = useState<string>(() => loadPersistedStudioSelection()?.selectedVideoModelId || activeVideoModelId || 'ltx-2.3');
  const [selectedTtsModelId, setSelectedTtsModelId] = useState<string>(() => loadPersistedStudioSelection()?.selectedTtsModelId || 'omnivoice');
  const [expandedAudio, setExpandedAudio] = useState<'audioGuide' | 'audioGuide2' | null>(null);
  const [newLoraUrl, setNewLoraUrl] = useState('');
  const [loraAdding, setLoraAdding] = useState(false);

  const isVideoWan = selectedVideoModelId.startsWith('wan-');
  const isVideoLtx = selectedVideoModelId === 'ltx-2.3';
  const isVideoLtx25Msr = selectedVideoModelId === 'ltx-2.5-msr';

  // Estado de la estación activa (badge offline/online)
  const currentStationModelId = activeTab === 'image'
    ? (selectedImageModelId || activeImageModelId)
    : activeTab === 'video'
      ? (isVideoWan ? 'wan-dual' : isVideoLtx25Msr ? 'ltx-2.5-msr' : 'ltx-2.3')
      : activeTab === 'audio'
        ? 'tts-dual'
        : null;
  const isStationOffline = currentStationModelId
    ? stationStatusMap[currentStationModelId] !== 'online'
    : false;
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
  const isTtsOmni = selectedTtsModelId === 'omnivoice';
  const ttsVoiceModeOptions = isTtsOmni ? TTS_OMNI_VOICE_MODES : TTS_INDEX_VOICE_MODES;
  const ttsLangOptions = isTtsOmni ? TTS_OMNI_LANGS : TTS_INDEX_LANGS;
  
  const [videoParams, setVideoParams] = useState<VideoParams>({
    imageStartFile: null,
    imageEndFile: null,
    audioFile: null,
    duration: '5 Seconds (121 frames)',
    resolution: '1080p',
    aspectRatio: '16:9 Landscape',
    guideScale: 4.0,
    seed: -1,
    matchAudioDur: false,
  });

  const [wanParams, setWanParams] = useState<WanParams>({
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
  });

  const [ltx25Params, setLtx25Params] = useState<Ltx25Params>({
    mode: 'KI',
    removeBg: true,
    ref1: null,
    ref2: null,
    ref3: null,
    ref4: null,
    ref5: null,
    duration: '3 Seconds (73 frames - Standard)',
    resolution: 'Fast Preview (384p - ~1-2 min)',
    aspectRatio: '16:9 Landscape',
    pipeline: 'Single stage (fast - recommended for T4)',
    audioCfg: 1.0,
    steps: 8,
    seed: -1,
    loraItems: loadLtx25Loras(),
  });

  const [kreaParams, setKreaParams] = useState<KreaParams>({
    negativePrompt: '',
    steps: 8,
    resolution: '1024px (Standard)',
    aspectRatio: '1:1 Square',
    seed: -1,
    numImages: 1,
    stylePreset: 'None',
  });

  const [fluxParams, setFluxParams] = useState<FluxParams>({
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
  });

  const [ttsParams, setTtsParams] = useState<TtsParams>({
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
  });

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

  // ── Persistir la selección actual (sobrevive refresh y navegación) ──
  useEffect(() => {
    try {
      localStorage.setItem(STUDIO_SELECTION_KEY, JSON.stringify({
        activeTab,
        selectedVideoModelId,
        selectedImageModelId,
        selectedTtsModelId,
        wanLoras: wanParams.loraItems,
        ltx25Loras: ltx25Params.loraItems,
      }));
    } catch {
      // noop (localStorage puede fallar en modo privado)
    }
  }, [
    activeTab,
    selectedVideoModelId,
    selectedImageModelId,
    selectedTtsModelId,
    wanParams.loraItems,
    ltx25Params.loraItems,
  ]);

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
  }, [stationStatusMap, activeTab, selectedVideoModelId, selectedImageModelId, selectedTtsModelId, activeImageModelId]);

  // FASE 3: escuchar pathfinder-load-config — repoblar prompt, params y refs
  useEffect(() => {
    const handleLoadConfig = async (e: Event) => {
      const custom = e as CustomEvent<{
        prompt: string;
        modelId: string;
        modelLabel: string;
        aspectRatio: string;
        params: Record<string, unknown>;
        refUrls: string[];
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
      } else if (isWan) {
        setActiveTab('video');
        setSelectedVideoModelId(detail.modelId);
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

      if (isWan && extraLorasArr.length > 0) {
        setWanParams(prev => ({
          ...prev,
          loraItems: extraLorasArr.map((name, i) => ({
            name,
            mult: loraMultsArr[i] || '1.0',
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

      if (Array.isArray(detail.refUrls) && detail.refUrls.length > 0) {
        try {
          const files: File[] = [];
          for (let i = 0; i < detail.refUrls.length; i++) {
            const url = detail.refUrls[i];
            const res = await fetch(url);
            const blob = await res.blob();
            const ext = (blob.type.split('/')[1] || 'png').split(';')[0];
            const f = new File([blob], `ref_${i + 1}.${ext}`, { type: blob.type });
            files.push(f);
          }
          if (isFlux && files.length > 0) {
            handleFluxRefFilesChange(files);
          }
        } catch (err) {
          console.error('[Fase 3] Error descargando refs:', err);
        }
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
      if (typeof status === 'string' && status.startsWith('✅')) {
        const name = status.replace('✅ Descargado:', '').trim();
        setWanParams(prev => ({
          ...prev,
          loraItems: [...prev.loraItems, { name, mult: '0.5' }],
        }));
        setNewLoraUrl('');
      } else {
        alert(status || 'Error al descargar la LoRA');
      }
    } catch (err) {
      console.error('[FCM] add_lora_url error:', err);
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
      if (typeof status === 'string' && status.startsWith('✅')) {
        const name = status.replace('✅ Descargado:', '').trim();
        setLtx25Params(prev => ({
          ...prev,
          loraItems: [...prev.loraItems, { name, mult: '1.0', enabled: true }],
        }));
        setNewLoraUrl('');
      } else {
        alert(status || 'Error al descargar la LoRA');
      }
    } catch (err) {
      console.error('[FCM] add_lora_url (LTX25) error:', err);
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
          await handleGenerate({ prompt, videoModelId: 'ltx-2.3', ...videoParams });
        } else if (isVideoLtx25Msr) {
          // LTX 2.5 MSR (Multi-Subject Reference)
          await handleGenerate({
            prompt,
            videoModelId: 'ltx-2.5-msr',
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
            extraLoras: wanParams.loraItems.map(x => x.name),
            loraMults: wanParams.loraItems.map(x => x.mult).join(' '),
          });
        }
      } else if (activeTab === 'image') {
        if (isFluxActive) {
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
      console.error("Error initiating generation:", error);
    }
  }, [prompt, activeTab, isFluxActive, isVideoLtx, isVideoLtx25Msr, isVideoWan, videoParams, wanParams, ltx25Params, fluxParams, kreaParams, ttsParams, selectedVideoModelId, selectedImageModelId, selectedTtsModelId, handleGenerate]);

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
          <img src={url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--pf-border-default)' }} />
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

    return (
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {models.map(model => (
          <button
            key={model.id}
            onClick={() => handleModelChange(model.id, !!model.comingSoon)}
            disabled={!!model.comingSoon}
            style={{
              padding: '6px 12px',
              background: selectedId === model.id ? 'var(--pf-text-primary)' : 'var(--pf-bg-tertiary)',
              color: selectedId === model.id ? 'var(--pf-bg-elevated)' : (model.comingSoon ? 'var(--pf-text-muted)' : 'var(--pf-text-secondary)'),
              border: 'none', borderRadius: '8px',
              fontFamily: 'var(--pf-font-ui)', fontSize: '12px', fontWeight: 600,
              cursor: model.comingSoon ? 'not-allowed' : 'pointer',
              opacity: model.comingSoon ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {model.name}{model.comingSoon && <span style={{ marginLeft: '4px', fontSize: '9px', opacity: 0.7 }}>Soon</span>}
          </button>
        ))}
      </div>
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
          </div>
          {renderModelSelector()}
        </div>

        {isStationOffline && currentStationModelId && (
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
          </div>
        )}

        <div style={{ padding: '12px 14px' }}>
          {/* Bloque de chips de upload para Video LTX */}
          {activeTab === 'video' && isVideoLtx && (
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
              onClick={handleGenerateClick}
              disabled={!prompt.trim() || isLoading}
              className={isLoading ? 'pf-generating-btn' : ''}
              style={{
                position: 'absolute', right: '0', bottom: '0',
                background: isLoading
                  ? 'var(--pf-text-primary)'
                  : (!prompt.trim() ? 'var(--pf-bg-tertiary)' : 'var(--pf-text-primary)'),
                color: isLoading
                  ? 'var(--pf-text-inverse, #FFFFFF)'
                  : (!prompt.trim() ? 'var(--pf-text-muted)' : 'var(--pf-text-inverse, #FFFFFF)'),
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '13px',
                fontWeight: 600,
                padding: '7px 18px',
                borderRadius: '99px',
                border: 'none',
                cursor: !prompt.trim() || isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: isLoading ? '118px' : 'auto',
                justifyContent: 'center',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generando</span>
                  <span className="pf-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </>
              ) : (
                <>
                  {activeTab === 'audio' ? 'Generar Audio' : 'Generar'}
                  <Sparkles size={14} />
                </>
              )}
            </button>
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
                {((isFluxActive ? fluxParams.negativePrompt : kreaParams.negativePrompt) || '').trim() !== '' && (
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--pf-text-muted)',
                    fontStyle: 'italic',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '240px',
                  }}>
                    — {(isFluxActive ? fluxParams.negativePrompt : kreaParams.negativePrompt).slice(0, 60)}
                  </span>
                )}
              </summary>
              <textarea
                value={isFluxActive ? fluxParams.negativePrompt : kreaParams.negativePrompt}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isFluxActive) {
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
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <DropdownButton options={VIDEO_DURATIONS} value={videoParams.duration} onChange={(v: string) => setVideoParams({...videoParams, duration: v})} formatOption={(opt) => opt.split(' ')[0] + 's'} />
                <DropdownButton options={VIDEO_RESOLUTIONS} value={videoParams.resolution} onChange={(v: string) => setVideoParams({...videoParams, resolution: v})} />
                <DropdownButton options={VIDEO_ASPECT_RATIOS} value={videoParams.aspectRatio} onChange={(v: string) => setVideoParams({...videoParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <NumberInput label="Guide" value={videoParams.guideScale} onChange={(v: number) => setVideoParams({...videoParams, guideScale: v})} min={1} max={8} step={0.5} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                  <input type="checkbox" checked={videoParams.matchAudioDur} onChange={(e) => setVideoParams({...videoParams, matchAudioDur: e.target.checked})} style={{ marginRight: '4px' }} />
                  Match Audio
                </label>
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
                      background: 'white',
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
                            {wanParams.loraItems.map((item, i) => (
                              <div key={`${item.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                            ))}
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
                      background: 'white',
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
            {activeTab === 'image' && !isFluxActive && (
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
                        background: 'white',
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
                        background: 'white',
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
    </div>
  );
};

export default FloatingCommandCenter;
