// src/pages/StudioPage.tsx
import React, { useState, useEffect } from 'react';
import { useGenerationContext } from '../context/GenerationContext';
import FloatingCommandCenter from '../components/FloatingCommandCenter';

const StudioPage: React.FC = () => {
  const { generationInfo, logs } = useGenerationContext();
  const [showDetails, setShowDetails] = useState(false);

  // Extraer valores de forma segura para evitar errores si generationInfo es null
  const status = generationInfo?.status;
  const progress = generationInfo?.progress;

  // Efecto para manejar el scroll hacia abajo cuando hay nueva información
  useEffect(() => {
    if (status === 'running' || status === 'complete') {
      // Lógica opcional de auto-scroll si es necesaria
      // Ejemplo: scrollToBottom();
    }
  }, [status, progress]);

  return (
    <div className="pf-studio-content">
      {/* Contenido Principal del Studio (Preview, Historial, Logs) */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: 'var(--pf-spacing-lg) var(--pf-spacing-md)',
        paddingBottom: '20px' // Extra padding interno
      }}>
        
        {/* Aquí iría tu componente de Preview Principal */}
        <div style={{ 
          minHeight: '300px', 
          background: 'var(--pf-bg-secondary)', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 'var(--pf-spacing-lg)'
        }}>
          {status === 'idle' ? (
            <p style={{ color: 'var(--pf-text-muted)', fontFamily: 'var(--pf-font-ui)' }}>
              El estudio está listo. Configura tu generación abajo.
            </p>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'var(--pf-font-display)', marginBottom: '8px' }}>
                {status === 'complete' ? '¡Generación Completada!' : 'Generando...'}
              </h2>
              <p style={{ color: 'var(--pf-text-secondary)' }}>
                {progress ? `${Math.round(progress * 100)}%` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Panel de Logs / Detalles (Colapsable en móvil si es muy largo) */}
        {logs.length > 0 && (
          <div style={{ 
            background: '#FFFFFF', 
            borderRadius: '12px', 
            border: '1px solid var(--pf-border-subtle)', 
            padding: 'var(--pf-spacing-md)',
            maxHeight: '40vh', // Limitado en móvil para no ocupar toda la pantalla
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 'var(--pf-spacing-sm)' 
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--pf-text-primary)' }}>Logs de Generación</h3>
              <button 
                onClick={() => setShowDetails(!showDetails)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--pf-text-secondary)', 
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                {showDetails ? 'Ocultar' : 'Ver Todo'}
              </button>
            </div>
            {(showDetails || logs.length < 5) && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--pf-text-secondary)' }}>
                {logs.slice(-10).map((log, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>
                    <span style={{ color: 'var(--pf-text-muted)' }}>{new Date(log.ts).toLocaleTimeString()}</span>: {log.msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Panel Flotante de Comandos (Siempre visible al final) */}
      <FloatingCommandCenter />
    </div>
  );
};

export default StudioPage;