import { useState, useRef, useEffect, ChangeEvent } from "react";
import { Client } from "@gradio/client";

// ============================================================
// CONFIGURACIÓN SUPABASE (Pathfinder Runtime Registry)
// ============================================================
const SUPABASE_URL = "https://sxvgldvnxwjtvqownayr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmdsZHZueHdqdHZxb3duYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTcwMDUsImV4cCI6MjEwMzM3MzAwNX0.KYClvOPXrVNGT76vizj5og4j7upw6IavO7K--XJkN3Q"; // <-- REEMPLAZA CON TU ANON KEY LEGACY
const STATION_ID = "PF-0001"; // Debe coincidir con el que pusiste en run_ltx.py

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
  const [gradioUrl, setGradioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("UNKNOWN");

  // ---- Imagen start / end (igual que en Gradio) ----
  const [imageStartFile, setImageStartFile] = useState<File | null>(null);
  const [imageStartPreview, setImageStartPreview] = useState<string | null>(null);
  const [imageEndFile, setImageEndFile] = useState<File | null>(null);
  const [imageEndPreview, setImageEndPreview] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string>("");

  // ---- Mismos defaults que el Gradio original ----
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

  // ---- 1. Descubrir automáticamente la URL del runtime desde Supabase ----
  useEffect(() => {
    let cancelled = false;

    const fetchRuntime = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/runtimes?station_id=eq.${STATION_ID}&order=created_at.desc&limit=1`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (cancelled) return;
        const data = await res.json();
        if (data && data.length > 0) {
          setGradioUrl(data[0].gradio_url);
        }
      } catch (err) {
        console.error("Error obteniendo runtime:", err);
      }
    };

    fetchRuntime();
    const interval = setInterval(fetchRuntime, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ---- 2. Polling del estado solo si ya tenemos gradioUrl ----
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
      } catch (err) {
        if (!cancelled) {
          setStatus("UNKNOWN");
        }
      }
    };

    pollStatus();
    const intervalId = setInterval(pollStatus, 2000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [gradioUrl]);

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

  const handleGenerate = async () => {
    if (!imageStartFile || !prompt || status !== "READY" || !gradioUrl) return;

    setIsLoading(true);
    setErrorMsg(null);
    setVideoSrc(null);
    setStatusMsg(null);

    try {
      const client = await Client.connect(gradioUrl);

      // Mismo orden que inputs=[prompt, input_image_start, input_image_end,
      // seed, duration_dropdown, resolution_dropdown, aspect_ratio_dropdown]
      const result = await client.predict("/generate", [
        prompt,
        imageStartFile,
        imageEndFile, // puede ser null → "End Frame (optional)"
        seed,
        duration,
        resolution,
        aspectRatio,
      ]);

      const data = result.data as unknown[];
      const videoData = Array.isArray(data) ? data[0] : data;
      const statusText = Array.isArray(data) ? (data[1] as string) : null;

      let url: string | null = null;
      if (typeof videoData === "string") {
        url = videoData;
      } else if (videoData && typeof videoData === "object") {
        const maybe = videoData as { url?: string; video?: { url?: string } };
        url = maybe.url ?? maybe.video?.url ?? null;
      }

      if (url) {
        setVideoSrc(url);
      } else {
        setErrorMsg("La generación no devolvió un video válido.");
      }
      if (statusText) setStatusMsg(statusText);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al generar el video.");
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

  const isButtonDisabled = status !== "READY" || isLoading || !imageStartFile || !prompt || !gradioUrl;

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Pathfinder Studio — LTX-2.3</h1>

      {!gradioUrl && (
        <p style={{ color: "#6b7280" }}>Buscando runtime Pathfinder...</p>
      )}

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
        <span>
          Estado del backend: {gradioUrl ? status : "SIN CONEXIÓN"}
        </span>
      </div>

      {/* ---- Start Frame (obligatorio) ---- */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Start Frame</label>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleStartFileChange} />
        {imageStartPreview && (
          <div style={{ marginTop: 8 }}>
            <img src={imageStartPreview} alt="start preview" style={{ maxWidth: 240, borderRadius: 8 }} />
          </div>
        )}
      </div>

      {/* ---- End Frame (opcional, igual que en Gradio) ---- */}
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