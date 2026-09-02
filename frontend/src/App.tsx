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

const glassStrong: React.CSSProperties = {
  background: palette.surfaceStrong,
  border: `1px solid ${palette.borderStrong}`,
  borderRadius: 20,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
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

const removeBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: 6,
  right: 6,
  width: 24,
  height: 24,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(7,8,10,0.8)",
  color: palette.ink,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  lineHeight: 1,
  backdropFilter: "blur(4px)",
};

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
  const [logsOpen, setLogsOpen] = useState<boolean>(false);
  const [stationDetailsOpen, setStationDetailsOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Puerta puramente visual: pantalla de bienvenida antes de entrar al Studio.
  // No agrega ninguna funcionalidad ni ruta nueva, solo un estado local de UI.
  const [hasEnteredStudio, setHasEnteredStudio] = useState<boolean>(false);

  // Reloj en vivo para el tiempo transcurrido/restante mientras genera
  const [nowTick, setNowTick] = useState<number>(Date.now());

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const endFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const lastLogSeqRef = useRef<number>(0);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // ---- Cliente Gradio único, reutilizado por todos los pollings y por
  // generate/cancel. Cachea la PROMESA (no solo el resultado) para que dos
  // llamadas casi simultáneas (p.ej. dos pollers disparando el mismo tick)
  // no disparen dos Client.connect() en paralelo. Se reconecta solo si
  // gradioUrl cambia, y cierra siempre la conexión anterior. ----
  const clientPromiseRef = useRef<{ url: string; promise: Promise<Client> } | null>(null);

  const closeClientRef = (entry: { url: string; promise: Promise<Client> } | null) => {
    if (!entry) return;
    entry.promise
      .then((c) => {
        // client.close() cierra la conexión (incl. heartbeat SSE) del cliente JS de Gradio.
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
        // la conexión cacheada falló: se limpia y se reintenta abajo
        if (clientPromiseRef.current?.url === gradioUrl) clientPromiseRef.current = null;
      }
    }

    // gradioUrl cambió (o no había cliente): cerrar el anterior
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

  // Cierra la conexión activa cuando gradioUrl cambia o al desmontar el componente.
  useEffect(() => {
    return () => {
      const entry = clientPromiseRef.current;
      clientPromiseRef.current = null;
      closeClientRef(entry);
    };
  }, [gradioUrl]);

  // Sesión
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

  // Autenticación
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

  // Obtener URL del runtime
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

  // Polling de estado de estación (tolerante a fallos)
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

  // Polling de progreso de generación
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
          setGenerationInfo(data as GenerationInfo);
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

  // Polling incremental de logs en vivo (independiente del polling anterior)
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

  // Reloj en vivo (tiempo transcurrido / restante) mientras hay una generación activa
  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLoading]);

  // Autoscroll del panel de logs
  useEffect(() => {
    if (logsOpen) {
      logsEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [logs, logsOpen]);

  // Al llegar una generación, el panel de detalles pasa a segundo plano automáticamente
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
    setMatchAudioDur(false);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!imageStartFile || !prompt || status !== "READY" || !gradioUrl) return;

    setIsLoading(true);
    setErrorMsg(null);
    setVideoSrc(null);
    setStatusMsg(null);
    setLogs([]);
    lastLogSeqRef.current = 0;
    setGenerationInfo({ status: "preparing", progress: 0, stage: "preparing", started_at: Date.now() / 1000 });

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
      // no forzar complete; el backend ya lo hará
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
    STARTING: "Preparando la estación",
    READY: "Lista para crear",
    BUSY: "Creando",
    ERROR: "Algo falló",
    UNKNOWN: "Sin conexión",
  };

  const isButtonDisabled =
    status !== "READY" || isLoading || !imageStartFile || !prompt.trim() || !gradioUrl;

  // ---- Tiempos derivados del generationInfo que expone el backend ----
  const nowSec = nowTick / 1000;
  const progressFrac = Math.min(1, Math.max(0, generationInfo?.progress ?? 0));

  const liveElapsedSec =
    isLoading && generationInfo?.started_at ? Math.max(0, nowSec - generationInfo.started_at) : null;

  const remainingSec =
    isLoading && generationInfo?.started_at && progressFrac > 0.03
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
              <div>Cómputo: Kaggle T4</div>
              <div>Sesión activa: {sessionUptime}</div>
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

      {/* Contenido principal */}
      <main style={{ flex: 1, minWidth: 0, padding: "36px 40px 60px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {!gradioUrl && (
            <div style={{ ...glass, padding: 18, marginBottom: 22, textAlign: "center", color: palette.inkMuted }}>
              Buscando tu estación Pathfinder...
            </div>
          )}

          {/* Prompt central */}
          <div style={{ ...glass, padding: 26, marginBottom: 16 }}>
            <textarea
              placeholder="Una mujer entra a un estudio y dice “hola”. Se escucha el ambiente del estudio."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              style={{
                ...inputBase,
                background: "transparent",
                border: "none",
                padding: "0 0 14px",
                fontSize: 18,
                lineHeight: 1.55,
                resize: "vertical",
                minHeight: 96,
              }}
            />
            <div
              style={{
                fontSize: 12,
                color: palette.inkFaint,
                paddingBottom: 18,
                borderBottom: `1px solid ${palette.border}`,
                marginBottom: 18,
              }}
            >
              [VISUAL] escena · [SPEECH] diálogo o voz · [SOUND] ambiente o efectos — opcional
            </div>

            {/* Chips de archivos: Start / End / Audio */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {/* Start Frame */}
              <div style={{ position: "relative", width: 128 }}>
                <label
                  htmlFor="start-frame-input"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 128,
                    height: 128,
                    borderRadius: 16,
                    border: `1px dashed ${palette.border}`,
                    background: imageStartPreview ? "transparent" : palette.surfaceSoft,
                    cursor: "pointer",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {imageStartPreview ? (
                    <img
                      src={imageStartPreview}
                      alt="start"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <>
                      <span style={{ fontSize: 20, color: palette.inkFaint }}>＋</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: palette.inkFaint,
                          marginTop: 6,
                          textAlign: "center",
                          padding: "0 10px",
                        }}
                      >
                        Imagen inicial
                      </span>
                    </>
                  )}
                </label>
                <input
                  id="start-frame-input"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleStartFileChange}
                  style={{ display: "none" }}
                />
                {imageStartPreview && (
                  <button
                    type="button"
                    onClick={clearStartFile}
                    style={removeBtnStyle}
                    aria-label="Quitar imagen inicial"
                    title="Quitar"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* End Frame */}
              <div style={{ position: "relative", width: 128 }}>
                <label
                  htmlFor="end-frame-input"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 128,
                    height: 128,
                    borderRadius: 16,
                    border: `1px dashed ${palette.border}`,
                    background: imageEndPreview ? "transparent" : palette.surfaceSoft,
                    cursor: "pointer",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {imageEndPreview ? (
                    <img
                      src={imageEndPreview}
                      alt="end"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <>
                      <span style={{ fontSize: 20, color: palette.inkFaint }}>＋</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: palette.inkFaint,
                          marginTop: 6,
                          textAlign: "center",
                          padding: "0 10px",
                        }}
                      >
                        Imagen final (opcional)
                      </span>
                    </>
                  )}
                </label>
                <input
                  id="end-frame-input"
                  type="file"
                  accept="image/*"
                  ref={endFileInputRef}
                  onChange={handleEndFileChange}
                  style={{ display: "none" }}
                />
                {imageEndPreview && (
                  <button
                    type="button"
                    onClick={clearEndFile}
                    style={removeBtnStyle}
                    aria-label="Quitar imagen final"
                    title="Quitar"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Audio */}
              <div style={{ position: "relative", width: 128 }}>
                <label
                  htmlFor="audio-input"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 128,
                    height: 128,
                    borderRadius: 16,
                    border: `1px dashed ${palette.border}`,
                    background: palette.surfaceSoft,
                    cursor: "pointer",
                    padding: "0 10px",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: 20, color: audioName ? palette.accentStrong : palette.inkFaint }}>
                    {audioName ? "♪" : "＋"}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: audioName ? palette.ink : palette.inkFaint,
                      marginTop: 6,
                      wordBreak: "break-word",
                      lineHeight: 1.3,
                    }}
                  >
                    {audioName || "Audio (opcional)"}
                  </span>
                </label>
                <input
                  id="audio-input"
                  type="file"
                  accept="audio/*"
                  ref={audioInputRef}
                  onChange={handleAudioChange}
                  style={{ display: "none" }}
                />
                {audioName && (
                  <button
                    type="button"
                    onClick={clearAudioFile}
                    style={removeBtnStyle}
                    aria-label="Quitar audio"
                    title="Quitar"
                  >
                    ✕
                  </button>
                )}
              </div>

              {audioFile && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: palette.inkMuted,
                    alignSelf: "flex-end",
                    marginBottom: 6,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={matchAudioDur}
                    onChange={(e) => setMatchAudioDur(e.target.checked)}
                  />
                  Ajustar duración al audio
                </label>
              )}
            </div>
          </div>

          {/* Botón principal + cancelar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button
              onClick={handleGenerate}
              disabled={isButtonDisabled}
              className="pf-btn-primary"
              style={{ flex: 1, padding: "17px 0", fontSize: 15 }}
            >
              {isLoading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span className="pf-spinner" />
                  Creando...
                </span>
              ) : (
                "Generate"
              )}
            </button>
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="pf-btn-danger"
                style={{ padding: "17px 22px", fontSize: 14 }}
              >
                {isCancelling ? "Cancelando..." : "Detener"}
              </button>
            )}
          </div>

          {/* Progreso en vivo */}
          {isLoading && generationInfo && (
            <div style={{ ...glass, padding: 22, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Pathfinder está creando</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: palette.inkMuted }}>
                  {generationInfo.stage || "Procesando"}
                </span>
                <span style={{ fontSize: 13, color: palette.accentStrong, fontWeight: 600 }}>
                  {Math.round(progressFrac * 100)}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 7,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                  marginBottom: 14,
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
              <div style={{ display: "flex", gap: 22, fontSize: 12, color: palette.inkFaint }}>
                <span>Transcurrido: {liveElapsedSec !== null ? formatHMS(liveElapsedSec) : "--:--:--"}</span>
                <span>Restante (est.): {remainingSec !== null ? formatHMS(remainingSec) : "calculando..."}</span>
              </div>
            </div>
          )}

          {completedDurationSec !== null && videoSrc && (
            <p style={{ color: palette.accentStrong, fontSize: 13, marginBottom: 10 }}>
              Listo — completado en {formatHMS(completedDurationSec)}
            </p>
          )}

          {(errorMsg || backendError) && (
            <p style={{ color: palette.danger, fontSize: 13, marginBottom: 10 }}>{errorMsg || backendError}</p>
          )}
          {statusMsg && !errorMsg && !backendError && (
            <p style={{ color: palette.inkMuted, fontSize: 13, marginBottom: 10 }}>{statusMsg}</p>
          )}

          {/* Resultado — protagonista */}
          {videoSrc && (
            <div style={{ ...glassStrong, padding: 14, marginBottom: 16 }}>
              <video src={videoSrc} controls style={{ width: "100%", borderRadius: 14, display: "block" }} />
            </div>
          )}

          {/* Advanced — parámetros técnicos, en segundo plano */}
          <div style={{ ...glass, marginBottom: 16, overflow: "hidden" }}>
            <button
              onClick={() => setParamsOpen((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                background: "transparent",
                border: "none",
                color: palette.inkMuted,
                cursor: "pointer",
                fontFamily: fontUI,
              }}
            >
              <span style={{ fontSize: 14 }}>Advanced</span>
              <span style={{ color: palette.inkFaint, fontSize: 13 }}>{paramsOpen ? "Ocultar" : "Mostrar"}</span>
            </button>

            {paramsOpen && (
              <div style={{ padding: "0 20px 22px" }}>
                {/* Resolución */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Resolución base</label>
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

                {/* Aspect ratio visual */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Aspect ratio</label>
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
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
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
                  <div>
                    <label style={labelStyle}>Duración</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      style={{ ...inputBase, cursor: "pointer" }}
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} style={{ background: "#14150F" }}>
                          {opt}
                        </option>
                      ))}
                    </select>
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

          {/* Generation details (logs) */}
          <div style={{ ...glass, overflow: "hidden" }}>
            <button
              onClick={() => setLogsOpen((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                background: "transparent",
                border: "none",
                color: palette.inkMuted,
                cursor: "pointer",
                fontFamily: fontUI,
                fontSize: 13,
              }}
            >
              <span>Generation details {logs.length > 0 ? `(${logs.length})` : ""}</span>
              <span>{logsOpen ? "Ocultar" : "Mostrar"}</span>
            </button>
            {logsOpen && (
              <div
                className="pf-log-scroll"
                style={{
                  maxHeight: 220,
                  overflowY: "auto",
                  padding: "0 20px 16px",
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  fontSize: 11.5,
                  color: palette.inkFaint,
                }}
              >
                {logs.length === 0 ? (
                  <div style={{ color: palette.inkFaint, padding: "8px 0" }}>Sin actividad todavía.</div>
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
        </div>
      </main>
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