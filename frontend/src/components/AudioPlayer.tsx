// src/components/AudioPlayer.tsx
// Reproductor de audio premium con waveform.
// Extrae los peaks con Web Audio API (sin librerías externas).
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  compact?: boolean;
  bars?: number;
  onReady?: (duration: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  compact = false,
  bars = 60,
  onReady,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // ── Extraer waveform con Web Audio API ──
  useEffect(() => {
    let cancelled = false;

    const loadWaveform = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(src);
        const arrayBuf = await res.arrayBuffer();
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new Ctx();
        // slice(0) porque decodeAudioData consume el buffer
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
        console.error("[AudioPlayer] Waveform error:", err);
        if (!cancelled) setPeaks(new Array(bars).fill(0.5));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadWaveform();
    return () => { cancelled = true; };
  }, [src, bars, onReady]);

  // ── Controles de reproducción ──
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((e) => console.error("[AudioPlayer] play error:", e));
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

  const handleSeek = (e: React.MouseEvent<SVGSVGElement>) => {
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

  // ── Geometría de la waveform ──
  const barWidth = compact ? 2 : 3;
  const barGap = compact ? 1.5 : 2;
  const totalWidth = bars * (barWidth + barGap) - barGap;
  const height = compact ? 28 : 44;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? "10px" : "14px",
        padding: compact ? "8px 10px" : "12px 16px",
        background: "var(--pf-bg-secondary, #FAFAFA)",
        border: "1px solid var(--pf-border-subtle, #F4F4F5)",
        borderRadius: "12px",
        width: "100%",
        boxSizing: "border-box",
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

      {/* Botón play/pause */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        aria-label={isPlaying ? "Pausar" : "Reproducir"}
        style={{
          flexShrink: 0,
          width: compact ? "30px" : "38px",
          height: compact ? "30px" : "38px",
          borderRadius: "50%",
          background: "var(--pf-text-primary, #0A0A0A)",
          color: "var(--pf-bg-elevated, #FFFFFF)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isLoading ? "wait" : "pointer",
          transition: "opacity 0.15s, transform 0.1s",
          opacity: isLoading ? 0.5 : 1,
          padding: 0,
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {isPlaying ? (
          <Pause size={compact ? 13 : 16} fill="currentColor" strokeWidth={0} />
        ) : (
          <Play
            size={compact ? 13 : 16}
            fill="currentColor"
            strokeWidth={0}
            style={{ marginLeft: "2px" }}
          />
        )}
      </button>

      {/* Waveform clickeable */}
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        preserveAspectRatio="none"
        onClick={handleSeek}
        style={{
          flex: 1,
          height: `${height}px`,
          cursor: "pointer",
          display: "block",
          color: "var(--pf-text-primary, #0A0A0A)",
          minWidth: 0,
        }}
      >
        {peaks.map((peak, i) => {
          const barHeight = Math.max(2, peak * height * 0.95);
          const x = i * (barWidth + barGap);
          const y = (height - barHeight) / 2;
          const isPast = i / bars <= progress;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={barWidth / 2}
              fill="currentColor"
              opacity={isPast ? 1 : 0.22}
            />
          );
        })}
      </svg>

      {/* Tiempos */}
      <span
        style={{
          flexShrink: 0,
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: compact ? "0.6875rem" : "0.75rem",
          fontWeight: 500,
          color: "var(--pf-text-secondary, #525252)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
      >
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
};

export default AudioPlayer;
