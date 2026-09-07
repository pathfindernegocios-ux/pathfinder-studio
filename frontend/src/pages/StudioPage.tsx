// src/pages/StudioPage.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import FloatingCommandCenter from '../components/FloatingCommandCenter';
import { useCreations } from '../hooks/useCreations';

const StudioPage: React.FC = () => {
  const { creations, getDownloadUrl } = useCreations();
  const [latestMediaUrl, setLatestMediaUrl] = useState<string | null>(null);
  
  // Nota: Como Sidebar maneja su estado internamente, asumimos un ancho base 
  // para el layout inicial. El sidebar real puede variar visualmente.
  // Para una sincronización perfecta sin props, lo ideal es usar CSS Grid 
  // con minmax o dejar que el sidebar sea fixed y el grid ocupe el resto.
  const sidebarWidth = 280; 

  const latestCreation = creations.length > 0 ? creations[0] : null;

  useEffect(() => {
    const loadLatestMedia = async () => {
      if (latestCreation && latestCreation.id) {
        try {
          const url = await getDownloadUrl(latestCreation.id);
          setLatestMediaUrl(url);
        } catch (error) {
          console.error('Error loading media URL:', error);
          setLatestMediaUrl(null);
        }
      } else {
        setLatestMediaUrl(null);
      }
    };
    loadLatestMedia();
  }, [latestCreation, getDownloadUrl]);

  return (
    <div
      style={{
        display: 'grid',
        // Usamos un ancho base. Si Sidebar se colapsa visualmente, 
        // el área de canvas se ajustará si usamos fr, pero el gap visual podría quedar.
        // La solución robusta sin props es que Sidebar sea 'position: fixed' y este grid ocupe 100%.
        gridTemplateColumns: `${sidebarWidth}px 1fr`,
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--pf-bg-primary)',
      }}
    >
      {/* 1. SIDEBAR COLUMN */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          borderRight: '1px solid var(--pf-border-subtle)',
          background: 'var(--pf-bg-secondary)',
          zIndex: 40,
        }}
      >
        {/* CORRECCIÓN: Sin props, Sidebar gestiona su estado interno */}
        <Sidebar />
      </div>

      {/* 2. CANVAS AREA */}
      <div
        style={{
          position: 'relative',
          overflowY: 'auto',
          height: '100%',
          background: 'var(--pf-bg-primary)',
          padding: '40px',
          paddingBottom: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '1400px', flex: 1 }}>
          {latestCreation ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              <div
                className="pf-glass-panel"
                style={{
                  padding: '20px',
                  borderRadius: 'var(--pf-radius-lg)',
                  background: 'var(--pf-glass-surface)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  border: '1px solid var(--pf-border-subtle)',
                }}
              >
                {latestMediaUrl ? (
                  latestCreation.media_type === 'video' ? (
                    <video src={latestMediaUrl} controls muted loop autoPlay style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
                  ) : (
                    <img src={latestMediaUrl} alt={latestCreation.prompt} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
                  )
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1', background: 'var(--pf-bg-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pf-text-muted)' }}>
                    Cargando...
                  </div>
                )}
                <p className="pf-font-prompt" style={{ marginTop: '16px', fontFamily: 'var(--pf-font-display)', fontSize: '1rem', color: 'var(--pf-text-primary)', lineHeight: 1.5 }}>
                  {latestCreation.prompt}
                </p>
                <div style={{ marginTop: '8px', fontFamily: 'var(--pf-font-ui)', fontSize: '0.75rem', color: 'var(--pf-text-muted)', textTransform: 'capitalize' }}>
                  {latestCreation.media_type || 'imagen'} • {new Date(latestCreation.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '5rem', marginBottom: '24px', opacity: 0.5 }}>🎨</div>
              <h2 className="pf-font-prompt" style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--pf-text-primary)', marginBottom: '16px' }}>
                Tu lienzo está vacío
              </h2>
              <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '1rem', color: 'var(--pf-text-secondary)', maxWidth: '400px' }}>
                Usa el panel inferior para crear tu primera obra de arte con IA.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. FLOATING COMMAND CENTER */}
      <div
        style={{
          position: 'fixed',
          bottom: '32px',
          // Centrado respecto al viewport asumiendo sidebar expandido. 
          // Si el sidebar se colapsa, el panel se desplazará ligeramente, 
          // pero al ser fixed y centrado con calc, se mantiene estable en la mayoría de casos.
          left: `calc(${sidebarWidth}px + ((100vw - ${sidebarWidth}px) / 2) - (min(90%, 800px) / 2))`,
          width: 'min(90%, 800px)',
          zIndex: 50,
          transition: 'left 0.3s ease',
        }}
      >
        <FloatingCommandCenter />
      </div>
    </div>
  );
};

export default StudioPage;