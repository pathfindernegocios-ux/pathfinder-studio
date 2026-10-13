// src/design/components/Badge.tsx
import React from 'react';
import { radius } from '../tokens';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  colorDeep?: string;
}

const TONE_MAP: Record<Tone, { color: string; colorDeep: string }> = {
  brand: { color: '#8B5CF6', colorDeep: '#6D28D9' },
  success: { color: '#10B981', colorDeep: '#047857' },
  warning: { color: '#F59E0B', colorDeep: '#B45309' },
  danger: { color: '#EF4444', colorDeep: '#B91C1C' },
  info: { color: '#22D3EE', colorDeep: '#0E7490' },
  neutral: { color: '#71717A', colorDeep: '#525252' },
};

export const Badge: React.FC<BadgeProps> = ({
  tone = 'brand',
  children,
  icon,
  color: customColor,
  colorDeep: customColorDeep,
}) => {
  const c = customColor ?? TONE_MAP[tone].color;
  const cDeep = customColorDeep ?? TONE_MAP[tone].colorDeep;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: `${c}14`,
        border: `1px solid ${c}40`,
        borderRadius: radius.full,
        fontFamily: 'var(--pf-font-mono)',
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: cDeep,
      }}
    >
      {icon}
      {children}
    </span>
  );
};
