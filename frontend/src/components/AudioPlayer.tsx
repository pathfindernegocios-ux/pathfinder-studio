// src/components/AudioPlayer.tsx
//
// Reproductor de audio estilo "nota de voz" (Instagram / WhatsApp).
// Waveform minimalista con progreso cyan, play circular, duración.

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  /** Cantidad de barras del waveform. Default: 40. */
  bars?: number;
  onReady?: (duration: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  bars = 40,
  onReady,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Extraer waveform con Web Audio API
  useEffect(() => {
    let cancelled = false;

    const loadWaveform = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(src);
        const arrayBuf = await res.arrayBuffer();
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new Ctx();
        const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));

        const channel = audioBuf.getChannelData(0);
        const blockSize = Math.max(1, Math.floor(channel.length / bars));
        const newPeaks: number[] = [];
        for (let i = 0; i < bars; i++) {
          let sum = 0;
          const start = i * blockSize;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channel[start + j] || 0);
          }
          newPeaks.push(sum / blockSize);
        }

        await ctx.close();

        if (cancelled) return;
        const max = Math.max(...newPeaks, 0.0001);
        const normalized = newPeaks.map((p) => p / max);
        setPeaks(normalized);
        setDuration(audioBuf.duration);
        onReady?.(audioBuf.duration);
      } catch (err) {
        void 0;
        if (!cancelled) setPeaks(new Array(bars).fill(0.5));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadWaveform();
    return () => { cancelled = true; };
  }, [src, bars, onReady]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => void 0);
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && isFinite(audio.duration) && duration === 0) {
      setDuration(audio.duration);
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

  const progress = duration > 0 ? currentTime / duration : 0;
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
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Botón play circular */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        aria-label={isPlaying ? "Pausar" : "Reproducir"}
        style={{
          flexShrink: 0,
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: isLoading ? "rgba(34, 211, 238, 0.4)" : "var(--pf-text-primary)",
          color: "var(--pf-bg-elevated)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isLoading ? "wait" : "pointer",
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

      {/* Waveform */}
      <div
        onClick={handleSeek}
        style={{
          flex: 1,
          height: `${height}px`,
          cursor: "pointer",
          position: "relative",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: `${barGap}px`,
        }}
      >
        {peaks.map((peak, i) => {
          const barHeight = Math.max(3, peak * height * 0.9);
          const isPast = i / peaks.length <= progress;
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

      {/* Duración */}
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
        {formatTime(isPlaying || currentTime > 0 ? duration - currentTime : duration)}
      </span>
    </div>
  );
};

export default AudioPlayer;
