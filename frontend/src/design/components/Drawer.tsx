// src/design/components/Drawer.tsx
import React from 'react';
import { Drawer as VaulDrawer } from 'vaul';
import { X } from 'lucide-react';
import { radius, space, shadow } from '../tokens';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  width = '560px',
}) => {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange} direction="right">
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 100,
          }}
        />
        <VaulDrawer.Content
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width,
            maxWidth: '95vw',
            background: 'var(--pf-bg-primary)',
            borderLeft: '1px solid var(--pf-border-subtle)',
            boxShadow: shadow.drawer,
            zIndex: 101,
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: `${space[6]} ${space[6]} ${space[4]}`,
              borderBottom: '1px solid var(--pf-border-subtle)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: space[4],
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {title && (
                  <VaulDrawer.Title
                    style={{
                      fontFamily: 'var(--pf-font-display)',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: 'var(--pf-text-primary)',
                      margin: 0,
                      marginBottom: subtitle ? space[2] : 0,
                    }}
                  >
                    {title}
                  </VaulDrawer.Title>
                )}
                {subtitle && (
                  <VaulDrawer.Description
                    style={{
                      fontFamily: 'var(--pf-font-ui)',
                      fontSize: '0.875rem',
                      color: 'var(--pf-text-secondary)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {subtitle}
                  </VaulDrawer.Description>
                )}
              </div>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Cerrar"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.sm,
                  background: 'transparent',
                  border: '1px solid var(--pf-border-subtle)',
                  color: 'var(--pf-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  transition: 'background 150ms, color 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--pf-bg-elevated)';
                  e.currentTarget.style.color = 'var(--pf-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--pf-text-muted)';
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body scrolleable */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: space[6],
            }}
          >
            {children}
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
};
