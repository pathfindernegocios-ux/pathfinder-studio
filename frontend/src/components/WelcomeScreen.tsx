// src/components/WelcomeScreen.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
}) => {
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
      {/* Hero Section */}
      <div
        style={{
          maxWidth: '800px',
          marginBottom: '48px',
        }}
      >
        <h1
          className="pf-font-prompt"
          style={{
            fontSize: '3.5rem',
            fontWeight: 700,
            color: 'var(--pf-text-primary)',
            marginBottom: '24px',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
          }}
        >
          Crea imágenes increíbles
          <br />
          con inteligencia artificial
        </h1>
        <p
          style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '1.25rem',
            color: 'var(--pf-text-secondary)',
            lineHeight: 1.6,
            marginBottom: '40px',
          }}
        >
          Transforma tus ideas en obras de arte visuales utilizando
          modelos de IA de última generación. Simple, rápido y
          poderoso.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
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
              padding: '16px 32px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--pf-shadow-floating)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = 'translateY(-2px)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = 'translateY(0)')
            }
            onClick={onGetStarted}
          >
            Comenzar ahora
          </Link>
          <a
            href="#learn-more"
            style={{
              display: 'inline-block',
              background: 'var(--pf-bg-secondary)',
              color: 'var(--pf-text-primary)',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '16px 32px',
              borderRadius: '9999px',
              border: '1px solid var(--pf-border-default)',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--pf-border-default)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'var(--pf-bg-secondary)')
            }
          >
            Saber más
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          maxWidth: '1200px',
          width: '100%',
        }}
      >
        {[
          {
            icon: '⚡',
            title: 'Generación rápida',
            description:
              'Obtén resultados en segundos con nuestra infraestructura optimizada.',
          },
          {
            icon: '🎨',
            title: 'Múltiples estilos',
            description:
              'Desde realismo hasta arte abstracto, explora infinitas posibilidades.',
          },
          {
            icon: '💾',
            title: 'Historial guardado',
            description:
              'Todas tus creaciones se almacenan automáticamente para acceso futuro.',
          },
        ].map((feature, index) => (
          <div
            key={index}
            className="pf-glass-panel"
            style={{
              padding: '32px 24px',
              borderRadius: 'var(--pf-radius-lg)',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: '2.5rem',
                marginBottom: '16px',
              }}
            >
              {feature.icon}
            </div>
            <h3
              style={{
                fontFamily: 'var(--pf-font-display)',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--pf-text-primary)',
                marginBottom: '12px',
                letterSpacing: '-0.025em',
              }}
            >
              {feature.title}
            </h3>
            <p
              style={{
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '0.9375rem',
                color: 'var(--pf-text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;