// src/pages/CreationDetailPage.tsx
// Detalle de una pieza — media + panel de metadatos editorial.
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { Cpu } from '@phosphor-icons/react/dist/csr/Cpu';
import { FilmSlate } from '@phosphor-icons/react/dist/csr/FilmSlate';
import { SmileyXEyes } from '@phosphor-icons/react/dist/csr/SmileyXEyes';
import { Image as ImageIcon } from '@phosphor-icons/react/dist/csr/Image';
import { MusicNotes } from '@phosphor-icons/react/dist/csr/MusicNotes';
import { ArrowsOut } from '@phosphor-icons/react/dist/csr/ArrowsOut';
import { Trash } from '@phosphor-icons/react/dist/csr/Trash';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { useCreations } from '../hooks/useCreations';
import { useSignedUrl } from '../hooks/useSignedUrl';
import type { Creation } from '../types';
import { fetchAudioBlob } from '../lib/audioBlobCache';
import VideoPlayer from '../components/VideoPlayer';
import ConfirmDialog from '../components/ConfirmDialog';
import { AtmosphereLayer } from '../components/marketing/Atmosphere';
import { useUIStore } from '../stores/useUIStore';

// ============================================================
// CONSTANTS
// ============================================================
const MODEL_LABELS: Record<string, string> = {
  'krea-2-turbo': 'Krea 2 Turbo',
  'qwen-image-2.1': 'Qwen Image 2.1',
  'flux-2-klein-4b': 'Flux 2 Klein 4B',
  'ltx-2.3': 'LTX 2.3',
  'ltx-2.3-msr': 'LTX 2.3 MSR',
  'ltx-2.5-msr': 'LTX 2.5 MSR',
  'wan-dual': 'Wan 2.1 Dual',
  'wan-dual-i2v': 'Wan 2.1 i2v',
  'wan-dual-t2v': 'Wan 2.1 t2v',
  'tts-dual': 'TTS Dual',
  'tts-dual-omnivoice': 'OmniVoice',
  'tts-dual-index': 'Index TTS 2.5',
};

// ============================================================
// HELPERS
// ============================================================
function getModelLabel(modelId?: string | null, fallback?: string | null): string {
  const id = modelId || fallback || '';
  return MODEL_LABELS[id] || id || 'IA';
}

function formatExpiry(expiresAt: string): { text: string; urgent: boolean } {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return { text: 'Expirada', urgent: true };
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

// ============================================================
// META ROW (definido arriba para evitar problemas de orden)
// ============================================================
const MetaRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
        fontSize: '0.625rem',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--pf-text-muted)',
      }}
    >
      {icon}
      {label}
    </div>
    <div
      style={{
        fontFamily: 'var(--pf-font-ui)',
        fontSize: '0.875rem',
        color: 'var(--pf-text-primary)',
        fontWeight: 500,
        textAlign: 'right',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '60%',
      }}
    >
      {value}
    </div>
  </div>
);

// ============================================================
// AUDIO PLAYER — detail
// ============================================================
const AudioDetailPlayer: React.FC<{ url: string; prompt: string; creationId: string }> = ({
  url,
  prompt,
  creationId,
}) => {
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
    <div
      style={{
        width: '100%',
        padding: '80px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 36,
      }}
    >
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

      {/* Disco central con glow */}
      <div style={{ position: 'relative' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: -40,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 65%)',
            filter: 'blur(40px)',
            animation: 'pfDetailGlow 4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'relative',
            width: 96,
            height: 96,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 40% 35%, var(--pf-accent-primary) 0%, rgba(139,92,246,0.55) 60%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(139,92,246,0.4)',
            border: '1px solid rgba(139,92,246,0.35)',
          }}
        >
          <MusicNotes size={40} weight="regular" color="#FFFFFF" />
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 560,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <button
          onClick={togglePlay}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'var(--pf-accent-primary)',
            border: 'none',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            boxShadow: '0 12px 32px -8px rgba(139,92,246,0.6)',
            transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}>
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
          )}
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            onClick={handleSeek}
            style={{
              height: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
            }}
          >
            {seededPeaks(creationId || prompt || 'audio', 56).map((h, i) => {
              const played = i / 56 <= progress;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h * 100}%`,
                    background: played ? 'var(--pf-accent-primary)' : 'var(--pf-text-muted)',
                    opacity: played ? 0.95 : 0.28,
                    borderRadius: 1,
                    transition: 'background 100ms linear, opacity 100ms linear',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: 'var(--pf-text-muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PAGE
// ============================================================
const CreationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCreations, deleteCreation, getDownloadUrl } = useCreations();
  const studioTheme = useUIStore((s) => s.studioTheme);

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
    [creation?.expires_at],
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
      alert('No se pudo eliminar la pieza. Inténtalo de nuevo.');
    }
  }, [creation, deleteCreation, navigate]);

  const handleDownload = useCallback(async () => {
    if (!creation) return;
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const url = await getDownloadUrl(creation.id);
      if (!url) return;
      try {
        const isAudioFile = creation.media_type === 'audio';
        const blob = isAudioFile
          ? await fetchAudioBlob(url, { timeoutMs: 120000 })
          : await (await fetch(url)).blob();
        const objectUrl = URL.createObjectURL(blob);
        const ext = creation.media_type === 'video' ? 'mp4'
                  : creation.media_type === 'audio' ? 'wav'
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
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setIsDownloading(false);
    }
  }, [creation, getDownloadUrl, isDownloading]);

  const toggleLightbox = useCallback(() => setIsLightboxOpen((o) => !o), []);

  const hasSpaceAtmosphere = studioTheme === 'space';

  // ─── Loading ───
  if (loading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
          fontSize: '0.6875rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--pf-text-muted)',
        }}
      >
        Cargando pieza...
      </div>
    );
  }

  // ─── Not found ───
  if (!creation) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <SmileyXEyes size={56} weight="regular" style={{ color: 'var(--pf-text-muted)', marginBottom: 24 }} />
        <h1
          style={{
            fontFamily: "'Satoshi', system-ui, sans-serif",
            fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--pf-text-primary)',
            margin: '0 0 16px',
          }}
        >
          Pieza no encontrada
        </h1>
        <p
          style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '1rem',
            color: 'var(--pf-text-secondary)',
            marginBottom: 32,
            maxWidth: 460,
          }}
        >
          La pieza que buscas no existe, fue eliminada o no tienes permiso para verla.
        </p>
        <Link
          to="/creations"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--pf-accent-primary)',
            color: '#FFFFFF',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.9375rem',
            fontWeight: 600,
            padding: '12px 24px',
            borderRadius: 9999,
            boxShadow: '0 12px 32px -8px rgba(139,92,246,0.6)',
          }}
        >
          <ArrowLeft size={16} weight="regular" />
          Volver
        </Link>
      </div>
    );
  }

  const modelLabel = getModelLabel(creation.model_id, creation.model);

  return (
    <div style={{ height: '100%', overflowY: 'auto', position: 'relative' }}>
      {hasSpaceAtmosphere && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <AtmosphereLayer />
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px 80px' }}>

          {/* ═══════════ TOP BAR ═══════════ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <Link
              to="/creations"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                border: '1px solid var(--pf-border-subtle)',
                borderRadius: 9999,
                fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
                fontSize: '0.6875rem',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--pf-text-secondary)',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)';
                e.currentTarget.style.color = 'var(--pf-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--pf-border-subtle)';
                e.currentTarget.style.color = 'var(--pf-text-secondary)';
              }}
            >
              <ArrowLeft size={12} weight="regular" />
              Volver
            </Link>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--pf-accent-primary)',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '10px 20px',
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  opacity: isDownloading ? 0.6 : 1,
                  boxShadow: '0 12px 32px -8px rgba(139,92,246,0.6)',
                  transition: 'transform 150ms ease',
                }}
                onMouseEnter={(e) => { if (!isDownloading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <DownloadSimple size={14} weight="regular" />
                {isDownloading ? 'Preparando...' : 'Descargar'}
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'transparent',
                  border: '1px solid rgba(235,87,87,0.35)',
                  borderRadius: 9999,
                  padding: '10px 20px',
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#FCA5A5',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.6 : 1,
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.background = 'rgba(235,87,87,0.10)';
                    e.currentTarget.style.borderColor = 'rgba(235,87,87,0.55)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(235,87,87,0.35)';
                }}
              >
                <Trash size={14} weight="regular" />
                Eliminar
              </button>
            </div>
          </div>

          {/* ═══════════ GRID: media | aside ═══════════ */}
          <div
            className="pf-detail-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              gap: 40,
              alignItems: 'flex-start',
            }}
          >
            {/* ── Media ── */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={isImage ? toggleLightbox : undefined}
                style={{
                  position: 'relative',
                  background: 'var(--pf-bg-secondary)',
                  borderRadius: 20,
                  border: '1px solid var(--pf-border-subtle)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isImage ? 'zoom-in' : 'default',
                  width: '100%',
                  minHeight: 400,
                  maxHeight: '78vh',
                }}
              >
                {/* Blur background */}
                {mediaUrl && !loadingUrl && !mediaBroken && isVideo && (
                  <video
                    src={mediaUrl}
                    muted
                    playsInline
                    preload="auto"
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: -20,
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
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: -20,
                      backgroundImage: `url(${mediaUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'blur(40px) saturate(1.4)',
                      opacity: 0.35,
                      zIndex: 0,
                    }}
                  />
                )}

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loadingUrl ? (
                    <div
                      style={{
                        fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
                        fontSize: '0.6875rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--pf-text-muted)',
                      }}
                    >
                      Cargando...
                    </div>
                  ) : mediaBroken ? (
                    <div
                      style={{
                        color: 'var(--pf-text-muted)',
                        fontFamily: 'var(--pf-font-ui)',
                        fontSize: '0.9375rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <Warning size={32} weight="regular" />
                      Esta pieza ya no está disponible
                    </div>
                  ) : mediaUrl ? (
                    isVideo ? (
                      <VideoPlayer
                        src={mediaUrl}
                        objectFit="contain"
                        background="transparent"
                        aspectRatio={creation.aspect_ratio || undefined}
                      />
                    ) : isAudio ? (
                      <AudioDetailPlayer
                        url={mediaUrl}
                        prompt={creation.prompt}
                        creationId={creation.id}
                      />
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

                {isImage && mediaUrl && !mediaBroken && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: 'rgba(15,15,18,0.70)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      padding: '6px 12px',
                      borderRadius: 9999,
                      border: '1px solid rgba(255,255,255,0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
                      fontSize: '0.5625rem',
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.75)',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  >
                    <ArrowsOut size={11} weight="regular" />
                    Ampliar
                  </div>
                )}
              </div>
            </div>

            {/* ── Aside ── */}
            <aside
              className="pf-detail-aside"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              {/* Prompt */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                    fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--pf-text-muted)',
                  }}
                >
                  <Cpu size={13} weight="regular" />
                  Prompt
                </div>
                <p
                  style={{
                    fontFamily: 'var(--pf-font-ui)',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: 'var(--pf-text-primary)',
                    margin: 0,
                  }}
                >
                  {creation.prompt}
                </p>
              </div>

              <div style={{ height: 1, background: 'var(--pf-border-subtle)' }} />

              {/* Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <MetaRow
                  icon={<FilmSlate size={14} weight="regular" />}
                  label="Tipo"
                  value={isVideo ? 'Video' : isAudio ? 'Audio' : 'Imagen'}
                />
                <MetaRow
                  icon={<Cpu size={14} weight="regular" />}
                  label="Modelo"
                  value={modelLabel}
                />
                {creation.resolution && (
                  <MetaRow
                    icon={<ImageIcon size={14} weight="regular" />}
                    label="Resolución"
                    value={creation.resolution}
                  />
                )}
                {creation.aspect_ratio && (
                  <MetaRow
                    icon={<ImageIcon size={14} weight="regular" />}
                    label="Aspecto"
                    value={creation.aspect_ratio}
                  />
                )}
                {creation.seed !== null && creation.seed !== undefined && (
                  <MetaRow
                    icon={<Cpu size={14} weight="regular" />}
                    label="Seed"
                    value={String(creation.seed)}
                  />
                )}
                <MetaRow
                  icon={<CalendarBlank size={14} weight="regular" />}
                  label="Creado"
                  value={formatDate(creation.created_at)}
                />
              </div>

              {/* Expiry */}
              {expiry && (
                <>
                  <div style={{ height: 1, background: 'var(--pf-border-subtle)' }} />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      background: expiry.urgent
                        ? 'rgba(245,158,11,0.08)'
                        : 'transparent',
                      border: expiry.urgent
                        ? '1px solid rgba(245,158,11,0.30)'
                        : '1px solid var(--pf-border-subtle)',
                      borderRadius: 10,
                      fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: expiry.urgent ? '#F59E0B' : 'var(--pf-text-secondary)',
                    }}
                  >
                    {expiry.urgent
                      ? <Warning size={13} weight="regular" />
                      : <Clock size={13} weight="regular" />}
                    {expiry.text}
                  </div>
                </>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* ═══════════ LIGHTBOX ═══════════ */}
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
            animation: 'pfDetailFade 200ms ease-out',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleLightbox(); }}
            style={{
              position: 'absolute',
              top: 30,
              right: 30,
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.20)',
              color: '#FFFFFF',
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1001,
            }}
          >
            <X size={20} weight="regular" />
          </button>
          <img
            src={mediaUrl}
            alt={creation.prompt}
            style={{
              maxWidth: '95%',
              maxHeight: '95vh',
              objectFit: 'contain',
              animation: 'pfDetailScale 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        title="¿Eliminar esta pieza?"
        description="Esta acción no se puede deshacer. La pieza y su archivo se eliminarán de forma permanente."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        danger
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <style>{`
        @keyframes pfDetailGlow {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
        @keyframes pfDetailFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pfDetailScale {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }

        @media (min-width: 1024px) {
          .pf-detail-grid {
            grid-template-columns: minmax(0, 1.8fr) minmax(320px, 1fr) !important;
          }
          .pf-detail-aside {
            position: sticky;
            top: 32px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [style*="pfDetail"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CreationDetailPage;
