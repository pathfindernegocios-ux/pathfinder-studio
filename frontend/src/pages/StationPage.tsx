// src/pages/StationPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Lock, Sparkles, Clock, Loader2, ExternalLink, HelpCircle, Flame, Crown, Zap, Layers, ArrowRight } from 'lucide-react';
import { useModels } from '../hooks/useModels';
import type { ModelCatalogEntry } from '../hooks/useModels';
import { supabase } from '../lib/supabaseClient';
import { Client } from '@gradio/client';
import { Power } from 'lucide-react';
import { useGenerationContext } from '../context/GenerationContext';
import { usePurchase } from '../hooks/usePurchase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import ConfirmDialog from '../components/ConfirmDialog';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// ============================================================
// Download de notebook
// ============================================================
async function downloadNotebook(modelId: string, platform: 'kaggle' | 'colab' = 'kaggle'): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No hay sesión activa');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-notebook`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ modelId, platform }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Error ${res.status}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pathfinder-${modelId}.ipynb`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ============================================================
// Shutdown de estación
// ============================================================
async function shutdownStation(modelId: string, stationId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No hay sesión activa');

  // 1. Buscar el runtime más reciente de este modelo
  let gradioUrl: string | null = null;
  try {
    const { data } = await supabase
      .from('runtimes')
      .select('gradio_url, created_at')
      .eq('station_id', stationId)
      .eq('model_id', modelId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.gradio_url) gradioUrl = data.gradio_url;
  } catch { /* ignorar */ }

  // 2. Best-effort: llamar al endpoint /shutdown del notebook
  if (gradioUrl) {
    try {
      const client = await Promise.race([
        Client.connect(gradioUrl),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
      await Promise.race([
        client.predict('/shutdown', [token]),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
    } catch {
      // El notebook puede estar ya muerto o sin responder — seguimos igual
    }
  }

  // 3. Esperar 2.5s para dar tiempo al notebook a procesar su shutdown
  await new Promise((r) => setTimeout(r, 2500));

  // 4. Borrar todas las filas de este modelo (el notebook también lo intenta, pero por las dudas)
  await supabase
    .from('runtimes')
    .delete()
    .eq('station_id', stationId)
    .eq('model_id', modelId);
}

// ============================================================
// Card de modelo (owned / locked / coming soon)
// ============================================================
type CardVariant = 'owned' | 'locked' | 'coming_soon';

interface ModelCardProps {
  model: ModelCatalogEntry;
  variant: CardVariant;
  onDownload?: (modelId: string) => void;
  isDownloading?: boolean;
  isOnline?: boolean;
  onShutdown?: (modelId: string) => void;
  isShuttingDown?: boolean;
  onUnlock?: () => void;
  isUnlocking?: boolean;
  canDownloadColab?: boolean;
  onDownloadColab?: (modelId: string) => void;
  isDownloadingColab?: boolean;
  onColabLocked?: () => void;
}

const CAPABILITY_LABEL: Record<string, string> = {
  image: 'Imagen',
  video: 'Video',
  audio: 'Audio',
};

const ModelCard: React.FC<ModelCardProps> = ({ model, variant, onDownload, isDownloading, isOnline, onShutdown, isShuttingDown, onUnlock, isUnlocking, canDownloadColab, onDownloadColab, isDownloadingColab, onColabLocked }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const hasColabVariant =
    typeof (model.metadata as Record<string, unknown>)?.colab_template_path === 'string' &&
    ((model.metadata as Record<string, unknown>).colab_template_path as string).length > 0;

  const isColabOnly = (model.metadata as Record<string, unknown>)?.colab_only === true;

  const CAPABILITY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
    image: { text: '#67E8F9', bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.3)' },
    video: { text: '#F472B6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.3)' },
    audio: { text: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
  };
  const capColor = CAPABILITY_COLORS[model.capability] || { text: 'var(--pf-text-muted)', bg: 'var(--pf-bg-tertiary)', border: 'var(--pf-border-subtle)' };

  const STRENGTH_BADGES: Record<string, { text: string; color: string; bg: string; border: string }> = {
    'qwen-image-2.1': { text: 'Sin censura', color: '#C4B5FD', bg: 'rgba(167,139,250,0.14)', border: 'rgba(167,139,250,0.4)' },
    'flux-2-klein-4b': { text: 'Edicion precisa', color: '#93C5FD', bg: 'rgba(96,165,250,0.14)', border: 'rgba(96,165,250,0.4)' },
    'ltx-2.3': { text: 'Con audio', color: '#F9A8D4', bg: 'rgba(244,114,182,0.14)', border: 'rgba(244,114,182,0.4)' },
    'ltx-2.3-msr': { text: 'Multi-referencia', color: '#6EE7B7', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)' },
    'ltx-2.5-msr': { text: 'Multi-ref 2.5', color: '#67E8F9', bg: 'rgba(34,211,238,0.14)', border: 'rgba(34,211,238,0.4)' },
    'tts-dual': { text: 'Clonacion de voz', color: '#FCD34D', bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.4)' },
  };

  const strength = STRENGTH_BADGES[model.id];

  const isClickableLocked = variant === 'locked' && !!onUnlock;
  const isOwnedOnline = variant === 'owned' && isOnline === true;

  // ── Estilos dinámicos del wrapper ──
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    background: 'var(--pf-bg-elevated, var(--pf-bg-primary))',
    border: isOwnedOnline
      ? '1px solid rgba(16,185,129,0.5)'
      : isClickableLocked && isHovered
        ? '1px solid rgba(139,92,246,0.6)'
        : '1px solid var(--pf-border-default)',
    borderRadius: '20px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isOwnedOnline
      ? '0 0 40px -12px rgba(16,185,129,0.55), 0 8px 24px -12px rgba(0,0,0,0.08)'
      : isClickableLocked && isHovered
        ? '0 20px 48px -20px rgba(139,92,246,0.6), 0 8px 24px -12px rgba(0,0,0,0.08)'
        : '0 1px 3px rgba(0,0,0,0.04)',
    cursor: isClickableLocked ? (isUnlocking ? 'wait' : 'pointer') : 'default',
    transform: isClickableLocked && isHovered ? 'translateY(-3px)' : 'none',
    overflow: 'hidden',
  };

  return (
    <div
      onClick={isClickableLocked && !isUnlocking ? onUnlock : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={wrapperStyle}
    >
      {/* Glow ring cuando online */}
      {isOwnedOnline && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '20px',
            padding: '1px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.4), rgba(16,185,129,0) 50%, rgba(16,185,129,0.4))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Thumbnail ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/10',
          background: 'var(--pf-bg-tertiary)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--pf-text-muted)',
          fontSize: '2rem',
          overflow: 'hidden',
        }}
      >
        {model.thumbnail_url ? (
          <img
            src={model.thumbnail_url}
            alt={model.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: variant === 'coming_soon' ? 'blur(3px) brightness(0.7)' : 'none',
              transition: 'transform 0.4s ease',
              transform: isHovered && isClickableLocked ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        ) : (
          <Sparkles size={32} />
        )}

        {/* Gradient overlay inferior */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Dot ON pulsante (owned online) */}
        {isOwnedOnline && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderRadius: '9999px',
              fontFamily: 'var(--pf-font-ui, system-ui)',
              fontSize: '0.6875rem',
              fontWeight: 800,
              color: '#10B981',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 10px #10B981',
                animation: 'pf-pulse 1.6s ease-in-out infinite',
              }}
            />
            ON
          </div>
        )}

        {/* Badge del "fuerte" (locked) */}
        {variant === 'locked' && strength && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '5px 11px',
              background: strength.bg,
              border: `1px solid ${strength.border}`,
              borderRadius: '9999px',
              fontFamily: 'var(--pf-font-ui, system-ui)',
              fontSize: '0.625rem',
              fontWeight: 800,
              color: strength.color,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {strength.text}
          </div>
        )}

        {/* Badge Próximamente (coming_soon) */}
        {variant === 'coming_soon' && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '5px 11px',
              background: 'rgba(245,158,11,0.2)',
              border: '1px solid rgba(245,158,11,0.5)',
              borderRadius: '9999px',
              fontFamily: 'var(--pf-font-ui, system-ui)',
              fontSize: '0.625rem',
              fontWeight: 800,
              color: '#FCD34D',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              backdropFilter: 'blur(10px)',
            }}
          >
            Proximamente
          </div>
        )}

        {/* Chip de capability (owned) */}
        {variant === 'owned' && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              padding: '4px 10px',
              background: capColor.bg,
              border: `1px solid ${capColor.border}`,
              borderRadius: '9999px',
              fontFamily: 'var(--pf-font-ui, system-ui)',
              fontSize: '0.625rem',
              fontWeight: 800,
              color: capColor.text,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              backdropFilter: 'blur(10px)',
            }}
          >
            {CAPABILITY_LABEL[model.capability] || model.capability}
          </div>
        )}
      </div>

      {/* ── Nombre + estado ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            fontFamily: 'var(--pf-font-display, system-ui)',
            fontSize: '1.1875rem',
            fontWeight: 700,
            color: 'var(--pf-text-primary)',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
          }}
        >
          {model.name}
        </div>
        {variant === 'owned' && isOnline !== undefined && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--pf-font-ui, system-ui)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isOnline ? '#10B981' : 'var(--pf-text-muted)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isOnline ? '#10B981' : 'var(--pf-text-muted)',
                boxShadow: isOnline ? '0 0 8px #10B981' : 'none',
              }}
            />
            {isOnline ? 'Estacion encendida' : 'Estacion apagada'}
          </div>
        )}
      </div>

      {/* ── Descripción ── */}
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--pf-font-ui, system-ui)',
          fontSize: '0.875rem',
          lineHeight: 1.55,
          color: 'var(--pf-text-secondary)',
          flex: 1,
        }}
      >
        {model.description}
      </p>

      {/* ── Acciones (owned) ── */}
      {variant === 'owned' && onDownload && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingTop: '14px',
            borderTop: '1px solid var(--pf-border-subtle)',
          }}
        >
          <button
            onClick={() => onDownload(model.id)}
            disabled={isDownloading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: isDownloading
                ? 'var(--pf-bg-tertiary)'
                : (isColabOnly
                    ? 'linear-gradient(135deg, #F9AB00 0%, #FBBC04 100%)'
                    : 'linear-gradient(135deg, #20BEFF 0%, #1E9DE0 100%)'),
              color: isDownloading
                ? 'var(--pf-text-muted)'
                : (isColabOnly ? '#1A1A1A' : '#FFFFFF'),
              border: 'none',
              borderRadius: '11px',
              fontFamily: 'var(--pf-font-ui, system-ui)',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isDownloading
                ? 'none'
                : (isColabOnly
                    ? '0 8px 20px -8px rgba(249,171,0,0.65)'
                    : '0 8px 20px -8px rgba(32,190,255,0.65)'),
            }}
            onMouseEnter={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = isColabOnly
                  ? '0 12px 28px -8px rgba(249,171,0,0.9)'
                  : '0 12px 28px -8px rgba(32,190,255,0.9)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isDownloading
                ? 'none'
                : (isColabOnly
                    ? '0 8px 20px -8px rgba(249,171,0,0.65)'
                    : '0 8px 20px -8px rgba(32,190,255,0.65)');
            }}
          >
            {isDownloading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Descargando...
              </>
            ) : (
              <>
                <Download size={14} />
                {isColabOnly ? 'Descargar (Colab)' : 'Descargar notebook'}
              </>
            )}
          </button>

          {hasColabVariant && (
            <button
              onClick={() =>
                canDownloadColab && onDownloadColab
                  ? onDownloadColab(model.id)
                  : onColabLocked?.()
              }
              disabled={isDownloadingColab}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: canDownloadColab
                  ? isDownloadingColab
                    ? 'var(--pf-bg-tertiary)'
                    : 'linear-gradient(135deg, #F9AB00 0%, #FBBC04 100%)'
                  : 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(236,72,153,0.1))',
                color: canDownloadColab
                  ? isDownloadingColab
                    ? 'var(--pf-text-muted)'
                    : '#1A1A1A'
                  : '#C4B5FD',
                border: canDownloadColab ? 'none' : '1px solid rgba(139,92,246,0.45)',
                borderRadius: '11px',
                fontFamily: 'var(--pf-font-ui, system-ui)',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: isDownloadingColab ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isDownloadingColab ? 0.6 : 1,
                boxShadow:
                  canDownloadColab && !isDownloadingColab
                    ? '0 8px 20px -8px rgba(249,171,0,0.65)'
                    : 'none',
              }}
              onMouseEnter={(e) => {
                if (canDownloadColab && !isDownloadingColab) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px -8px rgba(249,171,0,0.9)';
                } else if (!canDownloadColab) {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(236,72,153,0.16))';
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.75)';
                  e.currentTarget.style.boxShadow = '0 10px 24px -10px rgba(139,92,246,0.6)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  canDownloadColab && !isDownloadingColab
                    ? '0 8px 20px -8px rgba(249,171,0,0.65)'
                    : 'none';
                if (!canDownloadColab) {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(236,72,153,0.1))';
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)';
                }
              }}
            >
              {isDownloadingColab ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Descargar (Colab)
                  {!canDownloadColab && (
                    <span
                      style={{
                        marginLeft: '6px',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        background: 'rgba(139,92,246,0.25)',
                        color: '#DDD6FE',
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Creator
                    </span>
                  )}
                </>
              )}
            </button>
          )}

          {onShutdown && isOnline && (
            <button
              onClick={() => onShutdown(model.id)}
              disabled={isShuttingDown}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: isShuttingDown ? 'rgba(239,68,68,0.08)' : 'transparent',
                color: isShuttingDown ? 'var(--pf-text-muted)' : '#F87171',
                border: `1px solid ${isShuttingDown ? 'var(--pf-border-default)' : 'rgba(239,68,68,0.35)'}`,
                borderRadius: '11px',
                fontFamily: 'var(--pf-font-ui, system-ui)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                cursor: isShuttingDown ? 'not-allowed' : 'pointer',
                opacity: isShuttingDown ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (isShuttingDown) return;
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)';
              }}
              onMouseLeave={(e) => {
                if (isShuttingDown) return;
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)';
              }}
            >
              {isShuttingDown ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Apagando...
                </>
              ) : (
                <>
                  <Power size={14} />
                  Apagar estacion
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Footer locked ── */}
      {variant === 'locked' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '14px',
            marginTop: 'auto',
            borderTop: '1px solid var(--pf-border-subtle)',
            fontFamily: 'var(--pf-font-ui, system-ui)',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: isUnlocking
              ? 'var(--pf-text-muted)'
              : onUnlock
                ? '#A78BFA'
                : 'var(--pf-text-muted)',
            letterSpacing: '-0.01em',
            transition: 'color 0.2s',
          }}
        >
          <span>
            {isUnlocking
              ? 'Redirigiendo a Stripe...'
              : onUnlock
                ? 'Desbloquear con Creator'
                : 'Requiere plan Creator'}
          </span>
          {!isUnlocking && onUnlock && (
            <ArrowRight
              size={18}
              strokeWidth={2.5}
              style={{
                color: 'var(--pf-text-primary)',
                transition: 'transform 0.2s',
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                flexShrink: 0,
              }}
            />
          )}
          {!onUnlock && <Lock size={13} />}
        </div>
      )}

      {/* ── Footer coming soon ── */}
      {variant === 'coming_soon' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '14px',
            marginTop: 'auto',
            borderTop: '1px solid var(--pf-border-subtle)',
            fontFamily: 'var(--pf-font-ui, system-ui)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--pf-text-muted)',
            letterSpacing: '-0.01em',
          }}
        >
          <span>Proximamente</span>
          <Clock size={13} />
        </div>
      )}
    </div>
  );
};

// ============================================================
// Página principal
// ============================================================
const StationPage: React.FC = () => {
  const { ownedModels, lockedModels, comingSoonModels, loading, error, refresh } = useModels();
  const { stationStatusMap, refreshStationStatus } = useGenerationContext();
  const { startCheckout, state: purchaseState } = usePurchase();
  const { profile } = useAuth();
  const { resolved } = useTheme();
  const isLight = resolved === 'light';
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingColabId, setDownloadingColabId] = useState<string | null>(null);

  const userPlan = ((profile as Record<string, unknown> | null)?.plan as string || 'standard').toLowerCase();
  const canDownloadColab = ['creator', 'founder', 'pro'].includes(userPlan);
  const [shuttingDownId, setShuttingDownId] = useState<string | null>(null);
  const [shutdownTargetId, setShutdownTargetId] = useState<string | null>(null);

  const handleShutdown = (modelId: string) => {
    setShutdownTargetId(modelId);
  };

  const handleConfirmShutdown = async () => {
    if (!shutdownTargetId) return;
    const modelId = shutdownTargetId;
    setShuttingDownId(modelId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const stationId = session?.user?.id;
      if (!stationId) throw new Error('No hay sesión activa');

      await shutdownStation(modelId, stationId);
      await refreshStationStatus();
    } catch (e) {
      void 0;
      alert('Hubo un problema al apagar la estación. Intenta de nuevo.');
    } finally {
      setShuttingDownId(null);
      setShutdownTargetId(null);
    }
  };

  const handleDownload = async (modelId: string, platform: 'kaggle' | 'colab' = 'kaggle') => {
    if (platform === 'colab') {
      setDownloadingColabId(modelId);
    } else {
      setDownloadingId(modelId);
    }
    try {
      await downloadNotebook(modelId, platform);
    } catch (e) {
      void 0;
      alert('No se pudo descargar el notebook. Intenta de nuevo.');
    } finally {
      setDownloadingId(null);
      setDownloadingColabId(null);
    }
  };

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        color: 'var(--pf-text-primary)',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '48px 32px 80px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          {canDownloadColab && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: '9999px',
                fontFamily: 'var(--pf-font-ui, system-ui)',
                fontSize: '0.6875rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#10B981',
                marginBottom: '16px',
              }}
            >
              <Crown size={12} strokeWidth={2.5} />
              Creator activo
            </div>
          )}
          <h1
            style={{
              fontFamily: 'var(--pf-font-display)',
              fontSize: '2.25rem',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              margin: 0,
              marginBottom: '8px',
              lineHeight: 1.15,
            }}
          >
            Mi Estación
          </h1>
          <p
            style={{
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.9375rem',
              color: 'var(--pf-text-secondary)',
              margin: 0,
              maxWidth: '560px',
              lineHeight: 1.6,
            }}
          >
            {canDownloadColab
              ? 'Los 8 modelos del catálogo, listos para correr. Sin créditos. Sin límites semanales.'
              : 'Ocho modelos. Un solo lugar. Cero créditos. Descarga tus notebooks y corre tus runtimes en Kaggle o Google Colab — sin límites por generación.'}
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <a
              href="https://www.kaggle.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 20px",
                background: "linear-gradient(135deg, #20BEFF 0%, #1E9DE0 100%)",
                color: "#FFFFFF",
                borderRadius: "10px",
                textDecoration: "none",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.875rem",
                fontWeight: 700,
                boxShadow: "0 8px 20px -8px rgba(32,190,255,0.7)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 12px 28px -8px rgba(32,190,255,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px -8px rgba(32,190,255,0.7)";
              }}
            >
              Abrir Kaggle
              <ExternalLink size={14} />
            </a>
            <a
              href="https://colab.research.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 20px",
                background: "linear-gradient(135deg, #F9AB00 0%, #FBBC04 100%)",
                color: "#1A1A1A",
                borderRadius: "10px",
                textDecoration: "none",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.875rem",
                fontWeight: 700,
                boxShadow: "0 8px 20px -8px rgba(249,171,0,0.7)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 12px 28px -8px rgba(249,171,0,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px -8px rgba(249,171,0,0.7)";
              }}
            >
              Abrir Colab
              <ExternalLink size={14} />
            </a>
            <Link
              to="/how-it-works"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "transparent",
                color: "var(--pf-text-primary, #0A0A0A)",
                border: "1px solid var(--pf-border-default, #E5E5E5)",
                borderRadius: "10px",
                textDecoration: "none",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--pf-bg-secondary, #FAFAFA)";
                e.currentTarget.style.borderColor = "var(--pf-text-primary, #0A0A0A)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--pf-border-default, #E5E5E5)";
              }}
            >
              <HelpCircle size={14} />
              ¿Cómo enciendo mi estación?
            </Link>
          </div>

          {canDownloadColab && ownedModels.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                marginTop: '20px',
              }}
            >
              {[
                { Icon: Layers, label: `${ownedModels.length} modelos` },
                { Icon: Zap, label: '120 h/mes' },
                { Icon: Sparkles, label: 'Sin créditos' },
              ].map(({ Icon, label }, i) => (
                <div
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'var(--pf-bg-secondary)',
                    border: '1px solid var(--pf-border-default)',
                    borderRadius: '9999px',
                    fontFamily: 'var(--pf-font-ui, system-ui)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--pf-text-secondary)',
                  }}
                >
                  <Icon size={12} strokeWidth={2.25} />
                  {label}
                </div>
              ))}
            </div>
          )}

          {!canDownloadColab && (() => {
            const deadline = new Date("2026-12-31T23:59:59-06:00").getTime();
            const msLeft = Math.max(0, deadline - Date.now());
            const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
            const isPurchasing = purchaseState === 'loading';

            return (
              <div
                style={{
                  position: "relative",
                  marginTop: "32px",
                  padding: "32px 32px 28px",
                  background: isLight
                    ? "linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(236,72,153,0.05) 100%)"
                    : "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(236,72,153,0.12) 50%, rgba(34,211,238,0.08) 100%)",
                  border: isLight
                    ? "1px solid rgba(139,92,246,0.3)"
                    : "1px solid rgba(139,92,246,0.4)",
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: isLight
                    ? "0 12px 32px -16px rgba(139,92,246,0.25)"
                    : "0 20px 60px -20px rgba(139,92,246,0.5)",
                }}
              >
                {/* Glow decorativo — solo en dark/neon */}
                {!isLight && (
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: "-40%",
                      right: "-10%",
                      width: "400px",
                      height: "400px",
                      background:
                        "radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />
                )}

                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                    {/* Badge de urgencia */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "5px 12px",
                        background: isLight
                          ? "rgba(220,38,38,0.08)"
                          : "rgba(220,38,38,0.18)",
                        border: isLight
                          ? "1px solid rgba(220,38,38,0.35)"
                          : "1px solid rgba(220,38,38,0.5)",
                        borderRadius: "9999px",
                        fontFamily: "var(--pf-font-ui, system-ui)",
                        fontSize: "0.6875rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: isLight ? "#B91C1C" : "#FCA5A5",
                        marginBottom: "14px",
                      }}
                    >
                      <Flame size={12} strokeWidth={2.5} />
                      Precio de lanzamiento · Quedan {daysLeft} días
                    </div>

                    {/* Título */}
                    <div
                      style={{
                        fontFamily: "var(--pf-font-display, system-ui)",
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        letterSpacing: "-0.03em",
                        color: "var(--pf-text-primary)",
                        marginBottom: "8px",
                        lineHeight: 1.2,
                      }}
                    >
                      Desbloquea 5 modelos más.<br />
                      <span style={{ color: isLight ? "#6D28D9" : "#A5B4FC" }}>
                        Corre Kaggle y Colab al mismo tiempo.
                      </span>
                    </div>

                    {/* Subtítulo */}
                    <div
                      style={{
                        fontFamily: "var(--pf-font-ui, system-ui)",
                        fontSize: "0.9375rem",
                        color: "var(--pf-text-secondary)",
                        lineHeight: 1.55,
                        marginBottom: "20px",
                        maxWidth: "560px",
                      }}
                    >
                      Sin créditos por generación. Sin límites semanales.{" "}
                      <strong style={{ color: "var(--pf-text-primary)" }}>
                        $249/mes hasta el 31 dic
                      </strong>{" "}
                      — después sube a{" "}
                      <s style={{ opacity: 0.7 }}>$399/mes</s>.
                    </div>

                    {/* CTA + microcopy */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => startCheckout("creator")}
                        disabled={isPurchasing}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "14px 28px",
                          background: isPurchasing
                            ? "rgba(139,92,246,0.4)"
                            : "linear-gradient(135deg, #8B5CF6, #EC4899)",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "12px",
                          fontFamily: "var(--pf-font-ui, system-ui)",
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          cursor: isPurchasing ? "wait" : "pointer",
                          boxShadow: "0 12px 32px -8px rgba(139,92,246,0.8)",
                          transition: "transform 0.15s, box-shadow 0.15s",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          if (!isPurchasing) {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                              "0 16px 40px -8px rgba(139,92,246,1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 12px 32px -8px rgba(139,92,246,0.8)";
                        }}
                      >
                        {isPurchasing
                          ? "Redirigiendo a Stripe..."
                          : "Suscribirme — $249/mes"}
                      </button>
                      <div
                        style={{
                          fontFamily: "var(--pf-font-ui, system-ui)",
                          fontSize: "0.75rem",
                          color: "var(--pf-text-muted)",
                          lineHeight: 1.4,
                        }}
                      >
                        14 días de reembolso. Cancela cuando quieras.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Loading / Error */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--pf-text-muted)' }}>
            <Loader2 size={24} className="animate-spin" />
            <div style={{ marginTop: '12px', fontFamily: 'var(--pf-font-ui)', fontSize: '0.875rem' }}>
              Cargando modelos...
            </div>
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid #EF4444',
              borderRadius: '12px',
              color: '#EF4444',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.875rem',
              marginBottom: '32px',
            }}
          >
            {error}
            <button
              onClick={refresh}
              style={{
                marginLeft: '12px',
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '0.875rem',
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Sección 1: Mis notebooks */}
        {!loading && !error && ownedModels.length > 0 && (
          <section style={{ marginBottom: '56px' }}>
            <h2
              style={{
                fontFamily: 'var(--pf-font-display)',
                fontSize: '1.125rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: 0,
                marginBottom: '20px',
                color: 'var(--pf-text-primary)',
              }}
            >
              Mis notebooks
              <span
                style={{
                  marginLeft: '10px',
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--pf-text-muted)',
                }}
              >
                {ownedModels.length}
              </span>
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {[...ownedModels]
                .sort((a, b) => {
                  const aOnline = stationStatusMap[a.id] === 'online' ? 1 : 0;
                  const bOnline = stationStatusMap[b.id] === 'online' ? 1 : 0;
                  return bOnline - aOnline;
                })
                .map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    variant="owned"
                    onDownload={handleDownload}
                    isDownloading={downloadingId === model.id}
                    isOnline={stationStatusMap[model.id] === 'online'}
                    onShutdown={handleShutdown}
                    isShuttingDown={shuttingDownId === model.id}
                    canDownloadColab={canDownloadColab}
                    onDownloadColab={(id: string) => handleDownload(id, 'colab')}
                    isDownloadingColab={downloadingColabId === model.id}
                    onColabLocked={() => navigate('/pricing')}
                  />
                ))}
            </div>
          </section>
        )}

        {/* Sección 2: Catálogo */}
        {!loading && !error && (lockedModels.length > 0 || comingSoonModels.length > 0) && (
          <section>
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  fontFamily: 'var(--pf-font-display)',
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  margin: 0,
                  marginBottom: '6px',
                  color: 'var(--pf-text-primary)',
                }}
              >
                Desbloquea {lockedModels.filter((m) => !m.coming_soon).length} modelos más con Creator
              </h2>
              <p
                style={{
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.875rem',
                  color: 'var(--pf-text-secondary)',
                  margin: 0,
                  lineHeight: 1.55,
                  maxWidth: '620px',
                }}
              >
                Los mejores pipelines del catalogo: sin censura, multi-referencia, clonacion de voz y video con audio. Click en cualquier card para suscribirte.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {[...lockedModels, ...comingSoonModels].map((model) => {
                // Modelos "no free" son los que requieren plan pago.
                // Antes estaba hardcodeado a flux-2-klein-4b y ltx-2.3 — quedaba
                // obsoleto con cada modelo nuevo. Ahora se lee dinámicamente.
                const isPro = !model.is_free;
                return (
                  <ModelCard
                    key={model.id}
                    model={model}
                    variant={model.coming_soon ? 'coming_soon' : 'locked'}
                    onUnlock={isPro && !model.coming_soon ? () => startCheckout("creator") : undefined}
                    isUnlocking={purchaseState === 'loading'}
                  />
                );
              })}
            </div>

            {/* CTA grande al final del grid */}
            {lockedModels.filter((m) => !m.coming_soon).length > 0 && (
              <div
                style={{
                  marginTop: '32px',
                  padding: '28px 32px',
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.05))',
                  border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '24px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--pf-font-display)',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: 'var(--pf-text-primary)',
                      marginBottom: '4px',
                    }}
                  >
                    Un solo click te desbloquea todo.
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--pf-font-ui)',
                      fontSize: '0.875rem',
                      color: 'var(--pf-text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    $249/mes · 14 dias de reembolso · Cancela cuando quieras.
                  </div>
                </div>
                <button
                  onClick={() => startCheckout("creator")}
                  disabled={purchaseState === 'loading'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    background: purchaseState === 'loading'
                      ? 'rgba(139,92,246,0.4)'
                      : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontFamily: 'var(--pf-font-ui)',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    cursor: purchaseState === 'loading' ? 'wait' : 'pointer',
                    boxShadow: '0 12px 32px -8px rgba(139,92,246,0.7)',
                    whiteSpace: 'nowrap',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (purchaseState !== 'loading') {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 16px 40px -8px rgba(139,92,246,0.95)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(139,92,246,0.7)';
                  }}
                >
                  {purchaseState === 'loading'
                    ? 'Redirigiendo a Stripe...'
                    : 'Suscribirme a Creator'}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Estado vacío (nada en ninguna sección) */}
        {!loading && !error && ownedModels.length === 0 && lockedModels.length === 0 && comingSoonModels.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--pf-text-muted)' }}>
            <Sparkles size={32} style={{ marginBottom: '16px' }} />
            <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '0.9375rem', margin: 0 }}>
              Todavía no hay modelos disponibles en el catálogo.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={shutdownTargetId !== null}
        title="¿Apagar esta estación?"
        description="Se cerrará la sesión de Kaggle y los archivos temporales se perderán. Tus creaciones ya guardadas en Mis Creaciones se mantienen."
        confirmLabel="Sí, apagar"
        cancelLabel="Cancelar"
        danger
        loading={shuttingDownId !== null}
        onConfirm={handleConfirmShutdown}
        onCancel={() => setShutdownTargetId(null)}
      />

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pf-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};

export default StationPage;
