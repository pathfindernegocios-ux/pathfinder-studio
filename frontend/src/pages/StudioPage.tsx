// src/pages/StudioPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import FloatingCommandCenter from '../components/FloatingCommandCenter';
import { useCreations } from '../hooks/useCreations';
import { useGenerationContext } from '../context/GenerationContext';
import { Download, Trash2, RefreshCw, Maximize2, Save, Loader2, Music } from 'lucide-react';

interface SessionItem {
  id: string;
  prompt?: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'audio';
  modelLabel: string;
  createdAt: number;
  status: 'temporary' | 'saved';
  isGenerating?: boolean;
}

const StudioPage: React.FC = () => {
  const { saveCreation } = useCreations();
  const { 
    imageSrcs, 
    videoSrc, 
    generationInfo,
    isLoading,
    capability
  } = useGenerationContext();
  
  const [sessionHistory, setSessionHistory] = useState<SessionItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const sidebarWidth = 280;

  // 1. Cuando empieza a cargar, agregamos el "placeholder" de generación al FINAL
  useEffect(() => {
    if (isLoading && generationInfo?.prompt) {
      setSessionHistory(prev => {
        if (prev.some(item => item.isGenerating)) return prev;
        
        const newItem: SessionItem = {
          id: `gen-${Date.now()}`,
          prompt: generationInfo.prompt,
          mediaUrls: [],
          mediaType: capability === 'video' ? 'video' : capability === 'audio' ? 'audio' : 'image',
          modelLabel: generationInfo.modelId || (capability === 'video' ? 'LTX-2.3' : 'Flux/Krea'),
          createdAt: Date.now(),
          status: 'temporary',
          isGenerating: true
        };
        return [...prev, newItem];
      });
    }
  }, [isLoading, generationInfo?.prompt, capability]);

  // 2. Cuando termina de cargar, reemplazamos el placeholder con el resultado real
  useEffect(() => {
    if (!isLoading) {
      let newMediaUrl: string | null = null;
      let urls: string[] = [];

      if (videoSrc) {
        newMediaUrl = videoSrc;
        urls = [videoSrc];
      } else if (imageSrcs && imageSrcs.length > 0) {
        newMediaUrl = imageSrcs[0];
        urls = imageSrcs;
      }

      if (newMediaUrl) {
        setSessionHistory(prev => prev.map(item => {
          if (item.isGenerating) {
            return {
              ...item,
              mediaUrls: urls,
              isGenerating: false,
            };
          }
          return item;
        }));
        
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    }
  }, [isLoading, videoSrc, imageSrcs]);

  const handleSave = async (item: SessionItem) => {
    if (item.status === 'saved' || !item.mediaUrls[0] || isSavingId) return;
    setIsSavingId(item.id);
    try {
      await saveCreation({
        tempUrl: item.mediaUrls[0],
        prompt: item.prompt || '',
        seed: -1, 
        duration: item.mediaType === 'video' ? '5s' : '',
        resolution: 'Standard',
        aspectRatio: '1:1',
        guideScale: 0,
        matchAudioDur: false,
        mediaType: item.mediaType,
        modelId: item.modelLabel.toLowerCase().replace(/\s/g, '-')
      });
      setSessionHistory(prev => prev.map(i => i.id === item.id ? { ...i, status: 'saved' } : i));
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSavingId(null);
    }
  };

  const handleDiscard = (id: string) => {
    setSessionHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading:", error);
    }
  };

  const handleRetry = (prompt: string) => {
    const event = new CustomEvent('pathfinder-set-prompt', { detail: prompt });
    window.dispatchEvent(event);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${sidebarWidth}px 1fr`, height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--pf-bg-primary)' }}>
      
      {/* SIDEBAR */}
      <div style={{ position: 'relative', height: '100%', borderRight: '1px solid var(--pf-border-subtle)', background: 'var(--pf-bg-secondary)', zIndex: 40 }}>
        <Sidebar />
      </div>

      {/* CHAT AREA - Scroll natural */}
      <div
        style={{
          position: 'relative',
          overflowY: 'auto',
          height: '100%',
          background: 'var(--pf-bg-primary)',
          padding: '40px 20px',
          paddingBottom: '340px', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px', // Reducido ligeramente de 40px a 32px para compensar el tamaño
          scrollBehavior: 'smooth'
        }}
      >
        {sessionHistory.length === 0 && !isLoading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.5, marginTop: '10vh' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '20px', filter: 'grayscale(100%)' }}>✨</div>
            <h2 className="pf-font-prompt" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--pf-text-primary)', marginBottom: '10px' }}>
              ¿Qué quieres crear hoy?
            </h2>
            <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '0.9rem', color: 'var(--pf-text-secondary)', maxWidth: '320px' }}>
              Escribe un prompt abajo. Las generaciones aparecerán aquí como un chat.
            </p>
          </div>
        )}

        {sessionHistory.map((item) => (
          <div
            key={item.id}
            style={{
              width: '100%',
              maxWidth: '600px', // REDUCIDO: De 800px a 600px (-25%)
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              animation: 'fadeInSlide 0.5s ease-out'
            }}
          >
            {/* Prompt del Usuario */}
            {!item.isGenerating && item.prompt && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                <div style={{ 
                  background: 'var(--pf-bg-secondary)', 
                  padding: '10px 14px', 
                  borderRadius: '12px', 
                  borderTopRightRadius: '2px', 
                  color: 'var(--pf-text-primary)', 
                  fontFamily: 'var(--pf-font-ui)', 
                  fontSize: '0.9rem', // Ligeramente más pequeño
                  lineHeight: '1.4',
                  maxWidth: '80%'
                }}>
                  {item.prompt}
                </div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--pf-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', flexShrink: 0 }}>Tú</div>
              </div>
            )}

            {/* Respuesta de la IA */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--pf-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#000', fontWeight: 'bold', flexShrink: 0 }}>IA</div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                {!item.isGenerating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--pf-text-muted)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--pf-text-secondary)' }}>{item.modelLabel}</span>
                    {item.status === 'saved' && <span style={{ color: '#10B981' }}>• Guardado</span>}
                  </div>
                )}

                {/* Contenedor del Media con Aspect Ratio Fijo durante la carga */}
                <div 
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: item.isGenerating ? '16/9' : 'auto',
                    minHeight: item.isGenerating ? '220px' : 'auto', // Reducido de 300px
                    background: '#000',
                    borderRadius: '14px', // Ligeramente menos redondeado
                    overflow: 'hidden',
                    boxShadow: item.isGenerating ? 'none' : '0 6px 24px rgba(0,0,0,0.1)', // Sombra más suave
                    border: '1px solid var(--pf-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* ESTADO: GENERANDO */}
                  {item.isGenerating && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', gap: '10px',
                      zIndex: 10
                    }}>
                      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--pf-text-muted)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--pf-text-muted)', letterSpacing: '1px', fontWeight: 600 }}>CREANDO...</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--pf-text-secondary)' }}>{item.modelLabel}</span>
                    </div>
                  )}

                  {/* ESTADO: LISTO */}
                  {!item.isGenerating && item.mediaUrls.length > 0 && (
                    <div style={{ animation: 'imagePopIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      {item.mediaType === 'video' ? (
                        <video src={item.mediaUrls[0]} controls className="w-full" style={{ maxHeight: '33vh', objectFit: 'contain', borderRadius: '14px' }} />
                      ) : item.mediaType === 'audio' ? (
                         <div style={{ padding: '24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', background: 'var(--pf-bg-secondary)', borderRadius: '14px' }}>
                           <Music size={40} style={{ color: 'var(--pf-text-secondary)' }} />
                           <audio src={item.mediaUrls[0]} controls style={{ width: '100%' }} />
                         </div>
                      ) : (
                        <img 
                          src={item.mediaUrls[0]} 
                          alt={item.prompt} 
                          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '33vh', objectFit: 'contain', cursor: 'pointer' }}
                          onClick={() => setSelectedMedia(item.mediaUrls[0])}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Botones de Acción */}
                {!item.isGenerating && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                    {item.status === 'temporary' && (
                      <ActionButton 
                        onClick={() => handleSave(item)} 
                        disabled={isSavingId === item.id}
                        icon={<Save size={14} />} 
                        label={isSavingId === item.id ? "Guardando..." : "Guardar"} 
                      />
                    )}
                    <ActionButton onClick={() => handleDownload(item.mediaUrls[0], `pathfinder-${item.id.slice(-6)}.${item.mediaType === 'video' ? 'mp4' : 'png'}`)} icon={<Download size={14} />} label="Descargar" />
                    <ActionButton onClick={() => handleRetry(item.prompt || "")} icon={<RefreshCw size={14} />} label="Variación" />
                    <ActionButton onClick={() => handleDiscard(item.id)} icon={<Trash2 size={14} />} label="Eliminar" danger />
                    <ActionButton onClick={() => setSelectedMedia(item.mediaUrls[0])} icon={<Maximize2 size={14} />} label="Pantalla Completa" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div ref={bottomRef} style={{ height: '1px' }} />
      </div>

      {/* FLOATING COMMAND CENTER */}
      <div style={{ position: 'fixed', bottom: '32px', left: `calc(${sidebarWidth}px + ((100vw - ${sidebarWidth}px) / 2) - (min(90%, 800px) / 2))`, width: 'min(90%, 800px)', zIndex: 50, transition: 'left 0.3s ease' }}>
        <FloatingCommandCenter />
      </div>

      {/* LIGHTBOX */}
      {selectedMedia && (
        <div onClick={() => setSelectedMedia(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s', cursor: 'zoom-out' }}>
          <button onClick={(e) => { e.stopPropagation(); setSelectedMedia(null); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '2rem', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer' }}>×</button>
          {selectedMedia.includes('mp4') ? <video src={selectedMedia} controls autoPlay style={{ maxWidth: '90%', maxHeight: '90vh' }} onClick={e => e.stopPropagation()} /> : <img src={selectedMedia} alt="Full" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />}
        </div>
      )}
      
      <style>{`
        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes fadeInSlide { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes imagePopIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// Componente auxiliar para botones limpios
const ActionButton = ({ onClick, icon, label, danger, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '5px 10px',
      background: 'transparent',
      border: '1px solid var(--pf-border-subtle)',
      borderRadius: '6px',
      color: danger ? '#ef4444' : 'var(--pf-text-secondary)',
      fontSize: '0.75rem',
      fontFamily: 'var(--pf-font-ui)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s',
      userSelect: 'none'
    }}
    onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'var(--pf-bg-secondary)', e.currentTarget.style.borderColor = danger ? '#ef4444' : 'var(--pf-text-secondary)')}
    onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = 'transparent', e.currentTarget.style.borderColor = 'var(--pf-border-subtle)')}
  >
    {icon} <span>{label}</span>
  </button>
);

export default StudioPage;