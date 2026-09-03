import { useState, useRef, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";
import { Client } from "@gradio/client";
import { supabase } from "./lib/supabaseClient";

type Status = "STARTING" | "READY" | "BUSY" | "ERROR" | "UNKNOWN";

const DURATION_OPTIONS = [
  "2 Seconds (49 frames)",
  "3 Seconds (73 frames)",
  "5 Seconds (121 frames)",
  "8 Seconds (193 frames)",
  "10 Seconds (241 frames)",
  "15 Seconds (361 frames)",
  "20 Seconds (481 frames)",
  "25 Seconds (601 frames)",
  "30 Seconds (721 frames)",
];

const RESOLUTION_OPTIONS = ["1080p", "720p", "540p", "480p"];

// Misma lógica que get_resolution() en el backend (run_ltx_audio.py):
// base_resolutions + ratio, luego snap a múltiplos de 32.
const BASE_RESOLUTIONS: Record<string, number> = {
  "1080p": 1088,
  "720p": 704,
  "540p": 544,
  "480p": 480,
};

interface AspectOption {
  label: string; // valor que espera el backend (no tocar)
  short: string; // etiqueta visual
  ratio: number; // width / height
}

const ASPECT_RATIO_OPTIONS: AspectOption[] = [
  { label: "16:9 Landscape", short: "16:9", ratio: 16 / 9 },
  { label: "4:3 Standard", short: "4:3", ratio: 4 / 3 },
  { label: "1:1 Square", short: "1:1", ratio: 1 },
  { label: "3:4 Portrait", short: "3:4", ratio: 3 / 4 },
  { label: "9:16 Portrait", short: "9:16", ratio: 9 / 16 },
];

// ---- Cadencia de polling (ver getClient(): comparten UNA sola conexión) ----
const STATUS_POLL_MS = 5000;
const GENERATION_POLL_MS = 2000;
const LOGS_POLL_MS = 2500;

function snap32(v: number): number {
  return Math.floor(v / 32) * 32;
}

function computeDims(resolution: string, ratio: number): { width: number; height: number } {
  const base = BASE_RESOLUTIONS[resolution] ?? 704;
  let width: number;
  let height: number;
  if (ratio >= 1) {
    height = base;
    width = base * ratio;
  } else {
    width = base;
    height = base / ratio;
  }
  return { width: snap32(width), height: snap32(height) };
}

function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// mm:ss para la duración del audio (mucho más corta que una generación)
function formatMMSS(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return "0:00";
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ---- Recorte de audio en el navegador (Web Audio API) ----
// No agrega ningún parámetro nuevo al backend: el resultado sigue siendo
// un simple File que viaja como "audioFile", igual que antes del recorte.
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2; // 16-bit PCM
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
  view.setUint16(20, 1, true); // PCM
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

    const wavBlob = audioBufferToWavBlob(trimmed);
    return new File([wavBlob], "audio_recortado.wav", { type: "audio/wav" });
  } finally {
    ctx.close().catch(() => {});
  }
}

interface GenerationInfo {
  id?: string;
  status?: string;
  progress?: number;
  stage?: string;
  started_at?: number;
  finished_at?: number;
  output_url?: string;
  error?: string;
  cancellable?: boolean;
}

interface LogEntry {
  seq: number;
  ts: number;
  msg: string;
}

// ============================================================
// Identidad visual — Pathfinder Studio
// ============================================================

const fontDisplay = "'Bricolage Grotesque', 'Inter', sans-serif";
const fontUI = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const palette = {
  void: "#07080A",
  voidGradient:
    "radial-gradient(circle at 15% -10%, rgba(139,195,74,0.07), transparent 40%), radial-gradient(circle at 100% 0%, rgba(139,195,74,0.04), transparent 45%), radial-gradient(circle at 50% 120%, rgba(255,255,255,0.02), transparent 50%), #07080A",
  surface: "rgba(24,26,23,0.55)",
  surfaceStrong: "rgba(14,15,13,0.78)",
  surfaceSoft: "rgba(255,255,255,0.035)",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)",
  ink: "#F3F5F1",
  inkMuted: "#9BA39A",
  inkFaint: "#5C645C",
  accent: "#8BC34A",
  accentStrong: "#A6DB6B",
  accentDim: "rgba(139,195,74,0.14)",
  danger: "#E5484D",
  dangerDim: "rgba(229,72,77,0.14)",
};

const NAV_ITEMS: { key: string; label: string; glyph: string; enabled: boolean }[] = [
  { key: "studio", label: "Studio", glyph: "◆", enabled: true },
  { key: "projects", label: "Projects", glyph: "▤", enabled: false },
  { key: "generations", label: "Generations", glyph: "▶", enabled: false },
  { key: "assets", label: "Assets", glyph: "◫", enabled: false },
  { key: "academy", label: "Academy", glyph: "◐", enabled: false },
  { key: "station", label: "Station", glyph: "●", enabled: false },
  { key: "settings", label: "Settings", glyph: "⚙", enabled: false },
];

const glass: React.CSSProperties = {
  background: palette.surface,
  border: `1px solid ${palette.border}`,
  borderRadius: 20,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
};

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${palette.border}`,
  borderRadius: 12,
  padding: "11px 14px",
  color: palette.ink,
  fontFamily: fontUI,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 500,
  color: palette.inkMuted,
};

const pillButton = (active: boolean): React.CSSProperties => ({
  padding: "8px 15px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 500,
  fontFamily: fontUI,
  cursor: "pointer",
  border: `1px solid ${active ? palette.accent : palette.border}`,
  background: active ? palette.accentDim : palette.surfaceSoft,
  color: active ? palette.accentStrong : palette.inkMuted,
  transition: "all 0.15s ease",
});

function ReferenceChip({
  inputId,
  inputRef,
  onChange,
  preview,
  label,
  emphasized,
  onOpen,
  onClear,
}: {
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  preview: string | null;
  label: string;
  emphasized?: boolean;
  onOpen: () => void;
  onClear: () => void;
}) {
  const size = emphasized ? 56 : 48;
  return (
    <div style={{ position: "relative" }}>
      {preview ? (
        <div
          onClick={onOpen}
          title={`Ver ${label.toLowerCase()} completa`}
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            overflow: "hidden",
            cursor: "zoom-in",
            border: `1px solid ${palette.borderStrong}`,
          }}
        >
          <img src={preview} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <label
          htmlFor={inputId}
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            border: `1px dashed ${palette.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: palette.inkFaint,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ＋
        </label>
      )}
      <input id={inputId} type="file" accept="image/*" ref={inputRef} onChange={onChange} style={{ display: "none" }} />
      {preview && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Quitar ${label.toLowerCase()}`}
          title="Quitar"
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(7,8,10,0.9)",
            color: palette.ink,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
      <div style={{ fontSize: 10.5, color: palette.inkFaint, textAlign: "center", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ============================================================
// Chip de audio — reproducción propia (sin <audio controls> nativo)
// + recorte opcional. El File final sigue viajando como "audioFile",
// no se agrega ningún parámetro nuevo al backend.
// ============================================================
function AudioChip({
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

  // Nueva fuente de audio -> reiniciar estado de reproducción/recorte
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

function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);

  const [gradioUrl, setGradioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("UNKNOWN");

  const [imageStartFile, setImageStartFile] = useState<File | null>(null);
  const [imageStartPreview, setImageStartPreview] = useState<string | null>(null);
  const [imageEndFile, setImageEndFile] = useState<File | null>(null);
  const [imageEndPreview, setImageEndPreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState<string>("");
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string>("");
  const [seed, setSeed] = useState<number>(-1);
  const [duration, setDuration] = useState<string>("5 Seconds (121 frames)");
  const [resolution, setResolution] = useState<string>("720p");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9 Landscape");
  const [guideScale, setGuideScale] = useState<number>(4.0);
  const [matchAudioDur, setMatchAudioDur] = useState<boolean>(false);

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generationInfo, setGenerationInfo] = useState<GenerationInfo | null>(null);

  // Panel de parámetros (colapsable, en vez de todo apilado)
  const [paramsOpen, setParamsOpen] = useState<boolean>(false);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [logsOpen, setLogsOpen] = useState<boolean>(false);
  const [stationDetailsOpen, setStationDetailsOpen] = useState<boolean>(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState<boolean>(false);
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const [hasEnteredStudio, setHasEnteredStudio] = useState<boolean>(false);

  const [nowTick, setNowTick] = useState<number>(Date.now());

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const endFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const lastLogSeqRef = useRef<number>(0);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Marca de tiempo local del click en "Crear video". Se usa para descartar
  // snapshots de /generation_status que pertenezcan a una generación anterior
  // (ver pollGeneration más abajo).
  const generationStartRef = useRef<number>(0);

  const clientPromiseRef = useRef<{ url: string; promise: Promise<Client> } | null>(null);

  const closeClientRef = (entry: { url: string; promise: Promise<Client> } | null) => {
    if (!entry) return;
    entry.promise
      .then((c) => {
        (c as any).close?.();
      })
      .catch(() => {
        /* si nunca llegó a conectar, no hay nada que cerrar */
      });
  };

  const getClient = useCallback(async (): Promise<Client | null> => {
    if (!gradioUrl) return null;

    if (clientPromiseRef.current?.url === gradioUrl) {
      try {
        return await clientPromiseRef.current.promise;
      } catch {
        if (clientPromiseRef.current?.url === gradioUrl) clientPromiseRef.current = null;
      }
    }

    if (clientPromiseRef.current && clientPromiseRef.current.url !== gradioUrl) {
      closeClientRef(clientPromiseRef.current);
    }

    const promise = Client.connect(gradioUrl).catch((err) => {
      if (clientPromiseRef.current?.url === gradioUrl) clientPromiseRef.current = null;
      throw err;
    });
    clientPromiseRef.current = { url: gradioUrl, promise };
    return promise;
  }, [gradioUrl]);

  useEffect(() => {
    return () => {
      const entry = clientPromiseRef.current;
      clientPromiseRef.current = null;
      closeClientRef(entry);
    };
  }, [gradioUrl]);

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionUptime, setSessionUptime] = useState<string>("00:00:00");

  useEffect(() => {
    if (gradioUrl && status === "READY") {
      setSessionStartTime(Date.now());
    }
  }, [gradioUrl, status]);

  useEffect(() => {
    if (!sessionStartTime) return;
    const update = () => {
      const elapsed = Date.now() - sessionStartTime;
      const h = String(Math.floor(elapsed / 3600000)).padStart(2, "0");
      const m = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
      setSessionUptime(`${h}:${m}:${s}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error) setProfile(data);
  }

  useEffect(() => {
    if (!profile?.station_id) return;

    const fetchRuntime = async () => {
      const { data, error } = await supabase
        .from("runtimes")
        .select("gradio_url")
        .eq("station_id", profile.station_id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setGradioUrl(data[0].gradio_url);
      }
    };

    fetchRuntime();
    const interval = setInterval(fetchRuntime, 5000);
    return () => clearInterval(interval);
  }, [profile?.station_id]);

  useEffect(() => {
    if (!gradioUrl) return;

    let cancelled = false;
    const pollStatus = async () => {
      try {
        const client = await getClient();
        if (!client || cancelled) return;
        const result = await client.predict("/status", []);
        if (!cancelled) {
          const value = Array.isArray(result.data) ? result.data[0] : result.data;
          setStatus((value as Status) ?? "UNKNOWN");
        }
      } catch {
        // mantener último estado conocido
      }
    };

    pollStatus();
    const intervalId = setInterval(pollStatus, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [gradioUrl, getClient]);

  // Polling de progreso de generación.
  // IMPORTANTE: justo después de pulsar "Crear video", el backend puede
  // tardar en reiniciar su estado global (la llamada a /generate puede
  // quedar encolada detrás de otras peticiones). Si en ese instante llega
  // una respuesta de /generation_status, puede traer todavía el snapshot de
  // la generación ANTERIOR (p.ej. "complete" con un tiempo transcurrido que
  // no corresponde a esta corrida). Para evitar ese salto falso a
  // "completado", se descarta cualquier snapshot cuyo started_at sea
  // anterior al momento en que se pulsó el botón.
  useEffect(() => {
    if (!isLoading || !gradioUrl) return;

    let cancelled = false;
    const pollGeneration = async () => {
      try {
        const client = await getClient();
        if (!client || cancelled) return;
        const result = await client.predict("/generation_status", []);
        if (!cancelled) {
          const data = Array.isArray(result.data) ? result.data[0] : result.data;
          const info = data as GenerationInfo;
          if (info?.started_at != null && info.started_at + 1 < generationStartRef.current) {
            return; // snapshot de una generación anterior: se ignora
          }
          setGenerationInfo(info);
        }
      } catch {
        // silencioso
      }
    };

    pollGeneration();
    const interval = setInterval(pollGeneration, GENERATION_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoading, gradioUrl, getClient]);

  useEffect(() => {
    if (!isLoading || !gradioUrl) return;

    let cancelled = false;
    const pollLogs = async () => {
      try {
        const client = await getClient();
        if (!client || cancelled) return;
        const result = await client.predict("/logs", [lastLogSeqRef.current]);
        if (!cancelled) {
          const entries = (Array.isArray(result.data) ? result.data[0] : result.data) as
            | LogEntry[]
            | undefined;
          if (entries && entries.length > 0) {
            lastLogSeqRef.current = entries[entries.length - 1].seq;
            setLogs((prev) => [...prev, ...entries].slice(-400));
          }
        }
      } catch {
        // silencioso
      }
    };

    pollLogs();
    const interval = setInterval(pollLogs, LOGS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoading, gradioUrl, getClient]);

  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLoading]);

  useEffect(() => {
    if (logsOpen && diagnosticsOpen) {
      logsEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [logs, logsOpen, diagnosticsOpen]);

  useEffect(() => {
    if (isLoading) setParamsOpen(false);
  }, [isLoading]);

  async function handleAuth() {
    setAuthError(null);
    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else setAuthError("Revisa tu correo para confirmar la cuenta (si está activado).");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setGradioUrl(null);
    setStatus("UNKNOWN");
    setSessionStartTime(null);
    setSessionUptime("00:00:00");
    setHasEnteredStudio(false);
  }

  const handleDownloadNotebook = async () => {
    setErrorMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setErrorMsg("No hay sesión activa. Inicia sesión.");
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        setErrorMsg("Falta VITE_SUPABASE_URL en el entorno.");
        return;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/generate-notebook`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setErrorMsg(err?.error || `Error ${res.status}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notebook_${profile?.station_id || "personal"}.ipynb`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      setErrorMsg("No se pudo descargar el notebook.");
    }
  };

  const handleStartFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageStartFile(file);
    setVideoSrc(null);
    setErrorMsg(null);
    setImageStartPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleEndFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageEndFile(file);
    setImageEndPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAudioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAudioFile(file);
    setAudioName(file ? file.name : "");
    setAudioPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearStartFile = () => {
    setImageStartFile(null);
    setImageStartPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearEndFile = () => {
    setImageEndFile(null);
    setImageEndPreview(null);
    if (endFileInputRef.current) endFileInputRef.current.value = "";
  };

  const clearAudioFile = () => {
    setAudioFile(null);
    setAudioName("");
    setAudioPreview(null);
    setMatchAudioDur(false);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const handleAudioTrimmed = (file: File) => {
    setAudioFile(file);
    setAudioName(file.name);
    setAudioPreview(URL.createObjectURL(file));
  };

  const handleGenerate = async () => {
    if (!imageStartFile || !prompt || status !== "READY" || !gradioUrl) return;

    const localStart = Date.now() / 1000;
    generationStartRef.current = localStart;

    setIsLoading(true);
    setErrorMsg(null);
    setVideoSrc(null);
    setStatusMsg(null);
    setLogs([]);
    lastLogSeqRef.current = 0;
    setGenerationInfo({ status: "preparing", progress: 0, stage: "preparing", started_at: localStart });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setErrorMsg("No hay sesión activa. Inicia sesión.");
        return;
      }

      const client = await getClient();
      if (!client) {
        setErrorMsg("No se pudo conectar con el runtime.");
        return;
      }

      const result = await client.predict("/generate", [
        prompt,
        imageStartFile,
        imageEndFile || undefined,
        audioFile || undefined,
        seed,
        duration,
        resolution,
        aspectRatio,
        guideScale,
        matchAudioDur,
        token,
      ]);

      const data = result.data as unknown[];
      const videoData = data[0];
      const statusText = data[1] as string;

      let url: string | null = null;
      if (typeof videoData === "string") {
        url = videoData;
      } else if (videoData && typeof videoData === "object") {
        const maybe = videoData as { url?: string; video?: { url?: string } };
        url = maybe.url ?? maybe.video?.url ?? null;
      }

      if (url) setVideoSrc(url);
      else setErrorMsg("No se devolvió un video válido.");
      if (statusText) setStatusMsg(statusText);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al generar video.");
    } finally {
      setIsLoading(false);
      setGenerationInfo((prev) => (prev ? { ...prev } : prev));
    }
  };

  const handleCancel = async () => {
    if (!gradioUrl || isCancelling) return;
    setIsCancelling(true);
    try {
      const client = await getClient();
      if (!client) {
        setErrorMsg("No se pudo conectar con el runtime.");
        return;
      }
      const result = await client.predict("/cancel", []);
      const msg = Array.isArray(result.data) ? result.data[0] : result.data;
      if (typeof msg === "string") setStatusMsg(msg);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo enviar la cancelación.");
    } finally {
      setIsCancelling(false);
    }
  };

  const statusColor: Record<Status, string> = {
    STARTING: "#E0B84B",
    READY: palette.accent,
    BUSY: "#6FA8DC",
    ERROR: palette.danger,
    UNKNOWN: palette.inkFaint,
  };

  const statusLabel: Record<Status, string> = {
    STARTING: "Preparando Pathfinder",
    READY: "Lista para crear",
    BUSY: "Creando",
    ERROR: "No se pudo completar la creación",
    UNKNOWN: "Conexión no disponible",
  };

  const isButtonDisabled =
    status !== "READY" || isLoading || !imageStartFile || !prompt.trim() || !gradioUrl;

  const nowSec = nowTick / 1000;
  const progressFrac = Math.min(1, Math.max(0, generationInfo?.progress ?? 0));

  const liveElapsedSec =
    isLoading && generationInfo?.started_at ? Math.max(0, nowSec - generationInfo.started_at) : null;

  const remainingSec =
    isLoading && generationInfo?.started_at && progressFrac > 0.03 && progressFrac < 1
      ? Math.max(0, liveElapsedSec! / progressFrac - liveElapsedSec!)
      : null;

  const completedDurationSec =
    generationInfo?.status === "complete" && generationInfo.started_at && generationInfo.finished_at
      ? generationInfo.finished_at - generationInfo.started_at
      : null;

  const backendError =
    generationInfo?.status === "error" && generationInfo.error ? generationInfo.error : null;

  const canCancel =
    isLoading &&
    (generationInfo?.cancellable ?? true) &&
    generationInfo?.status !== "cancelled" &&
    generationInfo?.status !== "complete";

  // ============================================================
  // Pantalla de autenticación
  // ============================================================
  if (!session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: palette.voidGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontUI,
          padding: 16,
        }}
      >
        <style>{globalStyleSheet}</style>
        <div style={{ ...glass, width: "100%", maxWidth: 400, padding: "40px 36px" }}>
          <div style={{ marginBottom: 30 }}>
            <div
              style={{
                fontFamily: fontDisplay,
                fontSize: 28,
                fontWeight: 600,
                color: palette.ink,
                letterSpacing: -0.5,
              }}
            >
              Pathfinder
            </div>
            <div style={{ fontSize: 14, color: palette.inkMuted, marginTop: 6 }}>
              {authMode === "login" ? "Entra para seguir creando." : "Crea tu cuenta en Pathfinder."}
            </div>
          </div>

          <label style={labelStyle}>Correo electrónico</label>
          <input
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputBase, marginBottom: 14 }}
          />
          <label style={labelStyle}>Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputBase, marginBottom: 22 }}
          />
          <button onClick={handleAuth} className="pf-btn-primary" style={{ width: "100%" }}>
            {authMode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
          <button
            onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
            style={{
              background: "none",
              border: "none",
              color: palette.inkMuted,
              cursor: "pointer",
              width: "100%",
              marginTop: 16,
              fontSize: 13,
              fontFamily: fontUI,
            }}
          >
            {authMode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
          {authError && (
            <p style={{ color: palette.danger, fontSize: 13, marginTop: 14, textAlign: "center" }}>{authError}</p>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // Pantalla de bienvenida — puerta visual antes del Studio
  // ============================================================
  if (!hasEnteredStudio) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: palette.voidGradient,
          fontFamily: fontUI,
          color: palette.ink,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <style>{globalStyleSheet}</style>
        <div className="pf-intro-glow" aria-hidden="true" />

        <div style={{ padding: "28px 36px", fontSize: 14, color: palette.inkMuted, letterSpacing: 0.2 }}>
          Pathfinder
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 24px",
            position: "relative",
          }}
        >
          <h1
            style={{
              fontFamily: fontDisplay,
              fontWeight: 600,
              fontSize: "clamp(32px, 5vw, 56px)",
              letterSpacing: -1,
              lineHeight: 1.1,
              margin: 0,
              maxWidth: 720,
            }}
          >
            ¿Qué vamos a crear hoy?
          </h1>
          <p
            style={{
              marginTop: 18,
              fontSize: 16,
              color: palette.inkMuted,
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            Escribe una idea, agrega una imagen y Pathfinder la convierte en video con sonido.
          </p>
          <button
            onClick={() => setHasEnteredStudio(true)}
            className="pf-btn-primary"
            style={{ marginTop: 34, padding: "14px 30px", fontSize: 15 }}
          >
            Entrar al Studio
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Studio
  // ============================================================
  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.voidGradient,
        fontFamily: fontUI,
        color: palette.ink,
        display: "flex",
      }}
    >
      <style>{globalStyleSheet}</style>

      {/* Sidebar */}
      <aside
        style={{
          width: 224,
          flexShrink: 0,
          borderRight: `1px solid ${palette.border}`,
          padding: "26px 16px",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
        className="pf-sidebar"
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 19,
            fontWeight: 600,
            color: palette.ink,
            letterSpacing: -0.3,
            padding: "0 10px",
            marginBottom: 28,
          }}
        >
          Pathfinder
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={!item.enabled}
              title={item.enabled ? undefined : "Próximamente"}
              className={item.enabled ? "pf-nav-item pf-nav-item-active" : "pf-nav-item"}
            >
              <span style={{ fontSize: 13, opacity: 0.8 }}>{item.glyph}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 14, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setStationDetailsOpen((v) => !v)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "9px 10px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              borderRadius: 10,
              color: palette.inkMuted,
              fontFamily: fontUI,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: statusColor[status],
                boxShadow: `0 0 8px ${statusColor[status]}`,
                flexShrink: 0,
              }}
              className={status === "BUSY" || status === "STARTING" ? "pf-pulse" : ""}
            />
            <span style={{ fontSize: 13, textAlign: "left", flex: 1 }}>{statusLabel[status]}</span>
          </button>
          {stationDetailsOpen && (
            <div style={{ padding: "8px 10px 2px", fontSize: 12, color: palette.inkFaint, lineHeight: 1.7 }}>
              <div>Sesión activa · {sessionUptime}</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
            <button onClick={handleDownloadNotebook} className="pf-nav-item" style={{ fontSize: 12.5 }}>
              Descargar notebook
            </button>
            <button onClick={handleLogout} className="pf-nav-item" style={{ fontSize: 12.5 }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal — workspace de creación, no un formulario apilado */}
      <main style={{ flex: 1, minWidth: 0, padding: "40px 48px 60px", display: "flex", flexDirection: "column" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
          {!gradioUrl && (
            <div style={{ marginBottom: 20, color: palette.inkFaint, fontSize: 13 }}>
              Buscando tu estación Pathfinder...
            </div>
          )}

          {(errorMsg || backendError) && (
            <p style={{ color: palette.danger, fontSize: 13, marginBottom: 14 }}>{errorMsg || backendError}</p>
          )}
          {statusMsg && !errorMsg && !backendError && !isLoading && !videoSrc && (
            <p style={{ color: palette.inkMuted, fontSize: 13, marginBottom: 14 }}>{statusMsg}</p>
          )}

          {/* ============================================================
              MODO GENERANDO — reemplaza todo el workspace mientras trabaja
             ============================================================ */}
          {isLoading ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: 360,
              }}
            >
              <span className="pf-pulse" style={{ fontSize: 13, color: palette.accentStrong, letterSpacing: 0.3, marginBottom: 10 }}>
                ● Pathfinder está creando
              </span>
              <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: palette.ink, marginBottom: 22 }}>
                {generationInfo?.stage || "Dando forma a tu video"}
              </div>

              <div style={{ width: "100%", maxWidth: 360, marginBottom: 16 }}>
                {generationInfo?.progress != null ? (
                  <>
                    <div
                      style={{
                        width: "100%",
                        height: 6,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.round(progressFrac * 100)}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${palette.accent}, ${palette.accentStrong})`,
                          borderRadius: 999,
                          transition: "width 0.4s ease",
                          boxShadow: `0 0 10px ${palette.accentDim}`,
                        }}
                      />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: palette.accentStrong, fontWeight: 600 }}>
                      {Math.round(progressFrac * 100)}%
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: 6,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div className="pf-indeterminate" />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 22, fontSize: 12, color: palette.inkFaint, marginBottom: 26 }}>
                <span>Tiempo transcurrido · {liveElapsedSec !== null ? formatHMS(liveElapsedSec) : "--:--:--"}</span>
                {remainingSec !== null && <span>Tiempo estimado · {formatHMS(remainingSec)}</span>}
              </div>

              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="pf-btn-danger"
                  style={{ padding: "10px 20px", fontSize: 13 }}
                >
                  {isCancelling ? "Cancelando..." : "Detener"}
                </button>
              )}
            </div>
          ) : videoSrc ? (
            /* ============================================================
                MODO RESULTADO — el video domina la pantalla, acotado a la
                ventana sin importar el aspect ratio (9:16 incluido)
               ============================================================ */
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 22,
                  fontWeight: 600,
                  color: palette.ink,
                  marginBottom: 4,
                  letterSpacing: -0.3,
                }}
              >
                Tu creación
              </div>
              {completedDurationSec !== null && (
                <div style={{ fontSize: 13, color: palette.inkFaint, marginBottom: 18 }}>
                  Completado en {formatHMS(completedDurationSec)}
                </div>
              )}

              <div
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  background: "#000",
                  display: "flex",
                  justifyContent: "center",
                  maxHeight: "68vh",
                }}
              >
                <video
                  src={videoSrc}
                  controls
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "68vh",
                    width: "auto",
                    height: "auto",
                    background: "#000",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 22, flexWrap: "wrap" }}>
                <button onClick={() => setVideoSrc(null)} className="pf-btn-primary" style={{ padding: "12px 22px", fontSize: 14 }}>
                  Crear otra versión
                </button>
                <a
                  href={videoSrc}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="pf-btn-ghost"
                  style={{ padding: "12px 22px", fontSize: 14, textDecoration: "none", display: "inline-block" }}
                >
                  Descargar
                </a>
                <span style={{ fontSize: 12.5, color: palette.inkFaint }}>
                  Tu prompt y referencias siguen listos si quieres ajustar y regenerar.
                </span>
              </div>
            </div>
          ) : (
            /* ============================================================
                MODO CREACIÓN — un solo lienzo: prompt + referencias +
                configuración + Generate, sin cards separadas
               ============================================================ */
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "rgba(255,255,255,0.012)",
                border: `1px solid rgba(255,255,255,0.045)`,
                borderRadius: 28,
                padding: "34px 36px 24px",
              }}
            >
              <textarea
                placeholder="Una mujer entra a un estudio y dice “hola”. Se escucha el ambiente del estudio."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                style={{
                  ...inputBase,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  fontSize: 21,
                  lineHeight: 1.55,
                  resize: "none",
                  minHeight: 140,
                  flex: 1,
                }}
              />

              <div style={{ fontSize: 11, color: palette.inkFaint, opacity: 0.75, marginBottom: 18 }}>
                Guía opcional · [VISUAL] [SPEECH] [SOUND]
              </div>

              {/* Referencias — chips compactos, no dropzones grandes */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
                <ReferenceChip
                  inputId="start-frame-input"
                  inputRef={fileInputRef}
                  onChange={handleStartFileChange}
                  preview={imageStartPreview}
                  label="Inicio"
                  emphasized
                  onOpen={() => imageStartPreview && setLightbox({ src: imageStartPreview, label: "Imagen inicial" })}
                  onClear={clearStartFile}
                />
                <ReferenceChip
                  inputId="end-frame-input"
                  inputRef={endFileInputRef}
                  onChange={handleEndFileChange}
                  preview={imageEndPreview}
                  label="Final"
                  onOpen={() => imageEndPreview && setLightbox({ src: imageEndPreview, label: "Imagen final" })}
                  onClear={clearEndFile}
                />

                <div style={{ width: 1, height: 48, background: palette.border, margin: "4px 2px 0" }} />

                {audioName && audioPreview ? (
                  <AudioChip
                    audioName={audioName}
                    audioPreview={audioPreview}
                    matchAudioDur={matchAudioDur}
                    onToggleMatchDur={setMatchAudioDur}
                    onClear={clearAudioFile}
                    onTrimmed={handleAudioTrimmed}
                  />
                ) : (
                  <label
                    htmlFor="audio-input"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: `1px dashed ${palette.border}`,
                      color: palette.inkFaint,
                      fontSize: 12,
                      cursor: "pointer",
                      marginTop: 4,
                    }}
                  >
                    <span>＋</span> Audio
                  </label>
                )}
                <input
                  id="audio-input"
                  type="file"
                  accept="audio/*"
                  ref={audioInputRef}
                  onChange={handleAudioChange}
                  style={{ display: "none" }}
                />
              </div>

              {/* Barra inferior: resumen de configuración + Generate */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  paddingTop: 18,
                  borderTop: `1px solid ${palette.border}`,
                }}
              >
                <button
                  onClick={() => setParamsOpen((v) => !v)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: fontUI,
                    color: palette.inkMuted,
                    fontSize: 13,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>
                    {ASPECT_RATIO_OPTIONS.find((o) => o.label === aspectRatio)?.short ?? aspectRatio} · {resolution} · {duration.split(" ")[0]}s
                  </span>
                  <span style={{ color: palette.accentStrong, textDecoration: "underline", textUnderlineOffset: 3 }}>
                    {paramsOpen ? "Cerrar" : "Configuración"}
                  </span>
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={isButtonDisabled}
                  className="pf-btn-primary"
                  style={{ padding: "13px 26px", fontSize: 14.5, letterSpacing: 0.1 }}
                >
                  Crear video
                </button>
              </div>

              {/* Configuración — básica primero, avanzada plegada aparte */}
              {paramsOpen && (
                <div style={{ paddingTop: 22, marginTop: 4 }}>
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Formato</label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {ASPECT_RATIO_OPTIONS.map((opt) => {
                        const dims = computeDims(resolution, opt.ratio);
                        const active = aspectRatio === opt.label;
                        const maxBox = 28;
                        const boxW = opt.ratio >= 1 ? maxBox : maxBox * opt.ratio;
                        const boxH = opt.ratio >= 1 ? maxBox / opt.ratio : maxBox;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setAspectRatio(opt.label)}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 6,
                              padding: "12px 14px",
                              borderRadius: 14,
                              cursor: "pointer",
                              fontFamily: fontUI,
                              border: `1px solid ${active ? palette.accent : palette.border}`,
                              background: active ? palette.accentDim : palette.surfaceSoft,
                              minWidth: 84,
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <div
                                style={{
                                  width: boxW,
                                  height: boxH,
                                  border: `1.5px solid ${active ? palette.accentStrong : palette.inkFaint}`,
                                  borderRadius: 3,
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: active ? palette.accentStrong : palette.ink }}>
                              {opt.short}
                            </span>
                            <span style={{ fontSize: 10, color: palette.inkFaint }}>
                              {dims.width}×{dims.height}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Resolución</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {RESOLUTION_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setResolution(opt)}
                          style={pillButton(resolution === opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <label style={labelStyle}>Duración</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      style={{ ...inputBase, cursor: "pointer", maxWidth: 260 }}
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} style={{ background: "#14150F" }}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${palette.border}` }}>
                    <button
                      type="button"
                      onClick={() => setAdvancedOpen((v) => !v)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: palette.inkFaint,
                        fontSize: 12.5,
                        fontFamily: fontUI,
                        padding: 0,
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                      }}
                    >
                      {advancedOpen ? "Ocultar avanzado" : "Avanzado"}
                    </button>

                    {advancedOpen && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                          <div>
                            <label style={labelStyle}>Seed</label>
                            <input
                              type="number"
                              value={seed}
                              onChange={(e) => setSeed(parseInt(e.target.value, 10))}
                              style={inputBase}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={labelStyle}>
                            Prompt influence · <span style={{ color: palette.ink }}>{guideScale.toFixed(1)}</span>
                          </label>
                          <input
                            type="range"
                            min={1}
                            max={8}
                            step={0.5}
                            value={guideScale}
                            onChange={(e) => setGuideScale(parseFloat(e.target.value))}
                            style={{ width: "100%", accentColor: palette.accent }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detalles de generación — enlace discreto, sin card, con diagnóstico anidado */}
          <div style={{ marginTop: 22 }}>
            <button
              onClick={() => setLogsOpen((v) => !v)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: fontUI,
                fontSize: 12.5,
                color: palette.inkFaint,
                padding: 0,
              }}
            >
              {logsOpen ? "Ocultar detalles de generación" : "Detalles de generación"}
            </button>
            {logsOpen && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12.5, color: palette.inkFaint, lineHeight: 1.9, marginBottom: 8 }}>
                  <div>Estado · {statusLabel[status]}</div>
                  <div>Resolución · {resolution} ({ASPECT_RATIO_OPTIONS.find((o) => o.label === aspectRatio)?.short ?? aspectRatio})</div>
                  <div>Duración objetivo · {duration}</div>
                  {completedDurationSec !== null && <div>Tiempo de generación · {formatHMS(completedDurationSec)}</div>}
                </div>

                <button
                  onClick={() => setDiagnosticsOpen((v) => !v)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: palette.inkFaint,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: fontUI,
                    padding: 0,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  {diagnosticsOpen ? "Ocultar diagnóstico" : "Ver diagnóstico"}
                  {logs.length > 0 ? ` (${logs.length})` : ""}
                </button>

                {diagnosticsOpen && (
                  <div
                    className="pf-log-scroll"
                    style={{
                      maxHeight: 220,
                      overflowY: "auto",
                      marginTop: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(0,0,0,0.25)",
                      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                      fontSize: 11.5,
                      color: palette.inkFaint,
                    }}
                  >
                    {logs.length === 0 ? (
                      <div style={{ color: palette.inkFaint, padding: "4px 0" }}>Sin actividad todavía.</div>
                    ) : (
                      logs.map((entry) => (
                        <div key={entry.seq} style={{ padding: "2px 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          <span style={{ color: palette.inkFaint, opacity: 0.6 }}>
                            [{new Date(entry.ts * 1000).toLocaleTimeString()}]
                          </span>{" "}
                          <span style={{ color: palette.inkMuted }}>{entry.msg}</span>
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Lightbox — ver una referencia visual completa, se cierra al hacer clic de nuevo */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3,4,3,0.86)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            cursor: "zoom-out",
            padding: 32,
          }}
        >
          <img
            src={lightbox.src}
            alt={lightbox.label}
            style={{ maxWidth: "90vw", maxHeight: "82vh", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
          />
          <div style={{ marginTop: 16, color: palette.inkMuted, fontSize: 13 }}>{lightbox.label} · clic para cerrar</div>
        </div>
      )}
    </div>
  );
}

const globalStyleSheet = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Inter:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; }
body { margin: 0; }

.pf-btn-primary {
  background: linear-gradient(180deg, #A6DB6B, #8BC34A);
  color: #0A0B08;
  font-weight: 600;
  font-size: 14px;
  border: none;
  border-radius: 14px;
  padding: 12px 20px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: filter 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
}
.pf-btn-primary:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
.pf-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

.pf-btn-ghost {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #D7DBD5;
  font-size: 13px;
  font-weight: 500;
  border-radius: 10px;
  padding: 9px 14px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s ease;
}
.pf-btn-ghost:hover { background: rgba(255,255,255,0.08); }

.pf-btn-danger {
  background: rgba(229,72,77,0.12);
  border: 1px solid rgba(229,72,77,0.4);
  color: #E5484D;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s ease;
}
.pf-btn-danger:hover:not(:disabled) { background: rgba(229,72,77,0.2); }
.pf-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.pf-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 9px 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #6B726A;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  cursor: not-allowed;
  opacity: 0.55;
  transition: background 0.15s ease, color 0.15s ease;
}
.pf-nav-item-active {
  color: #F3F5F1;
  cursor: pointer;
  opacity: 1;
  background: rgba(139,195,74,0.1);
}
.pf-nav-item-active:hover { background: rgba(139,195,74,0.16); }

.pf-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(10,11,8,0.25);
  border-top-color: #0A0B08;
  animation: pf-spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes pf-spin { to { transform: rotate(360deg); } }

.pf-pulse { animation: pf-pulse-anim 1.4s ease-in-out infinite; }
@keyframes pf-pulse-anim {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.pf-indeterminate {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 40%;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #8BC34A, transparent);
  animation: pf-indeterminate-slide 1.4s ease-in-out infinite;
}
@keyframes pf-indeterminate-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

.pf-intro-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 900px;
  height: 900px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139,195,74,0.10) 0%, rgba(139,195,74,0) 65%);
  pointer-events: none;
  animation: pf-glow-breathe 8s ease-in-out infinite;
}
@keyframes pf-glow-breathe {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.pf-log-scroll::-webkit-scrollbar { width: 6px; }
.pf-log-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }

input[type="range"] { height: 4px; }
input::placeholder, textarea::placeholder { color: #5C645C; }
input:focus, textarea:focus, select:focus { border-color: #8BC34A !important; }

@media (max-width: 860px) {
  .pf-sidebar { display: none; }
}
`;

export default App;
