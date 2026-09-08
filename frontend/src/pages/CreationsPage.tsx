// src/pages/CreationsPage.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCreations } from '../hooks/useCreations';
import type { Creation } from '../types';

const CreationsPage: React.FC = () => {
  const { creations } = useCreations();
  const [filter, setFilter] = useState<'all' | 'processing'>('all');

  const filteredCreations = useMemo(() => {
    if (filter === 'processing') {
      return creations.filter((c: Creation) => c.status === 'processing');
    }
    return creations;
  }, [creations, filter]);

  const sortedCreations = useMemo(() => {
    return [...filteredCreations].sort(
      (a: Creation, b: Creation) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredCreations]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--pf-bg-primary)',
        padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div>
            <h1
              className="pf-font-prompt"
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--pf-text-primary)',
                marginBottom: '8px',
                letterSpacing: '-0.03em',
              }}
            >
              Mis Creaciones
            </h1>
            <p
              style={{
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '1rem',
                color: 'var(--pf-text-secondary)',
              }}
            >
              {sortedCreations.length}{' '}
              {sortedCreations.length === 1 ? 'creación' : 'creaciones'}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              background: 'var(--pf-bg-secondary)',
              padding: '4px',
              borderRadius: '9999px',
              border: '1px solid var(--pf-border-default)',
            }}
          >
            {(['all', 'processing'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'var(--pf-text-primary)' : 'transparent',
                  color: filter === f ? '#FFFFFF' : 'var(--pf-text-secondary)',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '10px 20px',
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.875rem',
                  fontWeight: filter === f ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {f === 'all' ? 'Todas' : 'Procesando'}
              </button>
            ))}
          </div>
        </div>

        {sortedCreations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🎨</div>
            <h2
              className="pf-font-prompt"
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--pf-text-primary)',
                marginBottom: '12px',
                letterSpacing: '-0.025em',
              }}
            >
              {filter === 'processing'
                ? 'No hay creaciones procesándose'
                : 'No has creado nada todavía'}
            </h2>
            <p
              style={{
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '1rem',
                color: 'var(--pf-text-secondary)',
                marginBottom: '32px',
              }}
            >
              {filter === 'processing'
                ? 'Las creaciones en procesamiento aparecerán aquí.'
                : 'Comienza a crear imágenes increíbles con IA.'}
            </p>
            <Link
              to="/studio"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                background: 'var(--pf-text-primary)',
                color: '#FFFFFF',
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '14px 28px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Ir al Studio
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {sortedCreations.map((creation: Creation) => (
              <CreationCard key={creation.id} creation={creation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CreationCard: React.FC<{ creation: Creation }> = ({ creation }) => {
  const { getDownloadUrl } = useCreations();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isVideo = creation.media_type === 'video';

  React.useEffect(() => {
    const loadMediaUrl = async () => {
      if (creation.id) {
        try {
          const url = await getDownloadUrl(creation.id);
          setMediaUrl(url);
        } catch (error) {
          console.error('Error loading media URL:', error);
          setMediaUrl(null);
        } finally {
          setLoading(false);
        }
      }
    };
    loadMediaUrl();
  }, [creation.id, getDownloadUrl]);

  return (
    <Link
      to={`/creations/${creation.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        className="pf-glass-panel"
        style={{
          borderRadius: 'var(--pf-radius-lg)',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--pf-shadow-floating)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div
          style={{
            aspectRatio: '1',
            overflow: 'hidden',
            background: 'var(--pf-bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <div
              style={{
                color: 'var(--pf-text-muted)',
                fontFamily: 'var(--pf-font-ui)',
              }}
            >
              Cargando...
            </div>
          ) : mediaUrl ? (
            isVideo ? (
              <video
                src={mediaUrl}
                muted
                loop
                autoPlay
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <img
                src={mediaUrl}
                alt={creation.prompt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLImageElement).style.transform = 'scale(1.05)')
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLImageElement).style.transform = 'scale(1)')
                }
              />
            )
          ) : (
            <div
              style={{
                color: 'var(--pf-text-muted)',
                fontFamily: 'var(--pf-font-ui)',
              }}
            >
              Sin vista previa
            </div>
          )}
        </div>
        <div style={{ padding: '20px' }}>
          <p
            className="pf-font-prompt"
            style={{
              fontFamily: 'var(--pf-font-display)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--pf-text-primary)',
              marginBottom: '8px',
              letterSpacing: '-0.025em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {creation.prompt}
          </p>
          <div
            style={{
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.8125rem',
              color: 'var(--pf-text-muted)',
            }}
          >
            {new Date(creation.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          {creation.status === 'processing' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '12px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '9999px',
                padding: '4px 12px',
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#F59E0B',
              }}
            >
              <span>⏳</span>
              <span>Procesando</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CreationsPage;