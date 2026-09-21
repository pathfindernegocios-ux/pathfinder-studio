// src/App.tsx
import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { GenerationProvider } from "./context/GenerationContext";

// Componentes y páginas
import Sidebar from "./components/Sidebar";
import AuthScreen from "./components/AuthScreen";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import OnboardingUsernamePage from "./pages/OnboardingUsernamePage";
import AccountRestorePage from "./pages/AccountRestorePage";
import AccountSuspendedPage from "./pages/AccountSuspendedPage";
import StudioPage from "./pages/StudioPage";
import CreationsPage from "./pages/CreationsPage";
import CreationDetailPage from "./pages/CreationDetailPage";

// Placeholders
import { ProjectsPage } from "./pages/placeholders/ProjectsPage";
import { AssetsPage } from "./pages/placeholders/AssetsPage";
import { AcademyPage } from "./pages/placeholders/AcademyPage";
import StationPage from "./pages/StationPage";
import SettingsPage from "./pages/placeholders/SettingsPage";

// ---------------------------------------------------------------------------
// Loading screen
// ---------------------------------------------------------------------------
const LoadingScreen: React.FC = () => (
  <div
    style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F9FAFB",
      color: "#111827",
      fontFamily: "system-ui, sans-serif",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "2rem",
          marginBottom: "1rem",
          animation: "spin 1s linear infinite",
        }}
      >
        ⏳
      </div>
      <p style={{ fontWeight: 500, fontSize: "0.9rem" }}>Cargando Pathfinder...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Legal stub temporal (se reemplaza en un bloque posterior)
// ---------------------------------------------------------------------------
const LegalStub: React.FC<{ title: string }> = ({ title }) => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center",
    }}
  >
    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "12px" }}>
      {title}
    </h1>
    <p style={{ color: "#525252", marginBottom: "24px" }}>
      Este documento estará disponible próximamente.
    </p>
    <Link to="/auth" style={{ color: "#0A0A0A", textDecoration: "underline" }}>
      Volver
    </Link>
  </div>
);

// ---------------------------------------------------------------------------
// AppLayout (sidebar + outlet)
// ---------------------------------------------------------------------------
interface AppLayoutProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  sidebarCollapsed,
  setSidebarCollapsed,
}) => (
  <div
    style={{
      display: "flex",
      height: "100vh",
      background: "#F9FAFB",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${sidebarCollapsed ? 80 : 260}px`,
        flexShrink: 0,
        height: "100%",
        background: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        zIndex: 40,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
      }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
      />
    </div>

    <main
      style={{
        flex: 1,
        minWidth: 0,
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Outlet />
    </main>
  </div>
);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
function App() {
  const { session, profile, isProfileLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Esperar a que useAuth cargue antes de decidir rutas.
  if (isProfileLoading) {
    return <LoadingScreen />;
  }

  const accountStatus = profile?.account_status ?? null;
  const hasUsername = !!profile?.username;

  return (
    <GenerationProvider stationId={session?.user?.id || null}>
      <style>{`html, body, #root { height: 100%; margin: 0; overflow: hidden; }`}</style>
      <BrowserRouter>
        <Routes>
          {/* ---- Auth callback (público) ---- */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* ---- Auth (público, redirige si hay sesión) ---- */}
          <Route
            path="/auth"
            element={
              session ? (
                accountStatus === "deletion_pending" ? (
                  <Navigate to="/account/restore" replace />
                ) : accountStatus === "suspended" ? (
                  <Navigate to="/account/suspended" replace />
                ) : !hasUsername || accountStatus === "provisional" ? (
                  <Navigate to="/onboarding/username" replace />
                ) : accountStatus === "active" ? (
                  <Navigate to="/studio" replace />
                ) : (
                  <Navigate to="/auth" replace />
                )
              ) : (
                <AuthScreen />
              )
            }
          />
          <Route path="/login" element={<Navigate to="/auth" replace />} />

          {/* ---- Onboarding ---- */}
          <Route
            path="/onboarding/username"
            element={
              !session ? (
                <Navigate to="/auth" replace />
              ) : !profile ? (
                <LoadingScreen />
              ) : accountStatus === "deletion_pending" ? (
                <Navigate to="/account/restore" replace />
              ) : accountStatus === "suspended" ? (
                <Navigate to="/account/suspended" replace />
              ) : hasUsername ? (
                <Navigate to="/studio" replace />
              ) : (
                <OnboardingUsernamePage />
              )
            }
          />

          {/* ---- Account states ---- */}
          <Route
            path="/account/restore"
            element={
              !session ? (
                <Navigate to="/auth" replace />
              ) : !profile ? (
                <LoadingScreen />
              ) : accountStatus === "deletion_pending" ? (
                <AccountRestorePage />
              ) : (
                <Navigate to="/studio" replace />
              )
            }
          />
          <Route
            path="/account/suspended"
            element={
              !session ? (
                <Navigate to="/auth" replace />
              ) : !profile ? (
                <LoadingScreen />
              ) : accountStatus === "suspended" ? (
                <AccountSuspendedPage />
              ) : (
                <Navigate to="/studio" replace />
              )
            }
          />

          {/* ---- Legacy welcome → redirect ---- */}
          <Route path="/welcome" element={<Navigate to="/studio" replace />} />

          {/* ---- Legal (stubs temporales) ---- */}
          <Route
            path="/legal/terms"
            element={<LegalStub title="Términos de Servicio" />}
          />
          <Route
            path="/legal/privacy"
            element={<LegalStub title="Aviso de Privacidad" />}
          />

          {/* ---- App protegida (requiere status=active + username) ---- */}
          <Route
            path="/"
            element={
              !session ? (
                <Navigate to="/auth" replace />
              ) : !profile ? (
                <LoadingScreen />
              ) : accountStatus === "deletion_pending" ? (
                <Navigate to="/account/restore" replace />
              ) : accountStatus === "suspended" ? (
                <Navigate to="/account/suspended" replace />
              ) : !hasUsername || accountStatus === "provisional" ? (
                <Navigate to="/onboarding/username" replace />
              ) : accountStatus === "active" ? (
                <AppLayout
                  sidebarCollapsed={sidebarCollapsed}
                  setSidebarCollapsed={setSidebarCollapsed}
                />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          >
            <Route index element={<Navigate to="/studio" replace />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="creations" element={<CreationsPage />} />
            <Route path="creations/:id" element={<CreationDetailPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="academy" element={<AcademyPage />} />
            <Route path="station" element={<StationPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* ---- Fallback ---- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GenerationProvider>
  );
}

export default App;
