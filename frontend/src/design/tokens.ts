// src/design/tokens.ts
// Pathfinder Design System v3 — FUTURISMO
// Chakra Petch (display) + Geist Sans (UI) + Geist Mono (specs)

// ═══════════════════════════════════════════════════════════════════════════
// TIPOGRAFÍA — 3 familias, roles duros
// ═══════════════════════════════════════════════════════════════════════════
export const fonts = {
  display: 'var(--pf-font-display)',   // Chakra Petch
  sans: 'var(--pf-font-ui)',           // Geist Sans
  mono: 'var(--pf-font-mono)',         // Geist Mono
} as const;

// Escala tipográfica futurista
export const typeScale = {
  // DISPLAY — Chakra Petch
  'hero': {
    fontFamily: 'var(--pf-font-display)',
    fontSize: 'clamp(3.5rem, 8vw, 5.5rem)',
    lineHeight: 0.95,
    letterSpacing: '-0.02em',
    fontWeight: 600,
  },
  'section': {
    fontFamily: 'var(--pf-font-display)',
    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
    lineHeight: 1.0,
    letterSpacing: '-0.02em',
    fontWeight: 600,
  },
  'number-hero': {
    fontFamily: 'var(--pf-font-display)',
    fontSize: 'clamp(5rem, 12vw, 8rem)',
    lineHeight: 0.9,
    letterSpacing: '-0.04em',
    fontWeight: 500,
  },
  'page-title': {
    fontFamily: 'var(--pf-font-display)',
    fontSize: '2.5rem',
    lineHeight: 1.15,
    letterSpacing: '-0.96px',
    fontWeight: 600,
  },
  'display-lg': {
    fontFamily: 'var(--pf-font-display)',
    fontSize: '3.5rem',
    lineHeight: 1.05,
    letterSpacing: '-1.28px',
    fontWeight: 600,
  },
  'display-md': {
    fontFamily: 'var(--pf-font-display)',
    fontSize: '1.75rem',
    lineHeight: 1.2,
    letterSpacing: '-0.56px',
    fontWeight: 600,
  },
  'heading': {
    fontFamily: 'var(--pf-font-display)',
    fontSize: '1.25rem',
    lineHeight: 1.3,
    letterSpacing: '-0.32px',
    fontWeight: 600,
  },

  // BODY — Geist Sans
  'body-lg': {
    fontFamily: 'var(--pf-font-ui)',
    fontSize: '1.0625rem',
    lineHeight: 1.55,
    letterSpacing: '-0.01em',
    fontWeight: 400,
  },
  'body': {
    fontFamily: 'var(--pf-font-ui)',
    fontSize: '0.9375rem',
    lineHeight: 1.55,
    fontWeight: 400,
  },
  'body-sm': {
    fontFamily: 'var(--pf-font-ui)',
    fontSize: '0.84375rem',
    lineHeight: 1.5,
    fontWeight: 400,
  },

  // MONO — Geist Mono
  'mono-label': {
    fontFamily: 'var(--pf-font-mono)',
    fontSize: '0.6875rem',
    lineHeight: 1.4,
    letterSpacing: '0.08em',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
  },
  'mono-value': {
    fontFamily: 'var(--pf-font-mono)',
    fontSize: '0.8125rem',
    lineHeight: 1.4,
    fontWeight: 500,
    fontVariantNumeric: 'tabular-nums' as const,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ESPACIADO (grid 4px)
// ═══════════════════════════════════════════════════════════════════════════
export const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// RADIOS — pequeños, futuristas
// ═══════════════════════════════════════════════════════════════════════════
export const radius = {
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SOMBRAS — solo flotantes
// ═══════════════════════════════════════════════════════════════════════════
export const shadow = {
  none: 'none',
  modal: '0 12px 48px -8px rgba(0,0,0,0.6)',
  drawer: '-8px 0 48px -8px rgba(0,0,0,0.6)',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COLOR — Canvas oscuro + chrome futurista
// ═══════════════════════════════════════════════════════════════════════════
export const surfaces = {
  void: '#000000',
  base: '#08090A',
  frame: '#0F1011',
  card: '#141516',
  raised: '#1C1C1F',
  overlay: '#232326',
} as const;

export const text = {
  primary: '#F7F8F8',
  secondary: '#D0D6E0',
  tertiary: '#8A8F98',
  quaternary: '#62666D',
} as const;

export const accent = {
  base: '#6E56CF',
  hover: '#7C66DD',
  glow: 'rgba(110,86,207,0.20)',
  glowStrong: '0 0 24px -8px rgba(110,86,207,0.6)',
} as const;

// Chrome futurista (Krea-tier)
export const chrome = {
  violet: '#8B5CF6',
  cyan: '#22D3EE',
  pink: '#EC4899',
} as const;

// Aliases retro-compatibles con el código existente
export const brand = {
  violet: '#8B5CF6',
  violetDeep: '#6D28D9',
  cyan: '#22D3EE',
  pink: '#EC4899',
} as const;

export const semantic = {
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EB5757',
} as const;

export const borders = {
  base: 'rgba(255,255,255,0.08)',
  strong: 'rgba(255,255,255,0.14)',
  subtle: 'rgba(255,255,255,0.05)',
} as const;

// Acentos por capability
export const capability = {
  image: { color: '#8B5CF6', colorDeep: '#7C66DD', label: 'Imagen' },
  video: { color: '#EC4899', colorDeep: '#DB2777', label: 'Video' },
  audio: { color: '#F59E0B', colorDeep: '#D97706', label: 'Audio' },
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
  wide: '1200px',
  max: '1360px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// GRADIENTES Y ATMÓSFERA
// ═══════════════════════════════════════════════════════════════════════════
export const gradients = {
  // Mesh energético futurista
  mesh: `
    radial-gradient(ellipse 40% 30% at 20% 20%, rgba(139,92,246,0.18), transparent),
    radial-gradient(ellipse 35% 25% at 80% 30%, rgba(34,211,238,0.14), transparent),
    radial-gradient(ellipse 50% 40% at 50% 80%, rgba(236,72,153,0.10), transparent)
  `,
  // Chrome gradient para texto (hero)
  chromeText: 'linear-gradient(135deg, #8B5CF6 0%, #22D3EE 50%, #EC4899 100%)',
  // Chrome border (feature cards)
  chromeBorder: 'linear-gradient(135deg, #8B5CF6, #22D3EE, #EC4899)',
} as const;
