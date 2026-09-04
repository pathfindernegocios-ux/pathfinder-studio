import { palette, fontDisplay, fontUI } from "../styles/tokens";
import { globalStyleSheet } from "../styles/globalStyles";

interface WelcomeScreenProps {
  onEnterStudio: () => void;
}

export function WelcomeScreen({ onEnterStudio }: WelcomeScreenProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.voidGradient,
        fontFamily: fontUI,
        color: palette.ink,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{globalStyleSheet}</style>
      <div className="pf-intro-glow" aria-hidden="true" />

      <div style={{ padding: "28px 36px", fontSize: 14, color: palette.inkMuted, letterSpacing: 0.2 }}>
        Pathfinder
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 24px",
          position: "relative",
        }}
      >
        <h1
          style={{
            fontFamily: fontDisplay,
            fontWeight: 600,
            fontSize: "clamp(32px, 5vw, 56px)",
            letterSpacing: -1,
            lineHeight: 1.1,
            margin: 0,
            maxWidth: 720,
          }}
        >
          ¿Qué vamos a crear hoy?
        </h1>
        <p
          style={{
            marginTop: 18,
            fontSize: 16,
            color: palette.inkMuted,
            maxWidth: 480,
            lineHeight: 1.6,
          }}
        >
          Escribe una idea, agrega una imagen y Pathfinder la convierte en video con sonido.
        </p>
        <button
          onClick={onEnterStudio}
          className="pf-btn-primary"
          style={{ marginTop: 34, padding: "14px 30px", fontSize: 15 }}
        >
          Entrar al Studio
        </button>
      </div>
    </div>
  );
}