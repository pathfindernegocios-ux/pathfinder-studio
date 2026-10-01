import React from 'react';
import { Play, Link as LinkIcon, Scissors } from 'lucide-react';
import type { StoryboardSceneMeta } from '../context/GenerationContext';

interface SceneChipProps {
  scene: StoryboardSceneMeta;
}

const MODE_ICON = {
  first: Play,
  continue: LinkIcon,
  cut: Scissors,
} as const;

const MODE_LABEL = {
  first: 'Inicial',
  continue: 'Continuación',
  cut: 'Corte',
} as const;

/**
 * Chip compacto de una escena del storyboard.
 * Se muestra en el card de resultado para indicar el orden y el tipo de cada escena.
 * NO es interactivo por ahora — solo informativo.
 */
const SceneChip: React.FC<SceneChipProps> = ({ scene }) => {
  const Icon = MODE_ICON[scene.mode];
  const label = `Escena ${scene.index + 1} — ${MODE_LABEL[scene.mode]} (${scene.durationSec}s)`;

  return (
    <div
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 7px',
        borderRadius: '6px',
        background: 'var(--pf-bg-secondary)',
        border: '1px solid var(--pf-border-subtle)',
        fontFamily: 'var(--pf-font-ui)',
        fontSize: '0.7rem',
        color: 'var(--pf-text-secondary)',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--pf-font-chat-mono, monospace)',
          fontSize: '0.6875rem',
          color: 'var(--pf-text-muted)',
          fontWeight: 600,
        }}
      >
        {scene.index + 1}
      </span>
      <Icon size={10} strokeWidth={2.2} />
      <span
        style={{
          color: 'var(--pf-text-muted)',
          fontSize: '0.65rem',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {scene.durationSec}s
      </span>
    </div>
  );
};

export default React.memo(SceneChip);
