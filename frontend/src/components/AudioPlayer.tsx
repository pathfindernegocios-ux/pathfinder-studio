// src/components/AudioPlayer.tsx
//
// Reproductor de audio estilo "nota de voz".
// - Waveform seeded (deterministica por URL, sin descargar el archivo).
// - Precarga el blob en background con % visible sobre el boton play.
// - Al llegar al 100%, reproduce con blob local (fluido, sin trabas).
// - Si falla, muestra boton de reintento.

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { getCachedAudio, fetchAudioBlob } from "../lib/audioBlobCache";

interface AudioPlayerProps {
  src: string;
  /** Cantidad de barras del waveform. Default: 40. */
  bars?: number;
  onReady?: (duration: number) => void;
}

/** Hash determinista de un string a un array de peaks [0.3, 1.0]. */
function seededPeaks(seed: string, count: number): number[] {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) + seed.charCodeAt(i);
    h = h & 0xffffffff;
  }
  const peaks: number[] = [];
  let x = Math.abs(h) || 1;
  for (let i = 0; i < count; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const v = (x % 1000) / 1000;
    const shaped = 0.3 + v * 0.7;
    peaks.push(shaped);
  }
  return peaks;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  bars = 40,
  onReady,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const [peaks, setPeaks] = useState<number[]>(() => seededPeaks(src, bars));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // Regenerar peaks si cambia la URL
  useEffect(() => {
    setPeaks(seededPeaks(src, bars));
  }, [src, bars]);

  // Cargar el blob al montar (con progreso visible)
  useEffect(() => {
    let cancelled = false;

    // Limpiar blob URL previo si cambia el src
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
      setBlobUrl(null);
    }
    setProgress(0);
    setLoadError(false);
    setDuration(0);
    setCurrentTime(0);

    const cached = getCachedAudio(src);
    if (cached) {
      const url = URL.createObjectURL(cached);
      blobUrlRef.current = url;
      setBlobUrl(url);
      setProgress(100);
      return;
    }

    const load = async () => {
      try {
        const blob = await fetchAudioBlob(src, {
          timeoutMs: 120000,
          onProgress: (pct) => { if (!cancelled) setProgress(pct); },
        });
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
        setProgress(100);
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setProgress(0);
        }
      }
    };
    load();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src]);

  const retryLoad = useCallback(() => {
    setLoadError(false);
    setProgress(0);
    const load = async () => {
      try {
        const blob = await fetchAudioBlob(src, {
          timeoutMs: 120000,
          onProgress: (pct) => setProgress(pct),
        });
        const url = URL.createObjectURL(blob);
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = url;
        setBlobUrl(url);
        setProgress(100);
      } catch {
        setLoadError(true);
      }
    };
    load();
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !blobUrl) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => void 0);
    }
  }, [isPlaying, blobUrl]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration);
      onReady?.(audio.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (secs: number): string => {
    if (!isFinite(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isReady = !!blobUrl && progress === 100;
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const barWidth = 2.5;
  const barGap = 2;
  const height = 32;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        background: "rgba(139, 92, 246, 0.05)",
        border: "1px solid rgba(139, 92, 246, 0.2)",
        borderRadius: "9999px",
        boxShadow: "0 4px 20px -8px rgba(139, 92, 246, 0.3)",
      }}
    >
      <audio
        ref={audioRef}
        src={blobUrl || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="auto"
      />

      {/* Boton play / progreso / reintento */}
      {loadError ? (
        <button
          onClick={retryLoad}
          aria-label="Reintentar"
          title="No se pudo cargar. Click para reintentar."
          style={{
            flexShrink: 0,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.15)",
            color: "#F87171",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <RotateCcw size={15} />
        </button>
      ) : !isReady ? (
        <div
          aria-label={`Cargando ${progress}%`}
          title={`Cargando audio... ${progress}%`}
          style={{
            flexShrink: 0,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "var(--pf-text-primary)",
            color: "var(--pf-bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "wait",
            padding: 0,
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Ring de progreso */}
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
          >
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke="rgba(139, 92, 246, 0.25)"
              strokeWidth="2"
            />
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeDasharray={`${(progress / 100) * 94.2} 94.2`}
              style={{ transition: "stroke-dasharray 0.3s ease" }}
            />
          </svg>
          <span style={{ position: "relative", zIndex: 1 }}>
            {progress > 0 ? `${progress}%` : "..."}
          </span>
        </div>
      ) : (
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
          style={{
            flexShrink: 0,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "var(--pf-text-primary)",
            color: "var(--pf-bg-elevated)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "transform 0.1s, background 0.15s",
            padding: 0,
            boxShadow: isPlaying ? "0 0 16px -2px rgba(34, 211, 238, 0.6)" : "none",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isPlaying ? (
            <Pause size={15} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={15} fill="currentColor" strokeWidth={0} style={{ marginLeft: "2px" }} />
          )}
        </button>
      )}

      {/* Waveform (siempre visible) */}
      <div
        onClick={isReady ? handleSeek : undefined}
        style={{
          flex: 1,
          height: `${height}px`,
          cursor: isReady ? "pointer" : "default",
          position: "relative",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: `${barGap}px`,
          opacity: isReady ? 1 : 0.5,
          transition: "opacity 0.3s ease",
        }}
      >
        {peaks.map((peak, i) => {
          const barHeight = Math.max(3, peak * height * 0.9);
          const isPast = i / peaks.length <= progressRatio;
          return (
            <div
              key={i}
              className={isPast ? "pf-audio-bar-past" : "pf-audio-bar-future"}
              style={{
                flex: "1 1 0",
                height: `${barHeight}px`,
                borderRadius: `${barWidth}px`,
                transition: "background 0.12s, opacity 0.12s",
              }}
            />
          );
        })}
      </div>

      {/* Duracion */}
      <span
        style={{
          flexShrink: 0,
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "var(--pf-text-secondary)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
      >
        {isReady
          ? formatTime(isPlaying || currentTime > 0 ? duration - currentTime : duration)
          : "..."
        }
      </span>
    </div>
  );
};

export default AudioPlayer;
