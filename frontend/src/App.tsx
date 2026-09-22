// src/App.tsx
import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { GenerationProvider } from "./context/GenerationContext";
import type { Profile } from "./types";

// Componentes
import Sidebar from "./components/Sidebar";
import AuthScreen from "./components/AuthScreen";

// Páginas públicas
import HomePage from "./pages/HomePage";
import PricingPage from "./pages/PricingPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

// Onboarding / estados de cuenta
import OnboardingUsernamePage from "./pages/OnboardingUsernamePage";
import AccountRestorePage from "./pages/AccountRestorePage";
import AccountSuspendedPage from "./pages/AccountSuspendedPage";

// App protegida
import StudioPage from "./pages/StudioPage";
import CreationsPage from "./pages/CreationsPage";
import CreationDetailPage from "./pages/CreationDetailPage";
import StationPage from "./pages/StationPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";

// Placeholders
import { ProjectsPage } from "./pages/placeholders/ProjectsPage";
import { AssetsPage } from "./pages/placeholders/AssetsPage";


// Legal
import TermsPage from "./pages/legal/TermsPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import AcademyPage from "./pages/AcademyPage";
import PrivacyPage from "./pages/legal/PrivacyPage";

// ---------------------------------------------------------------------------
// LoadingScreen
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
// ProtectedAppLayout — guards + sidebar + outlet
// ---------------------------------------------------------------------------
interface ProtectedAppLayoutProps {
  session: { user: { id: string } } | null;
  profile: Profile | null;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProtectedAppLayout: React.FC<ProtectedAppLayoutProps> = ({
  session,
  profile,
  sidebarCollapsed,
  setSidebarCollapsed,
}) => {
  if (!session) return <Navigate to="/auth" replace />;
  if (!profile) return <LoadingScreen />;

  const accountStatus = profile.account_status;
  const hasUsername = !!profile.username;

  if (accountStatus === "deletion_pending") {
    return <Navigate to="/account/restore" replace />;
  }
  if (accountStatus === "suspended") {
    return <Navigate to="/account/suspended" replace />;
  }
  if (!hasUsername || accountStatus === "provisional") {
    return <Navigate to="/onboarding/username" replace />;
  }
  if (accountStatus !== "active") {
    return <Navigate to="/auth" replace />;
  }

  return (
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
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
function App() {
  const { session, profile, isProfileLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
          {/* ============================================================
              PÚBLICAS
              ============================================================ */}
          <Route
            path="/"
            element={
              session ? <Navigate to="/studio" replace /> : <HomePage />
            }
          />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
          <Route path="/welcome" element={<Navigate to="/studio" replace />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/academy" element={<AcademyPage />} />

          {/* ============================================================
              ONBOARDING & ESTADOS DE CUENTA
              ============================================================ */}
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

          {/* ============================================================
              APP PROTEGIDA (pathless layout con guards)
              ============================================================ */}
          <Route
            element={
              <ProtectedAppLayout
                session={session}
                profile={profile}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
              />
            }
          >
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/creations" element={<CreationsPage />} />
            <Route path="/creations/:id" element={<CreationDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/station" element={<StationPage />} />
            <Route path="/settings" element={<AccountSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GenerationProvider>
  );
}

export default App;
