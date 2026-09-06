import { palette, fontDisplay, statePillStyle } from "../styles/tokens";
import { formatHMS } from "../lib/helpers";

interface GenerationProgressProps {
  stage: string | undefined;
  progress: number | null;
  progressFrac: number;
  liveElapsedSec: number | null;
  remainingSec: number | null;
  canCancel: boolean;
  isCancelling: boolean;
  onCancel: () => void;
  engineLabel: string;
}

export function GenerationProgress({
  stage,
  progress,
  progressFrac,
  liveElapsedSec,
  remainingSec,
  canCancel,
  isCancelling,
  onCancel,
  engineLabel,
}: GenerationProgressProps) {
  // El componente es compartido por Video e Image; el único dato que
  // lo distingue hoy es el motor activo. Lo usamos para que el
  // fallback del título no asuma siempre "video".
  const isVideo = engineLabel === "LTX-2.3";

  // Preparando vs Generando: mientras no hay progreso numérico el
  // job todavía está iniciando el runtime; en cuanto progress no es
  // null, ya se está renderizando activamente.
  const phase: "preparing" | "running" = progress != null ? "running" : "preparing";
  const phaseLabel = phase === "running" ? "Generando" : "Preparando";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: 360,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <span style={statePillStyle(phase)}>
          <span className="pf-pulse">●</span> {phaseLabel}
        </span>
        <span style={{ fontSize: 12.5, color: palette.inkFaint }}>{engineLabel}</span>
      </div>

      <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: palette.ink, marginBottom: 22 }}>
        {stage || (isVideo ? "Dando forma a tu video" : "Dando forma a tu imagen")}
      </div>

      <div style={{ width: "100%", maxWidth: 360, marginBottom: 16 }}>
        {progress != null ? (
          <>
            <div
              style={{
                width: "100%",
                height: 6,
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.round(progressFrac * 100)}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${palette.accent}, ${palette.accentStrong})`,
                  borderRadius: 999,
                  transition: "width 0.4s ease",
                  boxShadow: `0 0 10px ${palette.accentDim}`,
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: palette.accentStrong, fontWeight: 600 }}>
              {Math.round(progressFrac * 100)}%
            </div>
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: 6,
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div className="pf-indeterminate" />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 22, fontSize: 12, color: palette.inkFaint, marginBottom: 26 }}>
        <span>Tiempo transcurrido · {liveElapsedSec !== null ? formatHMS(liveElapsedSec) : "--:--:--"}</span>
        {remainingSec !== null && <span>Tiempo estimado · {formatHMS(remainingSec)}</span>}
      </div>

      {canCancel && (
        <button onClick={onCancel} disabled={isCancelling} className="pf-btn-cancel">
          {isCancelling ? "Cancelando..." : "Cancelar generación"}
        </button>
      )}
    </div>
  );
}
