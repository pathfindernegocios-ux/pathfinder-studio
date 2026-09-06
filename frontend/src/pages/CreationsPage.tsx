import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreations } from "../hooks/useCreations";
import type { Creation } from "../types";
import { palette, fontUI, fontDisplay } from "../styles/tokens";
import { CreationThumbnail } from "../components/CreationThumbnail";

function getMediaType(creation: Creation): "video" | "image" | "audio" {
  if (creation.media_type) return creation.media_type;
  const model = (creation.model || creation.engine || "").toLowerCase();
  if (model.includes("flux") || model.includes("krea") || model.includes("image")) return "image";
  if (model.includes("voice") || model.includes("audio")) return "audio";
  return "video";
}

/** Convierte el aspect_ratio guardado en Studio (ej. "16:9 Landscape") a un valor CSS "16 / 9". */
function aspectRatioCss(creation: Creation): string {
  const raw = creation.aspect_ratio || "";
  const match = raw.match(/(\d+)\s*:\s*(\d+)/);
  if (match) return `${match[1]} / ${match[2]}`;
  return getMediaType(creation) === "image" ? "1 / 1" : "16 / 9";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

function groupByDate(creations: Creation[]) {
  const sorted = [...creations].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const map = new Map<string, Creation[]>();
  for (const c of sorted) {
    const d = c.created_at.slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(c);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({ date, items }));
}

const galleryStyles = `
.pf-creations-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1080px) {
  .pf-creations-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 680px) {
  .pf-creations-grid { grid-template-columns: repeat(2, 1fr); }
}
.pf-creation-card { outline: none; }
.pf-card-overlay { opacity: 0; transition: opacity 0.2s ease; }
.pf-creation-card:hover .pf-card-overlay,
.pf-creation-card:focus-visible .pf-card-overlay {
  opacity: 1;
}
.pf-creation-card:focus-visible {
  box-shadow: 0 0 0 2px ${palette.accent};
  border-radius: 14px;
}
.pf-card-delete { opacity: 0; transition: opacity 0.2s ease; }
.pf-creation-card:hover .pf-card-delete,
.pf-creation-card:focus-visible .pf-card-delete {
  opacity: 1;
}
`;

export function CreationsPage() {
  const { creations, getCreations, deleteCreation, getDownloadUrl } = useCreations();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "video" | "image" | "audio">("all");
  const [showDeleteModal, setShowDeleteModal] = useState<Creation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await getCreations();
      setIsLoading(false);
    };
    load();
  }, []);

  const filtered = creations.filter((c) => {
    if (filter === "all") return true;
    return getMediaType(c) === filter;
  });
  const grouped = groupByDate(filtered);

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    setIsDeleting(true);
    await deleteCreation(showDeleteModal.id);
    setIsDeleting(false);
    setShowDeleteModal(null);
    await getCreations();
  };

  const handleDownload = async (creation: Creation) => {
    const url = await getDownloadUrl(creation.id);
    if (url) window.open(url, "_blank");
  };

  const handleReuse = (creation: Creation) => {
    const reuseData = {
      prompt: creation.prompt || "",
      resolution: creation.resolution || "720p",
      aspect_ratio: creation.aspect_ratio || "16:9 Landscape",
      duration: creation.duration || "5 Seconds (121 frames)",
      seed: creation.seed ?? -1,
      guide_scale: creation.guide_scale ?? 4.0,
      match_audio_dur: creation.match_audio_dur ?? false,
    };
    sessionStorage.setItem("pf_reuse_data", JSON.stringify(reuseData));
    window.location.href = "/studio";
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px", color: palette.inkFaint }}>
        Cargando biblioteca...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px", width: "100%" }}>
      <style>{galleryStyles}</style>

      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: fontDisplay,
            fontSize: 34,
            fontWeight: 600,
            color: palette.ink,
            letterSpacing: -0.5,
            margin: 0,
          }}
        >
          Mis creaciones
        </h1>
        <p style={{ fontSize: 15, color: palette.inkMuted, marginTop: 8 }}>
          Todo lo que has creado con Pathfinder.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[
          { key: "all", label: "Todo" },
          { key: "video", label: "Videos" },
          { key: "image", label: "Fotos" },
          { key: "audio", label: "Audio" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 13.5,
              fontFamily: fontUI,
              cursor: "pointer",
              border: `1px solid ${filter === f.key ? palette.accent : palette.border}`,
              background: filter === f.key ? palette.accentDim : "transparent",
              color: filter === f.key ? palette.accentStrong : palette.inkMuted,
              transition: "all 0.15s ease",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {grouped.map((group) => (
        <div key={group.date} style={{ marginBottom: 40 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: palette.inkFaint,
              marginBottom: 12,
              textTransform: "capitalize",
            }}
          >
            {formatDate(group.date)}
          </div>
          <div className="pf-creations-grid">
            {group.items.map((creation) => (
              <CreationCard
                key={creation.id}
                creation={creation}
                onDownload={() => handleDownload(creation)}
                onReuse={() => handleReuse(creation)}
                onDelete={() => setShowDeleteModal(creation)}
                getDownloadUrl={getDownloadUrl}
              />
            ))}
          </div>
        </div>
      ))}

      {grouped.length === 0 && (
        <div style={{ padding: "60px 0", textAlign: "center", color: palette.inkFaint }}>
          No hay creaciones en esta categoría.
        </div>
      )}

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
          onClick={() => setShowDeleteModal(null)}
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
                onClick={() => setShowDeleteModal(null)}
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

function CreationCard({
  creation,
  onDownload,
  onReuse,
  onDelete,
  getDownloadUrl,
}: {
  creation: Creation;
  onDownload: () => void;
  onReuse: () => void;
  onDelete: () => void;
  getDownloadUrl: (id: string) => Promise<string | null>;
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const mediaType = getMediaType(creation);
  const playLabel = mediaType === "image" ? "Ver" : "Reproducir";

  const openDetail = (autoplay: boolean) => {
    const shouldAutoplay = autoplay || mediaType === "video";
    navigate(shouldAutoplay ? `/creations/${creation.id}?autoplay=1` : `/creations/${creation.id}`);
  };

  return (
    <div
      className="pf-creation-card"
      role="button"
      tabIndex={0}
      onClick={() => openDetail(mediaType === "video")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail(mediaType === "video");
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        background: palette.surfaceSoft,
        border: `1px solid ${palette.border}`,
        cursor: "pointer",
        aspectRatio: aspectRatioCss(creation),
        boxShadow: isHovered ? "0 12px 40px rgba(0,0,0,0.5)" : "none",
        transition: "box-shadow 0.25s ease, border-color 0.25s ease",
      }}
    >
      <CreationThumbnail
        creation={creation}
        getDownloadUrl={getDownloadUrl}
        isHovered={isHovered}
      />

      <button
        className="pf-card-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Eliminar creación"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: "none",
          background: "rgba(10,12,10,0.6)",
          color: palette.danger,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        ✕
      </button>

      <div
        className="pf-card-overlay"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,12,10,0.55)",
          backdropFilter: "blur(4px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 12,
          pointerEvents: isHovered ? "auto" : "none",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openDetail(true);
            }}
            style={actionButtonStyle(palette.ink)}
          >
            {playLabel}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openDetail(false);
            }}
            style={actionButtonStyle(palette.ink)}
          >
            Abrir
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onReuse();
            }}
            style={actionButtonStyle(palette.ink)}
          >
            Reutilizar
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDownload();
            }}
            style={actionButtonStyle(palette.ink)}
          >
            Descargar
          </button>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 10,
            fontSize: 11,
            color: palette.inkFaint,
          }}
        >
          {creation.model || creation.engine} · {formatShortDateTime(creation.created_at)}
        </div>
      </div>
    </div>
  );
}

function actionButtonStyle(color: string): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color,
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: fontUI,
    textAlign: "left",
  };
}