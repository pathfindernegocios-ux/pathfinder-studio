import { useRef, useState, useEffect } from "react";
import { palette, labelStyle } from "../styles/tokens";
import { formatMMSS } from "../lib/helpers";

async function audioBufferToWavBlob(buffer: AudioBuffer): Promise<Blob> {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferOut = new ArrayBuffer(44 + dataSize);
  const view = new DataView(bufferOut);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([bufferOut], { type: "audio/wav" });
}

async function trimAudioFile(file: File, startSec: number, endSec: number): Promise<File> {
  const AudioCtx: typeof AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    const sampleRate = decoded.sampleRate;
    const startSample = Math.max(0, Math.floor(startSec * sampleRate));
    const endSample = Math.min(decoded.length, Math.floor(endSec * sampleRate));
    const frameCount = Math.max(1, endSample - startSample);

    const trimmed = ctx.createBuffer(decoded.numberOfChannels, frameCount, sampleRate);
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      trimmed.copyToChannel(decoded.getChannelData(ch).subarray(startSample, endSample), ch);
    }

    const wavBlob = await audioBufferToWavBlob(trimmed);
    return new File([wavBlob], "audio_recortado.wav", { type: "audio/wav" });
  } finally {
    ctx.close().catch(() => {});
  }
}

export function AudioChip({
  audioName,
  audioPreview,
  matchAudioDur,
  onToggleMatchDur,
  onClear,
  onTrimmed,
}: {
  audioName: string;
  audioPreview: string;
  matchAudioDur: boolean;
  onToggleMatchDur: (v: boolean) => void;
  onClear: () => void;
  onTrimmed: (file: File) => void;
}) {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimOpen, setTrimOpen] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimError, setTrimError] = useState<string | null>(null);

  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setTrimOpen(false);
    setTrimError(null);
  }, [audioPreview]);

  const togglePlay = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  };

  const seekFromClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioElRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = frac * duration;
    setCurrent(frac * duration);
  };

  const openTrim = () => {
    if (!trimOpen) {
      setTrimStart(0);
      setTrimEnd(duration || 0);
    }
    setTrimOpen((v) => !v);
  };

  const handleApplyTrim = async () => {
    const el = audioElRef.current;
    if (!el || !audioPreview) return;
    if (trimEnd - trimStart < 0.2) {
      setTrimError("El recorte es demasiado corto.");
      return;
    }
    setIsTrimming(true);
    setTrimError(null);
    try {
      const res = await fetch(audioPreview);
      const blob = await res.blob();
      const originalFile = new File([blob], "audio_original", { type: blob.type || "audio/mpeg" });
      const trimmedFile = await trimAudioFile(originalFile, trimStart, trimEnd);
      onTrimmed(trimmedFile);
      setTrimOpen(false);
    } catch (err) {
      setTrimError("No se pudo recortar este audio.");
    } finally {
      setIsTrimming(false);
    }
  };

  const progressFrac = duration > 0 ? current / duration : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "7px 12px 7px 8px",
          borderRadius: 999,
          border: `1px solid ${palette.border}`,
          background: palette.surfaceSoft,
        }}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pausar" : "Reproducir"}
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "none",
            background: palette.accentDim,
            color: palette.accentStrong,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {playing ? "❚❚" : "▶"}
        </button>

        <div
          onClick={seekFromClick}
          style={{
            width: 84,
            height: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${Math.round(progressFrac * 100)}%`,
              height: "100%",
              borderRadius: 999,
              background: palette.accent,
            }}
          />
        </div>

        <span style={{ fontSize: 11, color: palette.inkFaint, minWidth: 74, whiteSpace: "nowrap" }}>
          {formatMMSS(current)} / {formatMMSS(duration)}
        </span>

        <span
          title={audioName}
          style={{
            fontSize: 12,
            color: palette.inkMuted,
            maxWidth: 90,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {audioName}
        </span>

        <button
          type="button"
          onClick={openTrim}
          title="Recortar audio"
          style={{
            border: "none",
            background: "transparent",
            color: trimOpen ? palette.accentStrong : palette.inkFaint,
            cursor: "pointer",
            fontSize: 13,
            padding: 2,
          }}
        >
          ✂
        </button>

        <button
          type="button"
          onClick={onClear}
          aria-label="Quitar audio"
          title="Quitar"
          style={{
            border: "none",
            background: "transparent",
            color: palette.inkFaint,
            cursor: "pointer",
            fontSize: 12,
            padding: 2,
          }}
        >
          ✕
        </button>

        <audio
          ref={audioElRef}
          src={audioPreview}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            setDuration(Number.isFinite(d) ? d : 0);
            setTrimEnd((prev) => (prev ? prev : Number.isFinite(d) ? d : 0));
          }}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          style={{ display: "none" }}
        />
      </div>

      <label
        title="El video se generará con la misma duración que este audio"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 12,
          color: matchAudioDur ? palette.accentStrong : palette.inkFaint,
          cursor: "pointer",
          paddingLeft: 4,
        }}
      >
        <input
          type="checkbox"
          checked={matchAudioDur}
          onChange={(e) => onToggleMatchDur(e.target.checked)}
          style={{ accentColor: palette.accent, width: 12, height: 12 }}
        />
        Ajustar duración del video al audio
      </label>

      {trimOpen && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: `1px solid ${palette.border}`,
            background: "rgba(255,255,255,0.02)",
            maxWidth: 340,
          }}
        >
          <div style={{ fontSize: 11.5, color: palette.inkFaint, marginBottom: 10 }}>
            Recortar de {formatMMSS(trimStart)} a {formatMMSS(trimEnd)} (de {formatMMSS(duration)} totales)
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>Inicio</label>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={trimStart}
              onChange={(e) => {
                const v = Math.min(parseFloat(e.target.value), trimEnd - 0.2);
                setTrimStart(Math.max(0, v));
              }}
              style={{ width: "100%", accentColor: palette.accent }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>Fin</label>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={trimEnd}
              onChange={(e) => {
                const v = Math.max(parseFloat(e.target.value), trimStart + 0.2);
                setTrimEnd(Math.min(duration || 0, v));
              }}
              style={{ width: "100%", accentColor: palette.accent }}
            />
          </div>

          {trimError && (
            <p style={{ color: palette.danger, fontSize: 12, marginBottom: 8 }}>{trimError}</p>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={handleApplyTrim}
              disabled={isTrimming}
              className="pf-btn-primary"
              style={{ padding: "8px 16px", fontSize: 12.5 }}
            >
              {isTrimming ? "Recortando..." : "Aplicar recorte"}
            </button>
            <button
              type="button"
              onClick={() => setTrimOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: palette.inkFaint,
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}