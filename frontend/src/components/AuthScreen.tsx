import { palette, fontDisplay, fontUI, glass, labelStyle, inputBase } from "../styles/tokens";
import { globalStyleSheet } from "../styles/globalStyles";

interface AuthScreenProps {
  authMode: "login" | "signup";
  email: string;
  password: string;
  authError: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onAuth: () => void;
  onToggleMode: () => void;
}

export function AuthScreen({
  authMode,
  email,
  password,
  authError,
  onEmailChange,
  onPasswordChange,
  onAuth,
  onToggleMode,
}: AuthScreenProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.voidGradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontUI,
        padding: 16,
      }}
    >
      <style>{globalStyleSheet}</style>
      <div style={{ ...glass, width: "100%", maxWidth: 400, padding: "40px 36px" }}>
        <div style={{ marginBottom: 30 }}>
          <div
            style={{
              fontFamily: fontDisplay,
              fontSize: 28,
              fontWeight: 600,
              color: palette.ink,
              letterSpacing: -0.5,
            }}
          >
            Pathfinder
          </div>
          <div style={{ fontSize: 14, color: palette.inkMuted, marginTop: 6 }}>
            {authMode === "login" ? "Entra para seguir creando." : "Crea tu cuenta en Pathfinder."}
          </div>
        </div>

        <label style={labelStyle}>Correo electrónico</label>
        <input
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          style={{ ...inputBase, marginBottom: 14 }}
        />
        <label style={labelStyle}>Contraseña</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          style={{ ...inputBase, marginBottom: 22 }}
        />
        <button onClick={onAuth} className="pf-btn-primary" style={{ width: "100%" }}>
          {authMode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
        <button
          onClick={onToggleMode}
          style={{
            background: "none",
            border: "none",
            color: palette.inkMuted,
            cursor: "pointer",
            width: "100%",
            marginTop: 16,
            fontSize: 13,
            fontFamily: fontUI,
          }}
        >
          {authMode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
        {authError && (
          <p style={{ color: palette.danger, fontSize: 13, marginTop: 14, textAlign: "center" }}>{authError}</p>
        )}
      </div>
    </div>
  );
}