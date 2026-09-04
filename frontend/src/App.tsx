import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { supabase } from "./lib/supabaseClient";
import type { Status, AspectOption } from "./types";
import {
  durationSeconds,
  durationLabel,
  durationFrames,
  computeDims,
  formatHMS,
  formatMMSS,
} from "./lib/helpers";
import {
  fontDisplay,
  fontUI,
  palette,
  NAV_ITEMS,
  glass,
  inputBase,
  labelStyle,
  pillButton,
} from "./styles/tokens";
import { globalStyleSheet } from "./styles/globalStyles";
import { useAuth } from "./hooks/useAuth";
import { useGeneration } from "./hooks/useGeneration";
import { useRuntime } from "./hooks/useRuntime";

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

const ENGINE_LABEL = "LTX-2.3";

const RESOLUTION_OPTIONS = ["1080p", "720p", "540p", "480p"];

const ASPECT_RATIO_OPTIONS: AspectOption[] = [
  { label: "16:9 Landscape", short: "16:9", ratio: 16 / 9 },
  { label: "4:3 Standard", short: "4:3", ratio: 4 / 3 },
  { label: "1:1 Square", short: "1:1", ratio: 1 },
  { label: "3:4 Portrait", short: "3:4", ratio: 3 / 4 },
  { label: "9:16 Portrait", short: "9:16", ratio: 9 / 16 },
];

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
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

    const wavBlob = audioBufferToWavBlob(trimmed);
    return new File([wavBlob], "audio_recortado.wav", { type: "audio/wav" });
  } finally {
    ctx.close().catch(() => {});
  }
}

function FrameChip({
  inputId,
  inputRef,
  onChange,
  preview,
  label,
  sublabel,
  emphasized,
  onOpen,
  onClear,
}: {
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  preview: string | null;
  label: string;
  sublabel: string;
  emphasized?: boolean;
  onOpen: () => void;
  onClear: () => void;
}) {
  const size = emphasized ? 64 : 48;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
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
              border: `1px solid ${emphasized ? "rgba(139,195,74,0.35)" : palette.borderStrong}`,
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
              border: `1px dashed ${emphasized ? palette.borderStrong : palette.border}`,
              background: emphasized ? "rgba(255,255,255,0.02)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: emphasized ? palette.inkMuted : palette.inkFaint,
              fontSize: emphasized ? 18 : 15,
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
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontSize: emphasized ? 13 : 12,
            fontWeight: 500,
            color: emphasized ? palette.ink : palette.inkMuted,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 10.5, color: palette.inkFaint, whiteSpace: "nowrap", letterSpacing: 0.2 }}>
          {sublabel}
        </span>
      </div>
    </div>
  );
}

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
  const {
    session,
    profile,
    email,
    setEmail,
    password,
    setPassword,
    authMode,
    setAuthMode,
    authError,
    handleAuth,
    handleLogout,
    hasEnteredStudio,
    setHasEnteredStudio,
  } = useAuth();

  const { gradioUrl, status, sessionUptime, getClient } = useRuntime({
    stationId: profile?.station_id ?? null,
  });

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

  const [paramsOpen, setParamsOpen] = useState<boolean>(false);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [logsOpen, setLogsOpen] = useState<boolean>(false);
  const [stationDetailsOpen, setStationDetailsOpen] = useState<boolean>(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState<boolean>(false);
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const endFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const {
    videoSrc,
    setVideoSrc,
    videoRatio,
    setVideoRatio,
    statusMsg,
    errorMsg,
    setErrorMsg,
    isLoading,
    generationInfo,
    logs,
    isCancelling,
    handleGenerate,
    handleCancel,
    progressFrac,
    liveElapsedSec,
    remainingSec,
    completedDurationSec,
    backendError,
    canCancel,
  } = useGeneration({
    getClient,
    gradioUrl,
    status,
    imageStartFile,
    imageEndFile,
    audioFile,
    prompt,
    seed,
    duration,
    resolution,
    aspectRatio,
    guideScale,
    matchAudioDur,
  });

  useEffect(() => {
    if (logsOpen && diagnosticsOpen) {
      logsEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [logs, logsOpen, diagnosticsOpen]);

  useEffect(() => {
    if (isLoading) setParamsOpen(false);
  }, [isLoading]);

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
              <span style={{ fontSize: 13, color: palette.accentStrong, letterSpacing: 0.3, marginBottom: 10 }}>
                <span className="pf-pulse">●</span> Pathfinder está creando
                <span style={{ color: palette.inkFaint, fontWeight: 400 }}> · {ENGINE_LABEL}</span>
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
                <button onClick={handleCancel} disabled={isCancelling} className="pf-btn-cancel">
                  {isCancelling ? "Cancelando..." : "Cancelar generación"}
                </button>
              )}
            </div>
          ) : videoSrc ? (
            (() => {
              const selectedAspect = ASPECT_RATIO_OPTIONS.find((o) => o.label === aspectRatio);
              const ratio = videoRatio ?? selectedAspect?.ratio ?? 16 / 9;
              const aspectShort = selectedAspect?.short ?? aspectRatio;
              const maxH = "min(66vh, 720px)";
              return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "100%", maxWidth: 720, marginBottom: 22 }}>
                    <div
                      style={{
                        fontFamily: fontDisplay,
                        fontSize: 22,
                        fontWeight: 600,
                        color: palette.ink,
                        letterSpacing: -0.3,
                      }}
                    >
                      Tu creación
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12.5, color: palette.inkFaint, letterSpacing: 0.2 }}>
                      {ENGINE_LABEL} · {aspectShort} · {durationSeconds(duration)} s
                      {completedDurationSec !== null && (
                        <span style={{ opacity: 0.8 }}> · Completado en {formatHMS(completedDurationSec)}</span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      aspectRatio: String(ratio),
                      width: `min(100%, calc(${maxH} * ${ratio}))`,
                      maxHeight: maxH,
                      borderRadius: 18,
                      overflow: "hidden",
                      background: "#000",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow:
                        "0 30px 90px rgba(0,0,0,0.6), 0 0 120px rgba(139,195,74,0.05), 0 0 0 1px rgba(255,255,255,0.02) inset",
                    }}
                  >
                    <video
                      src={videoSrc}
                      controls
                      playsInline
                      onLoadedMetadata={(e) => {
                        const { videoWidth, videoHeight } = e.currentTarget;
                        if (videoWidth > 0 && videoHeight > 0) setVideoRatio(videoWidth / videoHeight);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        background: "#000",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      width: "100%",
                      maxWidth: 720,
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 26,
                      flexWrap: "wrap",
                    }}
                  >
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
                  </div>
                  <span style={{ fontSize: 12.5, color: palette.inkFaint, marginTop: 14, textAlign: "center" }}>
                    Tu prompt, imágenes, audio y configuración siguen listos para crear otra versión.
                  </span>
                </div>
              );
            })()
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.014) 0%, rgba(255,255,255,0.004) 100%)",
                border: `1px solid rgba(255,255,255,0.03)`,
                borderRadius: 28,
                padding: "38px 40px 26px",
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

              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginBottom: 22 }}>
                <FrameChip
                  inputId="start-frame-input"
                  inputRef={fileInputRef}
                  onChange={handleStartFileChange}
                  preview={imageStartPreview}
                  label="Imagen de inicio"
                  sublabel="Start Frame"
                  emphasized
                  onOpen={() => imageStartPreview && setLightbox({ src: imageStartPreview, label: "Imagen de inicio" })}
                  onClear={clearStartFile}
                />
                <FrameChip
                  inputId="end-frame-input"
                  inputRef={endFileInputRef}
                  onChange={handleEndFileChange}
                  preview={imageEndPreview}
                  label="Imagen final"
                  sublabel="End Frame · opcional"
                  onOpen={() => imageEndPreview && setLightbox({ src: imageEndPreview, label: "Imagen final" })}
                  onClear={clearEndFile}
                />

                <div style={{ width: 1, height: 40, background: palette.border, margin: "0 2px" }} />

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
                    {ASPECT_RATIO_OPTIONS.find((o) => o.label === aspectRatio)?.short ?? aspectRatio} · {resolution} · {durationSeconds(duration)} s
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
                          {durationLabel(opt)}
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
                  {(() => {
                    const aspectOpt = ASPECT_RATIO_OPTIONS.find((o) => o.label === aspectRatio);
                    const dims = computeDims(resolution, aspectOpt?.ratio ?? 16 / 9);
                    const frames = durationFrames(duration);
                    return (
                      <>
                        <div>Modelo · {ENGINE_LABEL}</div>
                        <div>Estado · {statusLabel[status]}</div>
                        {generationInfo?.stage && <div>Etapa · {generationInfo.stage}</div>}
                        <div>
                          Formato · {aspectOpt?.short ?? aspectRatio} · {resolution} · {dims.width}×{dims.height}
                        </div>
                        <div>
                          Duración objetivo · {durationLabel(duration)}
                          {frames && ` · ${frames} frames`}
                        </div>
                        <div>Seed · {seed === -1 ? "aleatoria (-1)" : seed}</div>
                        <div>Prompt influence · {guideScale.toFixed(1)}</div>
                        {completedDurationSec !== null && <div>Tiempo de generación · {formatHMS(completedDurationSec)}</div>}
                        {generationInfo?.id && <div>ID · {generationInfo.id}</div>}
                      </>
                    );
                  })()}
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

export default App;