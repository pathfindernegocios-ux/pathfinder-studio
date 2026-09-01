import { useState, useRef, useEffect } from "react";
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

const ASPECT_RATIO_OPTIONS = [
  "16:9 Landscape",
  "4:3 Standard",
  "1:1 Square",
  "3:4 Portrait",
  "9:16 Portrait",
];

interface GenerationInfo {
  id?: string;
  status?: string;
  progress?: number;
  stage?: string;
  started_at?: number;
  finished_at?: number;
  output_url?: string;
  error?: string;
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
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const endFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

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
        const client = await Client.connect(gradioUrl);
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
    const intervalId = setInterval(pollStatus, 4000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [gradioUrl]);

  // Polling de progreso de generación
  useEffect(() => {
    if (!isLoading || !gradioUrl) return;

    let cancelled = false;
    const pollGeneration = async () => {
      try {
        const client = await Client.connect(gradioUrl);
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
    const interval = setInterval(pollGeneration, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoading, gradioUrl]);

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

  const handleGenerate = async () => {
    if (!imageStartFile || !prompt || status !== "READY" || !gradioUrl) return;

    const startTime = Date.now();
    setIsLoading(true);
    setErrorMsg(null);
    setVideoSrc(null);
    setStatusMsg(null);
    setElapsedSeconds(null);
    setGenerationInfo({ status: "preparing", progress: 0, stage: "preparing" });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setErrorMsg("No hay sesión activa. Inicia sesión.");
        return;
      }

      const client = await Client.connect(gradioUrl);

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

      const endTime = Date.now();
      setElapsedSeconds(Math.round((endTime - startTime) / 1000));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al generar video.");
    } finally {
      setIsLoading(false);
      // no forzar complete; el backend ya lo hará
      setGenerationInfo((prev) => (prev ? { ...prev } : prev));
    }
  };

  const statusColor: Record<Status, string> = {
    STARTING: "#F5A623",
    READY: "#4CAF50",
    BUSY: "#2196F3",
    ERROR: "#F44336",
    UNKNOWN: "#9E9E9E",
  };

  const isButtonDisabled =
    status !== "READY" || isLoading || !imageStartFile || !prompt || !gradioUrl;

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!session) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
        <h2>Pathfinder Studio</h2>
        <p>{authMode === "login" ? "Inicia sesión" : "Crea una cuenta"}</p>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
        />
        <button onClick={handleAuth} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
          {authMode === "login" ? "Entrar" : "Registrarse"}
        </button>
        <button
          onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
          style={{ background: "none", border: "none", color: "#D7DADF", cursor: "pointer" }}
        >
          {authMode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
        {authError && <p style={{ color: "#F44336" }}>{authError}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Pathfinder Studio — LTX-2.3</h1>
        <div>
          <button onClick={handleDownloadNotebook} style={{ marginRight: 8 }}>
            Descargar mi notebook
          </button>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{ background: "#1C1E22", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: statusColor[status] }} />
          <span style={{ fontWeight: 600, color: "#F2F2F2" }}>{status === "READY" ? "Online" : status}</span>
          <span style={{ marginLeft: "auto", color: "#9EA4AA", fontSize: 12 }}>
            Sesión: {sessionUptime}
          </span>
        </div>
        <div style={{ marginTop: 8, color: "#9EA4AA", fontSize: 14 }}>
          <span>LTX 2.3</span> · <span>Kaggle</span> · <span>GPU: T4</span>
        </div>
      </div>

      {!gradioUrl && <p style={{ color: "#6b7280" }}>Buscando runtime Pathfinder...</p>}

      {isLoading && generationInfo && (
        <div style={{ marginBottom: 16, padding: 12, background: "#1C1E22", borderRadius: 8 }}>
          <p style={{ margin: 0, color: "#D7DADF" }}>
            {generationInfo.stage || "Procesando..."}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <progress value={generationInfo.progress ?? 0} max={1} style={{ flex: 1, height: 8 }} />
            <span style={{ color: "#9EA4AA", fontSize: 12 }}>
              {Math.round((generationInfo.progress ?? 0) * 100)}%
            </span>
          </div>
        </div>
      )}

      {elapsedSeconds !== null && videoSrc && (
        <p style={{ color: "#8BC34A", fontSize: 14 }}>
          Completado en {formatElapsed(elapsedSeconds)}
        </p>
      )}

      {/* Inputs */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Start Frame</label>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleStartFileChange} />
        {imageStartPreview && <img src={imageStartPreview} alt="start" style={{ maxWidth: 240, borderRadius: 8, marginTop: 8 }} />}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4 }}>End Frame (opcional)</label>
        <input type="file" accept="image/*" ref={endFileInputRef} onChange={handleEndFileChange} />
        {imageEndPreview && <img src={imageEndPreview} alt="end" style={{ maxWidth: 240, borderRadius: 8, marginTop: 8 }} />}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Audio (opcional)</label>
        <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioChange} />
        {audioName && <p style={{ color: "#9EA4AA", fontSize: 12 }}>Audio: {audioName}</p>}
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <input type="checkbox" checked={matchAudioDur} onChange={(e) => setMatchAudioDur(e.target.checked)} disabled={!audioFile} />
          <span>Ajustar duración al audio</span>
        </label>
      </div>

      <div style={{ marginBottom: 16 }}>
        <textarea placeholder="Describe el video..." value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} style={{ width: "100%", padding: 8 }} />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label>Seed</label>
          <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value, 10))} style={{ width: "100%", padding: 8 }} />
        </div>
        <div style={{ flex: 1 }}>
          <label>Duración</label>
          <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: "100%", padding: 8 }}>
            {DURATION_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label>Resolución</label>
          <select value={resolution} onChange={(e) => setResolution(e.target.value)} style={{ width: "100%", padding: 8 }}>
            {RESOLUTION_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Aspect Ratio</label>
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} style={{ width: "100%", padding: 8 }}>
            {ASPECT_RATIO_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Prompt Influence: {guideScale.toFixed(1)}</label>
        <input type="range" min={1} max={8} step={0.5} value={guideScale} onChange={(e) => setGuideScale(parseFloat(e.target.value))} style={{ width: "100%" }} />
      </div>

      <button onClick={handleGenerate} disabled={isButtonDisabled}>
        {isLoading ? "GENERANDO..." : "GENERAR VIDEO"}
      </button>

      {errorMsg && <p style={{ color: "#F44336", marginTop: 12 }}>{errorMsg}</p>}
      {statusMsg && !errorMsg && <p style={{ color: "#6b7280", marginTop: 12 }}>{statusMsg}</p>}

      {videoSrc && (
        <div style={{ marginTop: 24 }}>
          <video src={videoSrc} controls width={640} />
        </div>
      )}
    </div>
  );
}

export default App;