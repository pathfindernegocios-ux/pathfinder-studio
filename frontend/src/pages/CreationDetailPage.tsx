import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCreations } from "../hooks/useCreations";
import type { Creation } from "../types";
import { palette, fontUI, fontDisplay } from "../styles/tokens";

function getMediaType(creation: Creation) {
  const model = (creation.model || creation.engine || "").toLowerCase();
  if (model.includes("flux") || model.includes("image")) return "image";
  if (model.includes("voice") || model.includes("audio")) return "audio";
  return "video";
}

export function CreationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getCreations, deleteCreation, getDownloadUrl } = useCreations();
  const [creation, setCreation] = useState<Creation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const list = await getCreations();
      const found = list.find(c => c.id === id) || null;
      setCreation(found);
      setIsLoading(false);
    };
    load();
  }, [id]);

  // Función para cargar la URL firmada (se llama al hacer clic en Reproducir o al montar si es imagen)
  const loadMediaUrl = async () => {
    if (!creation) return;
    setMediaError(false);
    setIsMediaLoading(true);
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

  // Cargar automáticamente solo si es imagen (para que se muestre de inmediato)
  useEffect(() => {
    if (creation && getMediaType(creation) === "image") {
      loadMediaUrl();
    }
  }, [creation]);

  if (isLoading) return <div style={{ padding: 40, color: palette.inkFaint }}>Cargando...</div>;
  if (!creation) return <div style={{ padding: 40, color: palette.inkFaint }}>Creación no encontrada.</div>;

  const mediaType = getMediaType(creation);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteCreation(creation.id);
    setIsDeleting(false);
    setShowDeleteModal(false);
    window.location.href = "/creations";
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
      <Link to="/creations" style={{ color: palette.inkMuted, fontSize: 14, textDecoration: "none" }}>
        ← Volver a Mis creaciones
      </Link>
      <div style={{ marginTop: 24 }}>
        {/* Contenedor visual */}
        <div
          style={{
            width: "100%",
            maxHeight: "60vh",
            borderRadius: 16,
            overflow: "hidden",
            background: palette.surfaceSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            aspectRatio: mediaType === "video" ? "16/9" : mediaType === "image" ? "1/1" : "4/3",
            position: "relative",
          }}
        >
          {mediaType === "video" && !mediaUrl && (
            <button
              onClick={loadMediaUrl}
              disabled={isMediaLoading}
              style={{
                padding: "16px 32px",
                borderRadius: 999,
                background: palette.accent,
                color: "#0A0B0A",
                border: "none",
                fontFamily: fontUI,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              {isMediaLoading ? "Cargando..." : "▶ Reproducir"}
            </button>
          )}

          {mediaType === "video" && mediaUrl && (
            <video
              src={mediaUrl}
              controls
              autoPlay
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={() => setMediaError(true)}
            />
          )}

          {mediaType === "image" && mediaUrl && (
            <img
              src={mediaUrl}
              alt={creation.prompt || "Creación"}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={() => setMediaError(true)}
            />
          )}

          {mediaType === "audio" && (
            <div style={{ padding: 20, textAlign: "center", width: "100%" }}>
              {mediaUrl ? (
                <audio src={mediaUrl} controls style={{ width: "100%" }} />
              ) : (
                <button
                  onClick={loadMediaUrl}
                  disabled={isMediaLoading}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 999,
                    background: palette.accentDim,
                    color: palette.accentStrong,
                    border: "none",
                    fontFamily: fontUI,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {isMediaLoading ? "Cargando..." : "▶ Cargar audio"}
                </button>
              )}
            </div>
          )}

          {mediaError && (
            <div style={{ position: "absolute", bottom: 12, right: 12, fontSize: 13, color: palette.danger }}>
              No se pudo cargar el medio. Reintenta.
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <h1 style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 600, color: palette.ink }}>
            {creation.prompt?.slice(0, 80) || "Sin título"}
          </h1>
          <div style={{ fontSize: 14, color: palette.inkMuted, marginTop: 8 }}>
            Creado: {new Date(creation.created_at).toLocaleString("es-MX")}
          </div>
          <div style={{ fontSize: 14, color: palette.inkMuted, marginTop: 4 }}>
            Expira: {new Date(creation.expires_at).toLocaleString("es-MX")}
          </div>
        </div>

        <div style={{ marginTop: 32, borderTop: `1px solid ${palette.border}`, paddingTop: 24 }}>
          <h2 style={{ fontFamily: fontDisplay, fontSize: 18, color: palette.ink, marginBottom: 16 }}>
            Configuración
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><span style={{ color: palette.inkFaint }}>Prompt</span><br /><span style={{ color: palette.ink }}>{creation.prompt || "-"}</span></div>
            <div><span style={{ color: palette.inkFaint }}>Resolución</span><br /><span style={{ color: palette.ink }}>{creation.resolution || "-"}</span></div>
            <div><span style={{ color: palette.inkFaint }}>Duración</span><br /><span style={{ color: palette.ink }}>{creation.duration || "-"}</span></div>
            <div><span style={{ color: palette.inkFaint }}>Seed</span><br /><span style={{ color: palette.ink }}>{creation.seed ?? "-"}</span></div>
            <div><span style={{ color: palette.inkFaint }}>Aspect ratio</span><br /><span style={{ color: palette.ink }}>{creation.aspect_ratio || "-"}</span></div>
            <div><span style={{ color: palette.inkFaint }}>Guide scale</span><br /><span style={{ color: palette.ink }}>{creation.guide_scale ?? "-"}</span></div>
            <div><span style={{ color: palette.inkFaint }}>Match audio duration</span><br /><span style={{ color: palette.ink }}>{creation.match_audio_dur ? "Sí" : "No"}</span></div>
            <div><span style={{ color: palette.inkFaint }}>Modelo</span><br /><span style={{ color: palette.ink }}>{creation.model || creation.engine || "-"}</span></div>
          </div>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
          <button
            onClick={() => getDownloadUrl(creation.id).then(url => url && window.open(url, "_blank"))}
            style={{ padding: "12px 24px", borderRadius: 12, background: palette.accentDim, color: palette.accentStrong, border: "none", fontFamily: fontUI, fontSize: 14, cursor: "pointer" }}
          >
            Descargar
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem("pf_reuse_data", JSON.stringify({
                prompt: creation.prompt || "",
                resolution: creation.resolution || "720p",
                aspect_ratio: creation.aspect_ratio || "16:9 Landscape",
                duration: creation.duration || "5 Seconds (121 frames)",
                seed: creation.seed ?? -1,
                guide_scale: creation.guide_scale ?? 4.0,
                match_audio_dur: creation.match_audio_dur ?? false,
              }));
              window.location.href = "/studio";
            }}
            style={{ padding: "12px 24px", borderRadius: 12, background: palette.accent, color: "#0A0B0A", border: "none", fontFamily: fontUI, fontSize: 14, cursor: "pointer" }}
          >
            Reutilizar
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{ padding: "12px 24px", borderRadius: 12, background: "transparent", color: palette.danger, border: `1px solid ${palette.dangerDim}`, fontFamily: fontUI, fontSize: 14, cursor: "pointer" }}
          >
            Eliminar
          </button>
        </div>
      </div>

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
                style={{ padding: "10px 18px", borderRadius: 10, fontSize: 14, fontFamily: fontUI, border: `1px solid ${palette.border}`, background: "transparent", color: palette.inkMuted, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ padding: "10px 18px", borderRadius: 10, fontSize: 14, fontFamily: fontUI, border: "none", background: palette.dangerDim, color: palette.danger, cursor: "pointer" }}
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