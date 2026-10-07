// src/components/SessionExpiredModal.tsx
//
// Modal bloqueante que aparece cuando recover() detecta que el JWT fue
// rechazado por el backend y el refresh token también murió (4xx).
//
// Patrón industrial (Meshery, Backstage, AWS IAM Identity Center):
//   - Modal bloqueante, no se puede cerrar ni ignorar.
//   - Mensaje claro en lenguaje humano (sin errores crudos).
//   - Countdown visible antes del redirect.
//   - Redirect forzado a /auth al llegar a cero.
//   - Post-login el user vuelve al mismo lugar (via postAuthRedirect).
//
// NO hay botón de "cancelar" ni "seguir sin sesión": la sesión ya está
// muerta del lado servidor. El modal solo comunica el hecho.

import React, { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';

interface SessionExpiredModalProps {
  /** Se llama cuando el countdown llega a 0. El caller hace signOut + navigate. */
  onExpired: () => void;
  /** Segundos del countdown. Default 5. */
  seconds?: number;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  onExpired,
  seconds = 5,
}) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onExpired();
      return;
    }
    const t = window.setTimeout(() => setRemaining((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [remaining, onExpired]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pf-session-expired-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'pfSessionFadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: 'calc(100% - 40px)',
          background: 'var(--pf-bg-elevated, #1A1A1A)',
          border: '1px solid var(--pf-border-default, #333)',
          borderRadius: '14px',
          padding: '28px 24px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          fontFamily: 'var(--pf-font-ui, system-ui)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LogIn size={16} style={{ color: '#F59E0B' }} />
          </div>
          <h2
            id="pf-session-expired-title"
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--pf-text-primary, #FFF)',
              letterSpacing: '-0.01em',
            }}
          >
            Sesión expirada
          </h2>
        </div>

        <p
          style={{
            margin: '0 0 8px',
            fontSize: '0.875rem',
            lineHeight: 1.55,
            color: 'var(--pf-text-secondary, #A3A3A3)',
          }}
        >
          Inicia sesión de nuevo para continuar. Tu trabajo en curso está seguro.
        </p>

        <div
          style={{
            marginTop: '18px',
            paddingTop: '14px',
            borderTop: '1px solid var(--pf-border-subtle, #262626)',
            fontSize: '0.75rem',
            color: 'var(--pf-text-muted, #737373)',
            fontFamily: 'var(--pf-font-chat-mono, monospace)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span>Redirigiendo…</span>
          <span
            style={{
              minWidth: '24px',
              textAlign: 'right',
              fontWeight: 600,
              color: 'var(--pf-text-secondary, #A3A3A3)',
            }}
          >
            {remaining}s
          </span>
        </div>

        <style>{`
          @keyframes pfSessionFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
