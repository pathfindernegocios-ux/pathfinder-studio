import { palette, fontDisplay } from "../styles/tokens";
import { durationSeconds, formatHMS } from "../lib/helpers";

interface GenerationResultProps {
  videoSrc: string;
  videoRatio: number | null;
  onVideoRatioChange: (ratio: number) => void;
  selectedAspect: { label: string; short: string; ratio: number } | undefined;
  duration: string;
  completedDurationSec: number | null;
  onCreateAnother: () => void;
  engineLabel: string;
}

export function GenerationResult({
  videoSrc,
  videoRatio,
  onVideoRatioChange,
  selectedAspect,
  duration,
  completedDurationSec,
  onCreateAnother,
  engineLabel,
}: GenerationResultProps) {
  const ratio = videoRatio ?? selectedAspect?.ratio ?? 16 / 9;
  const aspectShort = selectedAspect?.short ?? "";
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
          {engineLabel} · {aspectShort} · {durationSeconds(duration)} s
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
            if (videoWidth > 0 && videoHeight > 0) onVideoRatioChange(videoWidth / videoHeight);
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
        <button onClick={onCreateAnother} className="pf-btn-primary" style={{ padding: "12px 22px", fontSize: 14 }}>
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
}