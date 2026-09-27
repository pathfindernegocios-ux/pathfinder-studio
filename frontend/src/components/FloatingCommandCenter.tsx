// src/components/FloatingCommandCenter.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGenerationContext } from '../context/GenerationContext';
import { supabase } from '../lib/supabaseClient';
import { Video, Image as ImageIcon, Music, Paperclip, Sparkles, X, Loader2, Mic, Mic2, Pencil } from 'lucide-react';
import AudioTrimmer from './AudioTrimmer';

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
const WAN_RESOLUTIONS = ['480p', '540p', '720p'];
const WAN_ASPECTS = ['16:9 Landscape', '4:3 Standard', '1:1 Square', '3:4 Portrait', '9:16 Portrait'];
const WAN_SAMPLERS = ['UniPC (recomendado)', 'Euler', 'Euler a', 'DPM++ 2M', 'DPM++ 2M SDE', 'Heun', 'LMS'];

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
  const [activeTab, setActiveTab] = useState<TabType>('video');
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

  const [selectedImageModelId, setSelectedImageModelId] = useState<string>('krea-2-turbo');
  const [selectedVideoModelId, setSelectedVideoModelId] = useState<string>(activeVideoModelId || 'ltx-2.3');
  const [selectedTtsModelId, setSelectedTtsModelId] = useState<string>('omnivoice');
  const [expandedAudio, setExpandedAudio] = useState<'audioGuide' | 'audioGuide2' | null>(null);
  const [newLoraUrl, setNewLoraUrl] = useState('');
  const [loraAdding, setLoraAdding] = useState(false);

  // Marca si el usuario tocó manualmente una tab durante esta sesión.
  // Mientras sea false, permitimos auto-select según backend online.
  // Se reinicia al desmontar el FCM (ej: ir al landing y volver).
  const userTouchedTabRef = useRef(false);

  const isVideoWan = selectedVideoModelId.startsWith('wan-');
  const isVideoLtx = selectedVideoModelId === 'ltx-2.3';

  // Estado de la estación activa (badge offline/online)
  const currentStationModelId = activeTab === 'image'
    ? (selectedImageModelId || activeImageModelId)
    : activeTab === 'video'
      ? (isVideoWan ? 'wan-dual' : 'ltx-2.3')
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
    loraItems: [],
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

  // ── AUTO-SELECT: si el usuario no tocó una tab manualmente y el tab actual
  //    no tiene ningún backend online, saltar al que sí lo tenga.
  //    Al desmontar el FCM (ir al landing y volver), userTouchedTabRef se reinicia.
  useEffect(() => {
    if (userTouchedTabRef.current) return;
    if (!stationStatusMap || Object.keys(stationStatusMap).length === 0) return;

    const currentTabHasOnline = MODELS_BY_CAPABILITY[activeTab].some(
      m => stationStatusMap[m.runtimeId] === 'online',
    );
    if (currentTabHasOnline) return;

    const onlineCap = getOnlineCapability(stationStatusMap);
    if (!onlineCap) return;

    setActiveTab(onlineCap);
    setCapability(onlineCap);

    const firstOnline = getFirstOnlineModel(onlineCap, stationStatusMap);
    if (!firstOnline) return;

    if (onlineCap === 'video') {
      setSelectedVideoModelId(firstOnline.id);
      setActiveVideoModelId(firstOnline.runtimeId);
      if (firstOnline.id === 'wan-i2v') {
        setWanParams(prev => ({ ...prev, mode: 'i2v' }));
      } else if (firstOnline.id === 'wan-t2v') {
        setWanParams(prev => ({ ...prev, mode: 't2v' }));
      }
    } else if (onlineCap === 'image') {
      setSelectedImageModelId(firstOnline.id);
      if (setActiveImageModelId) setActiveImageModelId(firstOnline.id);
    } else if (onlineCap === 'audio') {
      setSelectedTtsModelId(firstOnline.id);
      setTtsParams(prev => ({
        ...prev,
        voiceMode: firstOnline.id === 'omnivoice' ? 'VD' : 'A',
        language: firstOnline.id === 'omnivoice' ? 'Auto' : 'Spanish',
        steps: firstOnline.id === 'omnivoice' ? 32 : 25,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationStatusMap]);

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
  }, [prompt, activeTab, isFluxActive, isVideoLtx, isVideoWan, videoParams, wanParams, fluxParams, kreaParams, ttsParams, selectedVideoModelId, selectedImageModelId, selectedTtsModelId, handleGenerate]);

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
                  userTouchedTabRef.current = true;
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
                      left: 0,
                      background: 'white',
                      border: '1px solid var(--pf-border-default)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      width: '280px'
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
                        left: 0,
                        background: 'white',
                        border: '1px solid var(--pf-border-default)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        width: '200px'
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
                        left: 0,
                        background: 'white',
                        border: '1px solid var(--pf-border-default)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        width: '220px'
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
    </div>
  );
};

export default FloatingCommandCenter;
