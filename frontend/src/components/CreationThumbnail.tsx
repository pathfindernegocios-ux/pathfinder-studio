// src/components/CreationThumbnail.tsx
// Card de creación — imagen / video / audio.
// Hairline + hover lift + metadata mono + expiry pill.
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Trash } from '@phosphor-icons/react/dist/csr/Trash';
import { Archive } from '@phosphor-icons/react/dist/csr/Archive';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { Play } from '@phosphor-icons/react/dist/csr/Play';
import { Pause } from '@phosphor-icons/react/dist/csr/Pause';
import { useSignedUrl } from '../hooks/useSignedUrl';
import { useCreations } from '../hooks/useCreations';
import ConfirmDialog from './ConfirmDialog';
import type { Creation } from '../types';
import { fetchAudioBlob } from '../lib/audioBlobCache';
import { addTombstone, removeTombstone } from '../lib/tombstones';

// ============================================================
// HELPERS
// ============================================================
const MODEL_LABELS: Record<string, string> = {
  'krea-2-turbo': 'Krea 2 Turbo',
  'qwen-image-2.1': 'Qwen Image 2.1',
  'flux-2-klein-4b': 'Flux 2 Klein',
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

function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function getModelLabel(creation: Creation): string {
  const id = creation.model_id || creation.model || '';
  return MODEL_LABELS[id] || id || 'IA';
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

function formatDuration(secs: number): string {
  if (!isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getExpiryBadge(expiresAt: string): { label: string; urgent: boolean } | null {
  const t = new Date(expiresAt).getTime();
  if (isNaN(t)) return null;
  const diff = t - Date.now();
  if (diff <= 0) return { label: 'Expirada', urgent: true };
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return { label: `${hours}h`, urgent: true };
  const days = Math.floor(hours / 24);
  return { label: `${days}d`, urgent: false };
}

// ============================================================
// AUDIO — subcomponente interno
// ============================================================
const AudioThumbnailBody: React.FC<{ url: string; creationId: string }> = ({ url, creationId }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => void 0);
    else a.pause();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const a = audioRef.current;
    if (!a || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrentTime(a.currentTime);
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <>
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

      {/* Waveform centrada */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          pointerEvents: 'none',
        }}
      >
        {seededPeaks(creationId, 44).map((h, i) => {
          const played = i / 44 <= progress;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h * 100}%`,
                background: played ? 'var(--pf-accent-primary)' : 'var(--pf-text-muted)',
                opacity: played ? 0.95 : 0.25,
                borderRadius: 1,
                transition: 'background 100ms ease, opacity 100ms ease',
              }}
            />
          );
        })}
      </div>

      {/* Play button central — hairline */}
      <button
        onClick={togglePlay}
        title={isPlaying ? 'Pausar' : 'Reproducir'}
        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease',
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(139,92,246,0.55)';
          e.currentTarget.style.borderColor = 'rgba(139,92,246,0.65)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
        }}
      >
        {isPlaying
          ? <Pause size={20} weight="fill" />
          : <Play size={20} weight="fill" style={{ marginLeft: 3 }} />}
      </button>

      {/* Progress + tiempo abajo */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 2,
          pointerEvents: 'auto',
        }}
      >
        <div
          onClick={handleSeek}
          style={{
            flex: 1,
            height: 2,
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.15)',
            position: 'relative',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${progress * 100}%`,
              background: 'var(--pf-accent-primary)',
              boxShadow: '0 0 8px rgba(139,92,246,0.55)',
              borderRadius: 9999,
              transition: 'width 100ms linear',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
            fontSize: '0.625rem',
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.75)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
      </div>
    </>
  );
};

// ============================================================
// MAIN
// ============================================================
interface CreationThumbnailProps {
  creation: Creation;
}

export const CreationThumbnail: React.FC<CreationThumbnailProps> = ({ creation }) => {
  const { url, loading, error } = useSignedUrl(creation.id);
  const { deleteCreation, getDownloadUrl } = useCreations();
  const [mediaBroken, setMediaBroken] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  const isVideo = creation.media_type === 'video';
  const isAudio = creation.media_type === 'audio';
  const modelLabel = getModelLabel(creation);
  const relativeDate = formatRelative(creation.created_at);
  const expiry = getExpiryBadge(creation.expires_at);

  // Aspect ratio del creation (fallback a 4:5)
  const aspectRatio = creation.aspect_ratio
    ? creation.aspect_ratio.replace(':', '/')
    : '4/5';

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const downloadUrl = await getDownloadUrl(creation.id);
      if (!downloadUrl) return;
      try {
        const blob = isAudio
          ? await fetchAudioBlob(downloadUrl, { timeoutMs: 120000 })
          : await (await fetch(downloadUrl)).blob();
        const objectUrl = URL.createObjectURL(blob);
        const ext = isVideo ? 'mp4' : isAudio ? 'wav' : 'png';
        const filename = `pathfinder-${creation.id.slice(0, 8)}.${ext}`;
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } catch {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    addTombstone(creation.id); // PILAR 4: tombstone ANTES del backend
    try {
      const result = await deleteCreation(creation.id, 'single');
      if (!result.success) {
        removeTombstone(creation.id); // PILAR 4: rollback
        setDeleteError(result.error || "No se pudo eliminar. Intenta de nuevo.");
        return; // Mantener el modal abierto si falla
      }
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div
        id={`thumb-${creation.id}`}
        style={{
          aspectRatio,
          background: 'var(--pf-bg-secondary)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--pf-border-subtle)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(115deg, transparent 0%, rgba(139,92,246,0.06) 50%, transparent 100%)',
            animation: 'pfThumbShimmer 3.4s ease-in-out infinite',
          }}
        />
      </div>
    );
  }

  // ─── Error / expirada ───
  if (error || !url || mediaBroken) {
    return (
      <>
        <div
          id={`thumb-${creation.id}`}
          style={{
            aspectRatio,
            background: 'var(--pf-bg-secondary)',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
            textAlign: 'center',
            border: '1px solid var(--pf-border-subtle)',
          }}
        >
          <Archive size={32} weight="regular" style={{ color: 'var(--pf-text-muted)' }} />
          <div
            style={{
              fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
              fontSize: '0.625rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--pf-text-muted)',
            }}
          >
            Expirada
          </div>
          <button
            onClick={handleDeleteClick}
            style={{
              marginTop: 4,
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--pf-border-default)',
              borderRadius: 9999,
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--pf-text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(235,87,87,0.5)';
              e.currentTarget.style.color = '#FCA5A5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--pf-border-default)';
              e.currentTarget.style.color = 'var(--pf-text-secondary)';
            }}
          >
            Eliminar
          </button>
        </div>
        <ConfirmDialog
          open={showDeleteDialog}
          title="¿Eliminar esta pieza?"
          description={deleteError ? `⚠️ ${deleteError}` : "Esta acción no se puede deshacer."}
          confirmLabel="Sí, eliminar"
          cancelLabel="Cancelar"
          danger
          loading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => { setShowDeleteDialog(false); setDeleteError(null); }}
        />
      </>
    );
  }

  // ─── Card normal ───
  return (
    <>
      <Link
        to={`/creations/${creation.id}`}
        id={`thumb-${creation.id}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          textDecoration: 'none',
          display: 'block',
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--pf-bg-secondary)',
          border: hover
            ? '1px solid rgba(139,92,246,0.30)'
            : '1px solid var(--pf-border-subtle)',
          transform: hover ? 'translateY(-3px)' : 'translateY(0)',
          boxShadow: hover
            ? '0 20px 40px -12px rgba(139,92,246,0.35)'
            : 'none',
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease, box-shadow 200ms ease',
        }}
      >
        {/* Media */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio,
            overflow: 'hidden',
            background: '#050507',
          }}
        >
          {isAudio ? (
            <AudioThumbnailBody url={url} creationId={creation.id} />
          ) : isVideo ? (
            <>
              <video
                src={url}
                muted
                playsInline
                preload="metadata"
                onError={() => setMediaBroken(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Play size={20} weight="fill" color="#FFFFFF" style={{ marginLeft: 3 }} />
              </div>
            </>
          ) : (
            <img
              src={url}
              alt={creation.prompt}
              loading="lazy"
              onError={() => setMediaBroken(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          )}

          {/* Capability chip top-left */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '4px 10px',
              background: 'rgba(15,15,18,0.70)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(139,92,246,0.28)',
              borderRadius: 6,
              fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
              fontSize: '0.5625rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#A78BFA',
              pointerEvents: 'none',
            }}
          >
            {isVideo ? 'Video' : isAudio ? 'Audio' : 'Imagen'}
          </div>

          {/* Expiry pill top-right */}
          {expiry && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 9px',
                background: expiry.urgent
                  ? 'rgba(245,158,11,0.18)'
                  : 'rgba(15,15,18,0.70)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: expiry.urgent
                  ? '1px solid rgba(245,158,11,0.45)'
                  : '1px solid rgba(255,255,255,0.10)',
                borderRadius: 6,
                fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
                fontSize: '0.5625rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: expiry.urgent ? '#F59E0B' : 'rgba(255,255,255,0.65)',
                pointerEvents: 'none',
              }}
            >
              {expiry.urgent && <Warning size={10} weight="regular" />}
              {expiry.label}
            </div>
          )}

          {/* Hover overlay con acciones */}
          <div
            aria-hidden={!hover}
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.75) 100%)',
              opacity: hover ? 1 : 0,
              transition: 'opacity 200ms ease',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                display: 'flex',
                gap: 6,
                pointerEvents: hover ? 'auto' : 'none',
              }}
            >
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                title={isDownloading ? 'Descargando...' : 'Descargar'}
                aria-label="Descargar"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  color: '#FFFFFF',
                  cursor: isDownloading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background 150ms ease, border-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139,92,246,0.55)';
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.85)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
                }}
              >
                <DownloadSimple size={15} weight="regular" />
              </button>
              <button
                onClick={handleDeleteClick}
                title="Eliminar"
                aria-label="Eliminar"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background 150ms ease, border-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(235,87,87,0.65)';
                  e.currentTarget.style.borderColor = 'rgba(235,87,87,0.90)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
                }}
              >
                <Trash size={15} weight="regular" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer metadata */}
        <div
          style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderTop: '1px solid var(--pf-border-subtle)',
            background: 'var(--pf-bg-secondary)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
              fontSize: '0.625rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--pf-text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {modelLabel}
          </span>
          {relativeDate && (
            <span
              style={{
                fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
                fontSize: '0.5625rem',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--pf-text-muted)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {relativeDate}
            </span>
          )}
        </div>
      </Link>

      <ConfirmDialog
        open={showDeleteDialog}
        title="¿Eliminar esta pieza?"
        description={deleteError ? `⚠️ ${deleteError}` : "Esta acción no se puede deshacer. La creación y su archivo se eliminarán de forma permanente."}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        danger
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteDialog(false); setDeleteError(null); }}
      />
    </>
  );
};

export default CreationThumbnail;
