import React from 'react';
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import type { BootInfo } from '../hooks/useStationBoot';

interface StationBootPillProps {
  boot: BootInfo;
  modelLabel?: string;
}

// Fase narrativa según progreso (coincide con _phase() del notebook)
function phaseLabel(progress: number): string {
  if (progress < 0.2) return 'Preparando entorno';
  if (progress < 0.5) return 'Instalando herramientas';
  if (progress < 0.85) return 'Descargando modelos';
  if (progress < 1.0) return 'Conectando nodo';
  return 'Estación lista';
}

export const StationBootPill: React.FC<StationBootPillProps> = ({ boot }) => {
  // No mostrar nada si está en idle o si ya está lista (el botón Generar se encarga)
  if (boot.state === 'idle' || boot.isReady) return null;

  const pct = Math.round(Math.max(0, Math.min(1, boot.progress)) * 100);
  const phase = phaseLabel(boot.progress);

  const isError = boot.isError;
  const isStale = boot.isStale;

  const accent = isError
    ? '#F87171'
    : isStale
    ? '#F59E0B'
    : '#22D3EE';

  const bg = isError
    ? 'rgba(248,113,113,0.08)'
    : isStale
    ? 'rgba(245,158,11,0.08)'
    : 'rgba(34,211,238,0.06)';

  const border = isError
    ? 'rgba(248,113,113,0.3)'
    : isStale
    ? 'rgba(245,158,11,0.3)'
    : 'rgba(34,211,238,0.25)';

  const Icon = isError ? AlertCircle : isStale ? AlertTriangle : Loader2;
  const iconClass = !isError && !isStale ? 'pf-boot-spin' : '';

  const label = isError
    ? 'Falló el arranque'
    : isStale
    ? 'Sin reportes hace 4 min'
    : `${phase}...`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '10px',
        marginBottom: '10px',
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      <Icon
        size={14}
        className={iconClass}
        style={{ color: accent, flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: accent,
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: boot.isBooting ? '5px' : 0,
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
          {boot.isBooting && (
            <span
              style={{
                fontFamily: 'var(--pf-font-chat-mono, monospace)',
                fontSize: '0.6875rem',
                opacity: 0.85,
                flexShrink: 0,
              }}
            >
              {pct}%
            </span>
          )}
        </div>

        {boot.isBooting && (
          <div
            style={{
              height: '3px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: accent,
                borderRadius: '9999px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        )}

        {!boot.isBooting && boot.stepMessage && (
          <div
            style={{
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.6875rem',
              color: 'var(--pf-text-muted)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {boot.stepMessage}
          </div>
        )}
      </div>

      <style>{`
        .pf-boot-spin { animation: pf-boot-spin 2s linear infinite; }
        @keyframes pf-boot-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StationBootPill;
