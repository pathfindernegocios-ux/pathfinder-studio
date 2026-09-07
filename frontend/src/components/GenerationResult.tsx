// src/components/GenerationResult.tsx
import React, { useState, useCallback } from 'react';

interface Variant {
  id: string;
  imageUrl: string;
}

interface GenerationResultProps {
  prompt: string;
  variants: Variant[];
  createdAt: string;
  isFavorite?: boolean;
  onVariantSelect?: (variantId: string) => void;
  onFavoriteToggle?: () => void;
  onDelete?: () => void;
}

const resultHeroFrameStyle: React.CSSProperties = {
  background: 'var(--pf-bg-secondary)',
  borderRadius: 'var(--pf-radius-lg)',
  border: '1px solid var(--pf-border-subtle)',
  overflow: 'hidden',
};

const resultVariantThumbStyle: React.CSSProperties = {
  borderRadius: '12px',
  border: '2px solid var(--pf-border-default)',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, transform 0.2s ease',
};

const GenerationResult: React.FC<GenerationResultProps> = ({
  prompt,
  variants,
  createdAt,
  isFavorite = false,
  onVariantSelect,
  onFavoriteToggle,
  onDelete,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<string>(
    variants[0]?.id || ''
  );

  const handleVariantClick = useCallback(
    (variantId: string) => {
      setSelectedVariant(variantId);
      onVariantSelect?.(variantId);
    },
    [onVariantSelect]
  );

  const selectedImageData = variants.find(
    (v) => v.id === selectedVariant
  )?.imageUrl;

  return (
    <div style={resultHeroFrameStyle}>
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onFavoriteToggle}
            style={{
              background: isFavorite
                ? '#EF4444'
                : 'var(--pf-bg-secondary)',
              border: '1px solid var(--pf-border-default)',
              borderRadius: '9999px',
              padding: '8px 16px',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: isFavorite
                ? '#FFFFFF'
                : 'var(--pf-text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.opacity = '0.9')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.opacity = '1')
            }
          >
            {isFavorite ? '★ Favorito' : '☆ Favorito'}
          </button>
          <button
            onClick={onDelete}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid #EF4444',
              borderRadius: '9999px',
              padding: '8px 16px',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#EF4444',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.opacity = '0.9')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.opacity = '1')
            }
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Imagen principal */}
      <div
        style={{
          padding: '24px',
          background: 'var(--pf-bg-primary)',
        }}
      >
        {selectedImageData ? (
          <img
            src={selectedImageData}
            alt="Generación"
            style={{
              width: '100%',
              borderRadius: '16px',
              border: '1px solid var(--pf-border-default)',
              boxShadow: 'var(--pf-shadow-floating)',
            }}
          />
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
            Sin imagen disponible
          </div>
        )}
      </div>

      {/* Variantes */}
      {variants.length > 1 && (
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid var(--pf-border-subtle)',
            background: 'var(--pf-bg-secondary)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--pf-text-secondary)',
              marginBottom: '12px',
            }}
          >
            Variantes
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '12px',
            }}
          >
            {variants.map((variant) => (
              <div
                key={variant.id}
                onClick={() => handleVariantClick(variant.id)}
                style={{
                  ...resultVariantThumbStyle,
                  borderColor:
                    selectedVariant === variant.id
                      ? 'var(--pf-text-primary)'
                      : 'var(--pf-border-default)',
                  opacity:
                    selectedVariant === variant.id ? 1 : 0.7,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = 'scale(1.05)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = 'scale(1)')
                }
              >
                <img
                  src={variant.imageUrl}
                  alt={`Variante ${variant.id}`}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    display: 'block',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
          {prompt}
        </p>
        <div
          style={{
            marginTop: '12px',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.8125rem',
            color: 'var(--pf-text-muted)',
          }}
        >
          Creado: {new Date(createdAt).toLocaleDateString('es-ES')}
        </div>
      </div>
    </div>
  );
};

export default GenerationResult;