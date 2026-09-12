// src/App.tsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useMediaQuery } from "./hooks/useMediaQuery";
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

// Iconos
import { Menu } from 'lucide-react';

function App() {
  const { session, hasEnteredStudio, setHasEnteredStudio } = useAuth();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // Estado para colapso del Sidebar en Desktop/Tablet
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Estado para controlar el Drawer en Móvil
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Detección de móvil usando el hook personalizado
  const isMobile = useMediaQuery('(max-width: 640px)');

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

  // Cerrar sidebar móvil al cambiar de ruta o redimensionar a desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  if (isCheckingSession) {
    return (
      <div style={{ 
        height: '100dvh', 
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
      {/* Reset global */}
      <style>{`html, body, #root { height: 100dvh; margin: 0; overflow: hidden; }`}</style>
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
              <div className="pf-app-layout">
                
                {/* Botón Hamburguesa para Móvil (solo visible cuando el sidebar está cerrado) */}
                {isMobile && !mobileSidebarOpen && (
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="pf-mobile-menu-btn"
                    aria-label="Abrir menú"
                  >
                    <Menu size={24} />
                  </button>
                )}

                {/* Sidebar: 
                    - En Móvil: Se renderiza condicionalmente como drawer overlay
                    - En Desktop/Tablet: Siempre visible, empujando contenido
                */}
                {( !isMobile || mobileSidebarOpen ) && (
                  <div
                    className={isMobile ? 'pf-sidebar-drawer' : ''}
                    style={!isMobile ? {
                      width: `${sidebarCollapsed ? 80 : 260}px`,
                      flexShrink: 0,
                      height: '100dvh',
                      background: '#FFFFFF',
                      borderRight: '1px solid #E5E7EB',
                      zIndex: 40,
                      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden',
                    } : undefined}
                  >
                    <Sidebar 
                      collapsed={!isMobile && sidebarCollapsed} 
                      isMobile={isMobile}
                      onClose={() => setMobileSidebarOpen(false)}
                      onToggleCollapsed={() => setSidebarCollapsed(c => !c)} 
                    />
                  </div>
                )}

                {/* Overlay Oscuro para Móvil (solo cuando el drawer está abierto) */}
                {isMobile && mobileSidebarOpen && (
                  <div 
                    className="pf-sidebar-overlay"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-hidden="true"
                  />
                )}
                
                {/* Contenido Principal */}
                <main 
                  className="pf-main-content"
                  style={!isMobile ? {
                    flex: 1,
                    minWidth: 0,
                    height: '100dvh',
                    overflow: 'hidden',
                    position: 'relative',
                  } : undefined}
                >
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