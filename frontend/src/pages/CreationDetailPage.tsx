// src/pages/CreationDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCreations } from '../hooks/useCreations';
import type { Creation } from '../types';

const CreationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { creations, deleteCreation, getDownloadUrl } = useCreations();
  const [creation, setCreation] = useState<Creation | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && creations.length > 0) {
      const found = creations.find((c: Creation) => c.id === id);
      setCreation(found || null);
      setLoading(false);
    } else if (creations.length === 0) {
      setLoading(false);
    }
  }, [id, creations]);

  useEffect(() => {
    const loadMediaUrl = async () => {
      if (creation?.id && creation.storage_key) {
        try {
          const url = await getDownloadUrl(creation.id);
          setMediaUrl(url);
        } catch (error) {
          console.error('Error loading media URL:', error);
          setMediaUrl(null);
        } finally {
          setLoadingUrl(false);
        }
      } else {
        setLoadingUrl(false);
      }
    };
    loadMediaUrl();
  }, [creation?.id, creation?.storage_key, getDownloadUrl]);

  const handleDelete = useCallback(() => {
    if (
      creation &&
      window.confirm('¿Estás seguro de que deseas eliminar esta creación?')
    ) {
      deleteCreation(creation.id);
      navigate('/creations');
    }
  }, [creation, deleteCreation, navigate]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--pf-bg-primary)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--pf-font-ui)',
            color: 'var(--pf-text-muted)',
            fontSize: '1rem',
          }}
        >
          Cargando...
        </div>
      </div>
    );
  }

  if (!creation) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--pf-bg-primary)',
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>😕</div>
        <h1
          className="pf-font-prompt"
          style={{
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--pf-text-primary)',
            marginBottom: '16px',
            letterSpacing: '-0.03em',
          }}
        >
          Creación no encontrada
        </h1>
        <p
          style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '1rem',
            color: 'var(--pf-text-secondary)',
            marginBottom: '32px',
          }}
        >
          La creación que buscas no existe o ha sido eliminada.
        </p>
        <Link
          to="/creations"
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
          Volver a Creaciones
        </Link>
      </div>
    );
  }

  const isVideo = creation.media_type === 'video';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--pf-bg-primary)',
        padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <Link
            to="/creations"
            style={{
              textDecoration: 'none',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--pf-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--pf-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--pf-text-secondary)')}
          >
            ← Volver
          </Link>
          <button
            onClick={handleDelete}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid #EF4444',
              borderRadius: '9999px',
              padding: '10px 20px',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#EF4444',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Eliminar creación
          </button>
        </div>

        <div
          className="pf-glass-panel"
          style={{
            padding: '32px',
            borderRadius: 'var(--pf-radius-xl)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
            }}
          >
            <div>
              {loadingUrl ? (
                <div
                  style={{
                    width: '100%',
                    height: '400px',
                    background: 'var(--pf-bg-secondary)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    controls
                    autoPlay
                    loop
                    muted
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      border: '1px solid var(--pf-border-default)',
                      boxShadow: 'var(--pf-shadow-floating)',
                      display: 'block',
                    }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={creation.prompt}
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      border: '1px solid var(--pf-border-default)',
                      boxShadow: 'var(--pf-shadow-floating)',
                    }}
                  />
                )
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '400px',
                    background: 'var(--pf-bg-secondary)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--pf-text-muted)',
                    fontFamily: 'var(--pf-font-ui)',
                  }}
                >
                  Sin media disponible
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--pf-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Prompt
              </div>
              <p
                className="pf-font-prompt"
                style={{
                  fontFamily: 'var(--pf-font-display)',
                  fontSize: '1.125rem',
                  color: 'var(--pf-text-primary)',
                  lineHeight: 1.6,
                  marginBottom: '32px',
                  letterSpacing: '-0.025em',
                }}
              >
                {creation.prompt}
              </p>

              <div
                style={{
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--pf-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Fecha de creación
              </div>
              <p
                style={{
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.9375rem',
                  color: 'var(--pf-text-secondary)',
                  marginBottom: '32px',
                }}
              >
                {new Date(creation.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>

              <div
                style={{
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--pf-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Tipo de media
              </div>
              <p
                style={{
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.9375rem',
                  color: 'var(--pf-text-secondary)',
                  textTransform: 'capitalize',
                }}
              >
                {creation.media_type || 'imagen'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreationDetailPage;