// src/pages/placeholders/SettingsPage.tsx
import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--pf-bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <div
        className="pf-glass-panel"
        style={{
          textAlign: 'center',
          padding: '48px',
          borderRadius: 'var(--pf-radius-xl)',
          maxWidth: '600px',
        }}
      >
        <div
          style={{
            fontSize: '4rem',
            marginBottom: '24px',
          }}
        >
          ⚙️
        </div>
        <h1
          className="pf-font-prompt"
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--pf-text-primary)',
            marginBottom: '16px',
            letterSpacing: '-0.03em',
          }}
        >
          Configuración
        </h1>
        <p
          style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '1.125rem',
            color: 'var(--pf-text-secondary)',
            lineHeight: 1.6,
          }}
        >
          Esta página está en construcción. Pronto podrás gestionar tu cuenta,
          preferencias de generación y suscripción desde aquí.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;