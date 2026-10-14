// src/components/studio/Skeletons.tsx
// Skeletons premium — image / video / audio.
// Concepto: Develop Effect. La interfaz es invisible. El contenido se revela
// desde el blur, como una fotografía tomando forma en el cuarto oscuro.
import React from "react";

// ═══════════════════════════════════════════════════════════════════════════
// DEVELOP FIELD — campo etéreo que se enfoca conforme avanza el progreso
// ═══════════════════════════════════════════════════════════════════════════
const DevelopField: React.FC<{ progress: number }> = ({ progress }) => {
  // Blur que baja de 70px a 6px. No llega a 0: el residuo suave se disuelve
  // cuando el resultado real entra con su propio fade.
  const blurAmount = 70 - progress * 64;
  const opacity = 0.75 + progress * 0.25;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: "-25%",
        filter: `blur(${blurAmount}px)`,
        opacity,
        transition:
          "filter 900ms cubic-bezier(0.4, 0, 0.2, 1), opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: "none",
      }}
    >
      {/* Radial violeta — arriba izq, deriva lento */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "8%",
          width: "72%",
          height: "72%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.55) 0%, rgba(139,92,246,0.16) 45%, transparent 78%)",
          animation: "pfDevelopDrift1 9s ease-in-out infinite",
        }}
      />

      {/* Radial cyan — abajo der, deriva en contrafase */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          right: "12%",
          width: "68%",
          height: "68%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(34,211,238,0.38) 0%, rgba(34,211,238,0.10) 45%, transparent 78%)",
          animation: "pfDevelopDrift2 11s ease-in-out infinite",
        }}
      />

      {/* Núcleo blanco — emerge con el progreso, se expande y se disuelve */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: `${26 + progress * 34}%`,
          height: `${26 + progress * 34}%`,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 40%, transparent 68%)",
          opacity: 0.35 + progress * 0.65,
          transition:
            "width 900ms cubic-bezier(0.4, 0, 0.2, 1), height 900ms cubic-bezier(0.4, 0, 0.2, 1), opacity 900ms ease",
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// FRAME — contenedor base con aspect ratio, grain, vignette y progress line
// ═══════════════════════════════════════════════════════════════════════════
interface FrameProps {
  aspectRatio?: string;
  width?: string | number;
  height?: number;
  progress: number;
  children?: React.ReactNode;
  label?: string;
  sublabel?: string;
}

const Frame: React.FC<FrameProps> = ({
  aspectRatio,
  width,
  height,
  progress,
  children,
  label,
  sublabel,
}) => {
  const style: React.CSSProperties = {
    position: "relative",
    width: width ?? "100%",
    borderRadius: 20,
    overflow: "hidden",
    background: "#050507",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  if (aspectRatio) style.aspectRatio = aspectRatio;
  if (height) style.height = height;

  return (
    <div style={style}>
      {/* Campo etéreo que se revela */}
      <DevelopField progress={progress} />

      {/* Grain cinematográfico — textura analógica, siempre presente */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.028,
          mixBlendMode: "overlay",
          pointerEvents: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette suave — profundidad sin marco visible */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 48%, rgba(0,0,0,0.42) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Contenido específico por tipo (scan line, waveform, etc.) */}
      {children}

      {/* Etiqueta única al pie — sin bordes, sin caja */}
      {label && (
        <div
          style={{
            position: "absolute",
            bottom: 22,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: "var(--pf-font-mono, ui-monospace, monospace)",
              fontSize: "0.5625rem",
              fontWeight: 500,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.50)",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
          {sublabel && (
            <div
              style={{
                fontFamily: "var(--pf-font-mono, ui-monospace, monospace)",
                fontSize: "0.5rem",
                fontWeight: 500,
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.22)",
                whiteSpace: "nowrap",
              }}
            >
              {sublabel}
            </div>
          )}
        </div>
      )}

      {/* Progress line hairline al fondo del frame */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: "rgba(255,255,255,0.04)",
          zIndex: 3,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, Math.max(0, progress * 100))}%`,
            background:
              "linear-gradient(90deg, rgba(139,92,246,0.9) 0%, rgba(34,211,238,0.9) 100%)",
            boxShadow: "0 0 10px rgba(139,92,246,0.55)",
            transition: "width 900ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS — label + tiempo al pie (fuera del frame)
// ═══════════════════════════════════════════════════════════════════════════
const SkeletonProgress: React.FC<{ progress: number; label: string; startedAt?: number }> = ({
  progress,
  label,
  startedAt,
}) => {
  const [, tick] = React.useState(0);
  React.useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const elapsed = startedAt
    ? formatTimeMs(Date.now() - startedAt)
    : formatElapsed(progress);

  return (
    <div
      style={{
        marginTop: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        paddingLeft: 4,
        paddingRight: 4,
      }}
    >
      <span
        style={{
          fontFamily: "var(--pf-font-mono, ui-monospace, monospace)",
          fontSize: "0.6875rem",
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.42)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--pf-font-mono, ui-monospace, monospace)",
          fontSize: "0.6875rem",
          fontWeight: 500,
          letterSpacing: "0.10em",
          color: "rgba(255,255,255,0.26)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {elapsed}
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON IMAGE
// ═══════════════════════════════════════════════════════════════════════════
interface SkeletonProps {
  aspectRatio?: string;
  modelLabel?: string;
  progress?: number;
  stepMessage?: string;
  startedAt?: number;
}

export const SkeletonImage: React.FC<SkeletonProps & { width?: string | number }> = ({
  aspectRatio = "1/1",
  modelLabel = "Modelo",
  progress = 0,
  width,
  startedAt,
}) => {
  return (
    <div style={{ width: width ?? "100%", display: "flex", flexDirection: "column" }}>
      <Frame
        aspectRatio={aspectRatio}
        progress={progress}
        label="Revelando"
        sublabel={modelLabel.toUpperCase()}
      />
      <SkeletonProgress progress={progress} label="Generando imagen" startedAt={startedAt} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON VIDEO
// ═══════════════════════════════════════════════════════════════════════════
export const SkeletonVideo: React.FC<SkeletonProps & {
  width?: string | number;
  totalScenes?: number;
  currentScene?: number;
}> = ({
  aspectRatio = "16/9",
  modelLabel = "Modelo",
  progress = 0,
  width,
  totalScenes = 1,
  currentScene = 1,
  startedAt,
}) => {
  const isStoryboard = totalScenes > 1;
  const sublabel = isStoryboard
    ? `ESCENA ${currentScene} DE ${totalScenes}`
    : modelLabel.toUpperCase();

  return (
    <div style={{ width: width ?? "100%", display: "flex", flexDirection: "column" }}>
      <Frame
        aspectRatio={aspectRatio}
        progress={progress}
        label="Revelando"
        sublabel={sublabel}
      >
        {/* Scan line vertical tenue — barre de izq a der, marca el progreso */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 48,
            left: `calc(${Math.min(100, progress * 100)}% - 24px)`,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.055) 50%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 2,
            transition: "left 900ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </Frame>
      <SkeletonProgress
        progress={progress}
        label={isStoryboard ? `Escena ${currentScene} de ${totalScenes}` : "Generando video"}
        startedAt={startedAt}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON AUDIO — waveform que se dibuja de izquierda a derecha
// ═══════════════════════════════════════════════════════════════════════════
export const SkeletonAudio: React.FC<SkeletonProps & { width?: string | number }> = ({
  modelLabel = "Modelo",
  progress = 0,
  width,
  startedAt,
}) => {
  const BAR_COUNT = 56;
  const completedBars = Math.floor(Math.max(0, Math.min(1, progress)) * BAR_COUNT);
  const activeBar = Math.min(BAR_COUNT - 1, completedBars);

  return (
    <div style={{ width: width ?? "min(560px, 100%)", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          position: "relative",
          height: 100,
          borderRadius: 20,
          overflow: "hidden",
          background: "#050507",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Campo etéreo */}
        <DevelopField progress={progress} />

        {/* Grain */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.028,
            mixBlendMode: "overlay",
            pointerEvents: "none",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
          }}
        />

        {/* Vignette */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.42) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Waveform — solo las barras completadas son visibles */}
        <div
          style={{
            position: "absolute",
            left: 28,
            right: 28,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            height: 48,
          }}
        >
          {Array.from({ length: BAR_COUNT }).map((_, i) => {
            const isDone = i < completedBars;
            const isActive = i === activeBar && progress < 1 && progress > 0;
            // Altura pseudo-aleatoria pero determinística
            const seed = (i * 2654435761) % 1000;
            const barHeight = 5 + (seed % 38);

            const opacity = isDone ? 0.88 : isActive ? 1 : 0;
            const background = isActive
              ? "#FFFFFF"
              : "linear-gradient(180deg, #C4B5FD 0%, #8B5CF6 100%)";

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${barHeight}px`,
                  maxHeight: "100%",
                  borderRadius: 1,
                  background: isDone ? background : "#FFFFFF",
                  opacity,
                  boxShadow: isActive
                    ? "0 0 10px rgba(255,255,255,0.95)"
                    : isDone
                    ? "0 0 4px rgba(139,92,246,0.5)"
                    : "none",
                  transition:
                    "opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 600ms ease",
                }}
              />
            );
          })}
        </div>

        {/* Etiqueta al pie centrada */}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: "var(--pf-font-mono, ui-monospace, monospace)",
              fontSize: "0.5rem",
              fontWeight: 500,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.48)",
              whiteSpace: "nowrap",
            }}
          >
            Sintetizando
          </div>
          <div
            style={{
              fontFamily: "var(--pf-font-mono, ui-monospace, monospace)",
              fontSize: "0.4375rem",
              fontWeight: 500,
              letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.22)",
              whiteSpace: "nowrap",
            }}
          >
            {modelLabel.toUpperCase()}
          </div>
        </div>

        {/* Progress line hairline */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            background: "rgba(255,255,255,0.04)",
            zIndex: 3,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, Math.max(0, progress * 100))}%`,
              background:
                "linear-gradient(90deg, rgba(139,92,246,0.9) 0%, rgba(34,211,238,0.9) 100%)",
              boxShadow: "0 0 10px rgba(139,92,246,0.55)",
              transition: "width 900ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>
      <SkeletonProgress progress={progress} label="Generando audio" startedAt={startedAt} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function formatTimeMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatElapsed(pct: number): string {
  const totalSec = Math.round((pct / 100) * 180);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
export const SkeletonStyles: React.FC = () => (
  <style>{`
    @keyframes pfDevelopDrift1 {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.9; }
      50%      { transform: translate(6%, -4%) scale(1.08); opacity: 1; }
    }
    @keyframes pfDevelopDrift2 {
      0%, 100% { transform: translate(0, 0) scale(1.05); opacity: 0.8; }
      50%      { transform: translate(-5%, 5%) scale(1); opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      [style*="pfDevelopDrift"] { animation: none !important; }
    }
  `}</style>
);
