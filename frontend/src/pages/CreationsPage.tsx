import { useEffect, useState } from "react";
import { useCreations } from "../hooks/useCreations";
import type { Creation } from "../types";
import { palette, fontUI } from "../styles/tokens";

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function expiresText(expiresAt: string) {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diffMs = exp - now;

  if (diffMs <= 0) return "Expirada";

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 1) return "Expira mañana";
  return `Expira en ${days} días`;
}

export function CreationsPage() {
  const { creations, getCreations, deleteCreation, getDownloadUrl } = useCreations();
  const [isLoading, setIsLoading] = useState(true);

  const loadCreations = async () => {
    setIsLoading(true);
    await getCreations();
    setIsLoading(false);
  };

  useEffect(() => {
    loadCreations();
  }, []);

  const handleDownload = async (creation: Creation) => {
    const url = await getDownloadUrl(creation.id);
    if (url) window.open(url, "_blank");
  };

  const handleDelete = async (creation: Creation) => {
    const ok = confirm(`¿Eliminar la creación "${creation.prompt?.slice(0, 40)}..."?`);
    if (!ok) return;

    await deleteCreation(creation.id);
    await loadCreations();
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontFamily: fontUI,
            fontSize: 26,
            fontWeight: 600,
            color: palette.ink,
            letterSpacing: -0.3,
            marginBottom: 6,
          }}
        >
          Mis creaciones
        </h2>
        <p style={{ fontSize: 13.5, color: palette.inkMuted }}>
          Tus generaciones guardadas se eliminan automáticamente después de 7 días.
        </p>
      </div>

      {isLoading ? (
        <div style={{ color: palette.inkFaint, fontSize: 14 }}>Cargando creaciones...</div>
      ) : creations.length === 0 ? (
        <div
          style={{
            border: `1px dashed ${palette.border}`,
            borderRadius: 16,
            padding: "40px 24px",
            textAlign: "center",
            color: palette.inkFaint,
            fontSize: 14,
          }}
        >
          Aún no has guardado ninguna creación.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {creations.map((creation) => (
            <div
              key={creation.id}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${palette.border}`,
                borderRadius: 16,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13.5, color: palette.inkMuted, lineHeight: 1.5 }}>
                {creation.prompt ? creation.prompt.slice(0, 80) + (creation.prompt.length > 80 ? "…" : "") : "Sin prompt"}
              </div>

              <div style={{ fontSize: 12, color: palette.inkFaint }}>
                {formatDate(creation.created_at)} · {expiresText(creation.expires_at)}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <button
                  onClick={() => handleDownload(creation)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: 12.5,
                    borderRadius: 10,
                    border: `1px solid ${palette.border}`,
                    background: "transparent",
                    color: palette.ink,
                    cursor: "pointer",
                    fontFamily: fontUI,
                  }}
                >
                  Descargar
                </button>
                <button
                  onClick={() => handleDelete(creation)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: 12.5,
                    borderRadius: 10,
                    border: `1px solid ${palette.border}`,
                    background: "transparent",
                    color: palette.danger,
                    cursor: "pointer",
                    fontFamily: fontUI,
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}