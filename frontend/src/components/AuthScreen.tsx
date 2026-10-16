// src/components/AuthScreen.tsx
// Login — rediseño v3 con fuentes legacy (Satoshi + Inter Tight + JetBrains Mono).
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { FilmStrip } from '@phosphor-icons/react/dist/csr/FilmStrip';
import { Image as ImageIcon } from '@phosphor-icons/react/dist/csr/Image';
import { MusicNotes } from '@phosphor-icons/react/dist/csr/MusicNotes';
import SpaceWarp from './marketing/SpaceWarp';
import PathfinderLogo from './PathfinderLogo';

const GoogleIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const AuroraAtmosphere: React.FC = () => (
  <>
    <div
      aria-hidden
      className="pf-aurora-1"
      style={{
        position: "fixed",
        top: "-20%",
        left: "-15%",
        width: "900px",
        height: "900px",
        background: "radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)",
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
    <div
      aria-hidden
      className="pf-aurora-2"
      style={{
        position: "fixed",
        bottom: "-25%",
        right: "-10%",
        width: "800px",
        height: "800px",
        background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 40%, transparent 70%)",
        filter: "blur(90px)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        opacity: 0.025,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        zIndex: 1,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
      }}
    />
  </>
);

const AuthScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { session, accountStatus, isOnboarded, isProfileLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session || isProfileLoading) return;

    if (accountStatus === 'deletion_pending') {
      navigate('/account/restore', { replace: true });
    } else if (accountStatus === 'suspended') {
      navigate('/account/suspended', { replace: true });
    } else if (!isOnboarded) {
      navigate('/onboarding/username', { replace: true });
    } else {
      navigate('/studio', { replace: true });
    }
  }, [session, isProfileLoading, accountStatus, isOnboarded, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div
      className="pf-legacy"
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        background: '#000000',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* SpaceWarp deepfield + aurora + grain */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <SpaceWarp variant="deepfield" density={2000} intensity={1} centerX={0.5} centerY={0.4} />
      </div>
      <AuroraAtmosphere />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Panel Izquierdo: imagen random + overlay violeta + contenido */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className="auth-left-panel"
        style={{
          position: 'relative',
          flex: '1',
          overflow: 'hidden',
          borderRight: '1px solid rgba(139, 92, 246, 0.15)',
          zIndex: 2,
        }}
      >
        {/* Contenido */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px',
            color: '#FFFFFF',
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: '32px',
              width: 'fit-content',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <PathfinderLogo size={36} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span
                style={{
                  fontFamily: 'var(--pf-font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: '#FFFFFF',
                  marginBottom: 3,
                }}
              >
                Pathfinder
              </span>
              <span
                style={{
                  fontFamily: 'var(--pf-font-mono)',
                  fontSize: '0.5625rem',
                  fontWeight: 500,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                Studio
              </span>
            </div>
          </Link>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 4.5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              margin: 0,
              marginBottom: '24px',
              fontFamily: 'var(--pf-font-display)',
              letterSpacing: '-0.035em',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ¿Qué vamos a
            <br />
            crear hoy?
          </h1>

          <p
            style={{
              fontSize: '1.0625rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.6,
              maxWidth: '500px',
              margin: 0,
              marginBottom: '40px',
              fontFamily: 'var(--pf-font-ui)',
            }}
          >
            Escribe una idea, agrega una imagen y Pathfinder la convierte en
            video con sonido utilizando IA de última generación.
          </p>

          {/* Chips mono — capabilities */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 'auto',
              flexWrap: 'wrap',
            }}
          >
            {[
              { Icon: FilmStrip, label: 'Video' },
              { Icon: ImageIcon, label: 'Imagen' },
              { Icon: MusicNotes, label: 'Audio' },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 14px',
                  background: 'rgba(15,15,18,0.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(139,92,246,0.30)',
                  borderRadius: 9999,
                  fontFamily: 'var(--pf-font-mono)',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#A78BFA',
                }}
              >
                <Icon size={12} weight="regular" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Panel Derecho: formulario de auth                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: '460px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 40px',
          background: 'rgba(8, 4, 20, 0.55)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          borderLeft: '1px solid rgba(139, 92, 246, 0.20)',
          zIndex: 2,
          position: 'relative',
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: 0,
              marginBottom: 10,
              fontFamily: 'var(--pf-font-display)',
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
            }}
          >
            Empieza ahora
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              margin: 0,
              fontFamily: 'var(--pf-font-ui)',
            }}
          >
            Crea tu cuenta y empieza a generar con IA en segundos.
          </p>
        </div>

        {/* Botón Google — pill v3 */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: '#FFFFFF',
            color: '#1F1F1F',
            border: '1px solid rgba(255,255,255,0.85)',
            borderRadius: 9999,
            fontSize: '0.9375rem',
            fontWeight: 600,
            fontFamily: 'var(--pf-font-ui)',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'transform 150ms, box-shadow 150ms, background 150ms',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 12px 32px -12px rgba(255,255,255,0.25)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#F8F9FA';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 16px 40px -12px rgba(255,255,255,0.35)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px -12px rgba(255,255,255,0.25)';
            }
          }}
        >
          <GoogleIcon />
          <span>{loading ? 'Conectando...' : 'Continuar con Google'}</span>
        </button>

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'rgba(235,87,87,0.10)',
              color: '#FCA5A5',
              borderRadius: 10,
              fontSize: '0.875rem',
              border: '1px solid rgba(235,87,87,0.30)',
              lineHeight: 1.5,
              fontFamily: 'var(--pf-font-ui)',
            }}
          >
            {error}
          </div>
        )}

        {/* Divider "PRÓXIMAMENTE" */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginTop: 36,
            marginBottom: 18,
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
          <span
            style={{
              fontFamily: 'var(--pf-font-mono)',
              fontSize: '0.625rem',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            Próximamente
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
        </div>

        <p
          style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.8125rem',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          El registro con email estará disponible en las próximas semanas.
        </p>

        {/* TOS */}
        <p
          style={{
            marginTop: 40,
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          Al continuar, aceptas nuestros{' '}
          <Link
            to="/legal/terms"
            style={{ color: '#A78BFA', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Términos de Servicio
          </Link>{' '}
          y reconoces haber leído el{' '}
          <Link
            to="/legal/privacy"
            style={{ color: '#A78BFA', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Aviso de Privacidad
          </Link>
          .
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Mobile: ocultar panel izquierdo                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <style>{`
        @media (max-width: 900px) {
          .auth-left-panel {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
