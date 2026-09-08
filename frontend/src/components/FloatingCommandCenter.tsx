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
  maskFile: File | null; // Mantenemos el estado pero no lo usamos en la UI si no hay input
  modelModeLabel: string;
  fluxGuideScale: number;
  embeddedGuidance: number;
}

// Componente auxiliar para menús desplegables inteligentes (Arriba/Abajo)
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
        // Si hay menos de 200px abajo, abrir hacia arriba
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
          padding: '6px 10px',
          background: 'rgba(255,255,255,0.5)',
          border: '1px solid var(--pf-border-default)',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'var(--pf-font-ui)',
          color: 'var(--pf-text-primary)',
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
        background: 'rgba(255,255,255,0.5)',
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { 
    handleGenerate, 
    isLoading, 
    setCapability, 
    imageModels,
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
    refModeLabel: 'None (Text-to-Image)',
    maskFile: null,
    modelModeLabel: 'Prompt Focused Denoising : Inpainted area will follow the prompt more closely', // Default seguro
    fluxGuideScale: 5,
    embeddedGuidance: 1,
  });

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
    // Limitar a 4 imágenes
    if (files.length > 4) {
      alert("Máximo 4 imágenes de referencia permitidas.");
      setFluxParams(prev => ({ ...prev, refFiles: Array.from(files).slice(0, 4) }));
    } else {
      setFluxParams(prev => ({ ...prev, refFiles: Array.from(files) }));
    }
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
    
    try {
      if (activeTab === 'video') {
        await handleGenerate({ prompt, ...videoParams });
      } else if (activeTab === 'image') {
        if (isFluxActive) {
          await handleGenerate({ 
            prompt, 
            negativePrompt: fluxParams.negativePrompt || undefined,
            steps: fluxParams.steps,
            resolution: fluxParams.resolution,
            aspectRatio: fluxParams.aspectRatio,
            seed: fluxParams.seed,
            numImages: fluxParams.numImages,
            refFiles: fluxParams.refFiles.length > 0 ? fluxParams.refFiles : undefined,
            refModeLabel: fluxParams.refModeLabel !== 'None (Text-to-Image)' ? fluxParams.refModeLabel : undefined,
            modelModeLabel: fluxParams.modelModeLabel,
            fluxGuideScale: fluxParams.fluxGuideScale,
            embeddedGuidance: fluxParams.embeddedGuidance,
          });
        } else {
          await handleGenerate({ 
            prompt, 
            negativePrompt: kreaParams.negativePrompt || undefined,
            steps: kreaParams.steps,
            resolution: kreaParams.resolution,
            aspectRatio: kreaParams.aspectRatio,
            seed: kreaParams.seed,
            numImages: kreaParams.numImages,
            stylePreset: kreaParams.stylePreset !== 'None' ? kreaParams.stylePreset : undefined,
          });
        }
      }
    } catch (error) {
      console.error('Error generating:', error);
    }
  }, [prompt, activeTab, videoParams, kreaParams, fluxParams, isFluxActive, handleGenerate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerateClick();
  }, [handleGenerateClick]);

  const videoDurations = ['2 Seconds', '3 Seconds', '5 Seconds', '8 Seconds', '10 Seconds', '15 Seconds', '20 Seconds', '25 Seconds', '30 Seconds'];
  const videoResolutions = ['1080p', '720p', '540p', '480p'];
  const videoAspectRatios = ['16:9 Landscape', '4:3 Standard', '1:1 Square', '3:4 Portrait', '9:16 Portrait'];
  
  const kreaStylePresets = ['None', 'Cinematic', 'Photographic', 'Anime', 'Cyberpunk'];
  const kreaResolutions = ['1024px (Standard)', '1536px (High)', '2048px (2K Ultra)'];
  const kreaAspectRatios = ['1:1 Square', '16:9 Landscape', '9:16 Portrait', '4:3 Standard', '3:4 Portrait'];

  const fluxResolutions = ['1024px (Estándar)', '1536px (Alta)', '2048px (2K Ultra)'];
  const fluxAspectRatios = ['1:1 Cuadrado', '16:9 Horizontal', '9:16 Vertical', '4:3 Estándar', '3:4 Vertical'];
  const fluxRefModes = ['None (Text-to-Image)', 'Subject/Scene + People or Objects (KI)', 'People or Objects Only (I)'];
  // Opciones simplificadas sin "Masked Denoising" obsoleto
  const fluxInpaintModes = [
    'Prompt Focused Denoising : Inpainted area will follow the prompt more closely',
    'Prompt Focused Denoising (2x)',
    'Prompt Focused Denoising (5x)'
  ];

  const isModelReady = (modelId: string) => {
    if (!imageModels || !Array.isArray(imageModels)) return false;
    return imageModels.some((m: any) => m.model_id === modelId);
  };

  const renderFileThumbnail = (file: File, type: 'ref' | 'video-start' | 'video-end' | 'video-audio') => {
    const url = URL.createObjectURL(file);
    const isImage = type !== 'video-audio';
    
    const handleClick = () => {
      if (isImage) setSelectedImage(url);
    };

    return (
      <div 
        key={url} 
        onClick={handleClick}
        style={{ 
          position: 'relative', 
          width: '40px', 
          height: '40px', 
          borderRadius: '6px', 
          overflow: 'hidden', 
          cursor: isImage ? 'pointer' : 'default',
          border: '1px solid var(--pf-border-default)',
          background: 'var(--pf-bg-secondary)'
        }}
      >
        {isImage ? (
          <img src={url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎵</div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (type === 'video-start') setVideoParams(p => ({...p, imageStartFile: null}));
            if (type === 'video-end') setVideoParams(p => ({...p, imageEndFile: null}));
            if (type === 'video-audio') setVideoParams(p => ({...p, audioFile: null}));
            if (type === 'ref') setFluxParams(p => ({...p, refFiles: p.refFiles.filter(f => f !== file)}));
          }}
          style={{
            position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px',
            borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
            fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
          }}
        >
          ×
        </button>
      </div>
    );
  };

  const renderLightbox = () => {
    if (!selectedImage) return null;
    return (
      <div 
        onClick={() => setSelectedImage(null)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}
      >
        <img 
          src={selectedImage} alt="Vista completa" 
          style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} 
        />
      </div>
    );
  };

  const renderModelSelector = () => {
    const models = activeTab === 'image' ? STATIC_IMAGE_MODELS : activeTab === 'video' ? STATIC_VIDEO_MODELS : [];
    const currentModelId = activeTab === 'image' ? selectedImageModelId : selectedVideoModelId;

    if (models.length === 0) return null;

    return (
      <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '8px' }}>
        {models.map((model) => {
          const isActive = currentModelId === model.id;
          const isReady = isModelReady(model.id);
          const isDisabled = model.comingSoon || !isReady;
          
          return (
            <button
              key={model.id}
              onClick={() => handleModelChange(model.id, !!model.comingSoon)}
              disabled={isDisabled}
              style={{
                padding: '4px 10px', borderRadius: '6px', border: 'none',
                background: isActive ? 'white' : 'transparent',
                fontFamily: 'var(--pf-font-ui)', fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                color: isDisabled ? 'var(--pf-text-muted)' : (isActive ? 'var(--pf-text-primary)' : 'var(--pf-text-secondary)'),
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                opacity: isDisabled ? 0.6 : 1, position: 'relative', transition: 'all 0.2s',
              }}
              title={model.comingSoon ? 'Próximamente' : (!isReady ? 'Cargando...' : model.name)}
            >
              {model.name}
              {isActive && isReady && !model.comingSoon && (
                <span style={{
                  position: 'absolute', top: '-2px', right: '-2px',
                  width: '8px', height: '8px', background: '#10B981',
                  borderRadius: '50%', border: '1px solid white'
                }} />
              )}
              {model.comingSoon && <span style={{ marginLeft: '4px', fontSize: '9px', opacity: 0.7 }}>Soon</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {renderLightbox()}
      <div style={{ width: '100%' }}>
        <div
          className="pf-glass-panel"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '20px',
            boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.1)',
            display: 'flex', flexDirection: 'column', overflow: 'visible', transition: 'all 0.3s ease',
          }}
        >
          <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['video', 'image', 'audio'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: 'none',
                    background: activeTab === tab ? 'var(--pf-text-primary)' : 'transparent',
                    color: activeTab === tab ? '#FFFFFF' : 'var(--pf-text-secondary)',
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

          <div style={{ padding: '16px' }}>
            {(activeTab === 'video' || (activeTab === 'image' && isFluxActive)) && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {activeTab === 'video' && (
                  <>
                    <label style={{ position: 'relative', cursor: 'pointer' }}>
                      <input type="file" accept="image/*" onChange={(e) => handleVideoFileChange('start', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: videoParams.imageStartFile ? 'var(--pf-bg-secondary)' : 'rgba(255,255,255,0.5)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                        <span>{videoParams.imageStartFile ? '🖼️ Start Loaded' : '+ Start'}</span>
                      </div>
                    </label>
                    {videoParams.imageStartFile && renderFileThumbnail(videoParams.imageStartFile, 'video-start')}
                    
                    <label style={{ position: 'relative', cursor: 'pointer' }}>
                      <input type="file" accept="image/*" onChange={(e) => handleVideoFileChange('end', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: videoParams.imageEndFile ? 'var(--pf-bg-secondary)' : 'rgba(255,255,255,0.5)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                        <span>{videoParams.imageEndFile ? '🖼️ End Loaded' : '+ End'}</span>
                      </div>
                    </label>
                    {videoParams.imageEndFile && renderFileThumbnail(videoParams.imageEndFile, 'video-end')}
                    
                    <label style={{ position: 'relative', cursor: 'pointer' }}>
                      <input type="file" accept="audio/*" onChange={(e) => handleVideoFileChange('audio', e.target.files?.[0] || null)} style={{ display: 'none' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: videoParams.audioFile ? 'var(--pf-bg-secondary)' : 'rgba(255,255,255,0.5)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                        <span>{videoParams.audioFile ? '🎵 Audio Loaded' : '+ Audio'}</span>
                      </div>
                    </label>
                    {videoParams.audioFile && renderFileThumbnail(videoParams.audioFile, 'video-audio')}
                  </>
                )}
                
                {activeTab === 'image' && isFluxActive && (
                  <>
                    <label style={{ position: 'relative', cursor: 'pointer' }}>
                      <input type="file" multiple accept="image/*" onChange={(e) => handleFluxRefFilesChange(Array.from(e.target.files || []))} style={{ display: 'none' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: fluxParams.refFiles.length > 0 ? 'var(--pf-bg-secondary)' : 'rgba(255,255,255,0.5)', border: '1px dashed var(--pf-border-default)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                        <span>{fluxParams.refFiles.length > 0 ? `📎 ${fluxParams.refFiles.length} Refs` : '+ Referencias'}</span>
                      </div>
                    </label>
                    {fluxParams.refFiles.slice(0, 4).map((f, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        {renderFileThumbnail(f, 'ref')}
                        <span style={{ position: 'absolute', bottom: '0', right: '0', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '8px', padding: '1px 3px', borderRadius: '4px' }}>{idx + 1}</span>
                      </div>
                    ))}
                  </>
                )}
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
                  width: '100%', minHeight: '44px', maxHeight: '120px', background: 'transparent',
                  border: 'none', outline: 'none', resize: 'vertical',
                  fontFamily: 'var(--pf-font-display)', fontSize: '16px', color: 'var(--pf-text-primary)',
                  lineHeight: 1.5, paddingRight: '140px',
                }}
                disabled={isLoading}
              />
              <button
                onClick={handleGenerateClick}
                disabled={!prompt.trim() || isLoading}
                style={{
                  position: 'absolute', right: '0', bottom: '0',
                  background: !prompt.trim() || isLoading ? 'var(--pf-border-subtle)' : 'var(--pf-text-primary)',
                  color: '#FFFFFF', fontFamily: 'var(--pf-font-ui)', fontSize: '13px', fontWeight: 600,
                  padding: '8px 20px', borderRadius: '99px', border: 'none',
                  cursor: !prompt.trim() || isLoading ? 'not-allowed' : 'pointer',
                  opacity: !prompt.trim() || isLoading ? '0.5' : '1', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {isLoading ? '...' : 'Generar ✨'}
              </button>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--pf-border-subtle)' }}>
              {activeTab === 'video' && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <DropdownButton options={videoDurations} value={videoParams.duration} onChange={(v: string) => setVideoParams({...videoParams, duration: v})} formatOption={(opt) => opt.split(' ')[0] + '...'} />
                  <DropdownButton options={videoResolutions} value={videoParams.resolution} onChange={(v: string) => setVideoParams({...videoParams, resolution: v})} />
                  <DropdownButton options={videoAspectRatios} value={videoParams.aspectRatio} onChange={(v: string) => setVideoParams({...videoParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                  <NumberInput label="Guide" value={videoParams.guideScale} onChange={(v: number) => setVideoParams({...videoParams, guideScale: v})} min={1} max={8} step={0.5} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
                    <input type="checkbox" checked={videoParams.matchAudioDur} onChange={(e) => setVideoParams({...videoParams, matchAudioDur: e.target.checked})} style={{ marginRight: '4px' }} />
                    Match Audio
                  </label>
                </div>
              )}

              {activeTab === 'image' && !isFluxActive && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <DropdownButton options={kreaStylePresets} value={kreaParams.stylePreset} onChange={(v: string) => setKreaParams({...kreaParams, stylePreset: v})} />
                  <DropdownButton options={kreaResolutions} value={kreaParams.resolution} onChange={(v: string) => setKreaParams({...kreaParams, resolution: v})} formatOption={(opt) => opt.split(' ')[0]} />
                  <DropdownButton options={kreaAspectRatios} value={kreaParams.aspectRatio} onChange={(v: string) => setKreaParams({...kreaParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                  <NumberInput label="Steps" value={kreaParams.steps} onChange={(v: number) => setKreaParams({...kreaParams, steps: v})} min={1} max={50} />
                </div>
              )}

              {activeTab === 'image' && isFluxActive && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <DropdownButton options={fluxResolutions} value={fluxParams.resolution} onChange={(v: string) => setFluxParams({...fluxParams, resolution: v})} formatOption={(opt) => opt.split(' ')[0]} />
                  <DropdownButton options={fluxAspectRatios} value={fluxParams.aspectRatio} onChange={(v: string) => setFluxParams({...fluxParams, aspectRatio: v})} formatOption={(opt) => opt.split(' ')[0]} />
                  <NumberInput label="Steps" value={fluxParams.steps} onChange={(v: number) => setFluxParams({...fluxParams, steps: v})} min={1} max={50} />
                  
                  <div style={{ position: 'relative' }}>
                     <details style={{ display: 'inline-block' }}>
                        <summary style={{
                          listStyle: 'none',
                          background: 'transparent',
                          border: '1px solid var(--pf-border-default)',
                          borderRadius: '8px',
                          padding: '6px 10px',
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
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          zIndex: 1000,
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          width: '220px'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--pf-text-muted)', marginBottom: '4px' }}>Reference Mode</div>
                          <DropdownButton options={fluxRefModes} value={fluxParams.refModeLabel} onChange={(v: string) => setFluxParams({...fluxParams, refModeLabel: v})} />
                          
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--pf-text-muted)', marginTop: '8px', marginBottom: '4px' }}>Inpaint Mode</div>
                          <DropdownButton options={fluxInpaintModes} value={fluxParams.modelModeLabel} onChange={(v: string) => setFluxParams({...fluxParams, modelModeLabel: v})} />
                          
                          <div style={{ marginTop: '8px', borderTop: '1px solid var(--pf-border-subtle)', paddingTop: '8px' }}>
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
    </>
  );
};

export default FloatingCommandCenter;