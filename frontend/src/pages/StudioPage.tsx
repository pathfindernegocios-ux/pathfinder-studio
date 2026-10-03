// src/pages/StudioPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import FloatingCommandCenter from '../components/FloatingCommandCenter';
import AudioPlayer from '../components/AudioPlayer';
import { useCreations } from '../hooks/useCreations';
import { useAuth } from '../hooks/useAuth';
import { useGenerationContext, type SessionItem } from '../context/GenerationContext';
import { useStationBoot } from '../hooks/useStationBoot';
import { useIsMobile } from '../hooks/useIsMobile';
import { Download, Trash2, RefreshCw, Save, Loader2, HelpCircle, Play, AlertTriangle } from 'lucide-react';
import AssistantAvatar from '../components/AssistantAvatar';
import NebulaLoader from '../components/NebulaLoader';
import GenerationNarrative from '../components/GenerationNarrative';
import Callout from '../components/Callout';
import SceneChip from '../components/SceneChip';
import VideoPlayer from '../components/VideoPlayer';
import ConfirmDialog from '../components/ConfirmDialog';
import { getRuntimeLabel } from '../config/models';

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
  if (!w || !h) return 'min(360px, 75vw)';
  return `min(360px, 75vw, calc(52vh * ${w} / ${h}))`;
};

const StudioPage: React.FC = () => {
  const { saveCreation, saveError } = useCreations();
  const isMobile = useIsMobile();
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
    activeVideoModelId,
    stationStatusMap,
  } = useGenerationContext();

  const currentModelId = capability === 'image'
    ? activeImageModelId
    : capability === 'video'
      ? activeVideoModelId
      : capability === 'audio'
        ? 'tts-dual'
        : null;
  const isCurrentModelOnline = currentModelId
    ? stationStatusMap[currentModelId] === 'online'
    : false;

  // Boot state del notebook (Fase 2 — reporte en vivo desde Supabase)
  const { stationId } = useGenerationContext();
  const boot = useStationBoot(stationId, currentModelId);

  // Popover de arranque (Fase 2)
  const [bootPopoverOpen, setBootPopoverOpen] = useState(false);
  const bootPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bootPopoverOpen) return;
    const onClick = (e: MouseEvent) => {
      if (bootPopoverRef.current && !bootPopoverRef.current.contains(e.target as Node)) {
        setBootPopoverOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBootPopoverOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [bootPopoverOpen]);

  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  // Índice de la imagen seleccionada por item (para el stack cuando hay >1)
  const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState<Record<string, number>>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

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

  // SCROLL AUTOMÁTICO INTELIGENTE
  // Solo scrollea al final si el usuario ya estaba al final (respeta
  // cuando está leyendo historial arriba).
  const lastItem = sessionHistory[sessionHistory.length - 1];
  const lastItemIsGenerating = lastItem?.isGenerating ?? false;
  const lastItemMediaCount = lastItem?.mediaUrls.length ?? 0;

  useEffect(() => {
    if (!isAtBottomRef.current) return;

    // Doble rAF: esperar a que el DOM tenga la altura final del skeleton
    // o del resultado antes de scrollear.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    });
  }, [sessionHistory.length, lastItemIsGenerating, lastItemMediaCount]);

  // Fallback de huérfanos: si un item lleva >60s en isGenerating Y la estación
  // está en isError/isStale, lo marcamos como fallido. Cubre el caso real de
  // notebooks que revientan por OOM sin escribir status:error en el historial.
  // Se evita re-mutar el mismo item con un Set de IDs ya procesados.
  const orphanMarkedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!boot.isError && !boot.isStale) return;
    const now = Date.now();
    for (const item of sessionHistory) {
      if (!item.isGenerating) continue;
      if (orphanMarkedRef.current.has(item.id)) continue;
      if (now - item.createdAt < 60_000) continue;
      if (item.mediaUrls.length > 0) continue;
      if (item.sceneUrls && item.sceneUrls.length > 0) continue;
      orphanMarkedRef.current.add(item.id);
      updateSessionItem(item.id, {
        isGenerating: false,
        errorMessage: 'La generación se interrumpió porque la estación dejó de responder. Revisa Kaggle o inténtalo de nuevo.',
      });
    }
  }, [boot.isError, boot.isStale, sessionHistory, updateSessionItem]);

  // Callout de Guardar: aparece la primera vez que existe un item con media
  // y status temporary. Se recuerda con localStorage (global, una vez por usuario).
  const [guardCalloutVisible, setGuardCalloutVisible] = useState(false);
  const guardCalloutShownRef = useRef(false);
  useEffect(() => {
    if (guardCalloutShownRef.current) return;
    if (localStorage.getItem('pf_guard_callout_seen') === '1') return;
    const hasTempWithMedia = sessionHistory.some(
      it => it.status === 'temporary' && it.mediaUrls.length > 0
    );
    if (!hasTempWithMedia) return;
    guardCalloutShownRef.current = true;
    const t = window.setTimeout(() => setGuardCalloutVisible(true), 800);
    return () => window.clearTimeout(t);
  }, [sessionHistory]);

  const dismissGuardCallout = () => {
    localStorage.setItem('pf_guard_callout_seen', '1');
    setGuardCalloutVisible(false);
  };

  const lastTemporaryWithMediaId = (() => {
    for (let i = sessionHistory.length - 1; i >= 0; i--) {
      const it = sessionHistory[i];
      if (it.status === 'temporary' && it.mediaUrls.length > 0) return it.id;
    }
    return null;
  })();

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
      void 0;
      updateSessionItem(item.id, { status: 'temporary' });
    }
  };

  // ── Confirmación de eliminación ──
  const [discardTargetId, setDiscardTargetId] = useState<string | null>(null);
  const handleDiscard = (id: string) => setDiscardTargetId(id);
  const handleConfirmDiscard = () => {
    if (discardTargetId) removeSessionItem(discardTargetId);
    setDiscardTargetId(null);
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
      void 0;
    }
  };

  const handleContinueFromVideo = async (item: SessionItem) => {
    const url = item.mediaUrls[0];
    if (!url) return;
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const reader = new FileReader();
      const b64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      window.dispatchEvent(new CustomEvent('pathfinder-continue-video', {
        detail: {
          videoB64: b64,
          aspectRatio: item.aspectRatio,
          resolution: (item.params as any)?.resolution || '480p',
        },
      }));
    } catch (e) {
      console.warn('[continue] no se pudo preparar el video:', e);
    }
  };

  const handleRetry = (item: SessionItem) => {
    void 0;
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
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>

      {/* ESTACIÓN INDICATOR — pill enriquecido arriba a la derecha */}
      {currentModelId && (() => {
        // Resolver estado visual
        const isDetecting = boot.detecting;
        const isBooting = boot.isBooting;
        const isStale = boot.isStale;
        const isError = boot.isError;
        // El pill usa el check REAL (stationStatusMap vía Gradio) como fuente
        // de verdad. Una fila 'READY' en Supabase puede estar huérfana (el
        // notebook murió pero la fila no se borró). Solo confiamos en
        // boot.isReady si el updated_at es fresco (< 3 min) — esa ventana
        // cubre el delay entre que el notebook llega a READY y el poll de
        // useStationStatus lo confirma.
        const bootAgeMs = boot.updatedAt ? Date.now() - new Date(boot.updatedAt).getTime() : Infinity;
        const isFreshReady = boot.isReady && bootAgeMs < 3 * 60 * 1000;
        const isReady = isCurrentModelOnline || isFreshReady;

        const pct = Math.round(Math.max(0, Math.min(1, boot.progress)) * 100);

        const accent = isError
          ? '#F87171'
          : isStale
          ? '#F59E0B'
          : isBooting || isDetecting
          ? '#22D3EE'
          : isReady
          ? 'var(--pf-success)'
          : 'var(--pf-text-muted)';

        // Pill del topbar: durante el boot mostramos primero "Estación detectada"
        // (primer segundo, cuando el progreso es casi cero) y luego
        // "Cargando <Modelo>..." con el nombre real del runtime.
        const runtimeLabel = currentModelId ? getRuntimeLabel(currentModelId) : null;
        const isVeryEarlyBoot = isBooting && boot.progress < 0.05;

        const label = isDetecting
          ? 'Detectando estación...'
          : isError
          ? 'Algo salió mal'
          : isStale
          ? 'Sin señal hace 4 min'
          : isBooting
          ? isVeryEarlyBoot
            ? 'Estación detectada'
            : runtimeLabel
              ? `Cargando ${runtimeLabel}...`
              : 'Estación detectada. Cargando...'
          : isReady
          ? runtimeLabel
            ? `Estación lista · ${runtimeLabel}`
            : 'Estación lista'
          : 'Estación offline';

        // Anillo SVG — girando en detecting, progreso en booting, dot simple en el resto
        const RING_SIZE = 14;
        const RING_STROKE = 2;
        const RING_R = (RING_SIZE - RING_STROKE) / 2;
        const RING_C = 2 * Math.PI * RING_R;
        const ringOffset = isBooting ? RING_C * (1 - Math.min(1, Math.max(0, boot.progress))) : 0;

        // Fases narrativas del arranque
        const phases = [
          { label: 'Preparando entorno', max: 0.20 },
          { label: 'Instalando herramientas', max: 0.50 },
          { label: 'Descargando modelos', max: 0.85 },
          { label: 'Conectando nodo', max: 1.00 },
        ];
        const progressN = Math.max(0, Math.min(1, boot.progress));
        const firstUndone = phases.findIndex(p => progressN < p.max);
        const activeIdx = firstUndone === -1 ? phases.length - 1 : firstUndone;
        const secondsAgo = boot.updatedAt
          ? Math.max(0, Math.round((Date.now() - new Date(boot.updatedAt).getTime()) / 1000))
          : null;

        return (
          <>
            <style>{`@keyframes pf-boot-ring-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <div
              ref={bootPopoverRef}
              style={{
                position: 'absolute',
                top: '14px',
                right: '20px',
                zIndex: 60,
              }}
            >
              <div
                onClick={() => setBootPopoverOpen(v => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px 6px 10px',
                  borderRadius: '9999px',
                  background: 'var(--pf-bg-primary)',
                  border: `1px solid ${isBooting || isDetecting ? 'rgba(34,211,238,0.25)' : isStale ? 'rgba(245,158,11,0.35)' : isError ? 'rgba(248,113,113,0.35)' : 'var(--pf-border-subtle)'}`,
                  boxShadow: isBooting || isDetecting ? '0 0 0 3px rgba(34,211,238,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: isBooting || isDetecting ? accent : 'var(--pf-text-secondary)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {(isDetecting || isBooting) ? (
                  <svg
                    width={RING_SIZE}
                    height={RING_SIZE}
                    viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                    style={{
                      flexShrink: 0,
                      transform: isDetecting ? 'none' : 'rotate(-90deg)',
                      animation: isDetecting ? 'pf-boot-ring-spin 1.4s linear infinite' : 'none',
                    }}
                  >
                    <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                      fill="none" stroke={accent} strokeOpacity={0.18} strokeWidth={RING_STROKE} />
                    <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                      fill="none" stroke={accent} strokeWidth={RING_STROKE}
                      strokeLinecap="round"
                      strokeDasharray={isDetecting ? `${RING_C * 0.25} ${RING_C * 0.75}` : RING_C}
                      strokeDashoffset={isDetecting ? 0 : ringOffset}
                      style={{
                        transition: isDetecting ? 'none' : 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </svg>
                ) : (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: accent,
                    boxShadow: isReady ? '0 0 0 3px rgba(16,185,129,0.15)' : isError ? '0 0 0 3px rgba(248,113,113,0.15)' : isStale ? '0 0 0 3px rgba(245,158,11,0.15)' : 'none',
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                  }} />
                )}
                <span>{label}</span>
                {isBooting && (
                  <span
                    style={{
                      fontFamily: 'var(--pf-font-chat-mono, monospace)',
                      fontSize: '0.6875rem',
                      color: accent,
                      opacity: 0.9,
                    }}
                  >
                    {pct}%
                  </span>
                )}
              </div>

              {bootPopoverOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '320px',
                    background: 'var(--pf-bg-primary)',
                    border: '1px solid var(--pf-border-default)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                    padding: '16px',
                    fontFamily: 'var(--pf-font-ui)',
                    animation: 'pfPopoverIn 0.18s ease-out',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--pf-text-primary)',
                      letterSpacing: '-0.01em',
                      marginBottom: '12px',
                    }}
                  >
                    Arranque de la estación
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {phases.map((phase, idx) => {
                      // Cuando el notebook esta READY o BUSY, el boot ya termino.
                      // El progress en BUSY representa la generacion, no el arranque,
                      // asi que no debe usarse para marcar el ultimo step como activo.
                      const bootComplete = boot.state === 'READY' || boot.state === 'BUSY';
                      const isDone = bootComplete || progressN >= phase.max;
                      const isActive = !isDone && idx === activeIdx;
                      return (
                        <div
                          key={phase.label}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.75rem',
                            color: isDone
                              ? 'var(--pf-text-secondary)'
                              : isActive
                              ? accent
                              : 'var(--pf-text-muted)',
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {isDone ? (
                            <svg width={14} height={14} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                              <circle cx={7} cy={7} r={7} fill={accent} fillOpacity={0.15} />
                              <path
                                d="M4 7.2 L6.2 9.4 L10 5.4"
                                fill="none"
                                stroke={accent}
                                strokeWidth={1.6}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : isActive ? (
                            <svg
                              width={14}
                              height={14}
                              viewBox="0 0 14 14"
                              style={{
                                flexShrink: 0,
                                animation: 'pf-boot-ring-spin 1.4s linear infinite',
                              }}
                            >
                              <circle cx={7} cy={7} r={6} fill="none" stroke={accent} strokeOpacity={0.18} strokeWidth={2} />
                              <circle
                                cx={7}
                                cy={7}
                                r={6}
                                fill="none"
                                stroke={accent}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 6 * 0.25} ${2 * Math.PI * 6 * 0.75}`}
                              />
                            </svg>
                          ) : (
                            <svg width={14} height={14} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                              <circle cx={7} cy={7} r={6} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1.5} />
                            </svg>
                          )}
                          <span>{phase.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {boot.stepMessage && (
                    <div
                      style={{
                        marginTop: '14px',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--pf-border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-primary)', lineHeight: 1.5 }}>
                        {boot.stepMessage}
                      </div>
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '0.6875rem',
                          color: 'var(--pf-text-muted)',
                          fontFamily: 'var(--pf-font-chat-mono, monospace)',
                        }}
                      >
                        {pct}%{secondsAgo !== null ? ` · hace ${secondsAgo}s` : ''}
                      </div>
                    </div>
                  )}

                  {(isError || isStale) && (
                    <div
                      style={{
                        marginTop: '14px',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--pf-border-subtle)',
                      }}
                    >
                      <div
                        style={{
                          padding: '12px',
                          background: isError ? 'rgba(248,113,113,0.06)' : 'rgba(245,158,11,0.06)',
                          border: isError ? '1px solid rgba(248,113,113,0.25)' : '1px solid rgba(245,158,11,0.25)',
                          borderRadius: '8px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: isError ? '#F87171' : '#F59E0B',
                            marginBottom: '6px',
                          }}
                        >
                          {isError
                            ? 'La estación se detuvo'
                            : 'Sin actualizaciones hace más de 4 minutos'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--pf-text-secondary)',
                            lineHeight: 1.5,
                          }}
                        >
                          {isError
                            ? 'Ve a Kaggle y revisa que la celda siga corriendo. Si se detuvo, presiona Run All y espera. También puedes actualizar esta página si no responde.'
                            : 'Revisa Kaggle: probablemente la celda se pausó. Presiona Run All y espera unos minutos. También puedes actualizar esta página.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* ÁREA DE SCROLL — el único elemento que puede scrollear en esta página */}
      <div
        ref={scrollContainerRef}
        onScroll={() => {
          const el = scrollContainerRef.current;
          if (!el) return;
          // "Al final" si está a menos de 80px del fondo (tolerancia)
          const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          isAtBottomRef.current = distanceFromBottom < 80;
        }}
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          // paddingBottom dinámico = alto real del panel + margen. Este es el
          // límite duro: el scroll físicamente no llega más abajo que esto,
          // así que nada puede quedar detrás del panel flotante.
          paddingTop: isMobile ? '64px' : '40px',
          paddingBottom: `${panelHeight + (isMobile ? 20 : 40)}px`,
          paddingLeft: isMobile ? '12px' : '20px',
          paddingRight: isMobile ? '12px' : '20px',
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
                {item.prompt && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', justifyContent: 'flex-end', marginBottom: '6px' }}>
                    <div style={{
                      background: 'var(--pf-bg-tertiary)',
                      padding: '10px 16px',
                      borderRadius: '16px',
                      borderTopRightRadius: '4px',
                      color: 'var(--pf-text-primary)',
                      fontFamily: 'var(--pf-font-chat)',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      maxWidth: '85%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      {item.prompt}
                    </div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--pf-bg-elevated)', fontWeight: 700, flexShrink: 0, overflow: 'hidden', fontFamily: 'var(--pf-font-ui)' }}>
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
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'radial-gradient(circle at 50% 45%, #0A1628 0%, #020617 60%, #000000 100%)', border: '1px solid rgba(34, 211, 238, 0.3)', boxShadow: '0 0 10px rgba(34, 211, 238, 0.2), inset 0 0 8px rgba(34, 211, 238, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#67E8F9', overflow: 'visible' }}>
                    <AssistantAvatar />
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
                      {item.storyboardMeta && (
                        <>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--pf-border-default)' }}></span>
                          <span>
                            {item.isGenerating
                              ? `Escena ${item.storyboardMeta.currentScene}/${item.storyboardMeta.totalScenes}`
                              : `${item.storyboardMeta.totalScenes} escenas`}
                          </span>
                        </>
                      )}
                      {!item.isGenerating && item.elapsedSeconds != null && item.elapsedSeconds > 0 && (
                        <>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--pf-border-default)' }}></span>
                          <span style={{ color: 'var(--pf-text-tertiary)' }}>
                            {item.elapsedSeconds < 60
                              ? `${Math.round(item.elapsedSeconds)}s`
                              : item.elapsedSeconds < 3600
                                ? `${Math.floor(item.elapsedSeconds / 60)}m ${Math.round(item.elapsedSeconds % 60)}s`
                                : `${Math.floor(item.elapsedSeconds / 3600)}h ${Math.floor((item.elapsedSeconds % 3600) / 60)}m`}
                          </span>
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

                      {!item.isGenerating && item.mediaUrls.length === 0 && item.errorMessage && (
                        <div style={{
                          width: frameWidth,
                          background: 'rgba(248,113,113,0.06)',
                          border: '1px solid rgba(248,113,113,0.35)',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={14} color="#F87171" />
                            <span style={{
                              fontFamily: 'var(--pf-font-ui)',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: 'var(--pf-text-primary)',
                            }}>
                              No se pudo generar
                            </span>
                          </div>
                          <div style={{
                            fontSize: '0.8125rem',
                            color: 'var(--pf-text-secondary)',
                            lineHeight: 1.5,
                            fontFamily: /CUDA|Error|Exception|OOM|memory|out of/.test(item.errorMessage)
                              ? 'var(--pf-font-chat-mono, monospace)'
                              : 'var(--pf-font-ui)',
                            maxHeight: '6em',
                            overflow: 'hidden',
                          }}>
                            {item.errorMessage}
                          </div>
                        </div>
                      )}

                      {item.isGenerating && item.mediaType !== 'audio' && (
                        item.sceneUrls && item.sceneUrls.length > 0 ? (
                          <div style={{ display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                        gap: '8px', width: '100%' }}>
                            {item.sceneUrls.map((u, i) => (
                              <div key={i} style={{ borderRadius: '10px', overflow: 'hidden',
                                                    border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                                <video src={u} muted autoPlay loop playsInline
                                       style={{ width: '100%', display: 'block' }} />
                              </div>
                            ))}
                            <div style={{ aspectRatio: item.aspectRatio || '1/1',
                                          background: '#000000', borderRadius: '10px',
                                          position: 'relative', overflow: 'hidden',
                                          border: '1px solid rgba(34, 211, 238, 0.2)',
                                          boxShadow: '0 4px 20px rgba(34, 211, 238, 0.08)' }}>
                              <NebulaLoader />
                            </div>
                          </div>
                        ) : (
                          <div style={{ width: frameWidth,
                                        aspectRatio: item.aspectRatio || '1/1',
                                        background: '#000000', borderRadius: '10px',
                                        position: 'relative', overflow: 'hidden',
                                        border: '1px solid rgba(34, 211, 238, 0.2)',
                                        boxShadow: '0 4px 20px rgba(34, 211, 238, 0.08)' }}>
                            <NebulaLoader />
                          </div>
                        )
                      )}

                      {item.isGenerating && item.mediaType === 'audio' && (
                        <div style={{
                          width: frameWidth,
                          height: '80px',
                          background: '#000000',
                          borderRadius: '12px',
                          border: '1px solid rgba(34, 211, 238, 0.2)',
                          boxShadow: '0 4px 20px rgba(34, 211, 238, 0.08)',
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          gap: '12px'
                        }}>
                          <NebulaLoader />
                          <div style={{
                            position: 'relative',
                            zIndex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%'
                          }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'rgba(34, 211, 238, 0.15)',
                              border: '1px solid rgba(34, 211, 238, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 0 16px -4px rgba(34, 211, 238, 0.6)'
                            }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#67E8F9',
                                animation: 'pf-audio-pulse 1.4s ease-in-out infinite'
                              }} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                              <span style={{
                                fontFamily: 'var(--pf-font-ui)',
                                fontSize: '0.7rem',
                                letterSpacing: '1.5px',
                                color: '#67E8F9',
                                fontWeight: 600
                              }}>
                                CREANDO...
                              </span>
                              <span style={{
                                fontFamily: 'var(--pf-font-ui)',
                                fontSize: '0.6875rem',
                                color: 'rgba(255,255,255,0.5)'
                              }}>
                                Sintetizando voz
                              </span>
                            </div>
                            {/* Mini waveform pulsante */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
                              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} style={{
                                  width: '3px',
                                  background: '#67E8F9',
                                  borderRadius: '2px',
                                  opacity: 0.85,
                                  animation: `pf-audio-bar 1s ease-in-out ${i * 0.1}s infinite`
                                }} />
                              ))}
                            </div>
                          </div>
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
                              <VideoPlayer src={currentUrl} />
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

                          {item.storyboardMeta && item.storyboardMeta.scenes.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {item.storyboardMeta.scenes.map((scene, i) => (
                                <SceneChip key={i} scene={scene} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {!item.isGenerating && item.mediaUrls.length > 0 && item.mediaType === 'audio' && (
                        <div style={{ width: 'min(440px, 100%)' }}>
                          <AudioPlayer src={item.mediaUrls[0]} bars={44} />
                        </div>
                      )}
                    </div>

                    {item.isGenerating && (
                      <GenerationNarrative
                        mediaType={item.mediaType}
                        startedAt={item.createdAt}
                        resolution={(item.params as any)?.resolution}
                        isStoryboard={!!item.storyboardMeta}
                      />
                    )}

                    {!item.isGenerating && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                        {item.status === 'temporary' && (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <ActionButton
                              onClick={() => handleSave(item)}
                              icon={<Save size={14} />}
                              label="Guardar"
                            />
                            {guardCalloutVisible && item.id === lastTemporaryWithMediaId && (
                              <Callout
                                title="Guárdalo en Mis Creaciones"
                                body="Así no se pierde si reinicias la sesión o cambias de modelo."
                                align="left"
                                onDismiss={dismissGuardCallout}
                              />
                            )}
                          </div>
                        )}
                        {item.status === 'saving' && (
                          <ActionButton
                            disabled
                            icon={<Loader2 size={14} className="animate-spin" />}
                            label="Guardando..."
                          />
                        )}
                        {item.mediaUrls.length > 0 && (
                          <ActionButton onClick={() => handleDownload(item.mediaUrls[0], `pathfinder-${item.id.slice(-6)}.${item.mediaType === 'video' ? 'mp4' : item.mediaType === 'audio' ? 'mp3' : 'png'}`)} icon={<Download size={14} />} label="Descargar" />
                        )}
                        {item.mediaType === 'video' && item.modelId === 'ltx-2.3' && item.mediaUrls[0] && !item.storyboardMeta && (
                          <ActionButton onClick={() => handleContinueFromVideo(item)} icon={<Play size={14} />} label="Continuar" />
                        )}
                        <ActionButton onClick={() => handleRetry(item)} icon={<RefreshCw size={14} />} label={item.errorMessage ? "Reintentar" : "Variación"} />
                        <ActionButton onClick={() => handleDiscard(item.id)} icon={<Trash2 size={14} />} label="Eliminar" danger />
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
          bottom: isMobile ? '16px' : '32px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: isMobile ? '0 10px' : '0 16px',
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

      {/* BOTÓN FLOTANTE — Cómo funciona (oculto en móvil para no solaparse con el FCM) */}
      {!isMobile && (
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
            background: 'var(--pf-bg-elevated)',
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
            e.currentTarget.style.background = 'var(--pf-bg-elevated)';
            e.currentTarget.style.borderColor = 'var(--pf-border-default, #E5E5E5)';
            e.currentTarget.style.color = 'var(--pf-text-secondary, #525252)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <HelpCircle size={18} />
        </Link>
      )}

      <ConfirmDialog
        open={discardTargetId !== null}
        title="¿Eliminar esta creación?"
        description="Se eliminará de tu sesión actual. Si ya la guardaste, seguirá en Mis Creaciones."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        danger
        onConfirm={handleConfirmDiscard}
        onCancel={() => setDiscardTargetId(null)}
      />

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
// En móvil: solo íconos (con tooltip nativo via `title`) para evitar que el
// texto se corte y para ahorrar espacio horizontal.
const ActionButton = ({ onClick, icon, label, danger, disabled }: any) => {
  const isMobile = useIsMobile();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: isMobile ? '8px 10px' : '6px 12px',
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
        userSelect: 'none',
        justifyContent: 'center',
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => !disabled && (e.currentTarget.style.background = 'var(--pf-bg-tertiary)', e.currentTarget.style.borderColor = danger ? '#ef4444' : 'var(--pf-text-secondary)')}
      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => !disabled && (e.currentTarget.style.background = 'var(--pf-bg-secondary)', e.currentTarget.style.borderColor = 'var(--pf-border-subtle)')}
    >
      {icon} {!isMobile && <span>{label}</span>}
    </button>
  );
};

export default StudioPage;
