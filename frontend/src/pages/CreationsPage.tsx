// src/pages/CreationsPage.tsx
// Lo que has creado — archivo personal con atmósfera y secciones por capability.
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Warning, ArrowRight } from '@phosphor-icons/react';
import { useCreations } from '../hooks/useCreations';
import type { Creation } from '../types';
import { CreationThumbnail } from '../components/CreationThumbnail';
import { readLiveCache, writeLiveCache } from '../lib/liveCache';
import { AtmosphereLayer } from '../components/marketing/Atmosphere';
import { useUIStore } from '../stores/useUIStore';

// ============================================================
// CACHE
// ============================================================
const LIVE_CACHE_KEY = 'creations';
const LIVE_CACHE_TTL_MS = 10 * 60 * 1000;
interface CreationsCache { items: Creation[]; }

// ============================================================
// COPY HELPERS
// ============================================================
const NUMERALES = [
  'cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho',
  'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis',
  'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
];
function numberWord(n: number): string {
  return NUMERALES[n] || String(n);
}

function buildSubtitle(stats: { total: number; images: number; videos: number; audios: number }): string {
  if (stats.total === 0) return '';
  const parts: string[] = [];
  if (stats.videos > 0) {
    parts.push(`${numberWord(stats.videos)} ${stats.videos === 1 ? 'video' : 'videos'}`);
  }
  if (stats.images > 0) {
    parts.push(`${numberWord(stats.images)} ${stats.images === 1 ? 'imagen' : 'imágenes'}`);
  }
  if (stats.audios > 0) {
    parts.push(`${numberWord(stats.audios)} ${stats.audios === 1 ? 'audio' : 'audios'}`);
  }
  if (parts.length === 0) return '';
  const list = parts.length === 1
    ? parts[0]
    : parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1];
  const head = `${numberWord(stats.total)} ${stats.total === 1 ? 'pieza' : 'piezas'}`;
  return `${head}. ${list.charAt(0).toUpperCase() + list.slice(1)}.`;
}

// ============================================================
// SECCIONES
// ============================================================
type FilterType = 'all' | 'image' | 'video' | 'audio';

const SectionDivider: React.FC = () => (
  <div
    aria-hidden
    style={{
      height: 1,
      background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.30) 50%, transparent 100%)',
      margin: '72px 0',
    }}
  />
);

const SectionHeader: React.FC<{ label: string; count: number }> = ({ label, count }) => (
  <div style={{ marginBottom: 24 }}>
    <div
      style={{
        fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
        fontSize: '0.6875rem',
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--pf-text-muted)',
        marginBottom: 12,
      }}
    >
      {label} · {count} {count === 1 ? 'pieza' : 'piezas'}
    </div>
    <div
      aria-hidden
      style={{
        height: 1,
        background: 'linear-gradient(90deg, rgba(139,92,246,0.30) 0%, transparent 100%)',
      }}
    />
  </div>
);

const MasonryGrid: React.FC<{ items: Creation[] }> = ({ items }) => (
  <div style={{ columnWidth: '320px', columnGap: '20px' }}>
    {items.map((creation, index) => (
      <div
        key={creation.id}
        style={{
          breakInside: 'avoid',
          marginBottom: '20px',
          animation: 'pfCreationIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
          animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
        }}
      >
        <CreationThumbnail creation={creation} />
      </div>
    ))}
  </div>
);

// ============================================================
// EMPTY STATE
// ============================================================
const EmptyState: React.FC<{ filter: FilterType }> = ({ filter }) => {
  const isAll = filter === 'all';
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 24px 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'relative',
          width: 80,
          height: 80,
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 0 32px rgba(139,92,246,0.55))',
          animation: 'pfCreationsEmptyPulse 3.5s ease-in-out infinite',
        }}
      >
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="pf-creations-hex" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <path
            d="M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z"
            stroke="url(#pf-creations-hex)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="rgba(139,92,246,0.06)"
          />
          <path
            d="M50 30 L68 41 L68 59 L50 70 L32 59 L32 41 Z"
            stroke="url(#pf-creations-hex)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="none"
            opacity="0.55"
          />
          <circle cx="50" cy="50" r="3" fill="#A78BFA" />
        </svg>
      </div>

      <h2
        style={{
          fontFamily: "'Satoshi', system-ui, sans-serif",
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1.1,
          margin: 0,
          marginBottom: 16,
          background: 'linear-gradient(135deg, var(--pf-text-primary) 0%, var(--pf-accent-primary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {isAll ? 'Todavía no has creado nada' : `Todavía no tienes ${filter === 'image' ? 'imágenes' : filter === 'video' ? 'videos' : 'audios'}`}
      </h2>

      <p
        style={{
          fontFamily: 'var(--pf-font-ui)',
          fontSize: '1rem',
          lineHeight: 1.6,
          color: 'var(--pf-text-secondary)',
          maxWidth: 460,
          margin: '0 auto 32px',
        }}
      >
        {isAll
          ? 'Cuando generes en el Studio, tus piezas van a aparecer aquí.'
          : 'Prueba con otra categoría o crea algo nuevo.'}
      </p>

      {isAll && (
        <Link
          to="/studio"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 28px',
            background: 'var(--pf-accent-primary)',
            color: '#FFFFFF',
            borderRadius: 9999,
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.9375rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 12px 32px -8px rgba(139,92,246,0.6)',
          }}
        >
          Abrir el Studio
          <ArrowRight size={14} weight="regular" />
        </Link>
      )}
    </div>
  );
};

// ============================================================
// LOADING STATE
// ============================================================
const LoadingState: React.FC = () => (
  <div
    style={{
      maxWidth: 1400,
      margin: '0 auto',
      padding: '0 24px 80px',
      display: 'flex',
      flexDirection: 'column',
      gap: 40,
    }}
  >
    <div
      style={{
        fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
        fontSize: '0.6875rem',
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--pf-text-muted)',
        textAlign: 'center',
      }}
    >
      Preparando tus piezas...
    </div>

    <div style={{ columnWidth: '320px', columnGap: 20 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            breakInside: 'avoid',
            marginBottom: 20,
            aspectRatio: i % 3 === 0 ? '9/16' : i % 2 === 0 ? '1/1' : '4/3',
            background: 'var(--pf-bg-secondary)',
            borderRadius: 14,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--pf-border-subtle)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(115deg, transparent 0%, rgba(139,92,246,0.06) 50%, transparent 100%)',
              animation: 'pfCreationShimmer 3.4s ease-in-out infinite',
            }}
          />
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// PAGE
// ============================================================
const CreationsPage: React.FC = () => {
  const { getCreations } = useCreations();
  const studioTheme = useUIStore((s) => s.studioTheme);

  const _cached = readLiveCache<CreationsCache>(LIVE_CACHE_KEY, LIVE_CACHE_TTL_MS);
  const [creations, setCreations] = useState<Creation[]>(() => _cached?.items ?? []);
  const [loading, setLoading] = useState<boolean>(() => _cached === null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCreations();
        setCreations(data || []);
        writeLiveCache<CreationsCache>(LIVE_CACHE_KEY, { items: data || [] });
      } catch {
        setError('No se pudieron cargar tus piezas.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getCreations]);

  const stats = useMemo(() => ({
    total: creations.length,
    images: creations.filter((c) => c.media_type === 'image').length,
    videos: creations.filter((c) => c.media_type === 'video').length,
    audios: creations.filter((c) => c.media_type === 'audio').length,
  }), [creations]);

  const filtered = useMemo(() => {
    if (filter === 'all') return creations;
    return creations.filter((c) => c.media_type === filter);
  }, [creations, filter]);

  // Piezas que vencen en las próximas 24h (solo si hay alguna)
  const urgentCount = useMemo(() => {
    const now = Date.now();
    const limit = now + 24 * 60 * 60 * 1000;
    return creations.filter((c) => {
      const t = new Date(c.expires_at).getTime();
      return !isNaN(t) && t > now && t < limit;
    }).length;
  }, [creations]);

  const filterChips: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'TODAS', count: stats.total },
    { id: 'image', label: 'IMAGEN', count: stats.images },
    { id: 'video', label: 'VIDEO', count: stats.videos },
    { id: 'audio', label: 'AUDIO', count: stats.audios },
  ];

  const hasSpaceAtmosphere = studioTheme === 'space';

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
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HERO                                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '140px 24px 60px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontFamily: "'Satoshi', system-ui, sans-serif",
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.05,
              margin: 0,
              marginBottom: 20,
              background: 'linear-gradient(135deg, var(--pf-text-primary) 0%, var(--pf-accent-primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Lo que has creado
          </h1>

          {stats.total > 0 && (
            <p
              style={{
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '1.0625rem',
                lineHeight: 1.6,
                color: 'var(--pf-text-secondary)',
                maxWidth: 560,
                margin: '0 auto',
              }}
            >
              {buildSubtitle(stats)}
            </p>
          )}

          {/* Pill amber si hay piezas urgentes */}
          {urgentCount > 0 && (
            <div
              style={{
                marginTop: 24,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                background: 'rgba(245,158,11,0.10)',
                border: '1px solid rgba(245,158,11,0.35)',
                borderRadius: 9999,
                fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
                fontSize: '0.625rem',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#F59E0B',
              }}
            >
              <Warning size={12} weight="regular" />
              {urgentCount === 1 ? 'Una pieza vence hoy' : `${numberWord(urgentCount).charAt(0).toUpperCase() + numberWord(urgentCount).slice(1)} piezas vencen hoy`}
            </div>
          )}

          {/* Filter chips */}
          {stats.total > 0 && (
            <div
              style={{
                marginTop: 40,
                display: 'flex',
                justifyContent: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              {filterChips.map((chip) => {
                const active = filter === chip.id;
                const disabled = chip.count === 0 && chip.id !== 'all';
                return (
                  <button
                    key={chip.id}
                    onClick={() => !disabled && setFilter(chip.id)}
                    disabled={disabled}
                    style={{
                      padding: '8px 16px',
                      background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                      border: active
                        ? '1px solid rgba(139,92,246,0.50)'
                        : '1px solid var(--pf-border-subtle)',
                      borderRadius: 9999,
                      fontFamily: 'var(--pf-font-mono, ui-monospace, monospace)',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: active
                        ? '#A78BFA'
                        : disabled
                          ? 'var(--pf-text-muted)'
                          : 'var(--pf-text-secondary)',
                      cursor: disabled ? 'default' : 'pointer',
                      opacity: disabled ? 0.4 : 1,
                      transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: active ? '0 0 20px -6px rgba(139,92,246,0.55)' : 'none',
                    }}
                  >
                    {chip.label} · {chip.count}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* GALERÍA                                                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {error ? (
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: '80px 24px',
              textAlign: 'center',
            }}
          >
            <Warning size={48} weight="regular" style={{ color: 'var(--pf-text-muted)', marginBottom: 16 }} />
            <h2
              style={{
                fontFamily: "'Satoshi', system-ui, sans-serif",
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--pf-text-primary)',
                margin: '0 0 12px',
              }}
            >
              Algo salió mal
            </h2>
            <p style={{ fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)', margin: 0 }}>
              {error}
            </p>
          </div>
        ) : loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 80px' }}>
            <EmptyState filter={filter} />
          </div>
        ) : filter === 'all' ? (
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 80px' }}>
            {stats.images > 0 && (
              <>
                <SectionHeader label="Imagen" count={stats.images} />
                <MasonryGrid items={creations.filter((c) => c.media_type === 'image')} />
              </>
            )}
            {stats.images > 0 && stats.videos > 0 && <SectionDivider />}
            {stats.videos > 0 && (
              <>
                <SectionHeader label="Video" count={stats.videos} />
                <MasonryGrid items={creations.filter((c) => c.media_type === 'video')} />
              </>
            )}
            {(stats.images > 0 || stats.videos > 0) && stats.audios > 0 && <SectionDivider />}
            {stats.audios > 0 && (
              <>
                <SectionHeader label="Audio" count={stats.audios} />
                <MasonryGrid items={creations.filter((c) => c.media_type === 'audio')} />
              </>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 80px' }}>
            <MasonryGrid items={filtered} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes pfCreationIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pfCreationShimmer {
          0%   { transform: translateX(0); }
          70%  { transform: translateX(220%); }
          100% { transform: translateX(220%); }
        }
        @keyframes pfCreationsEmptyPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 32px rgba(139,92,246,0.55)); }
          50%      { transform: scale(1.04); filter: drop-shadow(0 0 44px rgba(139,92,246,0.85)); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="pfCreation"], [style*="pfCreationsEmpty"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CreationsPage;
