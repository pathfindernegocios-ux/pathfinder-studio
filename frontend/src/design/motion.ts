// src/design/motion.ts
// Variantes de animación reutilizables. Basadas en motion (ex framer-motion).

import type { Variants, Transition } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// EASINGS
// ═══════════════════════════════════════════════════════════════════════════
export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  spring: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// DURACIONES
// ═══════════════════════════════════════════════════════════════════════════
export const duration = {
  micro: 0.15,
  fast: 0.25,
  medium: 0.4,
  slow: 0.6,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// VARIANTES
// ═══════════════════════════════════════════════════════════════════════════

/** Fade + slide desde abajo. Para entradas de cards. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.fast, ease: ease.out },
  },
};

/** Container con stagger para hijos. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

/** Fade simple. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.fast, ease: ease.out },
  },
};

/** Scale + fade. Para modales. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.medium, ease: ease.out },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: duration.fast, ease: ease.out },
  },
};

/** Drawer slide desde la derecha. */
export const slideInRight: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { duration: duration.medium, ease: ease.out },
  },
  exit: {
    x: '100%',
    transition: { duration: duration.fast, ease: ease.out },
  },
};

/** Backdrop fade. */
export const backdropFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.fast } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};
