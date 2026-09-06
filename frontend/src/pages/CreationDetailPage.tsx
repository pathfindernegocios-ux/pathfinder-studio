import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useCreations } from "../hooks/useCreations";
import type { Creation } from "../types";
import { palette, fontUI, fontDisplay } from "../styles/tokens";

function getMediaType(creation: Creation) {
  const model = (creation.model || creation.engine || "").toLowerCase();
  if (model.includes("flux") || model.includes("krea") || model.includes("image")) return "image";
  if (model.includes("voice") || model.includes("audio")) return "audio";
  return "video";
}

/** Igual criterio que en la galería, para que el marco del "trofeo" respete el encuadre real. */
function aspectRatioCss(creation: Creation, mediaType: string): string {
  const raw = creation.aspect_ratio || "";
  const match = raw.match(/(\d+)\s*:\s*(\d+)/);
  if (match) return `${match[1]} / ${match[2]}`;
  return mediaType === "image" ? "1 / 1" : "16 / 9";
}

function formatDateTime(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const stageStyles = `
.pf-stage-media video,
.pf-stage-media audio {
  accent-color: ${palette.accent};
}
.pf-stage-media video::-webkit-media-controls-panel {
  background: rgba(8,10,8,0.55);
}
.pf-icon-btn {
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.pf-icon-btn:hover {
  background: rgba(255,255,255,0.1) !important;
}
.pf-config-row {
  border-bottom: 1px solid ${palette.border};
}
.pf-config-row:last-child {
  border-bottom: none;
}
.pf-waveform-bar {
  animation: pf-wave 1.6s ease-in-out infinite;
}
@keyframes pf-wave {
  0%, 100% { transform: scaleY(0.35); }
  50% { transform: scaleY(1); }
}
`;

export function CreationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const autoplay = searchParams.get("autoplay") === "1";
  const { getCreations, deleteCreation, getDownloadUrl } = useCreations();

  const [creation, setCreation] = useState<Creation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(autoplay);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const list = await getCreations();
      const found = list.find((c) => c.id === id) || null;
      setCreation(found);
      setIsLoading(false);
    };
    load();
  }, [id]);

  const loadMediaUrl = async (playAfter: boolean) => {
    if (!creation) return;
    setMediaError(false);
    setIsMediaLoading(true);
    if (playAfter) setShouldAutoplay(true);
    try {
      const url = await getDownloadUrl(creation.id);
      if (url) setMediaUrl(url);
      else setMediaError(true);
    } catch {
      setMediaError(true);
    } finally {
      setIsMediaLoading(false);
    }
  };

  useEffect(() => {
    if (!creation) return;
    const type = getMediaType(creation);
    if (type === "image" || autoplay) {
      loadMediaUrl(autoplay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creation]);

  // Escape cierra el lightbox y el modal de borrado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isLightboxOpen) setIsLightboxOpen(false);
      else if (showDeleteModal) setShowDeleteModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLightboxOpen, showDeleteModal]);

  if (isLoading) {
    return <div style={{ padding: 40, color: palette.inkFaint }}>Cargando...</div>;
  }
  if (!creation) {
    return <div style={{ padding: 40, color: palette.inkFaint }}>Creación no encontrada.</div>;
  }

  const mediaType = getMediaType(creation);
  const ratio = aspectRatioCss(creation, mediaType);
  const title = creation.prompt?.trim() || "Sin título";

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteCreation(creation.id);
    setIsDeleting(false);
    setShowDeleteModal(false);
    window.location.href = "/creations";
  };

  const handleDownload = async () => {
    const url = await getDownloadUrl(creation.id);
    if (url) window.open(url, "_blank");
  };

  const handleReuse = () => {
    sessionStorage.setItem(
      "pf_reuse_data",
      JSON.stringify({
        prompt: creation.prompt || "",
        resolution: creation.resolution || "720p",
        aspect_ratio: creation.aspect_ratio || "16:9 Landscape",
        duration: creation.duration || "5 Seconds (121 frames)",
        seed: creation.seed ?? -1,
        guide_scale: creation.guide_scale ?? 4.0,
        match_audio_dur: creation.match_audio_dur ?? false,
      })
    );
    window.location.href = "/studio";
  };

  const configFields: Array<[string, string]> = [
    ["Prompt", creation.prompt || "-"],
    ["Resolución", creation.resolution || "-"],
    ["Duración", creation.duration || "-"],
    ["Seed", creation.seed != null ? String(creation.seed) : "-"],
    ["Aspect ratio", creation.aspect_ratio || "-"],
    ["Guide scale", creation.guide_scale != null ? String(creation.guide_scale) : "-"],
    ["Match audio duration", creation.match_audio_dur ? "Sí" : "No"],
    ["Modelo", creation.model || creation.engine || "-"],
  ];

  return (
    <div
      style={{
        minHeight: "100%",
        background: `radial-gradient(circle at 50% 0%, ${palette.surfaceSoft} 0%, #07080700 55%)`,
      }}
    >
      <style>{stageStyles}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 64px" }}>
        {/* Barra superior */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <Link
            to="/creations"
            style={{
              color: palette.inkMuted,
              fontSize: 14,
              textDecoration: "none",
              fontFamily: fontUI,
            }}
          >
            ← Mis creaciones
          </Link>

          <div style={{ display: "flex", gap: 8 }}>
            <IconButton label="Descargar" onClick={handleDownload}>
              ⬇
            </IconButton>
            <IconButton label="Reutilizar" onClick={handleReuse}>
              ⟳
            </IconButton>
            <IconButton label="Eliminar" onClick={() => setShowDeleteModal(true)} danger>
              ✕
            </IconButton>
          </div>
        </div>

        {/* Escenario: la obra como protagonista */}
        <div
          className="pf-stage-media"
          style={{
            width: "100%",
            aspectRatio: ratio,
            maxHeight: "72vh",
            margin: "0 auto",
            borderRadius: 20,
            overflow: "hidden",
            background: "#08090880",
            border: `1px solid ${palette.border}`,
            boxShadow: "0 40px 120px rgba(0,0,0,0.55), 0 2px 0 rgba(255,255,255,0.02) inset",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {mediaType === "video" && !mediaUrl && (
            <TrophyPlayButton
              isLoading={isMediaLoading}
              onClick={() => loadMediaUrl(true)}
            />
          )}

          {mediaType === "video" && mediaUrl && (
            <video
              ref={mediaRef as any}
              src={mediaUrl}
              controls
              autoPlay={shouldAutoplay}
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
              onError={() => setMediaError(true)}
            />
          )}

          {mediaType === "image" && mediaUrl && (
            <img
              src={mediaUrl}
              alt={title}
              onClick={() => setIsLightboxOpen(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                cursor: "zoom-in",
              }}
              onError={() => setMediaError(true)}
            />
          )}

          {mediaType === "audio" && (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 28,
                padding: 32,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 64 }}>
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="pf-waveform-bar"
                    style={{
                      width: 4,
                      height: `${20 + ((i * 37) % 44)}px`,
                      borderRadius: 2,
                      background: palette.accent,
                      opacity: mediaUrl ? 0.85 : 0.25,
                      animationDelay: `${i * 0.05}s`,
                      animationPlayState: mediaUrl ? "running" : "paused",
                    }}
                  />
                ))}
              </div>

              {mediaUrl ? (
                <audio
                  ref={mediaRef as any}
                  src={mediaUrl}
                  controls
                  autoPlay={shouldAutoplay}
                  style={{ width: "100%", maxWidth: 480 }}
                  onError={() => setMediaError(true)}
                />
              ) : (
                <TrophyPlayButton
                  isLoading={isMediaLoading}
                  label="Cargar audio"
                  compact
                  onClick={() => loadMediaUrl(true)}
                />
              )}
            </div>
          )}

          {mediaError && (
            <div
              style={{
                position: "absolute",
                bottom: 14,
                right: 16,
                fontSize: 13,
                color: palette.danger,
                background: "rgba(0,0,0,0.5)",
                padding: "4px 10px",
                borderRadius: 8,
              }}
            >
              No se pudo cargar el medio. Reintenta.
            </div>
          )}
        </div>

        {/* Firma de la obra: prompt + fechas, discreto */}
        <div style={{ marginTop: 28, maxWidth: 760, margin: "28px auto 0" }}>
          <h1
            style={{
              fontFamily: fontDisplay,
              fontSize: 21,
              fontWeight: 500,
              lineHeight: 1.4,
              color: palette.ink,
              margin: 0,
            }}
          >
            {title}
          </h1>
          <div
            style={{
              display: "flex",
              gap: 18,
              marginTop: 10,
              fontSize: 12.5,
              color: palette.inkFaint,
              fontFamily: fontUI,
            }}
          >
            <span>Creado · {formatDateTime(creation.created_at)}</span>
            <span>Expira · {formatDateTime(creation.expires_at)}</span>
          </div>
        </div>

        {/* Configuración: secundaria, plegable */}
        <div style={{ maxWidth: 760, margin: "36px auto 0" }}>
          <button
            onClick={() => setShowConfig((v) => !v)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: fontUI,
              fontSize: 12.5,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: palette.inkFaint,
            }}
          >
            <span style={{ transform: showConfig ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
              ›
            </span>
            Detalles de generación
          </button>

          {showConfig && (
            <div
              style={{
                marginTop: 14,
                border: `1px solid ${palette.border}`,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {configFields.map(([label, value]) => (
                <div
                  key={label}
                  className="pf-config-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 24,
                    padding: "10px 16px",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: palette.inkFaint, fontFamily: fontUI }}>{label}</span>
                  <span
                    style={{
                      color: palette.inkMuted,
                      fontFamily: fontUI,
                      textAlign: "right",
                      maxWidth: "70%",
                      wordBreak: "break-word",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox de imagen */}
      {isLightboxOpen && mediaUrl && mediaType === "image" && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
            cursor: "zoom-out",
          }}
        >
          <img
            src={mediaUrl}
            alt={title}
            style={{ maxWidth: "92vw", maxHeight: "92vh", objectFit: "contain" }}
          />
        </div>
      )}

      {/* Modal de confirmación de borrado */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: palette.surfaceStrong,
              border: `1px solid ${palette.border}`,
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: fontDisplay, fontSize: 20, color: palette.ink, margin: "0 0 8px" }}>
              ¿Eliminar esta creación?
            </h3>
            <p style={{ fontSize: 14, color: palette.inkMuted, margin: "0 0 24px" }}>
              Esta acción eliminará la creación de tu biblioteca.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: fontUI,
                  border: `1px solid ${palette.border}`,
                  background: "transparent",
                  color: palette.inkMuted,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: fontUI,
                  border: "none",
                  background: palette.dangerDim,
                  color: palette.danger,
                  cursor: "pointer",
                }}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className="pf-icon-btn"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: `1px solid ${palette.border}`,
        background: "rgba(255,255,255,0.04)",
        color: danger ? palette.danger : palette.inkMuted,
        fontSize: 14,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function TrophyPlayButton({
  isLoading,
  onClick,
  label = "Reproducir",
  compact,
}: {
  isLoading: boolean;
  onClick: () => void;
  label?: string;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        padding: compact ? "12px 24px" : "18px 36px",
        borderRadius: 999,
        background: palette.accent,
        color: "#0A0B0A",
        border: "none",
        fontFamily: fontUI,
        fontSize: compact ? 14 : 16,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
      }}
    >
      {isLoading ? "Cargando..." : `▶ ${label}`}
    </button>
  );
}