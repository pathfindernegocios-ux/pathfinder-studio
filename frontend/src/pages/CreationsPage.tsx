// src/pages/CreationsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, Palette } from "lucide-react";
import { useCreations } from '../hooks/useCreations';
import type { Creation } from '../types';
import { CreationThumbnail } from '../components/CreationThumbnail';
import { readLiveCache, writeLiveCache } from '../lib/liveCache';

const LIVE_CACHE_KEY = 'creations';
const LIVE_CACHE_TTL_MS = 10 * 60 * 1000;
interface CreationsCache { items: Creation[]; }

const CreationsPage: React.FC = () => {
  const { getCreations } = useCreations();
  const _cached = readLiveCache<CreationsCache>(LIVE_CACHE_KEY, LIVE_CACHE_TTL_MS);
  const [creations, setCreations] = useState<Creation[]>(() => _cached?.items ?? []);
  const [loading, setLoading] = useState<boolean>(() => _cached === null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCreations();
        void 0;
        setCreations(data || []);
        writeLiveCache<CreationsCache>(LIVE_CACHE_KEY, { items: data || [] });
      } catch (err) {
        void 0;
        setError('No se pudieron cargar tus creaciones.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getCreations]);

  // Filtrado por media_type exclusivamente (fuente unica de verdad)
  const filteredCreations = useMemo(() => {
    if (filter === 'all') return creations;
    return creations.filter(c => c.media_type === filter);
  }, [creations, filter]);

  // Conteo para estadisticas (media_type exclusivamente)
  const stats = useMemo(() => ({
    total: creations.length,
    images: creations.filter(c => c.media_type === 'image').length,
    videos: creations.filter(c => c.media_type === 'video').length,
    audios: creations.filter(c => c.media_type === 'audio').length,
  }), [creations]);

  if (loading) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '24px'
      }}>
        {/* Skeleton del Header */}
        <div style={{ width: '200px', height: '32px', background: 'var(--pf-bg-tertiary)', borderRadius: '8px' }} />
        <div style={{ width: '160px', height: '20px', background: 'var(--pf-bg-secondary)', borderRadius: '6px' }} />
        
        {/* Skeletons de la Galería */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '32px', 
          width: '100%', 
          maxWidth: '1400px',
          padding: '0 24px'
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ 
              aspectRatio: '1', 
              background: 'var(--pf-bg-secondary)', 
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
                animation: 'shimmer 1.5s infinite',
              }} />
            </div>
          ))}
        </div>
        
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '40px'
      }}>
        <AlertTriangle size={48} strokeWidth={1.75} style={{ marginBottom: "16px", opacity: 0.5, color: "var(--pf-text-primary)" }} />
        <h2 style={{ fontFamily: 'var(--pf-font-display)', fontSize: '1.5rem', color: 'var(--pf-text-primary)', marginBottom: '8px' }}>
          Algo salió mal
        </h2>
        <p style={{ fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)', maxWidth: '400px' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      overflowY: 'auto', 
      scrollBehavior: 'smooth'
    }}>
      {/* Hero Section: La Bóveda */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '60px 24px 40px',
        borderBottom: '1px solid var(--pf-border-subtle)',
        marginBottom: '40px'
      }}>
        <div style={{ 
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '32px',
          flexWrap: 'wrap'
        }}>
          {/* Columna izquierda: título + subtítulo + filtros */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            alignItems: 'flex-start',
            flex: 1,
            minWidth: 0
          }}>
            <div>
              <h1 style={{ 
                fontFamily: 'var(--pf-font-display)', 
                fontSize: 'clamp(2rem, 4vw, 3rem)', 
                fontWeight: 700, 
                color: 'var(--pf-text-primary)',
                letterSpacing: '-0.03em',
                marginBottom: '12px',
                background: 'linear-gradient(135deg, var(--pf-text-primary) 0%, var(--pf-text-secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Tu Colección
              </h1>
              <p style={{ 
                fontFamily: 'var(--pf-font-ui)', 
                fontSize: '1.1rem', 
                color: 'var(--pf-text-secondary)',
                maxWidth: '600px',
                lineHeight: 1.6
              }}>
                {stats.total > 0
                  ? (() => {
                      const parts: string[] = [];
                      if (stats.videos > 0) parts.push(`${stats.videos} ${stats.videos === 1 ? 'video' : 'videos'}`);
                      if (stats.images > 0) parts.push(`${stats.images} ${stats.images === 1 ? 'imagen' : 'imágenes'}`);
                      if (stats.audios > 0) parts.push(`${stats.audios} ${stats.audios === 1 ? 'audio' : 'audios'}`);
                      const list = parts.length === 0
                        ? ''
                        : parts.length === 1
                          ? parts[0]
                          : parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1];
                      return `Has creado ${stats.total} ${stats.total === 1 ? 'pieza única' : 'piezas únicas'}.${list ? ' ' + list + '.' : ''}`;
                    })()
                  : 'Tu galería está lista para recibir tus primeras obras maestras.'}
              </p>
            </div>

            {/* Filtros Premium */}
            {stats.total > 0 && (
              <div style={{ 
                display: 'inline-flex', 
                background: 'var(--pf-bg-secondary)', 
                padding: '6px', 
                borderRadius: '12px',
                border: '1px solid var(--pf-border-default)',
                gap: '6px'
              }}>
                {(['all', 'image', 'video', 'audio'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '10px 20px',
                      background: filter === f ? 'var(--pf-bg-elevated)' : 'transparent',
                      color: filter === f ? 'var(--pf-text-primary)' : 'var(--pf-text-secondary)',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: 'var(--pf-font-ui)',
                      fontSize: '0.875rem',
                      fontWeight: filter === f ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: filter === f ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                      textTransform: 'capitalize'
                    }}
                  >
                    {f === 'all' ? 'Todas' : f === 'image' ? 'Imágenes' : f === 'video' ? 'Videos' : 'Audios'}
                    {f === 'all' && ` (${stats.total})`}
                    {f === 'image' && ` (${stats.images})`}
                    {f === 'video' && ` (${stats.videos})`}
                    {f === 'audio' && ` (${stats.audios})`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha: banner G1 */}
          <div style={{
            background: 'var(--pf-bg-secondary)',
            border: '1px solid var(--pf-border-subtle)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.8125rem',
            color: 'var(--pf-text-secondary)',
            maxWidth: '280px',
            lineHeight: 1.5,
            flexShrink: 0
          }}>
            Tus creaciones desaparecerán 7 días después de que las guardes.
          </div>
        </div>
      </div>

      {/* Galería Grid */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '0 24px 60px'
      }}>
        {filteredCreations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px',
            background: 'var(--pf-bg-secondary)',
            borderRadius: '24px',
            border: '1px dashed var(--pf-border-default)'
          }}>
            <Palette size={64} strokeWidth={1.5} style={{ marginBottom: "24px", opacity: 0.5, color: "var(--pf-text-primary)" }} />
            <h3 style={{ 
              fontFamily: 'var(--pf-font-display)', 
              fontSize: '1.5rem', 
              color: 'var(--pf-text-primary)',
              marginBottom: '12px'
            }}>
              No hay {filter === 'all' ? 'creaciones' : filter === 'video' ? 'videos' : filter === 'audio' ? 'audios' : 'imágenes'} aún
            </h3>
            <p style={{ fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
              Explora otras categorías o crea algo nuevo.
            </p>
          </div>
        ) : (
          <div style={{
            columnWidth: '320px',
            columnGap: '20px',
          }}>
            {filteredCreations.map((creation, index) => (
              <div
                key={creation.id}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '20px',
                  animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`,
                  animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
                }}
              >
                <CreationThumbnail creation={creation} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CreationsPage;