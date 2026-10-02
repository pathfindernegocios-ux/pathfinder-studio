// src/components/GenerationNarrative.tsx
// Narrativa rotativa mientras una generación está en curso.
// Autónomo: maneja su propio tick de 1s. No depende de estado global.
import { useEffect, useState } from 'react';

type MediaType = 'image' | 'video' | 'audio';

interface Phase { until: number; text: string; }

const PHASES: Record<MediaType, Phase[]> = {
  image: [
    { until: 8,          text: 'Preparando el lienzo…' },
    { until: 30,         text: 'Dando forma a tu imagen…' },
    { until: 90,         text: 'Ajustando detalles finos…' },
    { until: Infinity,   text: 'Puliendo el acabado final…' },
  ],
  video: [
    { until: 15,         text: 'Preparando la escena…' },
    { until: 60,         text: 'Dando vida a los primeros frames…' },
    { until: 180,        text: 'Componiendo el movimiento…' },
    { until: Infinity,   text: 'Puliendo el render final…' },
  ],
  audio: [
    { until: 5,          text: 'Analizando el texto…' },
    { until: 20,         text: 'Dando voz a tus palabras…' },
    { until: 60,         text: 'Ajustando entonación y ritmo…' },
    { until: Infinity,   text: 'Puliendo el audio final…' },
  ],
};

// Copy override cuando la generación es storyboard multi-escena.
const STORYBOARD_PHASES: Phase[] = [
  { until: 60,         text: 'Preparando la siguiente escena…' },
  { until: 240,        text: 'Manteniendo continuidad entre escenas…' },
  { until: Infinity,   text: 'Ensamblando el resultado final…' },
];

// Segundos a partir de los cuales se muestra la salvaguarda.
const WARN_THRESHOLD: Record<MediaType, number> = {
  image: 120,
  video: 300,
  audio: 150,
};
const STORYBOARD_WARN = 600;

function getPhase(elapsed: number, phases: Phase[]): string {
  for (const p of phases) if (elapsed < p.until) return p.text;
  return phases[phases.length - 1].text;
}

function formatElapsed(s: number): string {
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

interface GenerationNarrativeProps {
  mediaType: MediaType;
  /** Timestamp (ms epoch) del inicio de la generación. */
  startedAt: number;
  /** Etiqueta de resolución, ej "720p" o "Fast Preview (384p - ~1-2 min)". */
  resolution?: string;
  /** True si la generación es multi-escena (storyboard). */
  isStoryboard?: boolean;
}

export default function GenerationNarrative({
  mediaType,
  startedAt,
  resolution,
  isStoryboard = false,
}: GenerationNarrativeProps) {
  const [elapsed, setElapsed] = useState(
    () => Math.max(0, (Date.now() - startedAt) / 1000)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.max(0, (Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const phases = isStoryboard ? STORYBOARD_PHASES : PHASES[mediaType];
  const phaseText = getPhase(elapsed, phases);

  const show720Hint = !isStoryboard && (resolution?.includes('720') ?? false);
  const warnAfter = isStoryboard ? STORYBOARD_WARN : WARN_THRESHOLD[mediaType];
  const showWarning = elapsed >= warnAfter;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginTop: '6px',
        fontFamily: 'var(--pf-font-ui)',
        fontSize: '0.8125rem',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--pf-text-secondary)',
          animation: 'pf-audio-pulse 1.4s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
      <span style={{ color: 'var(--pf-text-secondary)' }}>{phaseText}</span>
      <span
        style={{
          color: 'var(--pf-text-tertiary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        · {formatElapsed(elapsed)}
      </span>

      {show720Hint && !showWarning && (
        <span style={{ color: 'var(--pf-text-tertiary)' }}>
          — Las generaciones en 720p pueden tardar unos minutos más de lo habitual.
        </span>
      )}

      {showWarning && (
        <span
          style={{
            color: 'var(--pf-text-secondary)',
            fontWeight: 500,
          }}
        >
          — Está tardando más de lo normal, pero seguimos trabajando. No cierres esta pestaña.
        </span>
      )}
    </div>
  );
}
