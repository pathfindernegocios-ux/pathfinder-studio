// src/design/tokens.ts
// Sistema de diseño Pathfinder — Design tokens

// ═══════════════════════════════════════════════════════════════════════════
// TIPOGRAFÍA
// ═══════════════════════════════════════════════════════════════════════════
export const fonts = {
  display: 'var(--pf-font-display)',
  body: 'var(--pf-font-ui)',
  mono: 'var(--pf-font-mono)',
} as const;

export const typeScale = {
  'display-2xl': {
    fontSize: '4.5rem',
    lineHeight: '1.0',
    letterSpacing: '-0.05em',
    fontWeight: 800,
  },
  'display-xl': {
    fontSize: '3.5rem',
    lineHeight: '1.05',
    letterSpacing: '-0.04em',
    fontWeight: 800,
  },
  'display-lg': {
    fontSize: '2.5rem',
    lineHeight: '1.1',
    letterSpacing: '-0.03em',
    fontWeight: 700,
  },
  'display-md': {
    fontSize: '1.875rem',
    lineHeight: '1.15',
    letterSpacing: '-0.02em',
    fontWeight: 700,
  },
  'body-lg': {
    fontSize: '1.125rem',
    lineHeight: '1.6',
    fontWeight: 400,
  },
  body: {
    fontSize: '1rem',
    lineHeight: '1.6',
    fontWeight: 400,
  },
  'body-sm': {
    fontSize: '0.875rem',
    lineHeight: '1.55',
    fontWeight: 400,
  },
  'mono-sm': {
    fontSize: '0.75rem',
    lineHeight: '1.4',
    letterSpacing: '0.05em',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  'mono-xs': {
    fontSize: '0.6875rem',
    lineHeight: '1.4',
    letterSpacing: '0.08em',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ESPACIADO (múltiplos de 4)
// ═══════════════════════════════════════════════════════════════════════════
export const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  24: '96px',
  32: '128px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// RADIOS
// ═══════════════════════════════════════════════════════════════════════════
export const radius = {
  sm: '8px',
  base: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SOMBRAS
// ═══════════════════════════════════════════════════════════════════════════
export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.04)',
  base: '0 4px 12px -2px rgba(0,0,0,0.08)',
  lg: '0 12px 32px -8px rgba(0,0,0,0.12)',
  glow: '0 0 40px -8px rgba(139,92,246,0.4)',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COLORES
// ═══════════════════════════════════════════════════════════════════════════
export const brand = {
  violet: '#8B5CF6',
  violetDeep: '#6D28D9',
  cyan: '#22D3EE',
  pink: '#EC4899',
} as const;

export const semantic = {
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export const capability = {
  image: { color: '#8B5CF6', colorDeep: '#6D28D9', label: 'Imagen' },
  video: { color: '#EC4899', colorDeep: '#BE185D', label: 'Video' },
  audio: { color: '#F59E0B', colorDeep: '#B45309', label: 'Audio' },
} as const;

export const platform = {
  kaggle: { color: '#20BEFF', colorDeep: '#1E9DE0', label: 'Kaggle' },
  colab: { color: '#F9AB00', colorDeep: '#FBBC04', label: 'Colab' },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINERS
// ═══════════════════════════════════════════════════════════════════════════
export const container = {
  narrow: '720px',
  base: '980px',
  wide: '1280px',
} as const;
