// src/design/components/Button.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { radius, space, brand, semantic } from '../tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, { bg: string; bgHover: string; text: string; border?: string; glow?: string }> = {
  primary: {
    bg: brand.violet,
    bgHover: brand.violetDeep,
    text: '#FFFFFF',
    glow: '0 8px 24px -8px rgba(139,92,246,0.6)',
  },
  secondary: {
    bg: 'transparent',
    bgHover: 'var(--pf-bg-elevated)',
    text: 'var(--pf-text-primary)',
    border: 'var(--pf-border-default)',
  },
  ghost: {
    bg: 'transparent',
    bgHover: 'var(--pf-bg-elevated)',
    text: 'var(--pf-text-secondary)',
  },
  danger: {
    bg: semantic.danger,
    bgHover: '#DC2626',
    text: '#FFFFFF',
    glow: '0 8px 24px -8px rgba(239,68,68,0.6)',
  },
  success: {
    bg: semantic.success,
    bgHover: '#059669',
    text: '#FFFFFF',
    glow: '0 8px 24px -8px rgba(16,185,129,0.6)',
  },
};

const SIZE_STYLES: Record<Size, { padding: string; fontSize: string; height: string }> = {
  sm: { padding: `0 ${space[4]}`, fontSize: '0.875rem', height: '40px' },
  md: { padding: `0 20px`, fontSize: '0.9375rem', height: '44px' },
  lg: { padding: `0 28px`, fontSize: '1rem', height: '48px' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled,
  children,
  style,
  ...rest
}) => {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[2],
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: 'var(--pf-font-ui)',
        borderRadius: radius.base,
        border: v.border ? `1px solid ${v.border}` : 'none',
        background: v.bg,
        color: v.text,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'background 150ms ease-out, box-shadow 150ms ease-out, transform 150ms ease-out',
        boxShadow: v.glow,
        width: fullWidth ? '100%' : 'auto',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.background = v.bgHover;
        if (variant === 'primary' || variant === 'danger' || variant === 'success') {
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.background = v.bg;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {loading ? <Loader2 size={16} className="pf-spin" /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
};
