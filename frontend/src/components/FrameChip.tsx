// src/components/FrameChip.tsx
import React from 'react';

interface FrameChipProps {
  label: string;
  icon?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const FrameChip: React.FC<FrameChipProps> = ({
  label,
  icon,
  isSelected = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        background: isSelected
          ? 'var(--pf-text-primary)'
          : 'var(--pf-bg-secondary)',
        color: isSelected
          ? '#FFFFFF'
          : 'var(--pf-text-secondary)',
        border: `1px solid ${isSelected ? 'var(--pf-text-primary)' : 'var(--pf-border-default)'}`,
        borderRadius: '9999px',
        fontFamily: 'var(--pf-font-ui)',
        fontSize: '0.875rem',
        fontWeight: isSelected ? 600 : 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--pf-border-default)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--pf-bg-secondary)';
        }
      }}
    >
      {icon && <span style={{ fontSize: '1.125rem' }}>{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

export default FrameChip;