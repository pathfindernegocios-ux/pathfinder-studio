// src/design/components/Card.tsx
import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { radius, space, shadow } from '../tokens';
import { ease, duration } from '../motion';

interface CardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean;
  padded?: boolean;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  padded = true,
  elevated = false,
  children,
  style,
  ...rest
}) => {
  return (
    <motion.div
      {...rest}
      whileHover={
        interactive
          ? {
              y: -2,
              boxShadow: shadow.none,
              transition: { duration: duration.micro, ease: ease.out },
            }
          : undefined
      }
      style={{
        background: elevated ? 'var(--pf-bg-elevated)' : 'var(--pf-bg-secondary)',
        border: '1px solid var(--pf-border-subtle)',
        borderRadius: radius.base,
        padding: padded ? space[6] : 0,
        boxShadow: shadow.none,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'border-color 150ms ease-out',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
};
