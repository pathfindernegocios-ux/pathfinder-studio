// src/components/GenerationProgress.tsx
import React from 'react';

interface GenerationProgressProps {
  progress: number;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  progress,
  status = 'processing',
  message,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'error':
        return '#EF4444';
      default:
        return 'var(--pf-text-primary)';
    }
  };

  const getStatusMessage = () => {
    if (message) return message;
    switch (status) {
      case 'pending':
        return 'En cola...';
      case 'processing':
        return 'Generando imagen...';
      case 'completed':
        return '¡Completado!';
      case 'error':
        return 'Error en la generación';
      default:
        return '';
    }
  };

  return (
    <div
      style={{
        width: '100%',
        padding: '24px',
        background: 'var(--pf-glass-surface)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderRadius: 'var(--pf-radius-lg)',
        border: '1px solid var(--pf-border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--pf-text-secondary)',
          }}
        >
          {getStatusMessage()}
        </span>
        <span
          style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: getStatusColor(),
          }}
        >
          {Math.round(progress)}%
        </span>
      </div>

      <div
        style={{
          width: '100%',
          height: '8px',
          background: 'var(--pf-bg-secondary)',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: getStatusColor(),
            borderRadius: '9999px',
            transition: 'width 0.3s ease, background 0.3s ease',
          }}
        />
      </div>

      {status === 'error' && (
        <p
          style={{
            marginTop: '12px',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.8125rem',
            color: '#EF4444',
            margin: 0,
          }}
        >
          Por favor, inténtalo de nuevo o contacta soporte si el problema persiste.
        </p>
      )}
    </div>
  );
};

export default GenerationProgress;