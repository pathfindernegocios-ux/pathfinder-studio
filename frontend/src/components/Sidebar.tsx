import { NavLink } from "react-router-dom";
import { palette, fontDisplay, fontUI, NAV_ITEMS } from "../styles/tokens";

interface SidebarProps {
  statusColor: string;
  statusLabel: string;
  status: "STARTING" | "READY" | "BUSY" | "ERROR" | "UNKNOWN";
  sessionUptime: string;
  stationDetailsOpen: boolean;
  onToggleStationDetails: () => void;
  onDownloadNotebook: () => void;
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
  const isPulsing = status === "BUSY" || status === "STARTING";

  return (
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
          if (item.enabled) {
            const path = item.key === "studio" ? "/studio" : `/${item.key}`;
            return (
              <NavLink
                key={item.key}
                to={path}
                className={({ isActive }) =>
                  isActive ? "pf-nav-item pf-nav-item-active" : "pf-nav-item"
                }
                style={{ textDecoration: "none" }}
              >
                <span style={{ fontSize: 13, opacity: 0.8 }}>{item.glyph}</span>
                {item.label}
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
              <span style={{ fontSize: 13, opacity: 0.8 }}>{item.glyph}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 14, marginTop: 14 }}>
        {/* Resto idéntico al Sidebar anterior */}
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
          <button onClick={onDownloadNotebook} className="pf-nav-item" style={{ fontSize: 12.5 }}>
            Descargar notebook
          </button>
          <button onClick={onLogout} className="pf-nav-item" style={{ fontSize: 12.5 }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}