// src/components/AuthScreen.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { session } = useAuth();
  const navigate = useNavigate();

  // Si ya está logueado, mandar al Studio inmediatamente
  if (session) {
    navigate('/studio');
    return null;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('¡Cuenta creada! Por favor inicia sesión.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error en autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      background: 'var(--pf-bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Lado Izquierdo: Bienvenida (Marketing) */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #FAFAFA 0%, #FFFFFF 100%)',
        borderRight: '1px solid var(--pf-border-subtle)'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', fontFamily: 'var(--pf-font-display)', letterSpacing: '-0.03em' }}>
          Pathfinder
        </div>
        
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 700,
          lineHeight: 1.1,
          color: 'var(--pf-text-primary)',
          marginBottom: '24px',
          fontFamily: 'var(--pf-font-display)',
          letterSpacing: '-0.04em'
        }}>
          ¿Qué vamos a <br/>
          <span style={{ color: 'var(--pf-text-secondary)' }}>crear hoy?</span>
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: 'var(--pf-text-secondary)',
          lineHeight: 1.6,
          maxWidth: '500px',
          marginBottom: '40px',
          fontFamily: 'var(--pf-font-ui)'
        }}>
          Escribe una idea, agrega una imagen y Pathfinder la convierte en video con sonido utilizando IA de última generación.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--pf-text-muted)' }}>
            <span>🎬 Video</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--pf-text-muted)' }}>
            <span>🖼️ Imagen</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--pf-text-muted)' }}>
            <span>🎵 Audio</span>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Formulario de Auth */}
      <div style={{
        width: '450px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '40px',
        background: '#FFFFFF',
        boxShadow: '-20px 0 40px -20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px', fontFamily: 'var(--pf-font-display)' }}>
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p style={{ color: 'var(--pf-text-secondary)', fontSize: '0.9375rem' }}>
            {isLogin ? 'Ingresa tus datos para continuar' : 'Comienza a crear con IA hoy mismo'}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px', color: 'var(--pf-text-primary)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--pf-border-default)',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--pf-text-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--pf-border-default)'}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px', color: 'var(--pf-text-primary)' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--pf-border-default)',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--pf-text-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--pf-border-default)'}
            />
          </div>

          {error && (
            <div style={{ padding: '12px', background: '#FEF2F2', color: '#EF4444', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #FEE2E2' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'var(--pf-text-muted)' : 'var(--pf-text-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              marginTop: '8px'
            }}
            onMouseEnter={(e) => { if(!loading) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { if(!loading) e.currentTarget.style.opacity = '1'; }}
          >
            {loading ? 'Procesando...' : (isLogin ? 'Entrar al Studio' : 'Crear Cuenta')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--pf-text-secondary)' }}>
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--pf-text-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;