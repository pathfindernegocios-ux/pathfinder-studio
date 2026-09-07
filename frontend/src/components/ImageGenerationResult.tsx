// src/components/ImageGenerationResult.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useCreations } from '../hooks/useCreations';
import type { Creation } from '../types';

interface GenerationResultProps {
  creation: Creation;
}

const GenerationResult: React.FC<GenerationResultProps> = ({ creation }) => {
  const { deleteCreation, getDownloadUrl } = useCreations();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);

  useEffect(() => {
    const loadMediaUrl = async () => {
      if (creation.id && creation.storage_key) {
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
  }, [creation.id, creation.storage_key, getDownloadUrl]);

  const handleDelete = useCallback(() => {
    if (window.confirm('¿Estás seguro de eliminar esta creación?')) {
      deleteCreation(creation.id);
    }
  }, [creation.id, deleteCreation]);

  const isVideo = creation.media_type === 'video';

  return (
    <div
      style={{
        background: 'var(--pf-bg-secondary)',
        borderRadius: 'var(--pf-radius-lg)',
        border: '1px solid var(--pf-border-subtle)',
        overflow: 'hidden',
      }}
    >
      {/* Header con acciones */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--pf-border-subtle)',
          background: 'var(--pf-glass-surface)',
          backdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--pf-font-display)',
            fontSize: '1.125rem',
            color: 'var(--pf-text-primary)',
            letterSpacing: '-0.025em',
          }}
        >
          Resultado
        </div>
        <button
          onClick={handleDelete}
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid #EF4444',
            borderRadius: '9999px',
            padding: '8px 16px',
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
          Eliminar
        </button>
      </div>

      {/* Media principal */}
      <div
        style={{
          padding: '24px',
          background: 'var(--pf-bg-primary)',
        }}
      >
        {loadingUrl ? (
          <div
            style={{
              width: '100%',
              height: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--pf-bg-secondary)',
              borderRadius: '16px',
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--pf-bg-secondary)',
              borderRadius: '16px',
              color: 'var(--pf-text-muted)',
              fontFamily: 'var(--pf-font-ui)',
            }}
          >
            Sin media disponible
          </div>
        )}
      </div>

      {/* Prompt usado */}
      <div
        style={{
          padding: '20px',
          borderTop: '1px solid var(--pf-border-subtle)',
          background: 'var(--pf-glass-surface)',
          backdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
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
          Prompt utilizado
        </div>
        <p
          className="pf-font-prompt"
          style={{
            color: 'var(--pf-text-primary)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {creation.prompt}
        </p>
      </div>
    </div>
  );
};

export default GenerationResult;