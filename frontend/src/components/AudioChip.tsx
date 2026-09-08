// src/components/AudioChip.tsx
import React from 'react';

interface AudioChipProps {
  label: string;
  duration?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const AudioChip: React.FC<AudioChipProps> = ({
  label,
  duration,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: isActive
          ? 'var(--pf-text-primary)'
          : 'var(--pf-bg-secondary)',
        color: isActive
          ? '#FFFFFF'
          : 'var(--pf-text-secondary)',
        border: `1px solid ${isActive ? 'var(--pf-text-primary)' : 'var(--pf-border-default)'}`,
        borderRadius: '9999px',
        fontFamily: 'var(--pf-font-ui)',
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--pf-border-default)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--pf-bg-secondary)';
        }
      }}
    >
      <span style={{ fontSize: '1rem' }}>🎵</span>
      <span>{label}</span>
      {duration && (
        <span
          style={{
            fontSize: '0.75rem',
            opacity: 0.7,
            fontFamily: 'var(--pf-font-ui)',
          }}
        >
          {duration}
        </span>
      )}
    </button>
  );
};

export default AudioChip;