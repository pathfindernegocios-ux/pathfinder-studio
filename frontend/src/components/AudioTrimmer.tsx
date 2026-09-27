// src/components/AudioTrimmer.tsx
// Reproductor con trim para audios de referencia.
// El trim se hace en el frontend (Web Audio API) y el File recortado
// se entrega al padre — el notebook recibe el fragmento ya cortado.
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Scissors, RotateCcw } from "lucide-react";

interface AudioTrimmerProps {
  src: string;
  fileName: string;
  bars?: number;
  onApply: (trimmedFile: File, startSec: number, endSec: number) => void;
  onCancel: () => void;
}

// ── WAV encoder: convierte AudioBuffer a Blob WAV (PCM 16-bit) ──
function encodeWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 2;
  const dataSize = length * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

const AudioTrimmer: React.FC<AudioTrimmerProps> = ({
  src,
  fileName,
  bars = 90,
  onApply,
  onCancel,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);

  // ── Cargar y decodear audio ──
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(src);
        const buf = await res.arrayBuffer();
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        const decoded = await ctx.decodeAudioData(buf.slice(0));
        await ctx.close();
        if (cancelled) return;

        setAudioBuffer(decoded);
        setDuration(decoded.duration);
        setEndSec(decoded.duration);

        const channel = decoded.getChannelData(0);
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
        const max = Math.max(...newPeaks, 0.0001);
        setPeaks(newPeaks.map((p) => p / max));
      } catch (err) {
        console.error("[AudioTrimmer] decode error:", err);
        if (!cancelled) setPeaks(new Array(bars).fill(0.5));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [src, bars]);

  // ── Play con auto-stop en endSec ──
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      // Si estoy fuera del rango, arranco desde startSec
      if (audio.currentTime < startSec || audio.currentTime >= endSec) {
        audio.currentTime = startSec;
      }
      audio.play().catch((e) => console.error("[AudioTrimmer] play:", e));
    }
  }, [isPlaying, startSec, endSec]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    // Auto-stop al llegar al final del trim
    if (audio.currentTime >= endSec) {
      audio.pause();
      audio.currentTime = endSec;
    }
  };

  // ── Drag handles ──
  const handlePointerDown = (which: "start" | "end") => (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(which);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (!dragging || !containerRef.current || duration <= 0) return;

    const onMove = (e: PointerEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const sec = (x / rect.width) * duration;
      const minGap = 0.1;
      if (dragging === "start") {
        setStartSec(Math.min(sec, endSec - minGap));
      } else {
        setEndSec(Math.max(sec, startSec + minGap));
      }
    };
    const onUp = () => setDragging(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, duration, startSec, endSec]);

  // ── Aplicar trim ──
  const handleApply = async () => {
    if (!audioBuffer) return;
    const sr = audioBuffer.sampleRate;
    const startSample = Math.floor(startSec * sr);
    const endSample = Math.floor(endSec * sr);
    const length = endSample - startSample;
    if (length <= 0) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const trimmed = ctx.createBuffer(audioBuffer.numberOfChannels, length, sr);
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const srcData = audioBuffer.getChannelData(ch);
      const dstData = trimmed.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        dstData[i] = srcData[startSample + i];
      }
    }
    await ctx.close();

    const wavBlob = encodeWav(trimmed);
    const baseName = fileName.replace(/\.[^.]+$/, "");
    const trimmedFile = new File([wavBlob], `${baseName}_trimmed.wav`, {
      type: "audio/wav",
    });
    onApply(trimmedFile, startSec, endSec);
  };

  const handleReset = () => {
    setStartSec(0);
    setEndSec(duration);
  };

  const fmt = (s: number): string => {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startPct = duration > 0 ? (startSec / duration) * 100 : 0;
  const endPct = duration > 0 ? (endSec / duration) * 100 : 100;
  const playPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const barWidth = 2.5;
  const barGap = 1.5;
  const totalWidth = bars * (barWidth + barGap) - barGap;
  const height = 56;

  return (
    <div
      style={{
        marginTop: "8px",
        marginBottom: "8px",
        padding: "14px",
        background: "var(--pf-bg-secondary, #FAFAFA)",
        border: "1px solid var(--pf-border-default, #E5E5E5)",
        borderRadius: "12px",
        fontFamily: "var(--pf-font-ui, system-ui)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
          fontSize: "0.75rem",
          color: "var(--pf-text-secondary, #525252)",
        }}
      >
        <span style={{ fontWeight: 600 }}>{fileName}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          Recorte: {fmt(startSec)} – {fmt(endSec)}{" "}
          <span style={{ color: "var(--pf-text-muted, #A1A1AA)" }}>
            ({fmt(endSec - startSec)})
          </span>
        </span>
      </div>

      {/* Play + waveform */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={togglePlay}
          disabled={loading}
          style={{
            flexShrink: 0,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "var(--pf-text-primary, #0A0A0A)",
            color: "var(--pf-bg-elevated, #FFFFFF)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.5 : 1,
            padding: 0,
          }}
        >
          {isPlaying ? (
            <Pause size={15} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={15} fill="currentColor" strokeWidth={0} style={{ marginLeft: "2px" }} />
          )}
        </button>

        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: "relative",
            height: `${height}px`,
            minWidth: 0,
            userSelect: "none",
          }}
        >
          <svg
            viewBox={`0 0 ${totalWidth} ${height}`}
            preserveAspectRatio="none"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              color: "var(--pf-text-primary, #0A0A0A)",
            }}
          >
            {peaks.map((peak, i) => {
              const h = Math.max(3, peak * height * 0.9);
              const x = i * (barWidth + barGap);
              const y = (height - h) / 2;
              const inRange = i / bars >= startPct / 100 && i / bars <= endPct / 100;
              const isPast = i / bars <= playPct / 100;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={barWidth / 2}
                  fill="currentColor"
                  opacity={inRange ? (isPast ? 1 : 0.55) : 0.15}
                />
              );
            })}
          </svg>

          {/* Overlay zonas fuera de rango */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: `${startPct}%`,
              background: "rgba(0,0,0,0.08)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: `${100 - endPct}%`,
              background: "rgba(0,0,0,0.08)",
              pointerEvents: "none",
            }}
          />

          {/* Handle inicio */}
          <div
            onPointerDown={handlePointerDown("start")}
            style={{
              position: "absolute",
              top: -4,
              bottom: -4,
              left: `calc(${startPct}% - 8px)`,
              width: "16px",
              cursor: "ew-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              touchAction: "none",
            }}
          >
            <div
              style={{
                width: "4px",
                height: "100%",
                background: "var(--pf-text-primary, #0A0A0A)",
                borderRadius: "2px",
                boxShadow: "0 0 0 3px rgba(10,10,10,0.15)",
              }}
            />
          </div>

          {/* Handle fin */}
          <div
            onPointerDown={handlePointerDown("end")}
            style={{
              position: "absolute",
              top: -4,
              bottom: -4,
              left: `calc(${endPct}% - 8px)`,
              width: "16px",
              cursor: "ew-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              touchAction: "none",
            }}
          >
            <div
              style={{
                width: "4px",
                height: "100%",
                background: "var(--pf-text-primary, #0A0A0A)",
                borderRadius: "2px",
                boxShadow: "0 0 0 3px rgba(10,10,10,0.15)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Time display bajo waveform */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "6px",
          fontSize: "0.6875rem",
          color: "var(--pf-text-muted, #A1A1AA)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>

      {/* Sliders finos debajo (alternativa al drag) */}
      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--pf-text-muted, #A1A1AA)", textTransform: "uppercase", letterSpacing: "0.05em", width: "40px" }}>
            Inicio
          </span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.05}
            value={startSec}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setStartSec(Math.min(v, endSec - 0.1));
            }}
            style={{ flex: 1, accentColor: "var(--pf-text-primary, #0A0A0A)" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--pf-text-muted, #A1A1AA)", textTransform: "uppercase", letterSpacing: "0.05em", width: "40px" }}>
            Fin
          </span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.05}
            value={endSec}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setEndSec(Math.max(v, startSec + 0.1));
            }}
            style={{ flex: 1, accentColor: "var(--pf-text-primary, #0A0A0A)" }}
          />
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
        <button
          onClick={handleReset}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 12px",
            background: "transparent",
            border: "1px solid var(--pf-border-default, #E5E5E5)",
            borderRadius: "8px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "var(--pf-text-secondary, #525252)",
            cursor: "pointer",
          }}
        >
          <RotateCcw size={12} />
          Reset
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "7px 14px",
            background: "transparent",
            border: "1px solid var(--pf-border-default, #E5E5E5)",
            borderRadius: "8px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "var(--pf-text-secondary, #525252)",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleApply}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            background: "var(--pf-text-primary, #0A0A0A)",
            color: "var(--pf-bg-elevated, #FFFFFF)",
            border: "none",
            borderRadius: "8px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          <Scissors size={12} />
          Aplicar recorte
        </button>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
        onTimeUpdate={handleTimeUpdate}
        preload="metadata"
      />
    </div>
  );
};

export default AudioTrimmer;
