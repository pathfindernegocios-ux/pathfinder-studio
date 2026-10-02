// src/components/Callout.tsx
// Callout anclado a un elemento padre con position:relative.
// Flota arriba del padre, con punta rombo que apunta hacia abajo.

interface CalloutProps {
  title: string;
  body: string;
  /** Lado del padre al que se alinea. Default 'left'. */
  align?: 'left' | 'right';
  /** Texto del botón de cierre. Default 'Entendido'. */
  dismissLabel?: string;
  onDismiss: () => void;
}

export default function Callout({
  title,
  body,
  align = 'left',
  dismissLabel = 'Entendido',
  onDismiss,
}: CalloutProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 10px)',
        [align]: 0,
        width: '280px',
        background: 'var(--pf-bg-elevated)',
        border: '1px solid var(--pf-border-subtle)',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 100,
        animation: 'pfPopoverIn 0.18s ease-out',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--pf-font-ui)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--pf-text-primary)',
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: 'var(--pf-font-ui)',
          fontSize: '0.75rem',
          color: 'var(--pf-text-secondary)',
          lineHeight: 1.5,
        }}
      >
        {body}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button
          onClick={onDismiss}
          style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--pf-text-inverse, #FFFFFF)',
            background: 'var(--pf-text-primary)',
            border: 'none',
            padding: '4px 12px',
            borderRadius: '99px',
            cursor: 'pointer',
          }}
        >
          {dismissLabel}
        </button>
      </div>
      {/* Punta rombo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-5px',
          [align]: '24px',
          width: '8px',
          height: '8px',
          background: 'var(--pf-bg-elevated)',
          borderRight: '1px solid var(--pf-border-subtle)',
          borderBottom: '1px solid var(--pf-border-subtle)',
          transform: 'rotate(45deg)',
        }}
      />
    </div>
  );
}
