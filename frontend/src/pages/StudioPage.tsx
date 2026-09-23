// src/pages/StudioPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import FloatingCommandCenter from '../components/FloatingCommandCenter';
import { useCreations } from '../hooks/useCreations';
import { useAuth } from '../hooks/useAuth';
import { useGenerationContext, type SessionItem } from '../context/GenerationContext';
import { Download, Trash2, RefreshCw, Maximize2, Save, Loader2, Music, HelpCircle, Sparkles } from 'lucide-react';

// NOTA IMPORTANTE: esta página YA NO monta su propio <Sidebar/>. El Sidebar
// vive una sola vez, en App.tsx, y esta página simplemente llena el espacio
// que App le da (el <main>). Montarlo aquí también fue lo que causaba el
// sidebar duplicado.

// Ancho de la tarjeta de entrega (skeleton o resultado final).
// Compacto a propósito: nunca más ancho que 220px, y respeta el aspect ratio
// real para que el ratio se note a simple vista sin abrir el archivo.
const frameWidthStyle = (aspectRatioCss: string): string => {
  const [wRaw, hRaw] = aspectRatioCss.split('/');
  const w = parseFloat(wRaw);
  const h = parseFloat(hRaw);
  if (!w || !h) return 'min(220px, 55vw)';
  return `min(220px, 55vw, calc(38vh * ${w} / ${h}))`;
};

const StudioPage: React.FC = () => {
  const { saveCreation, saveError } = useCreations();
  const { profile } = useAuth();

  // Datos del usuario para avatares del chat
  const userAvatarUrl = profile?.avatar_url || null;
  const userInitial = (
    profile?.username?.[0] ||
    profile?.full_name?.[0] ||
    profile?.email?.[0] ||
    'U'
  ).toUpperCase();
  const {
    sessionHistory,
    isLoading,
    updateSessionItem,
    removeSessionItem,
    capability,
    activeImageModelId,
    stationStatusMap,
  } = useGenerationContext();

  const currentModelId = capability === 'image'
    ? activeImageModelId
    : capability === 'video'
      ? 'ltx-2.3'
      : null;
  const isCurrentModelOnline = currentModelId
    ? stationStatusMap[currentModelId] === 'online'
    : false;

  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  // Índice de la imagen seleccionada por item (para el stack cuando hay >1)
  const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState<Record<string, number>>({});

  const bottomRef = useRef<HTMLDivElement>(null);

  // Banner de error de guardado — se auto-limpia a los 8s
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    if (!saveError) return;
    setBannerError(saveError);
    const t = window.setTimeout(() => setBannerError(null), 8000);
    return () => window.clearTimeout(t);
  }, [saveError]);

  // Alto real y dinámico del FloatingCommandCenter, para que el padding-bottom
  // del canvas nunca tape la última entrega, sea cual sea el tamaño del panel.
  const panelWrapperRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(280);

  useEffect(() => {
    const el = panelWrapperRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPanelHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Helpers para el stack de imágenes
  const getSelectedIndex = (itemId: string, total: number): number => {
    const idx = selectedImageIndexByItem[itemId] ?? 0;
    return idx >= 0 && idx < total ? idx : 0;
  };

  const setSelectedIndex = (itemId: string, idx: number) => {
    setSelectedImageIndexByItem(prev => ({ ...prev, [itemId]: idx }));
  };

  // SCROLL AUTOMÁTICO
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, sessionHistory.length]);

  const handleSave = async (item: SessionItem) => {
    if (item.status === 'saved' || item.mediaUrls.length === 0) return;

    const currentIdx = getSelectedIndex(item.id, item.mediaUrls.length);
    const currentUrl = item.mediaUrls[currentIdx] || item.mediaUrls[0];
    if (!currentUrl) return;

    try {
      updateSessionItem(item.id, { status: 'saving' });

      const result = await saveCreation({
        tempUrl: currentUrl,
        prompt: item.prompt || '',
        seed: -1,
        duration: item.mediaType === 'video' ? '5s' : '',
        resolution: 'Standard',
        aspectRatio: item.aspectRatio?.replace('/', ':') || '1:1',
        guideScale: 0,
        matchAudioDur: false,
        mediaType: item.mediaType,
        modelId: item.modelLabel.toLowerCase().replace(/\s/g, '-')
      });

      if (result) {
        updateSessionItem(item.id, { status: 'saved' });
      } else {
        // saveCreation devolvió null → no se guardó. Volver a 'temporary'
        // para que reaparezca el botón "Guardar". El banner ya muestra el motivo.
        updateSessionItem(item.id, { status: 'temporary' });
      }
    } catch (error) {
      console.error('Error saving:', error);
      updateSessionItem(item.id, { status: 'temporary' });
    }
  };

  const handleDiscard = (id: string) => removeSessionItem(id);

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

  const handleRetry = (item: SessionItem) => {
    window.dispatchEvent(new CustomEvent('pathfinder-load-config', {
      detail: {
        prompt: item.prompt,
        modelId: item.modelId,
        modelLabel: item.modelLabel,
        aspectRatio: item.aspectRatio,
        params: item.params || {},
        refUrls: item.refUrls || [],
      }
    }));
  };

  const openLightbox = (item: SessionItem, index: number = 0) => {
    const url = item.mediaUrls[index] || item.mediaUrls[0];
    if (!url) return;
    setSelectedMedia({ url, type: item.mediaType === 'video' ? 'video' : 'image' });
  };

  return (
    // position:relative + height:100% -> este bloque mide EXACTAMENTE lo que
    // le da el <main> de App.tsx (que a su vez mide exactamente el viewport).
    // No crece con el contenido (los hijos de abajo son position:absolute),
    // así que el panel flotante nunca se desincroniza del borde real.
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden', background: 'var(--pf-bg-primary)' }}>

      {/* ESTACIÓN INDICATOR — pill minimal arriba a la derecha */}
      {currentModelId && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '20px',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px 6px 10px',
            borderRadius: '9999px',
            background: 'var(--pf-bg-primary)',
            border: '1px solid var(--pf-border-subtle)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'var(--pf-text-secondary)',
            transition: 'all 0.3s ease',
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isCurrentModelOnline ? 'var(--pf-success)' : 'var(--pf-text-muted)',
            boxShadow: isCurrentModelOnline ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none',
            transition: 'all 0.3s ease',
          }} />
          {isCurrentModelOnline ? 'Estación lista' : 'Estación offline'}
        </div>
      )}

      {/* ÁREA DE SCROLL — el único elemento que puede scrollear en esta página */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          // paddingBottom dinámico = alto real del panel + margen. Este es el
          // límite duro: el scroll físicamente no llega más abajo que esto,
          // así que nada puede quedar detrás del panel flotante.
          paddingTop: '40px',
          paddingBottom: `${panelHeight + 40}px`,
          paddingLeft: '20px',
          paddingRight: '20px',
          transition: 'padding-bottom 0.2s ease',
        }}
      >
        <div style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: sessionHistory.length === 0 && !isLoading ? 'center' : 'flex-end',
          alignItems: 'center',
          width: '100%',
          maxWidth: 'min(700px, 100%)',
          margin: '0 auto',
          gap: '16px'
        }}>

          {/* ESTADO VACÍO */}
          {sessionHistory.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', opacity: 0.7, animation: 'fadeIn 0.8s ease-out' }}>
              <h2 className="pf-font-prompt" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--pf-text-primary)', marginBottom: '12px' }}>
                ¿Qué quieres crear hoy?
              </h2>
              <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '0.95rem', color: 'var(--pf-text-secondary)', maxWidth: '340px', lineHeight: '1.5' }}>
                Escribe un prompt abajo. Las generaciones aparecerán aquí como un chat.
              </p>
            </div>
          )}

          {/* LISTA DE HISTORIAL */}
          {sessionHistory.map((item) => {
            const frameWidth = frameWidthStyle(item.aspectRatio || '1/1');
            const currentIdx = getSelectedIndex(item.id, item.mediaUrls.length);
            const currentUrl = item.mediaUrls[currentIdx] || item.mediaUrls[0];
            const hasMultiple = item.mediaUrls.length > 1;

            return (
              <div
                key={item.id}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  marginBottom: item.isGenerating ? '0' : '14px'
                }}
              >
                {/* Prompt Usuario */}
                {!item.isGenerating && item.prompt && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', justifyContent: 'flex-end', marginBottom: '6px' }}>
                    <div style={{
                      background: 'var(--pf-bg-tertiary)',
                      padding: '10px 16px',
                      borderRadius: '16px',
                      borderTopRightRadius: '4px',
                      color: 'var(--pf-text-primary)',
                      fontFamily: 'var(--pf-font-ui)',
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      maxWidth: '85%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      {item.prompt}
                    </div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#FFFFFF', fontWeight: 700, flexShrink: 0, overflow: 'hidden', fontFamily: 'var(--pf-font-ui)' }}>
                      {userAvatarUrl ? (
                        <img src={userAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        userInitial
                      )}
                    </div>
                  </div>
                )}

                {/* Respuesta IA */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--pf-text-primary, #0A0A0A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#FFFFFF' }}>
                    <Sparkles size={16} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--pf-text-secondary)', fontFamily: 'var(--pf-font-ui)', fontWeight: 500 }}>
                      <span>{item.modelLabel}</span>
                      {item.aspectRatio && item.mediaType !== 'audio' && (
                        <>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--pf-border-default)' }}></span>
                          <span>{item.aspectRatio.replace('/', ':')}</span>
                        </>
                      )}
                    </div>

                    <div style={{
                      position: 'relative',
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'flex-start',
                      overflow: 'visible'
                    }}>

                      {item.isGenerating && item.mediaType !== 'audio' && (
                        <div style={{
                          width: frameWidth,
                          aspectRatio: item.aspectRatio || '1/1',
                          background: '#1a1a1a',
                          borderRadius: '10px',
                          position: 'relative',
                          overflow: 'hidden',
                          border: '1px solid var(--pf-border-subtle)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px'
                          }}>
                            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--pf-text-muted)' }} />
                            <span style={{ fontSize: '0.65rem', color: 'var(--pf-text-muted)', letterSpacing: '1px' }}>CREANDO...</span>
                          </div>
                        </div>
                      )}

                      {item.isGenerating && item.mediaType === 'audio' && (
                        <div style={{
                          width: frameWidthStyle('1/1'),
                          padding: '18px',
                          background: '#1a1a1a',
                          borderRadius: '10px',
                          border: '1px solid var(--pf-border-subtle)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px'
                        }}>
                          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--pf-text-muted)' }} />
                          <span style={{ fontSize: '0.65rem', color: 'var(--pf-text-muted)', letterSpacing: '1px' }}>CREANDO...</span>
                        </div>
                      )}

                      {!item.isGenerating && item.mediaUrls.length > 0 && item.mediaType !== 'audio' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{
                            position: 'relative',
                            width: frameWidth,
                            aspectRatio: item.aspectRatio || '1/1',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}>
                            {item.mediaType === 'video' ? (
                              <video
                                src={currentUrl}
                                controls
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                            ) : (
                              <img
                                src={currentUrl}
                                alt={item.prompt}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                                onClick={() => openLightbox(item, currentIdx)}
                              />
                            )}
                          </div>

                          {hasMultiple && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {item.mediaUrls.map((url, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setSelectedIndex(item.id, idx)}
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: idx === currentIdx
                                      ? '2px solid var(--pf-text-primary)'
                                      : '2px solid var(--pf-border-subtle)',
                                    opacity: idx === currentIdx ? 1 : 0.6,
                                    transition: 'all 0.15s ease',
                                    flexShrink: 0,
                                  }}
                                >
                                  <img
                                    src={url}
                                    alt={`${item.prompt} ${idx + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {!item.isGenerating && item.mediaUrls.length > 0 && item.mediaType === 'audio' && (
                        <div style={{ padding: '16px', width: frameWidthStyle('1/1'), background: 'var(--pf-bg-secondary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <Music size={24} style={{ color: 'var(--pf-text-secondary)' }} />
                          <audio src={item.mediaUrls[0]} controls style={{ width: '100%' }} />
                        </div>
                      )}
                    </div>

                    {!item.isGenerating && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                        {item.status === 'temporary' && (
                          <ActionButton
                            onClick={() => handleSave(item)}
                            icon={<Save size={14} />}
                            label="Guardar"
                          />
                        )}
                        {item.status === 'saving' && (
                          <ActionButton
                            disabled
                            icon={<Loader2 size={14} className="animate-spin" />}
                            label="Guardando..."
                          />
                        )}
                        <ActionButton onClick={() => handleDownload(item.mediaUrls[0], `pathfinder-${item.id.slice(-6)}.${item.mediaType === 'video' ? 'mp4' : item.mediaType === 'audio' ? 'mp3' : 'png'}`)} icon={<Download size={14} />} label="Descargar" />
                        <ActionButton onClick={() => handleRetry(item)} icon={<RefreshCw size={14} />} label="Variación" />
                        <ActionButton onClick={() => handleDiscard(item.id)} icon={<Trash2 size={14} />} label="Eliminar" danger />
                        {item.mediaType !== 'audio' && (
                          <ActionButton onClick={() => openLightbox(item, currentIdx)} icon={<Maximize2 size={14} />} label="Pantalla Completa" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} style={{ height: '1px', width: '100%' }} />
        </div>
      </div>

      {/* BANNER DE ERROR DE GUARDADO — no-blocking, auto-dismiss 8s */}
      {bannerError && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 55,
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.8125rem',
            color: '#B45309',
            maxWidth: 'min(560px, calc(100% - 32px))',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#F59E0B',
            flexShrink: 0,
          }} />
          <span style={{ flex: 1, lineHeight: 1.4 }}>{bannerError}</span>
          <button
            onClick={() => setBannerError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#B45309',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
              padding: '0 4px',
              opacity: 0.7,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}

      {/* FLOATING COMMAND CENTER — position:absolute DENTRO de este contenedor
          local (no fixed a la ventana). Así queda anclado al fondo del área
          real de esta página sin necesitar saber nada sobre el ancho del
          sidebar (eso lo resuelve App.tsx solo con el flexbox). */}
      <div
        ref={panelWrapperRef}
        style={{
          position: 'absolute',
          bottom: '32px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 16px',
          zIndex: 50,
        }}
      >
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <FloatingCommandCenter />
        </div>
      </div>

      {/* LIGHTBOX */}
      {selectedMedia && (
        <div onClick={() => setSelectedMedia(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s', cursor: 'zoom-out' }}>
          <button onClick={(e) => { e.stopPropagation(); setSelectedMedia(null); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '2rem', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer' }}>×</button>
          {selectedMedia.type === 'video' ? (
            <video src={selectedMedia.url} controls autoPlay style={{ maxWidth: '90%', maxHeight: '90vh' }} onClick={e => e.stopPropagation()} />
          ) : (
            <img src={selectedMedia.url} alt="Vista completa" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain' }} />
          )}
        </div>
      )}

      {/* BOTÓN FLOTANTE — Cómo funciona */}
      <Link
        to="/how-it-works"
        title="¿Cómo funciona Pathfinder?"
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          zIndex: 45,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#FFFFFF',
          border: '1px solid var(--pf-border-default, #E5E5E5)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--pf-text-secondary, #525252)',
          textDecoration: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--pf-bg-secondary, #FAFAFA)';
          e.currentTarget.style.borderColor = 'var(--pf-text-primary, #0A0A0A)';
          e.currentTarget.style.color = 'var(--pf-text-primary, #0A0A0A)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF';
          e.currentTarget.style.borderColor = 'var(--pf-border-default, #E5E5E5)';
          e.currentTarget.style.color = 'var(--pf-text-secondary, #525252)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <HelpCircle size={18} />
      </Link>

      <style>{`
        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--pf-border-subtle); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--pf-text-muted); }
      `}</style>
    </div>
  );
};

// Componente auxiliar para botones
const ActionButton = ({ onClick, icon, label, danger, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '6px 12px',
      background: 'var(--pf-bg-secondary)',
      border: '1px solid var(--pf-border-subtle)',
      borderRadius: '8px',
      color: danger ? '#ef4444' : 'var(--pf-text-secondary)',
      fontSize: '0.75rem',
      fontFamily: 'var(--pf-font-ui)',
      fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s',
      userSelect: 'none'
    }}
    onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'var(--pf-bg-tertiary)', e.currentTarget.style.borderColor = danger ? '#ef4444' : 'var(--pf-text-secondary)')}
    onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = 'var(--pf-bg-secondary)', e.currentTarget.style.borderColor = 'var(--pf-border-subtle)')}
  >
    {icon} <span>{label}</span>
  </button>
);

export default StudioPage;
