import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Scissors, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';

export type SceneMode = 'first' | 'cut' | 'continue';

export interface StoryboardSceneLocal {
  id: string;
  mode: SceneMode;
  durationSec: number;
  prompt: string;
  /** Solo aplica en mode='first' o 'cut'. En 'continue' siempre es null. */
  startImage: File | null;
  endImage: File | null;
  /** Audio de referencia de la escena (opcional, se sube como base64). */
  audioFile: File | null;
  /** Si true, la duración de la escena se toma del audio en vez del dropdown. */
  matchAudioDur: boolean;
  /** Solo aplica en mode='cut'. En 'continue' siempre es true. */
  inheritStartFromPrev: boolean;
}

interface StoryboardStripProps {
  prompt: string;
  onPromptChange: (v: string) => void;
  onScenesChange?: (scenes: StoryboardSceneLocal[]) => void;
  disabled?: boolean;
}

const DURATIONS = [3, 5, 8, 10, 15, 20];
const MAX_SCENES = 12;

const MODE_ICON = {
  first: Play,
  cut: Scissors,
  continue: LinkIcon,
} as const;

const MODE_LABEL: Record<SceneMode, string> = {
  first: 'Primera',
  cut: 'Corte',
  continue: 'Continuación',
};

function newScene(idx: number): StoryboardSceneLocal {
  return {
    id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode: idx === 0 ? 'first' : 'cut',
    durationSec: 5,
    prompt: '',
    startImage: null,
    endImage: null,
    audioFile: null,
    matchAudioDur: false,
    inheritStartFromPrev: idx > 0,
  };
}

/** Devuelve los modos permitidos según la posición de la escena. */
function availableModes(idx: number): SceneMode[] {
  return idx === 0 ? ['first', 'cut'] : ['cut', 'continue'];
}

const StoryboardStrip: React.FC<StoryboardStripProps> = ({
  prompt,
  onPromptChange,
  onScenesChange,
  disabled = false,
}) => {
  const [scenes, setScenes] = useState<StoryboardSceneLocal[]>(() => [newScene(0)]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Notificar cambios al padre (por si en 4c necesita acceso)
  useEffect(() => {
    onScenesChange?.(scenes);
  }, [scenes, onScenesChange]);

  // Al cambiar de escena, sincronizar el prompt del FCM con el de esa escena.
  const skipNextPromptSync = useRef(false);
  useEffect(() => {
    skipNextPromptSync.current = true;
    onPromptChange(scenes[selectedIdx]?.prompt ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx]);

  // Al tipear en el prompt del FCM, guardar en la escena seleccionada.
  useEffect(() => {
    if (skipNextPromptSync.current) {
      skipNextPromptSync.current = false;
      return;
    }
    setScenes((prev) => {
      const current = prev[selectedIdx];
      if (!current || current.prompt === prompt) return prev;
      const next = [...prev];
      next[selectedIdx] = { ...current, prompt };
      return next;
    });
  }, [prompt, selectedIdx]);

  const updateScene = useCallback((idx: number, patch: Partial<StoryboardSceneLocal>) => {
    setScenes((prev) => {
      if (!prev[idx]) return prev;
      const next = [...prev];
      next[idx] = { ...prev[idx], ...patch };
      return next;
    });
  }, []);

  const addScene = useCallback(() => {
    setScenes((prev) => {
      if (prev.length >= MAX_SCENES) return prev;
      const idx = prev.length;
      const next = [...prev, newScene(idx)];
      // El nuevo selectedIdx debe apuntar a la escena recién agregada.
      setSelectedIdx(idx);
      return next;
    });
  }, []);

  const removeScene = useCallback((idx: number) => {
    setScenes((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      // Reindexar y corregir modes del índice 0 (debe ser 'first' o 'cut').
      if (next[0] && next[0].mode === 'continue') {
        next[0] = { ...next[0], mode: 'first' };
      }
      return next;
    });
    setSelectedIdx((prev) => Math.max(0, Math.min(prev, scenes.length - 2)));
  }, [scenes.length]);

  const changeMode = useCallback((idx: number, mode: SceneMode) => {
    const patch: Partial<StoryboardSceneLocal> = { mode };
    if (mode === 'continue') {
      patch.startImage = null;
      patch.inheritStartFromPrev = true;
    }
    if (mode === 'first') {
      patch.inheritStartFromPrev = false;
    }
    updateScene(idx, patch);
  }, [updateScene]);

  const renderSceneFileChip = (
    file: File | null,
    onChange: (f: File | null) => void,
    label: string,
  ): React.ReactNode => {
    if (file) {
      let url = '';
      try { url = URL.createObjectURL(file); } catch { url = ''; }
      return (
        <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }} title={file.name}>
          <img
            src={url}
            alt={label}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              borderRadius: 4, border: '1px solid var(--pf-border-subtle)',
              display: 'block',
            }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              position: 'absolute', top: -4, right: -4,
              width: 14, height: 14, borderRadius: '50%',
              background: '#EF4444', color: '#fff', border: 'none',
              fontSize: 9, lineHeight: 1, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
            aria-label={`Quitar ${label}`}
          >×</button>
        </div>
      );
    }
    return (
      <label
        title={`Agregar imagen de ${label.toLowerCase()}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 7px', borderRadius: 6,
          background: 'var(--pf-bg-secondary)',
          border: '1px dashed var(--pf-border-default)',
          color: 'var(--pf-text-muted)',
          fontFamily: 'var(--pf-font-ui)', fontSize: '10px',
          fontWeight: 500, cursor: 'pointer',
          userSelect: 'none', lineHeight: 1,
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
        />
        + {label}
      </label>
    );
  };

  const selected = scenes[selectedIdx];
  const isFirst = selectedIdx === 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '8px',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {/* Fila 1 — Film strip */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
        {scenes.map((s, i) => {
          const Icon = MODE_ICON[s.mode];
          const active = i === selectedIdx;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedIdx(i)}
              title={`Escena ${i + 1} — ${MODE_LABEL[s.mode]} (${s.durationSec}s)`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 7px',
                borderRadius: '6px',
                background: active ? 'var(--pf-text-primary)' : 'var(--pf-bg-secondary)',
                color: active ? 'var(--pf-bg-elevated)' : 'var(--pf-text-secondary)',
                border: '1px solid ' + (active ? 'var(--pf-text-primary)' : 'var(--pf-border-subtle)'),
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                lineHeight: 1,
              }}
            >
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
              <Icon size={10} strokeWidth={2.2} />
            </button>
          );
        })}
        {scenes.length < MAX_SCENES && (
          <button
            type="button"
            onClick={addScene}
            title="Agregar escena"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '22px',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px dashed var(--pf-border-default)',
              color: 'var(--pf-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              padding: 0,
            }}
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {/* Fila 2 — Editor de la escena seleccionada */}
      {selected && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--pf-text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            Escena {selectedIdx + 1}
          </span>

          {/* Modo */}
          <select
            value={selected.mode}
            onChange={(e) => changeMode(selectedIdx, e.target.value as SceneMode)}
            title="Modo de la escena"
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'var(--pf-bg-secondary)',
              border: '1px solid var(--pf-border-subtle)',
              color: 'var(--pf-text-secondary)',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {availableModes(selectedIdx).map((m) => (
              <option key={m} value={m}>
                {MODE_LABEL[m]}
              </option>
            ))}
          </select>

          {/* Duración */}
          <select
            value={selected.durationSec}
            onChange={(e) => updateScene(selectedIdx, { durationSec: Number(e.target.value) })}
            title="Duración de la escena"
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'var(--pf-bg-secondary)',
              border: '1px solid var(--pf-border-subtle)',
              color: 'var(--pf-text-secondary)',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d}s
              </option>
            ))}
          </select>

          {/* Start uploader (first, o cut sin inherit) */}
          {(selected.mode === 'first' || (selected.mode === 'cut' && !selected.inheritStartFromPrev)) &&
            renderSceneFileChip(
              selected.startImage,
              (f) => updateScene(selectedIdx, { startImage: f }),
              'Start',
            )
          }

          {/* End uploader (siempre opcional) */}
          {renderSceneFileChip(
            selected.endImage,
            (f) => updateScene(selectedIdx, { endImage: f }),
            'End',
          )}

          {/* Audio uploader (siempre opcional) */}
          {renderSceneFileChip(
            selected.audioFile,
            (f) => updateScene(selectedIdx, { audioFile: f }),
            'Audio',
          )}

          {/* Toggle Match Audio (solo si hay audio) */}
          {selected.audioFile && (
            <label
              title="Ajustar la duración de la escena a la del audio"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 6,
                background: selected.matchAudioDur ? 'var(--pf-text-primary)' : 'var(--pf-bg-secondary)',
                color: selected.matchAudioDur ? 'var(--pf-bg-elevated)' : 'var(--pf-text-muted)',
                border: '1px solid ' + (selected.matchAudioDur ? 'var(--pf-text-primary)' : 'var(--pf-border-subtle)'),
                fontFamily: 'var(--pf-font-ui)', fontSize: '10px',
                fontWeight: 600, cursor: 'pointer', userSelect: 'none',
                lineHeight: 1,
              }}
            >
              <input
                type="checkbox"
                checked={selected.matchAudioDur}
                onChange={(e) => updateScene(selectedIdx, { matchAudioDur: e.target.checked })}
                style={{ display: 'none' }}
              />
              Match Audio
            </label>
          )}

          {/* Start heredado (info) */}
          {selected.mode === 'continue' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'var(--pf-bg-tertiary)',
                border: '1px solid var(--pf-border-subtle)',
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '10px',
                color: 'var(--pf-text-muted)',
              }}
            >
              <LinkIcon size={10} />
              Hereda escena {selectedIdx}
            </span>
          )}

          {/* Start manual (uploader, solo para first/cut con inherit=false) */}
          {selected.mode === 'cut' && selected.inheritStartFromPrev && (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'var(--pf-bg-tertiary)',
                border: '1px solid var(--pf-border-subtle)',
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '10px',
                color: 'var(--pf-text-muted)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={selected.inheritStartFromPrev}
                onChange={(e) => updateScene(selectedIdx, { inheritStartFromPrev: e.target.checked })}
                style={{ display: 'none' }}
              />
              <LinkIcon size={10} />
              Hereda fondo
            </label>
          )}

          {/* Delete */}
          {scenes.length > 1 && (
            <button
              type="button"
              onClick={() => removeScene(selectedIdx)}
              title="Eliminar escena"
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '22px',
                borderRadius: '6px',
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--pf-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#EF4444';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--pf-text-muted)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      {/* Footer info */}
      <div
        style={{
          fontFamily: 'var(--pf-font-ui)',
          fontSize: '10px',
          color: 'var(--pf-text-muted)',
          letterSpacing: '0.01em',
        }}
      >
        {scenes.length} {scenes.length === 1 ? 'escena' : 'escenas'}
        {' · '}
        {scenes.reduce((acc, s) => acc + s.durationSec, 0)}s
        {isFirst && selected.mode !== 'first' && (
          <span style={{ marginLeft: '8px', color: '#F59E0B' }}>
            · La primera escena no puede ser continuación
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(StoryboardStrip);
