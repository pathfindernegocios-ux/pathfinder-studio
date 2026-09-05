import { useEffect, useState } from "react";
import { useCreations } from "../hooks/useCreations";
import type { Creation } from "../types";
import { palette, fontUI, fontDisplay } from "../styles/tokens";

function getMediaType(creation: Creation): "video" | "image" | "audio" {
  const model = (creation.model || creation.engine || "").toLowerCase();
  if (model.includes("flux") || model.includes("image")) return "image";
  if (model.includes("voice") || model.includes("audio")) return "audio";
  return "video";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupByDate(creations: Creation[]) {
  const groups: { date: string; items: Creation[] }[] = [];
  const map = new Map<string, Creation[]>();
  for (const c of creations) {
    const d = c.created_at.slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(c);
  }
  for (const [date, items] of map.entries()) {
    groups.push({ date, items });
  }
  return groups;
}

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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 34, fontWeight: 600, color: palette.ink, letterSpacing: -0.5, margin: 0 }}>
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
          <div style={{ fontSize: 13, fontWeight: 500, color: palette.inkFaint, marginBottom: 12, textTransform: "capitalize" }}>
            {formatDate(group.date)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {group.items.map((creation) => (
              <div
                key={creation.id}
                style={{
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: palette.surfaceSoft,
                  border: `1px solid ${palette.border}`,
                  cursor: "pointer",
                  aspectRatio: getMediaType(creation) === "video" ? "16 / 9" : getMediaType(creation) === "image" ? "1 / 1" : "4 / 3",
                }}
                onClick={() => (window.location.href = `/creations/${creation.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      getMediaType(creation) === "video"
                        ? "linear-gradient(135deg, #1a1d21 0%, #111315 100%)"
                        : getMediaType(creation) === "image"
                        ? "linear-gradient(135deg, #20241f 0%, #141714 100%)"
                        : "linear-gradient(135deg, #1d2126 0%, #101316 100%)",
                    color: palette.inkFaint,
                    fontSize: 24,
                  }}
                >
                  {getMediaType(creation) === "video" ? "▶" : getMediaType(creation) === "image" ? "🖼" : "🎵"}
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: 12,
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0";
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReuse(creation); }}
                      style={{ background: "rgba(255,255,255,0.1)", border: "none", color: palette.ink, borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontFamily: fontUI, textAlign: "left" }}
                    >
                      Reutilizar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(creation); }}
                      style={{ background: "rgba(255,255,255,0.1)", border: "none", color: palette.ink, borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontFamily: fontUI, textAlign: "left" }}
                    >
                      Descargar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDeleteModal(creation); }}
                      style={{ background: "rgba(255,255,255,0.1)", border: "none", color: palette.danger, borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontFamily: fontUI, textAlign: "left" }}
                    >
                      Eliminar
                    </button>
                  </div>
                  <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 11, color: palette.inkFaint }}>
                    {creation.model || creation.engine} · {formatTime(creation.created_at)}
                  </div>
                </div>
              </div>
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
