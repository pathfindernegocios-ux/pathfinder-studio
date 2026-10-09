// src/pages/CreationDetailPage.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCreations } from '../hooks/useCreations';
import { useSignedUrl } from '../hooks/useSignedUrl';
import type { Creation } from '../types';
import {
  ArrowLeft, Clock, Cpu, Film, Frown, Image as ImageIcon,
  Music, Maximize2, Trash2, X, Download, Calendar,
} from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import ConfirmDialog from '../components/ConfirmDialog';

const MODEL_LABELS: Record<string, string> = {
  'krea-2-turbo': 'Krea 2 Turbo',
  'qwen-image-2.1': 'Qwen Image 2.1',
  'flux-2-klein-4b': 'Flux 2 Klein 4B',
  'ltx-2.3': 'LTX 2.3',
  'ltx-2.3-msr': 'LTX 2.3 MSR',
  'ltx-2.5-msr': 'LTX 2.5 MSR',
  'wan-dual': 'Wan 2.1 Dual',
  'tts-dual': 'TTS Dual',
};

function getModelLabel(modelId?: string | null, fallback?: string | null): string {
  const id = modelId || fallback || '';
  return MODEL_LABELS[id] || id || 'IA';
}

function formatExpiry(expiresAt: string): { text: string; urgent: boolean } {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return { text: 'Expirado', urgent: true };
  const hours = remainingMs / 3_600_000;
  if (hours < 1) return { text: 'Expira en menos de 1 hora', urgent: true };
  if (hours < 24) {
    const h = Math.floor(hours);
    return { text: `Expira en ${h} ${h === 1 ? 'hora' : 'horas'}`, urgent: true };
  }
  const days = Math.floor(hours / 24);
  return { text: `Expira en ${days} ${days === 1 ? 'día' : 'días'}`, urgent: false };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(secs: number): string {
  if (!isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function seededPeaks(id: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const rand = () => {
    h = (h * 1664525 + 1013904223) | 0;
    return Math.abs(h) / 0x7fffffff;
  };
  return Array.from({ length: count }, () => 0.2 + rand() * 0.8);
}

const AudioDetailPlayer: React.FC<{ url: string; prompt: string }> = ({ url, prompt }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => void 0);
    else a.pause();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrentTime(a.currentTime);
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div style={{
      width: '100%',
      padding: '60px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '32px',
    }}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
      />

      <div style={{
        width: '96px',
        height: '96px',
        borderRadius: '50%',
        background: '#6366F1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4)',
      }}>
        <Music size={44} color="#FFFFFF" strokeWidth={1.75} />
      </div>

      <div style={{
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <button
          onClick={togglePlay}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#6366F1',
            border: 'none',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
          }}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}>
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
          )}
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            onClick={handleSeek}
            style={{
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              cursor: 'pointer',
            }}
          >
            {seededPeaks(prompt || 'audio', 56).map((h, i) => {
              const played = i / 56 <= progress;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h * 100}%`,
                    background: played ? '#6366F1' : 'var(--pf-text-muted, #6E747D)',
                    opacity: played ? 1 : 0.4,
                    borderRadius: '2px',
                    transition: 'background 0.1s ease, opacity 0.1s ease',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.75rem',
            color: 'var(--pf-text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCreations, deleteCreation, getDownloadUrl } = useCreations();

  const [creation, setCreation] = useState<Creation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mediaBroken, setMediaBroken] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [, setTick] = useState(0);

  const { url: mediaUrl, loading: loadingUrl } = useSignedUrl(id || null);

  useEffect(() => {
    const loadCreation = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const allCreations = await getCreations();
        const found = allCreations.find((c: Creation) => c.id === id);
        setCreation(found || null);
      } catch {
        setCreation(null);
      } finally {
        setLoading(false);
      }
    };
    loadCreation();
  }, [id, getCreations]);

  // Refresca el countdown cada 60s
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const isVideo = creation?.media_type === 'video';
  const isAudio = creation?.media_type === 'audio';
  const isImage = creation?.media_type === 'image';

  const expiry = useMemo(
    () => (creation?.expires_at ? formatExpiry(creation.expires_at) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [creation?.expires_at, setTick],
  );



  const handleDelete = useCallback(() => setShowDeleteDialog(true), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!creation) return;
    setIsDeleting(true);
    try {
      await deleteCreation(creation.id);
      navigate('/creations', { replace: true });
    } catch {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      alert('No se pudo eliminar la creación. Inténtalo de nuevo.');
    }
  }, [creation, deleteCreation, navigate]);

  const handleDownload = useCallback(async () => {
    if (!creation) return;
    setIsDownloading(true);
    try {
      const url = await getDownloadUrl(creation.id);
      if (!url) return;

      // Forzar descarga: fetch -> blob -> <a download>
      // (window.open() abre el archivo en pestaña nueva si el content-type es valido)
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const ext = creation.media_type === 'video' ? 'mp4'
                  : creation.media_type === 'audio' ? 'mp3'
                  : 'png';
        const filename = `pathfinder-${creation.id.slice(0, 8)}.${ext}`;
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } catch {
        // Fallback: abrir en pestaña nueva (comportamiento previo)
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setIsDownloading(false);
    }
  }, [creation, getDownloadUrl]);

  const toggleLightbox = useCallback(() => setIsLightboxOpen((o) => !o), []);

  // ── Estados de carga / not found ─────────────────────────────

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          fontFamily: 'var(--pf-font-ui)',
          color: 'var(--pf-text-muted)',
          fontSize: '1rem',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid var(--pf-border-default)', borderTopColor: 'var(--pf-text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Cargando detalles...
        </div>
      </div>
    );
  }

  if (!creation) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <Frown size={64} strokeWidth={1.5} style={{ marginBottom: '24px', opacity: 0.5, color: 'var(--pf-text-primary)' }} />
        <h1 style={{ fontFamily: 'var(--pf-font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--pf-text-primary)', marginBottom: '16px' }}>
          Creación no encontrada
        </h1>
        <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '1rem', color: 'var(--pf-text-secondary)', marginBottom: '32px' }}>
          La creación que buscas no existe, ha sido eliminada o no tienes permiso para verla.
        </p>
        <Link
          to="/creations"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--pf-text-primary)',
            color: 'var(--pf-bg-elevated)',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '1rem',
            fontWeight: 600,
            padding: '12px 24px',
            borderRadius: '9999px',
          }}
        >
          <ArrowLeft size={18} />
          Volver a la Colección
        </Link>
      </div>
    );
  }

  const modelLabel = getModelLabel(creation.model_id, creation.model);

  return (
    <div style={{ height: '100%', overflowY: 'auto', scrollBehavior: 'smooth' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Barra superior: volver + acciones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
          <Link
            to="/creations"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--pf-text-secondary)',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--pf-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--pf-text-secondary)')}
          >
            <ArrowLeft size={18} />
            Volver a la Colección
          </Link>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--pf-bg-secondary)',
                border: '1px solid var(--pf-border-default)',
                borderRadius: '9999px',
                padding: '10px 18px',
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--pf-text-primary)',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                opacity: isDownloading ? 0.6 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!isDownloading) e.currentTarget.style.background = 'var(--pf-bg-tertiary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--pf-bg-secondary)'; }}
            >
              <Download size={16} />
              {isDownloading ? 'Preparando...' : 'Descargar'}
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '9999px',
                padding: '10px 18px',
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#EF4444',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.6 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!isDeleting) e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        </div>

        {/* Grid principal: media | panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '40px',
          alignItems: 'flex-start',
        }}
        className="pf-detail-grid"
        >
          {/* Columna izquierda: media */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={isImage ? toggleLightbox : undefined}
              style={{
                position: 'relative',
                background: 'var(--pf-bg-secondary)',
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isImage ? 'zoom-in' : 'default',
                width: '100%',
                minHeight: '400px',
                maxHeight: '78vh',
              }}
            >
              {/* Blur del propio media como fondo.
                  - Para imagenes: <div> con background-image.
                  - Para videos: un <video> ambient (CSS no acepta videos como background-image). */}
              {mediaUrl && !loadingUrl && !mediaBroken && isVideo && (
                <video
                  src={mediaUrl}
                  muted
                  playsInline
                  preload="auto"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: '-20px',
                    width: 'calc(100% + 40px)',
                    height: 'calc(100% + 40px)',
                    objectFit: 'cover',
                    filter: 'blur(40px) saturate(1.4)',
                    opacity: 0.35,
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {mediaUrl && !loadingUrl && !mediaBroken && isImage && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: '-20px',
                    backgroundImage: `url(${mediaUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(40px) saturate(1.4)',
                    opacity: 0.35,
                    zIndex: 0,
                  }}
                />
              )}

              <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loadingUrl ? (
                  <div style={{ color: 'var(--pf-text-muted)', fontFamily: 'var(--pf-font-ui)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '24px', height: '24px', border: '3px solid var(--pf-border-default)', borderTopColor: 'var(--pf-text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>Cargando obra...</span>
                  </div>
                ) : mediaBroken ? (
                  <div style={{
                    color: 'var(--pf-text-muted)',
                    fontFamily: 'var(--pf-font-ui)',
                    fontSize: '0.9375rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <X size={32} strokeWidth={1.5} />
                    Esta pieza ya no está disponible
                  </div>
                ) : mediaUrl ? (
                  isVideo ? (
                    <VideoPlayer
                      src={mediaUrl}
                      objectFit="contain"
                      background="transparent"
                      aspectRatio={creation.aspect_ratio}
                    />
                  ) : isAudio ? (
                    <AudioDetailPlayer url={mediaUrl} prompt={creation.prompt} />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={creation.prompt}
                      onError={() => setMediaBroken(true)}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '78vh',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  )
                ) : (
                  <div style={{ color: 'var(--pf-text-muted)', fontFamily: 'var(--pf-font-ui)' }}>
                    No disponible
                  </div>
                )}
              </div>

              {/* Hint de lightbox para imagen */}
              {isImage && mediaUrl && !mediaBroken && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  padding: '6px 12px',
                  borderRadius: '99px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}>
                  <Maximize2 size={12} />
                  Ampliar
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: panel de metadatos */}
          <aside
            className="pf-detail-aside"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Prompt */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                color: 'var(--pf-text-muted)',
                textTransform: 'uppercase',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
              }}>
                <Cpu size={13} />
                Prompt
              </div>
              <p style={{
                fontFamily: 'var(--pf-font-prompt, var(--pf-font-ui))',
                fontSize: '1rem',
                lineHeight: 1.6,
                color: 'var(--pf-text-primary)',
                margin: 0,
              }}>
                {creation.prompt}
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--pf-border-subtle)' }} />

            {/* Parámetros */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <MetaRow
                icon={<Film size={14} />}
                label="Tipo"
                value={isVideo ? 'Video' : isAudio ? 'Audio' : 'Imagen'}
              />
              <MetaRow
                icon={<Cpu size={14} />}
                label="Modelo"
                value={modelLabel}
              />
              {creation.resolution && (
                <MetaRow
                  icon={<ImageIcon size={14} />}
                  label="Resolución"
                  value={creation.resolution}
                />
              )}
              {creation.aspect_ratio && (
                <MetaRow
                  icon={<ImageIcon size={14} />}
                  label="Aspecto"
                  value={creation.aspect_ratio}
                />
              )}
              {creation.seed !== null && creation.seed !== undefined && (
                <MetaRow
                  icon={<Cpu size={14} />}
                  label="Seed"
                  value={String(creation.seed)}
                />
              )}
              <MetaRow
                icon={<Calendar size={14} />}
                label="Creado"
                value={formatDate(creation.created_at)}
              />
            </div>

            {/* Expiración */}
            {expiry && (
              <>
                <div style={{ height: '1px', background: 'var(--pf-border-subtle)' }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  background: expiry.urgent ? 'rgba(245,158,11,0.08)' : 'var(--pf-bg-secondary)',
                  border: `1px solid ${expiry.urgent ? 'rgba(245,158,11,0.25)' : 'var(--pf-border-subtle)'}`,
                  borderRadius: '10px',
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.8125rem',
                  color: expiry.urgent ? '#F59E0B' : 'var(--pf-text-secondary)',
                }}>
                  <Clock size={14} />
                  {expiry.text}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && mediaUrl && isImage && (
        <div
          onClick={toggleLightbox}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleLightbox(); }}
            style={{
              position: 'absolute',
              top: '30px',
              right: '30px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1001,
            }}
          >
            <X size={24} />
          </button>
          <img
            src={mediaUrl}
            alt={creation.prompt}
            style={{
              maxWidth: '95%',
              maxHeight: '95vh',
              objectFit: 'contain',
              animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        title="¿Eliminar esta creación?"
        description="Esta acción no se puede deshacer. La creación y su archivo se eliminarán de forma permanente."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        danger
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        @media (min-width: 1024px) {
          .pf-detail-grid {
            grid-template-columns: minmax(0, 1.8fr) minmax(320px, 1fr) !important;
          }
          .pf-detail-aside {
            position: sticky;
            top: 32px;
          }
        }
      `}</style>
    </div>
  );
};

// Fila de metadatos consistente
const MetaRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'var(--pf-font-ui)',
      fontSize: '0.8125rem',
      color: 'var(--pf-text-muted)',
    }}>
      {icon}
      {label}
    </div>
    <div style={{
      fontFamily: 'var(--pf-font-ui)',
      fontSize: '0.8125rem',
      color: 'var(--pf-text-primary)',
      fontWeight: 500,
      textAlign: 'right',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '60%',
    }}>
      {value}
    </div>
  </div>
);

export default CreationDetailPage;
