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
      <div className="pf-creations-loading">
        {/* Skeleton del Header */}
        <div className="pf-skeleton-text" />
        <div className="pf-skeleton-text-small" />
        
        {/* Skeletons de la Galería */}
        <div className="pf-creations-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="pf-skeleton-card">
              <div className="pf-skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-creations-error">
        <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>⚠️</div>
        <h2 className="pf-font-display" style={{ fontSize: '1.5rem', color: 'var(--pf-text-primary)', marginBottom: '8px' }}>
          Algo salió mal
        </h2>
        <p className="pf-font-ui" style={{ color: 'var(--pf-text-secondary)', maxWidth: '400px' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="pf-creations-container">
      {/* Hero Section: La Bóveda */}
      <div className="pf-creations-hero">
        <div>
          <h1 
            className="pf-creations-title pf-font-display"
            style={{
              // Solo dejamos lo dinámico o específico que no vale la pena llevar a CSS
              background: 'linear-gradient(135deg, var(--pf-text-primary) 0%, var(--pf-text-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text', // Propiedad estándar para quitar el warning
              WebkitTextFillColor: 'transparent',
            }}
          >
            Tu Colección
          </h1>
          <p className="pf-creations-subtitle pf-font-ui">
            {stats.total > 0 
              ? `Has creado ${stats.total} piezas únicas. ${stats.videos} videos y ${stats.images} imágenes.` 
              : 'Tu galería está lista para recibir tus primeras obras maestras.'}
          </p>
        </div>

        {/* Filtros Premium */}
        {stats.total > 0 && (
          <div className="pf-creations-filters">
            {(['all', 'image', 'video'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`pf-filter-btn ${filter === f ? 'active' : ''}`}
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

      {/* Galería Grid */}
      <div className="pf-creations-gallery">
        {filteredCreations.length === 0 ? (
          <div className="pf-empty-state">
            <div style={{ fontSize: '4rem', marginBottom: '24px', filter: 'grayscale(100%)', opacity: 0.5 }}>🎨</div>
            <h3 className="pf-font-display" style={{ fontSize: '1.5rem', color: 'var(--pf-text-primary)', marginBottom: '12px' }}>
              No hay {filter === 'all' ? 'creaciones' : filter === 'video' ? 'videos' : 'imágenes'} aún
            </h3>
            <p className="pf-font-ui" style={{ color: 'var(--pf-text-secondary)' }}>
              Explora otras categorías o crea algo nuevo.
            </p>
          </div>
        ) : (
          <div className="pf-creations-grid">
            {filteredCreations.map((creation, index) => (
              <div
                key={creation.id}
                className="pf-creation-card-wrapper"
                style={{
                  animationDelay: `${Math.min(index * 0.05, 0.3)}s` // Limitamos el delay máximo en móvil
                }}
              >
                <CreationThumbnail creation={creation} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreationsPage;