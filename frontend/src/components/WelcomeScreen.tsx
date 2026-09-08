// src/components/WelcomeScreen.tsx
import React from 'react';

interface WelcomeScreenProps {
  onEnter: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0f0f1a 100%)',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Elementos decorativos de fondo */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        zIndex: 0
      }} />

      {/* Contenido principal */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px', animation: 'fadeInUp 0.8s ease-out' }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3))'
        }}>
          ✨
        </div>
        
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          marginBottom: '16px',
          letterSpacing: '-0.02em',
          lineHeight: 1.1
        }}>
          Bienvenido a Pathfinder
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#94a3b8',
          marginBottom: '40px',
          lineHeight: 1.6,
          fontWeight: 400
        }}>
          Tu lienzo infinito para crear con IA.<br />
          Donde la imaginación se encuentra con la tecnología.
        </p>

        <button
          onClick={onEnter}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '16px 48px',
            fontSize: '1.125rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 8px 10px -6px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.3s ease',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(99, 102, 241, 0.5), 0 10px 10px -5px rgba(99, 102, 241, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 8px 10px -6px rgba(99, 102, 241, 0.4)';
          }}
        >
          Comenzar a Crear
          <span style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer 2s infinite'
          }} />
        </button>

        <p style={{
          marginTop: '32px',
          fontSize: '0.875rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Al entrar, aceptas nuestros términos de uso y política de privacidad.
        </p>
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
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @media (max-width: 640px) {
          h1 { font-size: 2rem !important; }
          p { font-size: 1rem !important; }
          button { padding: 14px 32px !important; font-size: 1rem !important; }
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;