import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Client } from "@gradio/client";
import { supabase } from "./lib/supabaseClient";

// ============================================================
// CONFIGURACIÓN SUPABASE (Pathfinder Runtime Registry)
// ============================================================

type Status = "STARTING" | "READY" | "BUSY" | "ERROR" | "UNKNOWN";

// ---- Mismas opciones que los dropdowns de Gradio (backend) ----
const DURATION_OPTIONS = [
  "2 Seconds (49 frames)",
  "3 Seconds (73 frames)",
  "5 Seconds (121 frames)",
  "10 Seconds (241 frames)",
  "15 Seconds (361 frames)",
  "20 Seconds (481 frames)",
];

const RESOLUTION_OPTIONS = ["1080p", "720p", "540p", "480p"];

const ASPECT_RATIO_OPTIONS = [
  "16:9 Landscape",
  "4:3 Standard",
  "1:1 Square",
  "3:4 Portrait",
  "9:16 Portrait",
];

function App() {
  // ---------- Autenticación y perfil ----------
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);

  // ---------- Estado del runtime ----------
  const [gradioUrl, setGradioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("UNKNOWN");

  // ---------- Inputs de generación ----------
  const [imageStartFile, setImageStartFile] = useState<File | null>(null);
  const [imageStartPreview, setImageStartPreview] = useState<string | null>(null);
  const [imageEndFile, setImageEndFile] = useState<File | null>(null);
  const [imageEndPreview, setImageEndPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [seed, setSeed] = useState<number>(-1);
  const [duration, setDuration] = useState<string>("3 Seconds (73 frames)");
  const [resolution, setResolution] = useState<string>("720p");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9 Landscape");

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const endFileInputRef = useRef<HTMLInputElement | null>(null);

  // ---------- 1. Obtener sesión al cargar ----------
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

  // ---------- 2. Obtener gradioUrl desde Supabase usando station_id del perfil ----------
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

  // ---------- 3. Polling del estado del runtime ----------
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
        if (!cancelled) setStatus("UNKNOWN");
      }
    };

    pollStatus();
    const intervalId = setInterval(pollStatus, 2000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [gradioUrl]);

  // ---------- Autenticación ----------
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
  }

  // ---------- Manejadores de archivos ----------
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

  // ---------- Generación de video ----------
  const handleGenerate = async () => {
    if (!imageStartFile || !prompt || status !== "READY" || !gradioUrl) return;

    setIsLoading(true);
    setErrorMsg(null);
    setVideoSrc(null);
    setStatusMsg(null);

    try {
      const client = await Client.connect(gradioUrl);
      const result = await client.predict("/generate", [
        prompt,
        imageStartFile,
        imageEndFile,
        seed,
        duration,
        resolution,
        aspectRatio,
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

  // ==================== RENDER ====================
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
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>

      {profile?.station_id && (
        <p style={{ color: "#9EA4AA", marginBottom: 16 }}>
          Tu Station ID: <strong>{profile.station_id}</strong>
        </p>
      )}

      {!gradioUrl && <p style={{ color: "#6b7280" }}>Buscando runtime Pathfinder...</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: statusColor[status],
          }}
        />
        <span>Estado del backend: {gradioUrl ? status : "SIN CONEXIÓN"}</span>
      </div>

      {/* ---- Start Frame ---- */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Start Frame</label>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleStartFileChange} />
        {imageStartPreview && (
          <div style={{ marginTop: 8 }}>
            <img src={imageStartPreview} alt="start preview" style={{ maxWidth: 240, borderRadius: 8 }} />
          </div>
        )}
      </div>

      {/* ---- End Frame ---- */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4 }}>End Frame (opcional)</label>
        <input type="file" accept="image/*" ref={endFileInputRef} onChange={handleEndFileChange} />
        {imageEndPreview && (
          <div style={{ marginTop: 8 }}>
            <img src={imageEndPreview} alt="end preview" style={{ maxWidth: 240, borderRadius: 8 }} />
          </div>
        )}
      </div>

      {/* ---- Prompt ---- */}
      <div style={{ marginBottom: 16 }}>
        <textarea
          placeholder="A cinematic shot of a red fox walking through a snowy forest..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      {/* ---- Seed / Duration ---- */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Seed (-1 = random)</label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value, 10))}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Duración</label>
          <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: "100%", padding: 8 }}>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ---- Resolution / Aspect ratio ---- */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Resolución</label>
          <select value={resolution} onChange={(e) => setResolution(e.target.value)} style={{ width: "100%", padding: 8 }}>
            {RESOLUTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Aspect Ratio</label>
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} style={{ width: "100%", padding: 8 }}>
            {ASPECT_RATIO_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
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