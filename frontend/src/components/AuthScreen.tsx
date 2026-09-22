// src/components/AuthScreen.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Video, Image as ImageIcon, Music } from 'lucide-react';

// ---------------------------------------------------------------------------
// Pool de imágenes para el panel izquierdo.
// Una imagen random por page load — no cambia mientras el usuario está acá.
// Se reutiliza el mismo set que el HeroMediaWall cuando migremos a Supabase.
// ---------------------------------------------------------------------------
const AUTH_IMAGE_POOL = Array.from({ length: 56 }, (_, i) => `auth-pool-${i + 1}`);

// Rotación: 24h. Misma imagen durante el día, cambia al día siguiente.
// Para cambiar a "por sesión" (sessionStorage), ver toggle abajo.
const AUTH_SEED_STORAGE_KEY = "pf_auth_hero_seed";
const AUTH_SEED_TTL_MS = 24 * 60 * 60 * 1000;
const AUTH_USE_SESSION_STORAGE = false; // ← true para comportamiento "por sesión"

function pickAuthSeed(): string {
  if (typeof window === "undefined") return AUTH_IMAGE_POOL[0];

  try {
    const storage = AUTH_USE_SESSION_STORAGE ? sessionStorage : localStorage;
    const raw = storage.getItem(AUTH_SEED_STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);
      // Modo 24h: validar TTL
      if (
        !AUTH_USE_SESSION_STORAGE &&
        parsed.seed &&
        typeof parsed.ts === "number" &&
        Date.now() - parsed.ts < AUTH_SEED_TTL_MS
      ) {
        return parsed.seed;
      }
      // Modo sesión: cualquier valor guardado es válido
      if (AUTH_USE_SESSION_STORAGE && parsed.seed) {
        return parsed.seed;
      }
    }

    // No hay válido → generar uno nuevo
    const seed = AUTH_IMAGE_POOL[Math.floor(Math.random() * AUTH_IMAGE_POOL.length)];
    storage.setItem(
      AUTH_SEED_STORAGE_KEY,
      JSON.stringify({ seed, ts: Date.now() }),
    );
    return seed;
  } catch (e) {
    // Fallback: random sin persistir
    return AUTH_IMAGE_POOL[Math.floor(Math.random() * AUTH_IMAGE_POOL.length)];
  }
}

const GoogleIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const AuthScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { session, accountStatus, isOnboarded, isProfileLoading } = useAuth();
  const navigate = useNavigate();

  // Imagen random — inicializada una sola vez por mount
  const [heroSeed] = useState(() => pickAuthSeed());
  const heroUrl = `https://picsum.photos/seed/${heroSeed}/1200/1600`;

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
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        background: 'var(--pf-bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ============================================================ */}
      {/* Lado Izquierdo: imagen random + overlay + contenido         */}
      {/* ============================================================ */}
      <div
        className="auth-left-panel"
        style={{
          position: 'relative',
          flex: '1',
          overflow: 'hidden',
          borderRight: '1px solid var(--pf-border-subtle)',
        }}
      >
        {/* Imagen de fondo */}
        <img
          src={heroUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Overlay oscuro para legibilidad */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(10,10,10,0.80) 0%, rgba(10,10,10,0.55) 50%, rgba(10,10,10,0.85) 100%)',
          }}
        />

        {/* Contenido encima de la imagen */}
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
          {/* Logo clickeable → home */}
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '24px',
              fontFamily: 'var(--pf-font-display)',
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              display: 'inline-block',
              width: 'fit-content',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Pathfinder
          </Link>

          <h1
            style={{
              fontSize: '3.5rem',
              fontWeight: 700,
              lineHeight: 1.1,
              color: '#FFFFFF',
              marginBottom: '24px',
              fontFamily: 'var(--pf-font-display)',
              letterSpacing: '-0.04em',
              textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            }}
          >
            ¿Qué vamos a <br />
            <span style={{ color: 'rgba(255,255,255,0.75)' }}>crear hoy?</span>
          </h1>

          <p
            style={{
              fontSize: '1.25rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
              maxWidth: '500px',
              marginBottom: '40px',
              fontFamily: 'var(--pf-font-ui)',
            }}
          >
            Escribe una idea, agrega una imagen y Pathfinder la convierte en
            video con sonido utilizando IA de última generación.
          </p>

          {/* Iconos + texto — sin emojis, con lucide-react */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: 'auto',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.75)',
                fontFamily: 'var(--pf-font-ui)',
              }}
            >
              <Video size={16} />
              <span>Video</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.75)',
                fontFamily: 'var(--pf-font-ui)',
              }}
            >
              <ImageIcon size={16} />
              <span>Imagen</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.75)',
                fontFamily: 'var(--pf-font-ui)',
              }}
            >
              <Music size={16} />
              <span>Audio</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Lado Derecho: formulario de auth                             */}
      {/* ============================================================ */}
      <div
        style={{
          width: '450px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '40px',
          background: '#FFFFFF',
          boxShadow: '-20px 0 40px -20px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '8px',
              fontFamily: 'var(--pf-font-display)',
            }}
          >
            Empieza ahora
          </h2>
          <p
            style={{
              color: 'var(--pf-text-secondary)',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
            }}
          >
            Crea tu cuenta y empieza a generar con IA en segundos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: '#FFFFFF',
            color: '#1F1F1F',
            border: '1px solid #DADCE0',
            borderRadius: '8px',
            fontSize: '0.9375rem',
            fontWeight: 500,
            fontFamily: 'var(--pf-font-ui, system-ui)',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'background 0.15s, box-shadow 0.15s',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = '#F8F9FA';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = '#FFFFFF';
          }}
        >
          <GoogleIcon />
          <span>{loading ? 'Conectando...' : 'Continuar con Google'}</span>
        </button>

        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#FEF2F2',
              color: '#EF4444',
              borderRadius: '8px',
              fontSize: '0.875rem',
              border: '1px solid #FEE2E2',
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '32px',
            marginBottom: '16px',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--pf-border-subtle, #F4F4F5)' }} />
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--pf-text-muted)',
              fontFamily: 'var(--pf-font-ui)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Próximamente
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--pf-border-subtle, #F4F4F5)' }} />
        </div>

        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--pf-text-muted)',
            textAlign: 'center',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          El registro con email estará disponible en las próximas semanas.
        </p>

        <p
          style={{
            marginTop: '40px',
            fontSize: '0.75rem',
            color: 'var(--pf-text-muted)',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          Al continuar, aceptas nuestros{' '}
          <Link
            to="/legal/terms"
            style={{ color: 'var(--pf-text-secondary)', textDecoration: 'underline' }}
          >
            Términos de Servicio
          </Link>{' '}
          y reconoces haber leído el{' '}
          <Link
            to="/legal/privacy"
            style={{ color: 'var(--pf-text-secondary)', textDecoration: 'underline' }}
          >
            Aviso de Privacidad
          </Link>
          .
        </p>
      </div>

      {/* Mobile: la imagen se oculta o se reduce */}
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
