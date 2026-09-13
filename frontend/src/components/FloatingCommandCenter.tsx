// src/components/FloatingCommandCenter.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGenerationContext } from '../context/GenerationContext';

type TabType = 'video' | 'image' | 'audio';

// Definición estática de modelos disponibles en la UI
const STATIC_IMAGE_MODELS = [
  { id: 'krea-2-turbo', name: 'Krea 2', type: 'krea' },
  { id: 'flux-2-klein-4b', name: 'Flux 2', type: 'flux' },
  { id: 'wan-i2v', name: 'Wan I2V', type: 'wan', comingSoon: true },
];

const STATIC_VIDEO_MODELS = [
  { id: 'ltx-2.3', name: 'LTX 2.3', type: 'ltx' },
  { id: 'wan-i2v-video', name: 'Wan I2V', type: 'wan', comingSoon: true },
];

// Arrays de opciones simplificadas
const VIDEO_DURATIONS = ['5 Seconds', '10 Seconds'];
const VIDEO_RESOLUTIONS = ['720p', '1080p'];
const VIDEO_ASPECT_RATIOS = ['16:9 Landscape', '9:16 Portrait', '1:1 Square'];

const KREA_STYLES = ['None', 'Cinematic', 'Anime', 'Photorealistic', '3D Render'];
const KREA_RESOLUTIONS = ['1024px (Standard)', '1536px (High Res)'];
const KREA_ASPECT_RATIOS = ['1:1 Square', '16:9 Landscape', '9:16 Portrait', '4:5 Portrait'];

// Simplificado: Solo modos con referencia (Opción "Ninguna" eliminada)
const FLUX_REF_MODES = [
  'Sujeto/Escenario + Personas u Objetos (KI)',
  'Solo Personas u Objetos (I)'
];

const FLUX_RESOLUTIONS = ['1024px (Estándar)', '1536px (Alta)'];
const FLUX_ASPECT_RATIOS = ['1:1 Cuadrado', '16:9 Paisaje', '9:16 Retrato', '4:5 Retrato'];

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
  modelModeLabel: string; // Se mantiene internamente pero no se edita en UI
  fluxGuideScale: number;
  embeddedGuidance: number;
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
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'var(--pf-font-ui)',
          color: '#374151',
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
          border: '1px solid #E5E7EB',
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
                color: value === option ? '#111827' : '#4B5563',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
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
    <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{label}</span>
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
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'var(--pf-font-ui)',
        color: '#111827'
      }}
    />
  </div>
);

const FloatingCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [prompt, setPrompt] = useState('');
  
  // --- Cache de Object URLs -------------------------------------------------
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
    setCapability, 
    activeImageModelId, 
    setActiveImageModelId 
  } = useGenerationContext();

  const [selectedImageModelId, setSelectedImageModelId] = useState<string>('krea-2-turbo');
  const [selectedVideoModelId, setSelectedVideoModelId] = useState<string>('ltx-2.3');

  useEffect(() => {
    if (activeTab === 'image') {
      if (activeImageModelId && STATIC_IMAGE_MODELS.some(m => m.id === activeImageModelId)) {
        setSelectedImageModelId(activeImageModelId);
      } else if (!activeImageModelId) {
        setSelectedImageModelId('krea-2-turbo');
      }
    } else if (activeTab === 'video') {
       if (!activeImageModelId) {
         setSelectedVideoModelId('ltx-2.3');
       }
    }
  }, [activeTab, activeImageModelId]);

  const isFluxActive = selectedImageModelId.includes('flux');
  
  const [videoParams, setVideoParams] = useState<VideoParams>({
    imageStartFile: null,
    imageEndFile: null,
    audioFile: null,
    duration: '5 Seconds',
    resolution: '1080p',
    aspectRatio: '16:9 Landscape',
    guideScale: 4.0,
    seed: -1,
    matchAudioDur: false,
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
    // Valor por defecto activado (KI)
    refModeLabel: 'Sujeto/Escenario + Personas u Objetos (KI)',
    maskFile: null,
    // Valor fijo interno para compatibilidad backend
    modelModeLabel: 'Masked Denoising : Inpainted area may reuse some content that has been masked',
    fluxGuideScale: 5,
    embeddedGuidance: 1,
  });

  // Limpieza de URLs huérfanas
  useEffect(() => {
    const activeFiles = new Set<File>([
      ...(videoParams.imageStartFile ? [videoParams.imageStartFile] : []),
      ...(videoParams.imageEndFile ? [videoParams.imageEndFile] : []),
      ...(videoParams.audioFile ? [videoParams.audioFile] : []),
      ...fluxParams.refFiles,
    ]);
    const cache = objectUrlCacheRef.current;
    for (const [file, url] of cache.entries()) {
      if (!activeFiles.has(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    }
  }, [videoParams.imageStartFile, videoParams.imageEndFile, videoParams.audioFile, fluxParams.refFiles]);

  useEffect(() => {
    return () => {
      objectUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlCacheRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'video') setCapability('video');
    else if (activeTab === 'image') setCapability('image');
    else if (activeTab === 'audio') setCapability('audio');
  }, [activeTab, setCapability]);

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

  const handleVideoFileChange = (type: 'start' | 'end' | 'audio', file: File | null) => {
    setVideoParams(prev => ({ ...prev, [type === 'start' ? 'imageStartFile' : type === 'end' ? 'imageEndFile' : 'audioFile']: file }));
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
    
    // Lógica: Si hay referencias, forzar a KI si no está en modo 'I'
    setFluxParams(prev => {
      const newMode = slicedFiles.length > 0 && !prev.refModeLabel.includes('(I)') 
        ? 'Sujeto/Escenario + Personas u Objetos (KI)' 
        : prev.refModeLabel;
      
      return { 
        ...prev, 
        refFiles: slicedFiles,
        refModeLabel: newMode 
      };
    });
  };

  const handleModelChange = (modelId: string, isComingSoon: boolean) => {
    if (isComingSoon) return;
    if (activeTab === 'image') {
      setSelectedImageModelId(modelId);
      if (setActiveImageModelId) setActiveImageModelId(modelId);
    }
  };

  const handleGenerateClick = useCallback(async () => {
    if (!prompt.trim()) return;

    const ratioLabel =
      activeTab === 'video'
        ? videoParams.aspectRatio
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
        await handleGenerate({ prompt, ...videoParams });
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
            refModeLabel: fluxParams.refModeLabel, // Siempre enviado
            maskFile: null, // Fijo
            modelModeLabel: fluxParams.modelModeLabel, // Fijo interno
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
      }
    } catch (error) {
      console.error("Error initiating generation:", error);
    }
  }, [prompt, activeTab, isFluxActive, videoParams, fluxParams, kreaParams, selectedVideoModelId, selectedImageModelId, handleGenerate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateClick();
    }
  };

  // Helper para renderizar thumbnails
  const renderFileThumbnail = (file: File, type: string) => {
    const url = getObjectUrl(file);
    const isAudio = type.includes('audio');
    
    return (
      <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
        {isAudio ? (
          <div style={{ width: '100%', height: '100%', background: '#E5E7EB', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎵</div>
        ) : (
          <img src={url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E5E7EB' }} />
        )}
        <button
          onClick={() => {
            if (type === 'video-start') handleVideoFileChange('start', null);
            if (type === 'video-end') handleVideoFileChange('end', null);
            if (type === 'video-audio') handleVideoFileChange('audio', null);
            if (type === 'ref') handleFluxRefFilesChange([]); // Simplificación: limpia todo al borrar uno
          }}
          style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#EF4444', color: 'white', border: 'none',
            fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >×</button>
      </div>
    );
  };

  const renderModelSelector = () => {
    const models = activeTab === 'image' ? STATIC_IMAGE_MODELS : STATIC_VIDEO_MODELS;
    const selectedId = activeTab === 'image' ? selectedImageModelId : selectedVideoModelId;
    // Eliminada la variable inutilizada setSelectedId

    return (
      <div style={{ display: 'flex', gap: '6px' }}>
        {models.map(model => (
          <button
            key={model.id}
            onClick={() => handleModelChange(model.id, !!model.comingSoon)}
            disabled={!!model.comingSoon}
            style={{
              padding: '6px 12px',
              background: selectedId === model.id ? '#111827' : '#F3F4F6',
              color: selectedId === model.id ? '#FFFFFF' : (model.comingSoon ? '#9CA3AF' : '#4B5563'),
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
          background: '#FFFFFF',
          backdropFilter: 'none',
          border: '1px solid #E5E7EB',
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
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '5px 12px', borderRadius: '8px', border: 'none',
                  background: activeTab === tab ? '#111827' : 'transparent',
                  color: activeTab === tab ? '#FFFFFF' : '#4B5563',
                  fontFamily: 'var(--pf-font-ui)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {tab === 'video' ? '🎬 Video' : tab === 'image' ? '🖼️ Imagen' : '🎵 Audio'}
              </button>
            ))}
          </div>
          {(activeTab === 'image' || activeTab === 'video') && renderModelSelector()}
        </div>

        <div style={{ padding: '12px 14px' }}>
          {(activeTab === 'video' || (activeTab === 'image' && isFluxActive)) && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {activeTab === 'video' && (
                <>
                  <label style={{ position: 'relative', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" onChange={(e) => handleVideoFileChange('start', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: videoParams.imageStartFile ? '#F3F4F6' : '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: '#4B5563' }}>
                      <span>{videoParams.imageStartFile ? '🖼️ Start Loaded' : '+ Start'}</span>
                    </div>
                  </label>
                  {videoParams.imageStartFile && renderFileThumbnail(videoParams.imageStartFile, 'video-start')}
                  
                  <label style={{ position: 'relative', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" onChange={(e) => handleVideoFileChange('end', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: videoParams.imageEndFile ? '#F3F4F6' : '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: '#4B5563' }}>
                      <span>{videoParams.imageEndFile ? '🖼️ End Loaded' : '+ End'}</span>
                    </div>
                  </label>
                  {videoParams.imageEndFile && renderFileThumbnail(videoParams.imageEndFile, 'video-end')}
                  
                  <label style={{ position: 'relative', cursor: 'pointer' }}>
                    <input type="file" accept="audio/*" onChange={(e) => handleVideoFileChange('audio', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: videoParams.audioFile ? '#F3F4F6' : '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: '#4B5563' }}>
                      <span>{videoParams.audioFile ? '🎵 Audio Loaded' : '+ Audio'}</span>
                    </div>
                  </label>
                  {videoParams.audioFile && renderFileThumbnail(videoParams.audioFile, 'video-audio')}
                </>
              )}
              
              {activeTab === 'image' && isFluxActive && (
                <>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: fluxParams.refFiles.length > 0 ? '#F3F4F6' : '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: '#4B5563' }}>
                      <span>{fluxParams.refFiles.length > 0 ? `📎 ${fluxParams.refFiles.length} Refs` : '+ Referencias'}</span>
                    </div>
                  </label>
                  {fluxParams.refFiles.slice(0, 4).map((f, idx) => (
                    <div key={`${f.name}-${f.lastModified}-${idx}`} style={{ position: 'relative' }}>
                      {renderFileThumbnail(f, 'ref')}
                      <span style={{ position: 'absolute', bottom: '0', right: '0', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '8px', padding: '1px 3px', borderRadius: '4px' }}>{idx + 1}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Selector de Reference Mode visible inmediatamente si hay refs (Solo Flux) */}
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
              placeholder={activeTab === 'video' ? "Describe tu video..." : "Describe tu imagen..."}
              rows={1}
              style={{
                width: '100%', minHeight: '38px', maxHeight: '110px', background: 'transparent',
                border: 'none', outline: 'none', resize: 'vertical',
                fontFamily: 'var(--pf-font-display)', fontSize: '15px', color: '#111827',
                lineHeight: 1.4, paddingRight: '140px',
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleGenerateClick}
              disabled={!prompt.trim() || isLoading}
              style={{
                position: 'absolute', right: '0', bottom: '0',
                background: !prompt.trim() || isLoading ? '#E5E7EB' : '#111827',
                color: '#FFFFFF', fontFamily: 'var(--pf-font-ui)', fontSize: '13px', fontWeight: 600,
                padding: '7px 18px', borderRadius: '99px', border: 'none',
                cursor: !prompt.trim() || isLoading ? 'not-allowed' : 'pointer',
                opacity: !prompt.trim() || isLoading ? '0.5' : '1', transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {isLoading ? '...' : 'Generar ✨'}
            </button>
          </div>

          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F3F4F6' }}>
            {activeTab === 'video' && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <DropdownButton options={VIDEO_DURATIONS} value={videoParams.duration} onChange={(v: string) => setVideoParams({...videoParams, duration: v})} formatOption={(opt) => opt.split(' ')[0] + '...'} />
                <DropdownButton options={VIDEO_RESOLUTIONS} value={videoParams.resolution} onChange={(v: string) => setVideoParams({...videoParams, resolution: v})} />
                <DropdownButton options={VIDEO_ASPECT_RATIOS} value={videoParams.aspectRatio} onChange={(v: string) => setVideoParams({...videoParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <NumberInput label="Guide" value={videoParams.guideScale} onChange={(v: number) => setVideoParams({...videoParams, guideScale: v})} min={1} max={8} step={0.5} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: '#4B5563' }}>
                  <input type="checkbox" checked={videoParams.matchAudioDur} onChange={(e) => setVideoParams({...videoParams, matchAudioDur: e.target.checked})} style={{ marginRight: '4px' }} />
                  Match Audio
                </label>
              </div>
            )}

            {activeTab === 'image' && !isFluxActive && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <DropdownButton options={KREA_STYLES} value={kreaParams.stylePreset} onChange={(v: string) => setKreaParams({...kreaParams, stylePreset: v})} />
                <DropdownButton options={KREA_RESOLUTIONS} value={kreaParams.resolution} onChange={(v: string) => setKreaParams({...kreaParams, resolution: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <DropdownButton options={KREA_ASPECT_RATIOS} value={kreaParams.aspectRatio} onChange={(v: string) => setKreaParams({...kreaParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <NumberInput label="Steps" value={kreaParams.steps} onChange={(v: number) => setKreaParams({...kreaParams, steps: v})} min={1} max={50} />
              </div>
            )}

            {activeTab === 'image' && isFluxActive && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <DropdownButton options={FLUX_RESOLUTIONS} value={fluxParams.resolution} onChange={(v: string) => setFluxParams({...fluxParams, resolution: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <DropdownButton options={FLUX_ASPECT_RATIOS} value={fluxParams.aspectRatio} onChange={(v: string) => setFluxParams({...fluxParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                <NumberInput label="Steps" value={fluxParams.steps} onChange={(v: number) => setFluxParams({...fluxParams, steps: v})} min={1} max={50} />
                
                <div style={{ position: 'relative' }}>
                   <details style={{ display: 'inline-block' }}>
                      <summary style={{
                        listStyle: 'none',
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '12px',
                        fontFamily: 'var(--pf-font-ui)',
                        color: '#4B5563',
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
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        width: '200px'
                      }}>
                        {/* Solo Guide Scale y Embedded Guidance quedan aquí */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingCommandCenter;