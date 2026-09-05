import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import type { Status } from "./types";
import { palette, fontUI } from "./styles/tokens";
import { globalStyleSheet } from "./styles/globalStyles";
import { useAuth } from "./hooks/useAuth";
import { useRuntime } from "./hooks/useRuntime";
import { Sidebar } from "./components/Sidebar";
import { AuthScreen } from "./components/AuthScreen";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { StudioPage } from "./pages/StudioPage";
import { CreationsPage } from "./pages/CreationsPage";
import { GenerationProvider } from "./context/GenerationContext";

function App() {
  const {
    session,
    profile,
    email,
    setEmail,
    password,
    setPassword,
    authMode,
    setAuthMode,
    authError,
    handleAuth,
    handleLogout,
    hasEnteredStudio,
    setHasEnteredStudio,
  } = useAuth();

  const { gradioUrl, status, sessionUptime, getClient } = useRuntime({
    stationId: profile?.station_id ?? null,
  });

  const [stationDetailsOpen, setStationDetailsOpen] = useState(false);

  const handleDownloadNotebook = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) return;

      const res = await fetch(`${supabaseUrl}/functions/v1/generate-notebook`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notebook_${profile?.station_id || "personal"}.ipynb`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor: Record<Status, string> = {
    STARTING: "#E0B84B",
    READY: palette.accent,
    BUSY: "#6FA8DC",
    ERROR: palette.danger,
    UNKNOWN: palette.inkFaint,
  };

  const statusLabel: Record<Status, string> = {
    STARTING: "Preparando Pathfinder",
    READY: "Lista para crear",
    BUSY: "Creando",
    ERROR: "No se pudo completar la creación",
    UNKNOWN: "Conexión no disponible",
  };

  return (
    <GenerationProvider gradioUrl={gradioUrl} getClient={getClient}>
      <BrowserRouter>
        <style>{globalStyleSheet}</style>
        <Routes>
          {/* Ruta pública de autenticación */}
          <Route
            path="/auth"
            element={
              session ? (
                <Navigate to={hasEnteredStudio ? "/studio" : "/welcome"} replace />
              ) : (
                <AuthScreen
                  authMode={authMode}
                  email={email}
                  password={password}
                  authError={authError}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onAuth={handleAuth}
                  onToggleMode={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                />
              )
            }
          />

          {/* Ruta de bienvenida */}
          <Route
            path="/welcome"
            element={
              !session ? (
                <Navigate to="/auth" replace />
              ) : !hasEnteredStudio ? (
                <WelcomeScreen onEnterStudio={() => setHasEnteredStudio(true)} />
              ) : (
                <Navigate to="/studio" replace />
              )
            }
          />

          {/* Layout protegido con Sidebar */}
          <Route
            path="/"
            element={
              !session ? (
                <Navigate to="/auth" replace />
              ) : !hasEnteredStudio ? (
                <Navigate to="/welcome" replace />
              ) : (
                <div
                  style={{
                    minHeight: "100vh",
                    background: palette.voidGradient,
                    fontFamily: fontUI,
                    color: palette.ink,
                    display: "flex",
                  }}
                >
                  <Sidebar
                    status={status}
                    statusColor={statusColor[status]}
                    statusLabel={statusLabel[status]}
                    sessionUptime={sessionUptime}
                    stationDetailsOpen={stationDetailsOpen}
                    onToggleStationDetails={() => setStationDetailsOpen((v) => !v)}
                    onDownloadNotebook={handleDownloadNotebook}
                    onLogout={handleLogout}
                  />
                  <main
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "40px 48px 60px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Outlet />
                  </main>
                </div>
              )
            }
          >
            {/* Rutas hijas del layout */}
            <Route index element={<Navigate to="/studio" replace />} />
            <Route
              path="studio"
              element={
                <StudioPage
                  profile={profile}
                  status={status}
                />
              }
            />
            <Route path="creations" element={<CreationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GenerationProvider>
  );
}

export default App;