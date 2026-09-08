// src/pages/placeholders/StationPage.tsx
import React from 'react';
// Imports corregidos: eliminados los no necesarios para evitar errores de ruta
// Si en el futuro se necesita Sidebar, la ruta correcta sería ../../components/Sidebar

const StationPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--pf-bg-primary)',
        color: 'var(--pf-text-primary)',
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '5rem', marginBottom: '24px', opacity: 0.5 }}>
        🖥️
      </div>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '16px',
          fontFamily: 'var(--pf-font-display)',
          letterSpacing: '-0.03em',
        }}
      >
        Station
      </h1>
      <p
        style={{
          fontSize: '1rem',
          color: 'var(--pf-text-secondary)',
          maxWidth: '500px',
          lineHeight: 1.6,
          fontFamily: 'var(--pf-font-ui)',
        }}
      >
        Tu estación de trabajo de renderizado y gestión de colas aparecerá aquí.
        Esta página está actualmente en desarrollo.
      </p>
      
      <div
        style={{
          marginTop: '40px',
          padding: '24px',
          background: 'var(--pf-glass-surface)',
          backdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--pf-border-subtle)',
          borderRadius: 'var(--pf-radius-xl)',
          maxWidth: '600px',
          width: '100%',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '12px',
            fontFamily: 'var(--pf-font-display)',
          }}
        >
          Próximamente
        </h2>
        <ul
          style={{
            textAlign: 'left',
            paddingLeft: '20px',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.9375rem',
            color: 'var(--pf-text-secondary)',
            lineHeight: 1.8,
          }}
        >
          <li>Monitor de rendimiento de GPUs en tiempo real</li>
          <li>Cola de renderizados activos y pendientes</li>
          <li>Historial de trabajos completados</li>
          <li>Configuración de nodos de renderizado</li>
        </ul>
      </div>
    </div>
  );
};

export default StationPage;