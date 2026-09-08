// src/App.tsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { GenerationProvider } from "./context/GenerationContext";

// Componentes principales
import Sidebar from "./components/Sidebar";
import AuthScreen from "./components/AuthScreen";
import WelcomeScreen from "./components/WelcomeScreen";
import StudioPage from "./pages/StudioPage";
import CreationsPage from "./pages/CreationsPage";
import CreationDetailPage from "./pages/CreationDetailPage";

// Placeholders (Exportación Nombrada)
import { ProjectsPage } from "./pages/placeholders/ProjectsPage";
import { AssetsPage } from "./pages/placeholders/AssetsPage";
import { AcademyPage } from "./pages/placeholders/AcademyPage";

// Placeholders (Exportación por Defecto)
import StationPage from "./pages/placeholders/StationPage";
import SettingsPage from "./pages/placeholders/SettingsPage";

function App() {
  const { session, hasEnteredStudio, setHasEnteredStudio } = useAuth();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    if (session !== null) {
      const timer = setTimeout(() => setIsCheckingSession(false), 300);
      return () => clearTimeout(timer);
    }
  }, [session]);

  if (isCheckingSession) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#0f0f0f', 
        color: '#fff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p>Iniciando Pathfinder...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <GenerationProvider stationId={session?.user?.id || null}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={
            session ? (
              <Navigate to={hasEnteredStudio ? "/studio" : "/welcome"} replace />
            ) : (
              <AuthScreen />
            )
          } />

          <Route path="/welcome" element={
            !session ? (
              <Navigate to="/auth" replace />
            ) : hasEnteredStudio ? (
              <Navigate to="/studio" replace />
            ) : (
              <WelcomeScreen onEnter={() => {
                setHasEnteredStudio(true);
              }} />
            )
          } />

          <Route path="/" element={
            !session ? (
              <Navigate to="/auth" replace />
            ) : !hasEnteredStudio ? (
              <Navigate to="/welcome" replace />
            ) : (
              <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f0f" }}>
                <Sidebar />
                <main style={{ flex: 1, minWidth: 0 }}>
                  <Outlet />
                </main>
              </div>
            )
          }>
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
        </Routes>
      </BrowserRouter>
    </GenerationProvider>
  );
}

export default App;