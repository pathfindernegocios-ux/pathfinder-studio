// src/App.tsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useUIStore } from "./stores/useUIStore";
import { useIsMobile } from "./hooks/useIsMobile";
import { GenerationProvider, useGenerationContext } from "./context/GenerationContext";
import { supabase } from "./lib/supabaseClient";
import { setPostAuthRedirect } from "./lib/postAuthRedirect";
import { SessionExpiredModal } from "./components/SessionExpiredModal";
import type { Profile } from "./types";

// Componentes
import Sidebar from "./components/Sidebar";
const AuthScreen = lazy(() => import("./components/AuthScreen"));

// Páginas públicas (lazy)
const HomePage = lazy(() => import("./pages/HomePage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));

// Onboarding / estados de cuenta (lazy)
const OnboardingUsernamePage = lazy(() => import("./pages/OnboardingUsernamePage"));
const AccountRestorePage = lazy(() => import("./pages/AccountRestorePage"));
const AccountSuspendedPage = lazy(() => import("./pages/AccountSuspendedPage"));

// App protegida (lazy)
const StudioPage = lazy(() => import("./pages/StudioPage"));
const CreationsPage = lazy(() => import("./pages/CreationsPage"));
const CreationDetailPage = lazy(() => import("./pages/CreationDetailPage"));
const StationPage = lazy(() => import("./pages/StationPage"));
const AccountSettingsPage = lazy(() => import("./pages/AccountSettingsPage"));

// Placeholders (lazy, named exports)
const ProjectsPage = lazy(() => import("./pages/placeholders/ProjectsPage").then(m => ({ default: m.ProjectsPage })));
const AssetsPage = lazy(() => import("./pages/placeholders/AssetsPage").then(m => ({ default: m.AssetsPage })));


// Legal + resto (lazy)
const TermsPage = lazy(() => import("./pages/legal/TermsPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const WhatIsPathfinderPage = lazy(() => import("./pages/WhatIsPathfinderPage"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const AcademyPage = lazy(() => import("./pages/AcademyPage"));
const ModelDetailPage = lazy(() => import("./pages/ModelDetailPage"));
const PrivacyPage = lazy(() => import("./pages/legal/PrivacyPage"));

// ---------------------------------------------------------------------------
// SessionExpiredBridge — P4-b
//
// Lee sessionExpired del contexto. Cuando es true:
//   1. Guarda el path actual para volver despues del re-login.
//   2. Monta el modal bloqueante con countdown.
//   3. Al llegar a 0: signOut local + navigate('/auth').
//
// Vive dentro del BrowserRouter (puede usar useNavigate) pero fuera de
// Routes (cubre todas las paginas).
// ---------------------------------------------------------------------------
const SessionExpiredBridge: React.FC = () => {
  const { sessionExpired, resetSessionExpired } = useGenerationContext();
  const navigate = useNavigate();

  // Guardar el path apenas se marca la sesion como expirada. Si el user
  // navega mientras el modal esta visible, no cambiamos la intencion.
  useEffect(() => {
    if (sessionExpired) {
      setPostAuthRedirect(window.location.pathname + window.location.search);
    }
  }, [sessionExpired]);

  if (!sessionExpired) return null;

  return (
    <SessionExpiredModal
      onExpired={async () => {
        // Reset ANTES de navigate: el bridge vive fuera de Routes y sigue
        // renderizando en /auth. Sin este reset el modal se queda pegado
        // sobre la pantalla de login (bug reportado en QA).
        resetSessionExpired();
        await supabase.auth.signOut({ scope: "local" });
        navigate("/auth", { replace: true });
      }}
    />
  );
};

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
      background: "var(--pf-bg-primary)",
      color: "var(--pf-text-primary)",
    }}
  >
    <div
      style={{
        width: "40px",
        height: "40px",
        border: "3px solid var(--pf-border-default, #E5E5E5)",
        borderTopColor: "var(--pf-text-primary, #0A0A0A)",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
  children?: React.ReactNode;
}

const ProtectedAppLayout: React.FC<ProtectedAppLayoutProps> = ({
  session,
  profile,
  sidebarCollapsed,
  setSidebarCollapsed,
  children,
}) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const studioTheme = useUIStore((s) => s.studioTheme);

  // Cerrar el drawer al cambiar de ruta (solo en móvil)
  useEffect(() => {
    if (isMobile) setMobileMenuOpen(false);
  }, [location.pathname, isMobile]);

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

  // Sidebar como drawer en móvil (translateX), colapsable en desktop
  const sidebarWrapperStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        height: "100%",
        width: "260px",
        background: "var(--pf-bg-secondary)",
        borderRight: "1px solid var(--pf-border-subtle)",
        zIndex: 60,
        transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
        boxShadow: mobileMenuOpen ? "0 12px 32px rgba(0,0,0,0.25)" : "none",
      }
    : {
        width: `${sidebarCollapsed ? 80 : 260}px`,
        flexShrink: 0,
        height: "100%",
        background: "var(--pf-bg-secondary)",
        borderRight: "1px solid var(--pf-border-subtle)",
        zIndex: 40,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
      };

  return (
    <div
      data-theme={studioTheme}
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--pf-bg-primary)",
        overflow: "hidden",
        position: "relative",
        color: "var(--pf-text-primary)",
      }}
    >
      {/* Blobs neón (solo tema "neon") */}

      {/* Backdrop (solo móvil, cuando el drawer está abierto) */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 55,
            animation: "fadeIn 0.2s ease",
          }}
        />
      )}

      <div style={sidebarWrapperStyle}>
        <Sidebar
          collapsed={isMobile ? false : sidebarCollapsed}
          onToggleCollapsed={() => {
            if (isMobile) {
              setMobileMenuOpen(false);
            } else {
              setSidebarCollapsed((c) => !c);
            }
          }}
        />
      </div>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Botón hamburguesa (solo móvil) */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              zIndex: 50,
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "var(--pf-bg-elevated)",
              border: "1px solid var(--pf-border-default, #E5E5E5)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--pf-text-primary)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {children ? (
          <div
            style={{
              height: "100%",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {children}
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
function App() {
  const { session, profile, isProfileLoading, sessionRevokedAt } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isProfileLoading) {
    return <LoadingScreen />;
  }

  const accountStatus = profile?.account_status ?? null;
  const hasUsername = !!profile?.username;

  return (
      <GenerationProvider stationId={session?.user?.id || null} sessionRevokedAt={sessionRevokedAt}>
        <style>{`html, body, #root { height: 100%; margin: 0; overflow: hidden; }`}</style>
      <BrowserRouter>
        <SessionExpiredBridge />
        <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* ============================================================
              PÚBLICAS
              ============================================================ */}
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/what-is-pathfinder" element={<WhatIsPathfinderPage />} />
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
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/academy" element={<AcademyPage />} />
          <Route path="/academy/:id" element={<ModelDetailPage />} />

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
        </Suspense>
        </BrowserRouter>
      </GenerationProvider>
  );
}

export default App;
