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
  
  // Estado compartido para el colapso del Sidebar en todo el layout.
  // Este es el ÚNICO lugar donde vive este estado — ninguna página hija
  // (StudioPage, etc.) debe volver a montar su propio <Sidebar>.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Lógica de carga robusta
  useEffect(() => {
    if (session !== null) {
      const timer = setTimeout(() => setIsCheckingSession(false), 300);
      return () => clearTimeout(timer);
    }
    
    const fallbackTimer = setTimeout(() => {
      setIsCheckingSession(false);
    }, 800);

    return () => clearTimeout(fallbackTimer);
  }, [session]);

  if (isCheckingSession) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#F9FAFB', 
        color: '#111827',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>Iniciando Pathfinder...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <GenerationProvider stationId={session?.user?.id || null}>
      {/* Reset global: SOLO el contenedor de scroll que cada página define
          internamente puede hacer scroll. Vive aquí, una vez, para toda la
          sesión de la app — así ninguna página necesita andar
          activándolo/desactivándolo al montarse o desmontarse. */}
      <style>{`html, body, #root { height: 100%; margin: 0; overflow: hidden; }`}</style>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública de autenticación */}
          <Route path="/auth" element={
            session ? (
              <Navigate to={hasEnteredStudio ? "/studio" : "/welcome"} replace />
            ) : (
              <AuthScreen />
            )
          } />

          {/* Ruta de bienvenida */}
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

          {/* Layout protegido con Sidebar */}
          <Route path="/" element={
            !session ? (
              <Navigate to="/auth" replace />
            ) : !hasEnteredStudio ? (
              <Navigate to="/welcome" replace />
            ) : (
              // height FIJO (no minHeight): esto es lo que evita que el layout
              // crezca con el contenido y desincronice al panel flotante de
              // las páginas hijas respecto al borde real de la ventana.
              <div style={{ display: "flex", height: "100vh", background: "#F9FAFB", overflow: "hidden" }}>
                {/* Sidebar controlado desde App para evitar franjas grises */}
                <div
                  style={{
                    width: `${sidebarCollapsed ? 80 : 260}px`,
                    flexShrink: 0,
                    height: '100%',
                    background: '#FFFFFF',
                    borderRight: '1px solid #E5E7EB',
                    zIndex: 40,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                  }}
                >
                  <Sidebar 
                    collapsed={sidebarCollapsed} 
                    onToggleCollapsed={() => setSidebarCollapsed(c => !c)} 
                  />
                </div>
                
                {/* Las páginas hijas (StudioPage, etc.) llenan este espacio.
                    NO deben montar su propio Sidebar ni preocuparse por su
                    ancho: ya están correctamente posicionadas aquí. */}
                <main style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'hidden', position: 'relative' }}>
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
