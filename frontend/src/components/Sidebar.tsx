import { useState } from "react";
import { NavLink } from "react-router-dom";
import { palette, fontDisplay, fontUI, NAV_ITEMS } from "../styles/tokens";
import {
  StudioIcon,
  ProjectsIcon,
  CreationsIcon,
  AssetsIcon,
  AcademyIcon,
  StationIcon,
  SettingsIcon,
} from "./NavIcons";

const ICONS: Record<string, React.ReactNode> = {
  studio: <StudioIcon />,
  projects: <ProjectsIcon />,
  creations: <CreationsIcon />,
  assets: <AssetsIcon />,
  academy: <AcademyIcon />,
  station: <StationIcon />,
  settings: <SettingsIcon />,
};

const AVAILABLE_MODELS = [
  {
    modelId: "ltx-2.3",
    label: "LTX-2.3",
    description: "Generación de video con audio",
    capability: "video" as const,
  },
  {
    modelId: "krea-2-turbo",
    label: "Krea-2 Turbo",
    description: "Generación de imágenes",
    capability: "image" as const,
  },
  {
    modelId: "flux-2-klein-4b",
    label: "Flux.2 Klein 4B",
    description: "Generación de imágenes experimental",
    capability: "image" as const,
  },
];

interface SidebarProps {
  statusColor: string;
  statusLabel: string;
  status: "STARTING" | "READY" | "BUSY" | "ERROR" | "UNKNOWN";
  sessionUptime: string;
  stationDetailsOpen: boolean;
  onToggleStationDetails: () => void;
  onDownloadNotebook: (modelId: string) => void;
  onLogout: () => void;
}

export function Sidebar({
  statusColor,
  statusLabel,
  status,
  sessionUptime,
  stationDetailsOpen,
  onToggleStationDetails,
  onDownloadNotebook,
  onLogout,
}: SidebarProps) {
  const [isPrepareOpen, setIsPrepareOpen] = useState(false);
  const isPulsing = status === "BUSY" || status === "STARTING";

  const handleDownload = (modelId: string) => {
    onDownloadNotebook(modelId);
    setIsPrepareOpen(false);
  };

  return (
    <>
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
          {NAV_ITEMS.map((item) => {
            const icon = ICONS[item.key] ?? null;
            const path = item.key === "studio" ? "/studio" : `/${item.key}`;

            if (item.enabled) {
              return (
                <NavLink
                  key={item.key}
                  to={path}
                  className={({ isActive }) =>
                    isActive ? "pf-nav-item pf-nav-item-active" : "pf-nav-item"
                  }
                  style={{ textDecoration: "none" }}
                >
                  {icon && (
                    <span style={{ display: "flex", alignItems: "center", fontSize: 18 }}>
                      {icon}
                    </span>
                  )}
                  <span style={{ marginLeft: 8 }}>{item.label}</span>
                </NavLink>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                disabled
                title="Próximamente"
                className="pf-nav-item"
              >
                {icon && (
                  <span style={{ display: "flex", alignItems: "center", fontSize: 18 }}>
                    {icon}
                  </span>
                )}
                <span style={{ marginLeft: 8 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 14, marginTop: 14 }}>
          <button
            type="button"
            onClick={onToggleStationDetails}
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
                backgroundColor: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
                flexShrink: 0,
              }}
              className={isPulsing ? "pf-pulse" : ""}
            />
            <span style={{ fontSize: 13, textAlign: "left", flex: 1 }}>{statusLabel}</span>
          </button>
          {stationDetailsOpen && (
            <div style={{ padding: "8px 10px 2px", fontSize: 12, color: palette.inkFaint, lineHeight: 1.7 }}>
              <div>Sesión activa · {sessionUptime}</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
            <button
              onClick={() => setIsPrepareOpen(true)}
              className="pf-nav-item"
              style={{ fontSize: 12.5 }}
            >
              Preparar estación
            </button>
            <button onClick={onLogout} className="pf-nav-item" style={{ fontSize: 12.5 }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {isPrepareOpen && (
        <div
          onClick={() => setIsPrepareOpen(false)}
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
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: palette.surfaceStrong,
              border: `1px solid ${palette.border}`,
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 560,
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            }}
          >
            <h2
              style={{
                fontFamily: fontDisplay,
                fontSize: 22,
                fontWeight: 600,
                color: palette.ink,
                margin: "0 0 6px",
              }}
            >
              Preparar estación
            </h2>
            <p style={{ fontSize: 14, color: palette.inkMuted, margin: "0 0 24px" }}>
              Selecciona qué quieres generar en Kaggle.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {AVAILABLE_MODELS.map((model) => (
                <div
                  key={model.modelId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    background: palette.surfaceSoft,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: fontUI, fontWeight: 600, color: palette.ink }}>
                      {model.label}
                    </div>
                    <div style={{ fontSize: 12.5, color: palette.inkFaint, marginTop: 2 }}>
                      {model.description}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(model.modelId)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: palette.accentDim,
                      color: palette.accentStrong,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: fontUI,
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}