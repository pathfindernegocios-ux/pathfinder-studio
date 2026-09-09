// src/pages/CreationsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useCreations } from '../hooks/useCreations';
import type { Creation } from '../types';
import { CreationThumbnail } from '../components/CreationThumbnail';

const CreationsPage: React.FC = () => {
  const { getCreations } = useCreations();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCreations();
        console.log('🏆 Sala de Trofeos: Creaciones cargadas:', data?.length || 0);
        setCreations(data || []);
      } catch (err) {
        console.error('Error loading creations:', err);
        setError('No se pudieron cargar tus creaciones.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getCreations]);

  // Filtrado optimizado
  const filteredCreations = useMemo(() => {
    if (filter === 'all') return creations;
    return creations.filter(c => {
      if (filter === 'video') return c.media_type === 'video' || (c.duration && c.duration !== '');
      return c.media_type === 'image';
    });
  }, [creations, filter]);

  // Conteo para estadísticas
  const stats = useMemo(() => ({
    total: creations.length,
    images: creations.filter(c => c.media_type === 'image').length,
    videos: creations.filter(c => c.media_type === 'video' || (c.duration && c.duration !== '')).length,
  }), [creations]);

  if (loading) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--pf-bg-primary)',
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
        background: 'var(--pf-bg-primary)',
        textAlign: 'center',
        padding: '40px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>⚠️</div>
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
      background: 'var(--pf-bg-primary)',
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
          flexDirection: 'column', 
          gap: '16px',
          alignItems: 'flex-start'
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
                ? `Has creado ${stats.total} piezas únicas. ${stats.videos} videos y ${stats.images} imágenes.` 
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
              {(['all', 'image', 'video'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '10px 20px',
                    background: filter === f ? '#FFFFFF' : 'transparent',
                    color: filter === f ? '#000000' : 'var(--pf-text-secondary)',
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
                  {f === 'all' ? 'Todas' : f === 'image' ? 'Imágenes' : 'Videos'}
                  {f === 'all' && ` (${stats.total})`}
                  {f === 'image' && ` (${stats.images})`}
                  {f === 'video' && ` (${stats.videos})`}
                </button>
              ))}
            </div>
          )}
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
            <div style={{ fontSize: '4rem', marginBottom: '24px', filter: 'grayscale(100%)', opacity: 0.5 }}>🎨</div>
            <h3 style={{ 
              fontFamily: 'var(--pf-font-display)', 
              fontSize: '1.5rem', 
              color: 'var(--pf-text-primary)',
              marginBottom: '12px'
            }}>
              No hay {filter === 'all' ? 'creaciones' : filter === 'video' ? 'videos' : 'imágenes'} aún
            </h3>
            <p style={{ fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-secondary)' }}>
              Explora otras categorías o crea algo nuevo.
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '32px'
          }}>
            {filteredCreations.map((creation, index) => (
              <div
                key={creation.id}
                style={{
                  animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`,
                  animationDelay: `${index * 0.05}s`
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
            transform: translateY(30px);
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