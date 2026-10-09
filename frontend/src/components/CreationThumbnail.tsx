// src/components/CreationThumbnail.tsx
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Trash2, ArchiveX } from 'lucide-react';
import { useSignedUrl } from '../hooks/useSignedUrl';
import { useCreations } from '../hooks/useCreations';
import ConfirmDialog from './ConfirmDialog';
import type { Creation } from '../types';

const MODEL_LABELS: Record<string, string> = {
  'krea-2-turbo': 'Krea 2 Turbo',
  'qwen-image-2.1': 'Qwen Image 2.1',
  'flux-2-klein-4b': 'Flux 2 Klein',
  'ltx-2.3': 'LTX 2.3',
  'ltx-2.3-msr': 'LTX 2.3 MSR',
  'ltx-2.5-msr': 'LTX 2.5 MSR',
  'wan-dual': 'Wan 2.1 Dual',
  'tts-dual': 'TTS Dual',
};

function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} dias`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks} sem`;
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function getModelLabel(creation: Creation): string {
  const id = creation.model_id || creation.model || '';
  return MODEL_LABELS[id] || id || 'IA';
}

// Waveform deterministica: mismos peaks para el mismo id
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

// Card de audio — subcomponente
const AudioThumbnail: React.FC<{ url: string; prompt: string }> = ({ url, prompt }) => {
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

      {/* Boton play/pause grande */}
      <button
        onClick={togglePlay}
        title={isPlaying ? 'Pausar' : 'Reproducir'}
        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#6366F1',
          border: 'none',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.06)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.55)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
        }}
      >
        {isPlaying ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}>
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        )}
      </button>

      {/* Waveform decorativa abajo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '16px',
          right: '16px',
          bottom: '44px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {seededPeaks(prompt || 'audio', 48).map((h, i) => {
          const played = i / 48 <= progress;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h * 100}%`,
                background: played
                  ? '#6366F1'
                  : 'var(--pf-text-muted, #6E747D)',
                opacity: played ? 1 : 0.4,
                borderRadius: '2px',
                transition: 'background 0.1s ease, opacity 0.1s ease',
              }}
            />
          );
        })}
      </div>

      {/* Barra de progreso inferior */}
      <div
        style={{
          position: 'absolute',
          left: '16px',
          right: '16px',
          bottom: '22px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 2,
          pointerEvents: 'auto',
        }}
      >
        <div
          onClick={handleSeek}
          style={{
            flex: 1,
            height: '4px',
            borderRadius: '9999px',
            background: 'var(--pf-border-default, #40454D)',
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
              background: '#6366F1',
              borderRadius: '9999px',
            }}
          />
        </div>
        <span style={{
          fontFamily: 'var(--pf-font-ui)',
          fontSize: '0.6875rem',
          color: 'var(--pf-text-secondary)',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}>
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
      </div>
    </>
  );
};

interface CreationThumbnailProps {
  creation: Creation;
}

export const CreationThumbnail: React.FC<CreationThumbnailProps> = ({ creation }) => {
  const { url, loading, error } = useSignedUrl(creation.id);
  const { deleteCreation, getDownloadUrl } = useCreations();
  const [mediaBroken, setMediaBroken] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Deteccion por media_type exclusivamente
  const isVideo = creation.media_type === 'video';
  const isAudio = creation.media_type === 'audio';

  const modelLabel = getModelLabel(creation);
  const relativeDate = formatRelative(creation.created_at);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const downloadUrl = await getDownloadUrl(creation.id);
    if (!downloadUrl) return;

    // Forzar descarga: fetch -> blob -> <a download>
    try {
      const res = await fetch(downloadUrl);
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
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCreation(creation.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Estado: cargando
  if (loading) {
    return (
      <div
        id={`thumb-${creation.id}`}
        style={{
          aspectRatio: '4 / 5',
          background: 'var(--pf-bg-secondary)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid var(--pf-border-default)',
          borderTopColor: 'var(--pf-text-muted)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  // Estado: expirado o sin preview
  if (error || !url || mediaBroken) {
    return (
      <>
        <div
          id={`thumb-${creation.id}`}
          style={{
            aspectRatio: '4 / 5',
            background: 'var(--pf-bg-tertiary)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '24px',
            textAlign: 'center',
            border: '1px solid var(--pf-border-subtle)',
          }}
        >
          <ArchiveX size={36} strokeWidth={1.5} style={{ color: 'var(--pf-text-muted)' }} />
          <div style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.875rem',
            color: 'var(--pf-text-secondary)',
            lineHeight: 1.4,
          }}>
            Esta pieza ya no esta disponible
          </div>
          <div style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.75rem',
            color: 'var(--pf-text-muted)',
          }}>
            Se elimino despues de 7 dias
          </div>
          <button
            onClick={handleDeleteClick}
            style={{
              marginTop: '6px',
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid var(--pf-border-default)',
              borderRadius: '8px',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--pf-text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--pf-text-muted)';
              e.currentTarget.style.color = 'var(--pf-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--pf-border-default)';
              e.currentTarget.style.color = 'var(--pf-text-secondary)';
            }}
          >
            Eliminar de mi coleccion
          </button>
        </div>
        <ConfirmDialog
          open={showDeleteDialog}
          title="Eliminar esta pieza?"
          description="La pieza se eliminara de tu coleccion de forma permanente."
          confirmLabel="Si, eliminar"
          cancelLabel="Cancelar"
          danger
          loading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </>
    );
  }

  // Card normal
  return (
    <>
      <Link
        to={`/creations/${creation.id}`}
        id={`thumb-${creation.id}`}
        className="pf-creation-card"
        style={{
          textDecoration: 'none',
          display: 'block',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--pf-bg-secondary)',
        }}
      >
        {isAudio ? (
          <div
            style={{
              width: '100%',
              aspectRatio: '4 / 5',
              background: 'var(--pf-bg-tertiary, #141414)',
              position: 'relative',
            }}
          >
            <AudioThumbnail url={url} prompt={creation.prompt} />
          </div>
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
                display: 'block',
                objectFit: 'cover',
              }}
            />
            {/* Play overlay centrado - siempre visible */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#FFFFFF"
                stroke="none"
                style={{ marginLeft: '3px' }}
              >
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
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
              display: 'block',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Overlay hover */}
        <div
          className="pf-creation-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 45%, transparent 70%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px',
            gap: '10px',
            pointerEvents: 'none',
          }}
        >
          {/* Prompt */}
          <div style={{
            fontFamily: 'var(--pf-font-prompt, var(--pf-font-ui))',
            fontSize: '0.875rem',
            lineHeight: 1.4,
            color: '#FFFFFF',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}>
            {creation.prompt}
          </div>

          {/* Chips + acciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 8px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '6px',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.95)',
              whiteSpace: 'nowrap',
            }}>
              {modelLabel}
            </span>
            {relativeDate && (
              <span style={{
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '0.6875rem',
                color: 'rgba(255,255,255,0.75)',
                whiteSpace: 'nowrap',
              }}>
                {relativeDate}
              </span>
            )}

            <div style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: '4px',
              pointerEvents: 'auto',
            }}>
              <button
                onClick={handleDownload}
                title="Descargar"
                aria-label="Descargar"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              >
                <Download size={14} />
              </button>
              <button
                onClick={handleDeleteClick}
                title="Eliminar"
                aria-label="Eliminar"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.7)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </Link>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Eliminar esta creacion?"
        description="Esta accion no se puede deshacer. La creacion y su archivo se eliminaran de forma permanente."
        confirmLabel="Si, eliminar"
        cancelLabel="Cancelar"
        danger
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
};

export default CreationThumbnail;
